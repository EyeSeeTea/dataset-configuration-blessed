import fp from 'lodash/fp';
import _ from '../utils/lodash-mixins';
import { generateUid } from 'd2/lib/uid';
import moment from 'moment';
import { getOwnedPropertyJSON } from 'd2/lib/model/helpers/json';
import { map, pick, get, filter, flatten, compose, identity, head } from 'lodash/fp';
import {getCategoryCombos,
        collectionToArray,
        getAsyncUniqueValidator,
        sendMessage,
        getUserGroups,
        mapPromise,
        getOrgUnitsForLevel,
        getCountryCode,
        getSharing,
        buildSharing,
        deepMerge,
        buildSharingFromUserGroupNames,
        postMetadata,
        getUids,
        update,
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
            '*,dataSetElements[*,categoryCombo[*,categories[*,categoryOptions[*]]],dataElement[*,categoryCombo[*]]]',
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
            expiryDays: parseInt(this.config.expiryDays) || 0,
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
            publicAccess: "--------",
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
            const match = section.name.match(/^(.*) (Outputs|Outcomes)(@|$)/);
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
            initialSections: collectionToArray(dataset.sections),
            initialCoreCompetencies: coreCompetencies,
            processedCoreCompetencies: coreCompetencies,
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
            const newDataset = dataset;
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
            const newDataset = dataset;
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

    processDatasetSections(dataset, stateSections) {
        this.associations.processedCoreCompetencies = this.associations.coreCompetencies;
        return Section.processDatasetSections(this.d2, this.config, dataset, stateSections);
    }

    setGreyedFields(greyedFieldsForSections) {
        const sections = collectionToArray(this.dataset.sections);

        if (sections.length !== greyedFieldsForSections.length) {
            throw new Error("setGreyedFields: invalid input array length")
        }
        _(sections)
            .zip(greyedFieldsForSections)
            .each(([section, greyedFields]) => update(section, {greyedFields}));
    }

    /* Save */

    _getInitialSaving() {
        const {countries, project} = this.associations;
        const countryCodes = _(countries)
            .map(ou => ou.code ? ou.code.split("_")[0] : null)
            .compact()
            .value();
        const userGroups$ = this.d2.models.userGroups.list({paging: false, fields: "id,name"});
        const project$ = project ? this.d2.models.categoryOption.get(project.id) : Promise.resolve(null);
        const categoryCombos$ = getCategoryCombos(this.d2);

        return Promise.all([userGroups$, project$, categoryCombos$]).then(([userGroups, project, categoryCombos]) => {
            return {
                dataset: this.dataset,
                warnings: [],
                project: project,
                countryCodes: countryCodes,
                userGroups: userGroups.toArray(),
                metadata: {},
                categoryCombos: categoryCombos,
            };
        });
    }

    _processDisaggregation(saving) {
        const {dataset} = saving;
        const dataSetElements = collectionToArray(dataset.dataSetElements);
        const removeUnusedGreyedFields = (sections, newCategoryCombos) => {
            const categoryComboOptionsByCCId = _(collectionToArray(saving.categoryCombos))
                .concat(newCategoryCombos)
                .map(cc => [cc.id, cc.categoryOptionCombos.toArray().map(coc => coc.id)])
                .fromPairs()
                .value();

            const allowedGreyedFieldKeys = new Set(_(dataSetElements).flatMap(dse =>
                _([dse.dataElement.id])
                    .cartesianProduct(categoryComboOptionsByCCId[dse.categoryCombo.id])
                    .map(([dataElementId, cocId]) => dataElementId + "." + cocId)
                    .value()
            ).value());

            return collectionToArray(sections).map(section => {
                const allowedGreyedFields = section.greyedFields.filter(greyedField => {
                    const key = greyedField.dataElement.id  + "." + greyedField.categoryOptionCombo.id;
                    return allowedGreyedFieldKeys.has(key);
                });
                section.greyedFields = allowedGreyedFields;
                return section;
            });
        };

        const newCategoryCombos = _(dataSetElements)
            .map(dse => dse.categoryCombo)
            .uniqBy(cc => cc.id)
            .filter(cc => cc.dirty)
            .map(cc => this._addSharingToCategoryCombo(saving, cc))
            .value();
        const newCategoryComboOptions = _(newCategoryCombos)
            .flatMap(cc => cc.categoryOptionCombos.toArray())
            .value();

        dataset.sections = removeUnusedGreyedFields(dataset.sections, newCategoryCombos);

        return this._addMetadataOp(saving, {create_and_update: {
            categoryCombos: newCategoryCombos,
            categoryOptionCombos: newCategoryComboOptions,
        }});
    }

    _setDatasetId(saving) {
        const {dataset} = saving;
        const datasetId = dataset.id || generateUid();
        return _.imerge(saving, {dataset: update(dataset, {id: datasetId})});
    }

    _saveDataset(saving) {
        const {dataset} = saving;
        // Cleanup dataSetElements to avoid "circular references" error on POST
        const datasetPayload = getOwnedPropertyJSON(dataset);
        const newDataSetElements = dataset.dataSetElements.map(dataSetElement => ({
            dataSet: {id: dataset.id},
            dataElement: {id: dataSetElement.dataElement.id},
            categoryCombo: {id: dataSetElement.categoryCombo.id},
        }));
        datasetPayload.dataSetElements = newDataSetElements;

        return this._addMetadataOp(saving, {create_and_update: {dataSets: [datasetPayload]}});
    }

    _setDatasetCode(saving) {
        const {dataset, warnings} = saving;
        const {project} = this.associations;
        const projectCode = project ? project.code : null;

        if (projectCode) {
            const datasetCode = projectCode + " " + "Data Set";
            const codeValidator = getAsyncUniqueValidator(this.d2.models.dataSet, "code");
            return codeValidator(datasetCode)
                .then(() =>
                    _.imerge(saving, {dataset: update(dataset, {code: datasetCode})}))
                .catch(err =>
                    _.imerge(saving, {warnings: warnings.concat(["Dataset code already used: " + datasetCode])}));
        } else {
            return Promise.resolve(saving);
        }
    }

    _addSharingToCategoryCombo(saving, categoryCombo) {
        const userGroupSharingByName = _(saving.countryCodes)
            .map(countryCode => [countryCode + "_Users", {access: "r-------"}])
            .fromPairs()
            .value();
        const sharing = buildSharingFromUserGroupNames({}, saving.userGroups, userGroupSharingByName);
        return update(categoryCombo, sharing.object);
    }

    _addDataSetToUserRoles(saving) {
        const {dataset, warnings} = saving;
        const {coreCompetencies} = this.associations;
        const getUserRoleName = (coreCompetency, countryCode) => {
            const key = coreCompetency.name.toLocaleLowerCase().replace(/\s+/g, '');
            return `${countryCode}__dataset_` + key;
        }
        const getAssociatedUserRoles = (userRoleNames) => {
            const filter = "name:in:[" + userRoleNames.join(",") + "]";
            return d2.models.userRoles.list({paging: false, filter})
                .then(collection => collection.toArray())
                .then(userRoles => ({
                    existing: userRoles,
                    not_found: userRoleNames.filter(name => !_(userRoles).find(ur => ur.name === name)),
                }));
        };
        const addDataset = (userRole) => userRole.dataSets.set(dataset.id, dataset) && userRole;
        const checkUserRolesExistence = (userRolesInfo) => {
            const {existing, not_found} = userRolesInfo;
            const msgs = not_found.map(name => "User role not found: " + name);
            const savingWithWarnings = _.imerge(saving, {warnings: warnings.concat(msgs)});
            return {saving: savingWithWarnings, userRoles: existing};
        };
        const userRoleNamesForCoreCompetencies = _(coreCompetencies)
            .cartesianProduct(saving.countryCodes)
            .map(([coreCompetency, countryCode]) => getUserRoleName(coreCompetency, countryCode))
            .value();

        return getAssociatedUserRoles(userRoleNamesForCoreCompetencies)
            .then(checkUserRolesExistence)
            .then(({saving, userRoles}) =>
                this._addMetadataOp(saving, {create_and_update: {userRoles: userRoles.map(addDataset)}}));
    }

    _addSharingToDataset(saving) {
        const {dataset} = saving;
        const userGroupSharingByName = _(saving.countryCodes)
            .flatMap(countryCode => [
                [countryCode + "_Users", {access: "r-------"}],
                [countryCode + "_Administrators", {access: "rw------"}],
            ])
            .fromPairs()
            .set("GL_GlobalAdministrator", {access: "rw------"})
            .value();

        const baseSharing = {object: {publicAccess: dataset.publicAccess}};
        const sharing = buildSharingFromUserGroupNames(baseSharing, saving.userGroups, userGroupSharingByName);
        const datasetWithSharing = update(dataset, sharing.object);
        return _.imerge(saving, {dataset: datasetWithSharing});

    }

    _processSections(saving) {
        const {dataset} = saving;
        const {coreCompetencies, initialCoreCompetencies, processedCoreCompetencies} = this.associations;
        const sectionsProcessed = _.isEqual(
            new Set(processedCoreCompetencies.map(cc => cc.id)),
            new Set(coreCompetencies.map(cc => cc.id)),
        );

        if (sectionsProcessed) {
            return Promise.resolve(saving);
        } else {
            return Section.getSections(this.d2, this.config,
                    dataset, initialCoreCompetencies, coreCompetencies).then(sectionsArray => {
                const sections = _.keyBy(sectionsArray, "name");
                const {errors, dataset: newDataset} = this.processDatasetSections(dataset, sections);

                return _(errors).isEmpty() ? _.imerge(saving, {dataset: newDataset}) :
                    Promise.reject("Cannot get sections. Go to sections step for more details");
            });
        }
    }

    _saveSections(saving) {
        const {dataset} = saving;
        const {initialSections} = this.associations;
        const sections = collectionToArray(dataset.sections);

        const datasetId = dataset.id;
        const sectionsToSave = _(sections)
            .filter(section => section.dataElements.size > 0 || section.indicators.size > 0)
            .sortBy(section => section.name)
            .map(section => update(section, {dataSet: {id: datasetId}}))
            .value();
        const sectionsToSaveIds = sectionsToSave.map(section => section.id);
        const sectionsToDelete = initialSections
            .filter(existingSection => existingSection.id && !_.includes(sectionsToSaveIds, existingSection.id));

        // Metadata API for sections delete returns 500 (see https://jira.dhis2.org/browse/DHIS2-2541),
        // so we will use metada only to create/update sections. Delete sections using non-batch d2 methods.
        const deleteSections$ = mapPromise(sectionsToDelete, section => {
            return section.delete().catch(err => {
                if (err && err.httpStatusCode === 404) {
                    return Promise.resolve(true);
                } else {
                    throw err;
                }
            });
        });
        return deleteSections$
            .then(() => this._addMetadataOp(saving, {create_and_update: {sections: sectionsToSave}}));
    }

    _addMetadataOp(saving, metadata) {
        return deepMerge(saving, {metadata: metadata});
    }

    _addOrgUnitsToProject(saving) {
        const {dataset, project} = saving;

        if (project) {
            _(dataset.organisationUnits.toArray()).each(datasetOu =>
                project.organisationUnits.set(datasetOu.id, datasetOu)
            );
            const op = {create_and_update: {categoryOptions: [project]}};
            return Promise.resolve(this._addMetadataOp(saving, op));
        } else {
            return Promise.resolve(saving);
        }
    }

    _sendNotificationMessages(saving) {
        const {dataset, warnings} = saving;
        const d2 = this.d2;
        const userName = this.d2.currentUser.name;
        const op = this.action === "edit" ? "edited" : "created";
        const warningsList = warnings.map(s => "- " + s).join("\n");
        const msg = {
            subject: `Dataset ${op}: ${dataset.name}` +
                (_(warnings).isEmpty() ? "" : " (with warnings)"),
            body: `Dataset ${op}: ${dataset.name} by ${userName}.` +
                (_(warnings).isEmpty() ? "" : `\n\nWarnings: \n\n${warningsList}`),
        };
        const userGroupNames = _(saving.countryCodes)
            .map(countryCode => countryCode + "_M&EDatasetCompletion")
            .push("GL_M&E")
            .value();

        return getUserGroups(d2, userGroupNames)
            .then(col => col.toArray())
            .then(userGroups => sendMessage(d2, msg.subject, msg.body, userGroups))
            .then(() => saving)
            .catch(err => {
                // An error sending a notification message is not critical, log and continue
                console.error("Could not send message", err);
                return saving;
            });
    }

    _runMetadataOps(saving) {
        return postMetadata(this.d2, saving.metadata).then(() => saving);
    }

    save() {
        return this._getInitialSaving()
            .then(this._setDatasetId.bind(this))
            .then(this._setDatasetCode.bind(this))
            .then(this._addSharingToDataset.bind(this))
            .then(this._processSections.bind(this))
            .then(this._processDisaggregation.bind(this))
            .then(this._addDataSetToUserRoles.bind(this))
            .then(this._addOrgUnitsToProject.bind(this))
            .then(this._saveSections.bind(this))
            .then(this._saveDataset.bind(this))
            .then(this._runMetadataOps.bind(this))
            .then(this._sendNotificationMessages.bind(this));
    }
}