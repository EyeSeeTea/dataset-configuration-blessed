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
        getOrgUnitsForLevel,
        getCountryCode,
        getSharing,
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

class Factory {
    constructor(d2, config) {
        this.d2 = d2;
        this.config = config;
    }

    get() {
        const dataset = this.getInitialModel();
        return this.getStore(dataset, "add");
    }

    getFromDB(id) {
        return this.getDataset(id).then(dataset => {
            return this.getStore(dataset, "edit");
        });
    }

    cloneFromDB(id) {
        return this.getDataset(id).then(dataset => {
            dataset.id = undefined;
            dataset._sourceId = id;
            dataset.code = undefined;
            dataset.dataInputPeriods.forEach(dip => { dip.id = generateUid(); });
            dataset.dataSetElements.forEach(dse => {
                dse.id = generateUid();
                dse.dataSet = {id: undefined};
            });
            dataset.sections.toArray().forEach(section => { section.id = undefined; });
            return this.getStore(dataset, "clone");
        });
    }

    getStore(dataset, action) {
        return this.getCountries().then(countries =>
            this.getAssociations(dataset, countries).then(associations =>
                new DataSetStore(action, this.d2, this.config, countries, dataset, associations)));
    }

    getDataset(id) {
        const fields = [
            '*,dataSetElements[*,categoryCombo[*,categories[*]],dataElement[*,categoryCombo[*]]]',
            'sections[*,href],organisationUnits[*]',
        ].join(",");
        return this.d2.models.dataSets.get(id, {fields});
    }

    getCountries() {
        const countryLevelId = this.config.organisationUnitLevelForCountriesId;
        return countryLevelId ? getOrgUnitsForLevel(d2, countryLevelId) :
            Promise.reject("No country level configured");
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
            sections: [],
        });
    }

    getProject(dataset) {
        if (dataset.name) {
            return this.d2.models.categoryOptions
                .filter().on("categories.id").equals(this.config.categoryProjectsId)
                .list({fields: "id,name", paging: false})
                .then(collection => collection.toArray())
                .then(projects => _(projects).find(project => _.includes(dataset.name, project.name)));
        } else {
            return Promise.resolve(null);
        }
    }

    getCoreCompetencies(dataset) {
        const extractCoreCompetenciesFromSection = section => {
            const match = section.name.match(/^(.*) (Outputs|Outcome)(@|$)/);
            return match ? match[1] : null;
        };
        const coreCompetencyNames = _(dataset.sections.toArray())
            .map(extractCoreCompetenciesFromSection)
            .compact()
            .uniq()

        return this.d2.models.dataElementGroups
            .filter().on("dataElementGroupSet.id").equals(this.config.dataElementGroupSetCoreCompetencyId)
            .list({filter: `name:in:[${coreCompetencyNames.join(',')}]`, fields: "*"})
            .then(collection => collection.toArray())
    }

    getCountriesFromSharing(dataset, countries) {
        const datasetId = dataset.id || dataset._sourceId;

        if (datasetId) {
            const _dataset = this.d2.models.dataSets.create({id: datasetId});
            const countriesByCode = _.keyBy(countries, getCountryCode);
            const getCode = userGroupAccess => userGroupAccess.displayName.split("_")[0];
            return getSharing(this.d2, _dataset)
                .then(sharing => _(sharing.object.userGroupAccesses).map(getCode).uniq().value())
                .then(sharingCountryCodes => _(countriesByCode).at(sharingCountryCodes).compact().value());
        } else {
            return Promise.resolve([]);
        }
    }

    getAssociations(dataset, countries) {
        const promises = [
            this.getProject(dataset),
            this.getCoreCompetencies(dataset),
            this.getCountriesFromSharing(dataset, countries),
        ];

        return Promise.all(promises).then(([project, coreCompetencies, sharingCountries]) => ({
            project,
            coreCompetencies,
            dataInputStartDate: _(dataset.dataInputPeriods).map("openingDate").compact().min(),
            dataInputEndDate: _(dataset.dataInputPeriods).map("closingDate").compact().max(),
            sections: collectionToArray(dataset.sections),
            countries: sharingCountries,
        }));
    }
}

export default class DataSetStore {
    constructor(action, d2, config, countries, dataset, associations) {
        this.action = action;
        this.d2 = d2;
        this.config = config;
        this.countriesByCode = _.keyBy(countries, getCountryCode);
        this.countriesById = _.keyBy(countries, "id");
        this.countryLevel = _.isEmpty(countries) ? null : countries[0].level;
        this.dataset = dataset;
        this.associations = associations;
        window.store = this;
    }

    getTranslation(...args) {
        return this.d2.i18n.getTranslation(...args);
    }

    static add(d2, config) {
        const factory = new Factory(d2, config);
        return factory.get();
    }

    static edit(d2, config, datasetId) {
        const factory = new Factory(d2, config);
        return factory.getFromDB(datasetId);
    }

