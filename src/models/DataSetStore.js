import fp from 'lodash/fp';
import { generateUid } from 'd2/lib/uid';
import moment from 'moment';
import Promise from 'bluebird';
import { getOwnedPropertyJSON } from 'd2/lib/model/helpers/json';
import { map, pick, get, filter, flatten, compose, identity, head } from 'lodash/fp';
import {getCategoryCombos, collectionToArray, getAsyncUniqueValidator} from '../utils/Dhis2Helpers';

// From maintenance-app/src/EditModel/objectActions.js
const extractErrorMessagesFromResponse = compose(
    filter(identity),
    map(get('message')),
    flatten,
    map('errorReports'),
    flatten,
    map('objectReports'),
    get('typeReports')
);

const merge = (obj1, obj2) => {
    _(obj2).each((value, key) => { obj1[key] = value; });
    return obj1;
};

export default class DataSetStore {
    constructor(d2, getTranslation) {
        this.d2 = d2;
        this.getTranslation = getTranslation;
        this.config = {
            categoryProjectsId: "MRwzyV0kXv9",
            categoryComboId: "GmXXE8fiCK5",
            dataElementGroupSetCoreCompetencyId: "Pyj6SCrmnZy",
            dataElementGroupOutputId: "rldkyVpu4EM",
            dataElementGroupOutcomeId: "WlNsNnj2sil",
            dataElementGroupGlobalIndicatorMandatoryId: "CQlBGbf2jSs",
            dataElementGroupSetOriginId: "mxv75P8OgZF",
            dataElementGroupSetThemeId: "chyJVMF3G7k",
            attributeGroupId: "YxwyKOlG4lP",
            organisationUnitLevelForCountries: 3,
        };
        const {associations, dataset} = this.getInitialState();
        this.associations = associations;
        this.dataset = dataset;
    }

    getInitialModel() {
        return this.d2.models.dataSet.create({
            name: undefined,
            code: undefined,
            description: undefined,
            expiryDays: 15,
            openFuturePeriods: 1,
            periodType: "Monthly",
            dataInputPeriods: [],
            categoryCombo: {id: this.config.categoryComboId},
            notifyCompletingUser: true,
            noValueRequiresComment: false,
            legendSets: [],
            organisationUnits: [],
            skipOffline: false,
            dataElementDecoration: true,
            renderAsTabs: true,
            indicators: [],
            dataSetElements: [],
        });
    }

    getInitialState() {
        const baseDataset = this.getInitialModel();
        const baseAssociations = {
            project: null,
            coreCompetencies: [],
            dataInputStartDate: _(baseDataset.dataInputPeriods).map("openingDate").compact().min(),
            dataInputEndDate: _(baseDataset.dataInputPeriods).map("closingDate").compact().max(),
            sections: [],
            stateSections: null,
            country: null,
        };
        return this.getDataFromProject(baseDataset, baseAssociations);
    }

    getDataInputPeriods(startDate, endDate) {
        if (startDate && endDate) {
            const endDate_ = moment(endDate);
            let currentDate = moment(startDate);
            let periods = [];

            while (currentDate <= endDate_) {
                periods.push({
                    id: generateUid(),
                    period: {id: currentDate.format("YYYYMM")},
                    openingDate: startDate,
                    closingDate: endDate,
                });
                currentDate.add(1, "months").startOf("month");
            }
            return periods;
        } else {
            return [];
        }
    }

    getDataFromProject(dataset, associations) {
        const {project} = associations;

        if (project) {
            const clonedDataset = dataset.clone();
            const clonedAssociations = _.clone(associations);
            const getOrgUnitIds = (ds) => ds.organisationUnits.toArray().map(ou => ou.id);
            clonedDataset.name = project.name ? project.name : "";
            clonedAssociations.dataInputStartDate =
                project.startDate ? new Date(project.startDate) : undefined;
            clonedAssociations.dataInputEndDate =
                project.endDate ? new Date(project.endDate) : undefined;
            clonedDataset.dataInputPeriods = this.getDataInputPeriods(
                clonedAssociations.dataInputStartDate, clonedAssociations.dataInputEndDate);
            clonedDataset.organisationUnits = project.organisationUnits;
            return {dataset: clonedDataset, associations: clonedAssociations};
        } else {
            return {dataset, associations};
        }
    }

