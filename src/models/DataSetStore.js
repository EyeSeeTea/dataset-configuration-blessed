import fp from 'lodash/fp';
import _ from 'lodash';
import { generateUid } from 'd2/lib/uid';
import moment from 'moment';
import { getOwnedPropertyJSON } from 'd2/lib/model/helpers/json';
import { map, pick, get, filter, flatten, compose, identity, head } from 'lodash/fp';
import {getCategoryCombos,
        collectionToArray,
        getAsyncUniqueValidator,
        sendMessage,
        setSharings,
        getUserGroups,
        mapPromise,
       } from '../utils/Dhis2Helpers';
import * as Section from './Section';

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

const update = (obj1, obj2) => {
    const obj1c = obj1;
    _(obj2).each((value, key) => { obj1c[key] = value; });
    return obj1c;
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
        window.store = this;
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
            countries: [],
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
            const newDataset = dataset.clone();
            const newAssociations = _.clone(associations);
            const getOrgUnitIds = (ds) => ds.organisationUnits.toArray().map(ou => ou.id);

            newDataset.name = project.name ? project.name : "";
            newAssociations.dataInputStartDate =
                project.startDate ? new Date(project.startDate) : undefined;
            newAssociations.dataInputEndDate =
                project.endDate ? new Date(project.endDate) : undefined;
            newDataset.dataInputPeriods = this.getDataInputPeriods(
                newAssociations.dataInputStartDate, newAssociations.dataInputEndDate);
            newDataset.organisationUnits = project.organisationUnits || [];
            return {dataset: newDataset, associations: newAssociations};
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
                const {dataInputStartDate, dataInputEndDate} = associations;
                this.dataset.dataInputPeriods =
                    this.getDataInputPeriods(dataInputStartDate, dataInputEndDate);
                break;
        }
    }

    updateField(fieldPath, newValue) {
        const oldValue = fp.get(fieldPath, this);
        _.set(this, fieldPath, newValue);
        this.updateFromAssociations(fieldPath, oldValue);
    }

    updateModelSections(stateSections) {
        const {sections, dataSetElements, indicators, errors} =
            Section.getDataSetInfo(this.d2, this.config, _.values(stateSections));

        // Don't override previous values of dataSetElements (disaggregation)
        const newDataSetElements =
            _.keyBy(dataSetElements, dse => dse.dataElement.id);
        const prevDataSetElements =
            _.keyBy(this.dataset.dataSetElements || [], dse => dse.dataElement.id);
        const mergedDataSetElements = _(newDataSetElements)
            .merge(prevDataSetElements)
            .at(_.keys(newDataSetElements))
            .value();

        _.assign(this.associations, {stateSections, sections});
        _.assign(this.dataset, {dataSetElements: mergedDataSetElements, indicators});
        return errors;
    }

    setGreyedFields(greyedFieldsForSections) {
        if (this.associations.sections.length !== greyedFieldsForSections.length) {
            throw new Error("setGreyedFields: invalid input array length")
        }
        _(this.associations.sections)
            .zip(greyedFieldsForSections)
            .each(([section, greyedFields]) => update(section, {greyedFields}));
    }

    getCountryCodes(orgUnits) {
        const {countries} = this.associations;
        return _(countries).map(ou => ou.code ? ou.code.split("_")[0] : null).compact().value();
    }

    /* Save */

    _getInitialSaving() {
        return {
            dataset: this.dataset,
            warnings: [],
            sectionsWithPersistedCocs: null,
            newCategoryCombos: null,
            href: null,
       };
    }

    _processDisaggregation(saving) {
        const {dataset} = saving;
        const categoryCombos = _(dataset.dataSetElements)
            .map(dse => dse.categoryCombo)
            .uniqBy(categoryCombo => categoryCombo.id)
            .value();
        const items$ = mapPromise(categoryCombos, categoryCombo => {
            if (categoryCombo.id.startsWith("new-")) {
                const newCategoryCombo = update(categoryCombo.clone(), {id: null});
                return newCategoryCombo.save()
                    .then(res => ({oldCc: categoryCombo, newCc: newCategoryCombo}));
            } else {
                return Promise.resolve({oldCc: categoryCombo, newCc: null});
            }
        });

        return items$.then(items => {
            return getCategoryCombos(this.d2).then(finalCategoryCombos => {
                const finalCocsById = _.keyBy(finalCategoryCombos.toArray(), "id");
                const cocsById = _(dataset.dataSetElements)
                    .map(dse => [dse.categoryCombo.id, dse.categoryCombo.categoryOptionCombos])
                    .fromPairs()
                    .value();

                const sortByCategoryOptions = cocs => {
                    return _(collectionToArray(cocs))
                        .orderBy(coc =>
                            _(collectionToArray(coc.categoryOptions)).map("id").orderBy().join("."))
                        .value();
                };
                const relation = _(items)
                    .filter(({oldCc, newCc}) => newCc)
                    .flatMap(({oldCc, newCc}) =>
                        _.zip(
                            sortByCategoryOptions(cocsById[oldCc.id]).map(coc => coc.id),
                            sortByCategoryOptions(finalCocsById[newCc.id].categoryOptionCombos),
                        )
                    )
                    .fromPairs()
                    .value();

                const sectionsWithPersistedCocs = this.associations.sections.map(section => {
                    const persistedGreyedFields = section.greyedFields.map(field =>
                        _.merge(field, {categoryOptionCombo: {
                            id: (relation[field.categoryOptionCombo.id] || field.categoryOptionCombo).id,
                        }})
                    );
                    return update(section, {greyedFields: persistedGreyedFields});
                });

                const newCategoryCombos = items.map(({oldCc, newCc}) => newCc).filter(cc => cc);
                const categoryCombosRelation = _(items)
                    .map(({oldCc, newCc}) => [oldCc.id, newCc || oldCc])
                    .fromPairs().value();

                const dataSetElementsWithPersistedCc = _(dataset.dataSetElements).map(dse =>
                    update(dse, {categoryCombo: {id: categoryCombosRelation[dse.categoryCombo.id].id}})
                ).value();
                
                dataset.dataSetElements = dataSetElementsWithPersistedCc;

                return _.merge(saving, {
                    sectionsWithPersistedCocs,
                    newCategoryCombos,
                });
            });
        })
    }

    _saveDataset(saving) {
        const {dataset} = saving;
        const d2 = this.d2;
        const api = d2.Api.getApi();

        return new Promise(async (complete, error) => {
            // maintenance-app uses a custom function to save the dataset as it needs to do
            // some processing  not allowed by dataset.save(). The code in this method is copied
            // from maintenance-app/src/EditModel/objectActions.js
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
                    complete(saving);
                } else {
                    const errorMessages = extractErrorMessagesFromResponse(response);

                    error(head(errorMessages) || 'Unknown error!');
                }
            } catch (err) {
                error(err);
            }
        });
    }

    _setCode(saving) {
        const {dataset, warnings} = saving;
        const {project} = this.associations;
        const projectCode = project ? project.code : null;

        if (projectCode) {
            const datasetCode = projectCode + " " + "Data Set";
            const codeValidator = getAsyncUniqueValidator(this.d2.models.dataSet, "code");
            return codeValidator(datasetCode)
                .then(() =>
                    _.merge(saving, {dataset: update(dataset, {code: datasetCode})}))
                .catch(err =>
                    _.merge(saving, {warnings: warnings.concat(["Dataset code already used: " + datasetCode])}));
        } else {
            return Promise.resolve(saving);
        }
    }

    _setCategoryCombosSharing(saving) {
        const {dataset, warnings} = saving;
        const categoryCombos = dataset.dataSetElements
            .map(dse => this.d2.models.categoryCombo.create({id: dse.categoryCombo.id}));
        const userGroupAccessByName = _(this.getCountryCodes())
            .flatMap(countryCode =>
                _.compact([
                    countryCode ? [countryCode + "_Users", "r-------"] : null,
                ])
            )
            .value();

        return setSharings(this.d2, categoryCombos, userGroupAccessByName)
            .then(() => saving);
    }

    _addDataSetToUserRole(saving) {
        const {dataset, warnings} = saving;

        return mapPromise(this.getCountryCodes(), countryCode => {
            const addUserRole = (coreCompetency) => {
                // userRoleName example: AF__dataset_campmanagement, AF__dataset_icla
                const key = coreCompetency.name.toLocaleLowerCase().replace(/\s+/g, '');
                const userRoleName = `${countryCode}__dataset_` + key;
                
                return this.d2.models.userRoles
                    .list({filter: "name:eq:" + userRoleName})
                    .then(collection => collection.toArray()[0])
                    .then(userRole => {
                        if (userRole) {
                            userRole.dataSets.set(dataset.id, dataset);
                            userRole.dirty = true;
                            return userRole.save().then(() => null);
                        } else {
                            const msg = "User role not found: " + userRoleName
                            return Promise.resolve(msg);
                        }
                    })
            }

            return mapPromise(this.associations.coreCompetencies, addUserRole);
        }).then(msgs => _.merge(saving, {warnings: warnings.concat(_.compact(_.flatten(msgs)))}));
    }

    _shareWithGroups(saving) {
        const {dataset} = saving;

        const userGroupAccessByName = _(this.getCountryCodes())
            .flatMap(countryCode =>
                _.compact([
                    countryCode ? [countryCode + "_Users", "r-------"] : null,
                    countryCode ? [countryCode + "_Administrators", "rw------"] : null,
                ])
            )
            .push(["GL_GlobalAdministrator", "rw------"])
            .value();

        return setSharings(this.d2, [dataset], userGroupAccessByName).then(() => saving);
    }

    _createSections(saving) {
        const {dataset, sectionsWithPersistedCocs} = saving;
        const datasetId = dataset.id;
        const sections = _(sectionsWithPersistedCocs)
            .sortBy(section => section.name)
            .map(section => update(section, {dataSet: {id: datasetId}}))
            .value();

        return mapPromise(sections, section => section.save()).then(() => saving);
    }

    _getDatasetLink(saving) {
        return this.d2.models.dataSets.get(saving.dataset.id)
            .then(datasetDB => _.merge(saving, {href: datasetDB.href}));
    }

    _addOrgUnitsToProject(saving) {
        const {dataset} = saving;
        const {project} = this.associations;

        if (project) {
            return this.d2.models.categoryOption.get(project.id).then(project => {
                _(dataset.organisationUnits.toArray())
                    .each(datasetOu => project.organisationUnits.set(datasetOu.id, datasetOu));
                project.dirty = true;
                return project.save().then(() => saving);
            });
        } else {
            return Promise.resolve(saving);
        }
    }

    _sendNotificationMessages(saving) {
        const {dataset, href} = saving;
        const d2 = this.d2;
        const userName = this.d2.currentUser.name;
        const createMsg = {
            subject: `Dataset created: ${dataset.name}`,
            body: `New dataset created: ${dataset.name} by ${userName}:\n\n${href}`,
        };
        const warningsList = saving.warnings.map(s => "- " + s).join("\n");
        const warningMsg = _.isEmpty(saving.warnings) ? null : {
            subject: `Dataset created with warnings: ${dataset.name}`,
            body: `New dataset created (${dataset.name} by ${userName}) has some warnings:` +
                `\n\n${warningsList}\n\n${href}`,
        };

        const userGroupNames = _(this.getCountryCodes())
            .flatMap(countryCode =>
                 _.compact([
                    countryCode ? countryCode + "_M&EDatasetCompletion" : null,
                ])
            )
            .push("GL_M&E")
            .value();

        return getUserGroups(d2, userGroupNames)
            .then(col => col.toArray())
            .then(userGroups => {
                return Promise.all(_.compact([
                    sendMessage(d2, createMsg.subject, createMsg.body, userGroups),
                    warningMsg && sendMessage(d2, warningMsg.subject, warningMsg.body, userGroups),
                ]));
            })
            .then(() => saving)
            .catch(err => {
                // An error sending a notification message is not critical, log and continue
                console.error("Could not send message", err);
                return saving;
            });
    }

    save() {
        return Promise.resolve(this._getInitialSaving())
            .then(this._processDisaggregation.bind(this))
            .then(this._setCode.bind(this))
            .then(this._saveDataset.bind(this))
            .then(this._setCategoryCombosSharing.bind(this))
            .then(this._addDataSetToUserRole.bind(this))
            .then(this._shareWithGroups.bind(this))
            .then(this._createSections.bind(this))
            .then(this._getDatasetLink.bind(this))
            .then(this._addOrgUnitsToProject.bind(this))
            .then(this._sendNotificationMessages.bind(this));
    }
}