    static clone(d2, config, datasetId) {
        const factory = new Factory(d2, config);
        return factory.cloneFromDB(datasetId);
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
        this.associations.countries = this.getSharingCountries();

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
            newDataset.organisationUnits = project.organisationUnits;
            return {dataset: newDataset, associations: newAssociations};
        } else {
            const newDataset = dataset.clone();
            const newAssociations = _.clone(associations);

            newDataset.name = "";
            newAssociations.dataInputStartDate = undefined;
            newAssociations.dataInputEndDate = undefined;
            newAssociations.countries = [];
            newDataset.dataInputPeriods = this.getDataInputPeriods(
                newAssociations.dataInputStartDate, newAssociations.dataInputEndDate);
            newDataset.organisationUnits.clear();
            return {dataset: newDataset, associations: newAssociations};
        }
    }

    getSharingCountries() {
        const {dataset, associations, countriesByCode, countriesById, countryLevel} = this;
        const {project} = associations;
        const projectCountryCode =
            project && project.code ? project.code.slice(0, 2).toUpperCase() : null;

        if (projectCountryCode && countriesByCode[projectCountryCode]) {
            return [countriesByCode[projectCountryCode]];
        } else {
            return _(countriesById)
                .at(dataset.organisationUnits.toArray().map(ou => ou.id))
                .compact().value();
        }
    }

    updateLinkedFields(fieldPath, oldValue) {
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
            case "associations.organisationUnits":
                this.associations.countries = this.getSharingCountries();
                break;
        }
    }

    updateField(fieldPath, newValue) {
        const oldValue = fp.get(fieldPath, this);
        _.set(this, fieldPath, newValue);
        this.updateLinkedFields(fieldPath, oldValue);
    }

    updateModelSections(stateSections, d2Sections) {
        const {sections, dataSetElements, indicators, errors} =
            Section.getDataSetInfo(this.d2, this.config, _.values(stateSections));

        // Don't override greyed fields && ID/href (so it can be updated if existing)
        const prevSections =_(d2Sections).keyBy("name").value();
        sections.forEach(section => {
            const prevSection = prevSections[section.name] || {};
            update(section, _.pick(prevSection, ["id", "href", "greyedFields"]));
        });

        // Don't override dataSetElements (disaggregation)
        const newDataSetElements =
            _.keyBy(dataSetElements, dse => dse.dataElement.id);
        const prevDataSetElements =
            _.keyBy(this.dataset.dataSetElements || [], dse => dse.dataElement.id);
        const mergedDataSetElements = _(fp.merge(newDataSetElements, prevDataSetElements))
            .at(_.keys(newDataSetElements))
            .value();

        update(this.associations, {sections});
        update(this.dataset, {dataSetElements: mergedDataSetElements, indicators});
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
                        update(_.clone(field), {categoryOptionCombo: {
                            id: (relation[field.categoryOptionCombo.id] || field.categoryOptionCombo).id,
                        }})
                    );
                    return update(section, {greyedFields: persistedGreyedFields});
                });

                const newCategoryCombos = items.map(({oldCc, newCc}) => newCc).filter(cc => cc);
                const categoryCombosRelation = _(items)
                    .map(({oldCc, newCc}) => [oldCc.id, newCc || oldCc])
                    .fromPairs().value();

                const dataSetElementsWithPersistedCc = dataset.dataSetElements.map(dse =>
                    update(_.clone(dse), {categoryCombo: {id: categoryCombosRelation[dse.categoryCombo.id].id}})
                );
                const newDataset = update(dataset.clone(),
                    {dataSetElements: dataSetElementsWithPersistedCc});
                
                return update(saving, {
                    sectionsWithPersistedCocs,
                    newCategoryCombos,
                    dataset: newDataset,
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
                    update(saving, {dataset: update(dataset.clone(), {code: datasetCode})}))
                .catch(err =>
                    update(saving, {warnings: warnings.concat(["Dataset code already used: " + datasetCode])}));
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
        }).then(msgs => update(saving, {warnings: warnings.concat(_.compact(_.flatten(msgs)))}));
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

    _saveSections(saving) {
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
            .then(datasetDB => update(saving, {href: datasetDB.href}));
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
        const op = this.action === "edit" ? "edited" : "created";
        const saveMsg = {
            subject: `Dataset ${op}: ${dataset.name}`,
            body: `New dataset ${op}: ${dataset.name} by ${userName}:\n\n${href}`,
        };
        const warningsList = saving.warnings.map(s => "- " + s).join("\n");
        const warningMsg = _.isEmpty(saving.warnings) ? null : {
            subject: `Dataset ${op} with warnings: ${dataset.name}`,
            body: `New dataset ${op} (${dataset.name} by ${userName}) has some warnings:` +
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
                    sendMessage(d2, saveMsg.subject, saveMsg.body, userGroups),
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
            .then(this._setCode.bind(this))
            .then(this._processDisaggregation.bind(this))
            .then(this._saveDataset.bind(this))
            .then(this._setCategoryCombosSharing.bind(this))
            .then(this._addDataSetToUserRole.bind(this))
            .then(this._shareWithGroups.bind(this))
            .then(this._saveSections.bind(this))
            .then(this._getDatasetLink.bind(this))
            .then(this._addOrgUnitsToProject.bind(this))
            .then(this._sendNotificationMessages.bind(this));
    }
}