    updateFromAssociations(fieldPath, oldValue) {
        const {dataset, associations} = this;

        switch (fieldPath) {
            case "associations.project":
                const {dataset: newDataset, associations: newAssociations} =
                    this.getDataFromProject(dataset, associations);
                if (!oldValue ||
                      !newAssociations.project ||
                      confirm(this.getTranslation("confirm_project_updates"))) {
                    this.dataset = newDataset;
                    this.associations = newAssociations;
                }
                break;
            case "associations.dataInputStartDate":
            case "associations.dataInputEndDate":
                this.dataset.dataInputPeriods =
                    this.getDataInputPeriods(associations.dataInputStartDate, associations.dataInputEndDate)
                break;
        }
    }

    updateField(fieldPath, newValue) {
        const oldValue = fp.get(fieldPath, this);
        _.set(this, fieldPath, newValue);
        this.updateFromAssociations(fieldPath, oldValue);
    }

    setGreyedFields(greyedFieldsForSections) {
        if (this.associations.sections.length !== greyedFieldsForSections.length) {
            throw new Error("setGreyedFields: invalid input array length")
        }
        _(this.associations.sections).zip(greyedFieldsForSections).each(([section, greyedFields]) => {
            section.greyedFields = greyedFields;
        });
    }

    _saveDataset(dataset) {
        return new Promise(async (complete, error) => {
            // maintenance-app uses a custom function to save the dataset as it needs to do
            // some processing  not allowed by dataset.save(). The code in this method is copied
            // from maintenance-app/src/EditModel/objectActions.js
            const d2 = this.d2;
            const api = d2.Api.getApi();
            const dataSetPayload = getOwnedPropertyJSON(dataset);

            if (!dataSetPayload.id) {
                const dataSetId = await api.get('system/uid', { limit: 1 }).then(({ codes }) => codes[0]);
                dataSetPayload.id = dataSetId;
            }

            const dataSetElements = Array
                .from(dataset.dataSetElements ? dataset.dataSetElements.values() : [])
                .map(({ dataSet, dataElement, ...other }) => {
                    return {
                        dataSet: { ...dataSet, id: dataSet.id || dataSetPayload.id },
                        ...other,
                        dataElement: {
                            id: dataElement.id,
                        }
                    }
                });

            dataSetPayload.dataSetElements = dataSetElements;

            const metadataPayload = {
                dataSets: [dataSetPayload],
            };

            try {
                const response = await api.post('metadata', metadataPayload);

                if (response.status === 'OK') {
                    dataset.id = dataSetPayload.id;
                    complete(dataset);
                } else {
                    const errorMessages = extractErrorMessagesFromResponse(response);

                    error(head(errorMessages) || 'Unknown error!');
                }
            } catch (err) {
                error(err);
            }
        });
    }

    _setSharing(object, userGroupAccessByName) {
        const [userGroupNames, userGroupAccesses] = _.zip(...userGroupAccessByName);
        const d2 = this.d2;
        const api = d2.Api.getApi();

        return d2.models.userGroups.list({
                filter: "name:in:[" + userGroupNames.join(",") + "]",
                paging: false,
            })
            .then(userGroupsCollection =>
                _(userGroupsCollection.toArray())
                    .keyBy(userGroup => userGroup.name)
                    .at(userGroupNames)
                    .zip(userGroupAccesses)
                    .map(([userGroup, access]) =>
                        userGroup ? {id: userGroup.id, access} : null)
                    .compact()
                    .value()
            ).then(userGroupAccesses => {
                const payload = {
                    meta: {
                        allowPublicAccess: true,
                        allowExternalAccess: false,
                    },
                    object: {
                        userGroupAccesses: userGroupAccesses,
                    }
                }
                return api.post(`sharing?type=${object.modelDefinition.name}&id=${object.id}`, payload);
            });
    }

    saveSharing(dataset) {
        const setNewCategoryCombosSharing = () => {
            const countryCode = this.associations.country.code.split("_")[0];
            const userGroupAccessByName = [
                [countryCode + "_Users", "r-------"],
            ];
            return Promise.map(dataset.newCategoryCombos, categoryCombo => {
                return this._setSharing(categoryCombo, userGroupAccessByName);
            });
        };

        const addDataSetToUserRole = () => {
            return Promise.map(this.associations.coreCompetencies, coreCompetency => {
                // userRoleName example: AF__dataset_campmanagement
                const key = coreCompetency.name.toLocaleLowerCase().replace(/\s+/g, '');
                const userRoleName = "AF__dataset_" + key;
                
                return this.d2.models.userRoles
                    .list({filter: "name:eq:" + userRoleName})
                    .then(collection => collection.toArray()[0])
                    .then(userRole => {
                        if (userRole) {
                            userRole.dataSets.set(dataset.id, dataset);
                            userRole.dirty = true;
                            return userRole.save();
                        } else {
                            console.log("User role not found: " + userRoleName)
                            return Promise.resolve();
                        }
                    })
            }, {concurrency: 1});
        };

        const shareWithGroups = () => {
            // [COUNTRY_PREFIX]_users -> view, [COUNTRY_PREFIX]_admin -> edit, gl_admin -> edit
            const countryCode = this.associations.country.code.split("_")[0];
            const userGroupAccessByName = [
                [countryCode + "_Users", "r-------"],
                [countryCode + "_Administrators", "rw------"],
                ["GL_AllAdmins", "rw------"],
            ];
            return this._setSharing(dataset, userGroupAccessByName);
        };

        return Promise.resolve()
            .then(setNewCategoryCombosSharing)
            .then(addDataSetToUserRole)
            .then(shareWithGroups)
            .then(() => dataset);
    }

    _processDisaggregation(sourceDataset, categoryCombos) {
        const savedCategoryCombos$ = Promise.map(sourceDataset.dataSetElements, dse => {
            if (dse.categoryCombo.id.startsWith("new-")) {
                const newCategoryCombo = merge(dse.categoryCombo.clone(), {id: null});
                return newCategoryCombo.save().then(res => [dse.categoryCombo, newCategoryCombo]);
            } else {
                return Promise.resolve([dse.categoryCombo, dse.categoryCombo]);
            }
        }, {concurrency: 1});

        return savedCategoryCombos$.then(savedCategoryCombos => {
            return getCategoryCombos(this.d2).then(finalCategoryCombos => {
                const finalCocsById = _.keyBy(finalCategoryCombos.toArray(), "id");
                const cocsById = _(sourceDataset.dataSetElements)
                    .map(dse => [dse.categoryCombo.id, dse.categoryCombo.categoryOptionCombos])
                    .fromPairs()
                    .value();

                const sortByCategoryOptions = cocs => {
                    return _(collectionToArray(cocs))
                        .orderBy(coc =>
                            _(collectionToArray(coc.categoryOptions)).map("id").orderBy().join("."))
                        .value();
                };
                const relation = _(savedCategoryCombos)
                    .flatMap(([oldCc, newCc]) =>
                        _.zip(
                            sortByCategoryOptions(cocsById[oldCc.id]).map(coc => coc.id),
                            sortByCategoryOptions(finalCocsById[newCc.id].categoryOptionCombos),
                        )
                    )
                    .fromPairs()
                    .value();

                const sectionsWithPersistedCocs = this.associations.sections.map(section => {
                    const persistedGreyedFields = section.greyedFields.map(field =>
                        merge(field, {categoryOptionCombo: {
                            id: relation[field.categoryOptionCombo.id].id,
                        }})
                    );
                    return merge(section.clone(), {greyedFields: persistedGreyedFields})
                });

                const dataset = merge(sourceDataset.clone(), {sections: sectionsWithPersistedCocs});
                _(dataset.dataSetElements).zip(savedCategoryCombos).each(([dse, [oldCc, newCc]]) => {
                    dse.categoryCombo = {id: newCc.id};
                });
                return dataset;
            });
        })
    }

    _createSections(dataset) {
        const datasetId = dataset.id;
        const sections = _(dataset.sections)
            .sortBy(section => section.name)
            .map(section => merge(section.clone(), {dataSet: {id: datasetId}}))
            .map(section =>
                merge(section, {greyedFields: section.greyedFields.map(field =>
                    merge(field, {categoryOptionCombo: {id: field.categoryOptionCombo.id}}))}))
            .value();

        return sections.reduce(
            (promise, section) => promise.then(() => section.save()),
            Promise.resolve()
        );
    }

    setCode(dataset) {
        const {project} = this.associations;
        const projectCode = project ? project.code : null;

        if (projectCode) {
            const datasetCode = projectCode + " " + "Data Set";
            const codeValidator = getAsyncUniqueValidator(this.d2.models.dataSet, "code");
            return codeValidator(datasetCode)
                .then(() => merge(dataset.clone(), {code: datasetCode}))
                .catch(err => dataset);
        } else {
            return Promise.resolve(dataset);
        }
    }

    save() {
        return getCategoryCombos(this.d2).then(categoryCombos => {
            return this._processDisaggregation(this.dataset, categoryCombos)
		.then(dataset => this.setCode(dataset))
                .then(dataset => this._saveDataset(dataset))
                .then(dataset => this._createSections(dataset));
        });
    }
}