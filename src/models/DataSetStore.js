import fp from "lodash/fp";
import _ from "../utils/lodash-mixins";
import { generateUid } from "d2/lib/uid";
import moment from "moment";
import { getOwnedPropertyJSON } from "d2/lib/model/helpers/json";
import {
    getCategoryCombos,
    collectionToArray,
    getAsyncUniqueValidator,
    sendMessage,
    getUserGroups,
    mapPromise,
    getOrgUnitsForLevel,
    getCountryCode,
    getSharing,
    deepMerge,
    buildSharingFromUserGroupNames,
    postMetadata,
    update,
    sendMessageToGroups,
} from "../utils/Dhis2Helpers";

import { getCoreCompetencies, getProject } from "./dataset";
import * as Section from "./Section";
import getCustomForm from "./CustomForm";

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
            dataset._sourceName = dataset.name;
            dataset.code = undefined;
            dataset.dataInputPeriods.forEach(dip => {
                dip.id = generateUid();
            });
            dataset.dataSetElements.forEach(dse => {
                dse.id = generateUid();
                dse.dataSet = { id: undefined };
            });
            dataset.sections.toArray().forEach(section => {
                section.id = undefined;
            });
            return this.getStore(dataset, "clone");
        });
    }

    getStore(dataset, action) {
        return this.getCountries().then(countries =>
            this.getAssociations(dataset, countries).then(
                associations =>
                    new DataSetStore(action, this.d2, this.config, countries, dataset, associations)
            )
        );
    }

    getDataset(id) {
        const fields = [
            "*,dataSetElements[*,categoryCombo[*,categories[*,categoryOptions[*]]],dataElement[*,categoryCombo[*]]]",
            "sections[*,href],organisationUnits[*]",
        ].join(",");
        return this.d2.models.dataSets.get(id, { fields });
    }

    getCountries() {
        const countryLevelId = this.config.organisationUnitLevelForCountriesId;
        return countryLevelId
            ? getOrgUnitsForLevel(this.d2, countryLevelId)
            : Promise.reject("No country level configured");
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
            categoryCombo: { id: this.config.categoryComboId },
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

    getCountriesFromSharing(dataset, countries) {
        const datasetId = dataset.id || dataset._sourceId;

        if (datasetId) {
            const _dataset = this.d2.models.dataSets.create({ id: datasetId });
            const countriesByCode = _.keyBy(countries, getCountryCode);
            const getCode = userGroupAccess => userGroupAccess.displayName.split("_")[0];
            return getSharing(this.d2, _dataset)
                .then(sharing =>
                    _(sharing.object.userGroupAccesses)
                        .map(getCode)
                        .uniq()
                        .value()
                )
                .then(sharingCountryCodes =>
                    _(countriesByCode)
                        .at(sharingCountryCodes)
                        .compact()
                        .value()
                )
                .catch(err => {
                    console.error(
                        "Cannot get sharing for dataset, default to empty countries",
                        err
                    );
                    return [];
                });
        } else {
            return Promise.resolve([]);
        }
    }

    getUserRolesForCurrentUser() {
        // Dhis2 has d2.currentUser.getUserRoles(), but the call generates a wrong URL and fails.
        return this.d2.models.users
            .get(this.d2.currentUser.id, { fields: "userCredentials[userRoles[id,name]]" })
            .then(user => user.userCredentials.userRoles);
    }

    getAssociations(dataset, countries) {
        const promises = [
            getProject(this.d2, this.config, dataset),
            getCoreCompetencies(this.d2, this.config, dataset),
            this.getCountriesFromSharing(dataset, countries),
            this.getUserRolesForCurrentUser(),
        ];

        return Promise.all(promises).then(
            ([project, coreCompetencies, sharingCountries, userRoles]) => ({
                project,
                coreCompetencies,
                initialSections: collectionToArray(dataset.sections),
                initialCoreCompetencies: coreCompetencies,
                processedCoreCompetencies: coreCompetencies,
                dataInputStartDate: _(dataset.dataInputPeriods)
                    .map("openingDate")
                    .compact()
                    .min(),
                dataInputEndDate: _(dataset.dataInputPeriods)
                    .map("closingDate")
                    .compact()
                    .max(),
                sections: collectionToArray(dataset.sections),
                countries: sharingCountries,
                userRoles,
                sameDates: { outputDates: false, outcomeDates: false }, // TO-DO calculate from saved values
                outputDates: {},
                outcomeDates: {},
            })
        );
    }
}

export default class DataSetStore {
    constructor(action, d2, config, countries, dataset, associations) {
        this.action = action;
        this.d2 = d2;
        this.api = d2.Api.getApi();
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

    isSharingStepVisible() {
        return !this.associations.project;
    }

    _saveCustomForm(saving) {
        const { richSections, dataset, project } = saving;
        const categoryCombos$ = getCategoryCombos(this.d2);
        const api = this.d2.Api.getApi();

        return categoryCombos$.then(categoryCombos => {
            return getCustomForm(this.d2, dataset, project, richSections, categoryCombos).then(
                htmlCode => {
                    const payload = { style: "NORMAL", htmlCode };
                    return api
                        .post(["dataSets", dataset.id, "form"].join("/"), payload)
                        .then(() => saving);
                }
            );
        });
    }

    getDataInputPeriods(startDate, endDate) {
        if (startDate && endDate) {
            const endDate_ = moment(endDate);
            let currentDate = moment(startDate);
            let periods = [];

            while (currentDate <= endDate_) {
                periods.push({
                    id: generateUid(),
                    period: { id: currentDate.format("YYYYMM") },
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

    getOpenFuturePeriods(endDate) {
        if (endDate) {
            const currentDate = new Date();
            const monthsDiff =
                (endDate.getYear() - currentDate.getYear()) * 12 +
                (endDate.getMonth() - currentDate.getMonth());
            return monthsDiff > 0 ? monthsDiff + 1 : 1;
        } else {
            return 1;
        }
    }

    getDataFromProject(dataset, associations) {
        const { project } = associations;
        this.associations.countries = this.getSharingCountries();

        if (project) {
            const newDataset = dataset;
            const newAssociations = _.clone(associations);

            newDataset.name = project.name ? `${project.name} DataSet` : "";
            newAssociations.dataInputStartDate = project.startDate
                ? new Date(project.startDate)
                : undefined;
            newAssociations.dataInputEndDate = project.endDate
                ? new Date(project.endDate)
                : undefined;
            newDataset.openFuturePeriods = this.getOpenFuturePeriods(
                newAssociations.dataInputEndDate
            );
            newDataset.dataInputPeriods = this.getDataInputPeriods(
                newAssociations.dataInputStartDate,
                newAssociations.dataInputEndDate
            );
            newDataset.organisationUnits = project.organisationUnits;
            return { dataset: newDataset, associations: newAssociations };
        } else {
            const newDataset = dataset;
            const newAssociations = _.clone(associations);

            newDataset.name = "";
            newAssociations.dataInputStartDate = undefined;
            newAssociations.dataInputEndDate = undefined;
            newAssociations.countries = [];
            newDataset.openFuturePeriods = this.getOpenFuturePeriods(
                newAssociations.dataInputEndDate
            );
            newDataset.dataInputPeriods = this.getDataInputPeriods(
                newAssociations.dataInputStartDate,
                newAssociations.dataInputEndDate
            );
            newDataset.organisationUnits.clear();
            return { dataset: newDataset, associations: newAssociations };
        }
    }

    getSharingCountries() {
        const { dataset, associations, countriesByCode, countriesById } = this;
        const { project } = associations;
        const projectCountryCode =
            project && project.code ? project.code.slice(0, 2).toUpperCase() : null;

        if (projectCountryCode && countriesByCode[projectCountryCode]) {
            return [countriesByCode[projectCountryCode]];
        } else {
            return _(countriesById)
                .at(dataset.organisationUnits.toArray().map(ou => ou.id))
                .compact()
                .value();
        }
    }

    updateLinkedFields(fieldPath, oldValue) {
        const { dataset, associations } = this;

        switch (fieldPath) {
            case "associations.project":
                if (!oldValue || window.confirm(this.getTranslation("confirm_project_updates"))) {
                    const {
                        dataset: newDataset,
                        associations: newAssociations,
                    } = this.getDataFromProject(dataset, associations);
                    this.dataset = newDataset;
                    this.associations = newAssociations;
                }
                break;
            case "associations.dataInputStartDate":
            case "associations.dataInputEndDate":
                const { dataInputStartDate, dataInputEndDate } = associations;
                this.dataset.openFuturePeriods = this.getOpenFuturePeriods(dataInputEndDate);
                this.dataset.dataInputPeriods = this.getDataInputPeriods(
                    dataInputStartDate,
                    dataInputEndDate
                );
                break;
            case "associations.organisationUnits":
                this.associations.countries = this.getSharingCountries();
                break;
            default:
                break;
        }
    }

    validateUserRoles() {
        const isAdmin = this.d2.currentUser.authorities.has("ALL");
        if (isAdmin) {
            return { valid: true, missing: [] };
        } else {
            const missingUserRoles = _(this._getRequiredUserRoles())
                .difference(this.associations.userRoles.map(ur => ur.name))
                .sortBy()
                .value();
            return { valid: _(missingUserRoles).isEmpty(), missing: missingUserRoles };
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
            throw new Error("setGreyedFields: invalid input array length");
        }
        _(sections)
            .zip(greyedFieldsForSections)
            .each(([section, greyedFields]) => update(section, { greyedFields }));
    }

    hasSections() {
        return collectionToArray(this.dataset.sections).length > 0;
    }

    _getRequiredUserRoles() {
        const { countries, coreCompetencies } = this.associations;
        return _(coreCompetencies)
            .cartesianProduct(countries)
            .map(([coreCompetency, country]) => this._getUserRoleName(coreCompetency, country))
            .value();
    }

    /* Save */

    _getInitialSaving() {
        const { countries, project } = this.associations;
        const userGroups$ = this.d2.models.userGroups.list({ paging: false, fields: "id,name" });
        const project$ = project
            ? this.d2.models.categoryOption.get(project.id)
            : Promise.resolve(null);
        const categoryCombos$ = getCategoryCombos(this.d2);
        const countryCodes = _(countries)
            .map(getCountryCode)
            .compact()
            .value();

        return Promise.all([userGroups$, project$, categoryCombos$]).then(
            ([userGroups, project, categoryCombos]) => {
                return {
                    dataset: this.dataset,
                    warnings: [],
                    project: project,
                    countryCodes: countryCodes,
                    userGroups: userGroups.toArray(),
                    metadata: {},
                    categoryCombos: categoryCombos,
                };
            }
        );
    }

    _processDisaggregation(saving) {
        const { dataset } = saving;
        const dataSetElements = collectionToArray(dataset.dataSetElements);
        const removeUnusedGreyedFields = (sections, newCategoryCombos) => {
            const categoryComboOptionsByCCId = _(collectionToArray(saving.categoryCombos))
                .concat(newCategoryCombos)
                .map(cc => [cc.id, cc.categoryOptionCombos.toArray().map(coc => coc.id)])
                .fromPairs()
                .value();

            const allowedGreyedFieldKeys = new Set(
                _(dataSetElements)
                    .flatMap(dse =>
                        _([dse.dataElement.id])
                            .cartesianProduct(categoryComboOptionsByCCId[dse.categoryCombo.id])
                            .map(([dataElementId, cocId]) => dataElementId + "." + cocId)
                            .value()
                    )
                    .value()
            );

            return collectionToArray(sections).map(section => {
                const allowedGreyedFields = section.greyedFields.filter(greyedField => {
                    const key =
                        greyedField.dataElement.id + "." + greyedField.categoryOptionCombo.id;
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

        return this._addMetadataOp(saving, {
            create_and_update: {
                categoryCombos: newCategoryCombos,
                categoryOptionCombos: newCategoryComboOptions,
            },
        });
    }

    _setDatasetId(saving) {
        const { dataset } = saving;
        const datasetId = dataset.id || generateUid();
        return _.imerge(saving, { dataset: update(dataset, { id: datasetId }) });
    }

    _saveDataset(saving) {
        const { dataset } = saving;
        // Cleanup dataSetElements to avoid "circular references" error on POST
        const datasetPayload = getOwnedPropertyJSON(dataset);
        const newDataSetElements = dataset.dataSetElements.map(dataSetElement => ({
            dataSet: { id: dataset.id },
            dataElement: { id: dataSetElement.dataElement.id },
            categoryCombo: { id: dataSetElement.categoryCombo.id },
        }));
        datasetPayload.dataSetElements = newDataSetElements;

        return this._addMetadataOp(saving, { create_and_update: { dataSets: [datasetPayload] } });
    }

    _setDatasetCode(saving) {
        const { dataset, warnings } = saving;
        const { project } = this.associations;
        const projectCode = project ? project.code : null;

        if (projectCode) {
            const datasetCode = projectCode + " Data Set";
            const codeValidator = getAsyncUniqueValidator(this.d2.models.dataSet, "code");
            return codeValidator(datasetCode)
                .then(() => _.imerge(saving, { dataset: update(dataset, { code: datasetCode }) }))
                .catch(_err =>
                    _.imerge(saving, {
                        warnings: warnings.concat(["Dataset code already used: " + datasetCode]),
                    })
                );
        } else {
            return Promise.resolve(saving);
        }
    }

    _addSharingToCategoryCombo(saving, categoryCombo) {
        const userGroupSharingByName = _(saving.countryCodes)
            .map(countryCode => [countryCode + "_Users", { access: "r-------" }])
            .fromPairs()
            .value();
        const sharing = buildSharingFromUserGroupNames(
            {},
            saving.userGroups,
            userGroupSharingByName
        );
        return update(categoryCombo, sharing.object);
    }

    _getUserRoleName(coreCompetency, country) {
        const countryCode = getCountryCode(country);
        const key = coreCompetency.name.toLocaleLowerCase().replace(/\W+/g, "");
        return `${countryCode}__dataset_${key}`;
    }

    _addWarnings(saving, msgs) {
        return _.imerge(saving, { warnings: saving.warnings.concat(msgs) });
    }

    _addDataSetToUserRoles(saving) {
        const { dataset } = saving;
        const getAssociatedUserRoles = userRoleNames => {
            const filter = "name:in:[" + userRoleNames.join(",") + "]";
            return this.d2.models.userRoles
                .list({ paging: false, filter })
                .then(collection => collection.toArray())
                .then(userRoles =>
                    _(userRoles)
                        .keyBy("name")
                        .value()
                )
                .then(userRolesByName =>
                    _(userRoleNames)
                        .map(name => [name, null])
                        .fromPairs()
                        .imerge(userRolesByName)
                );
        };
        const addDataset = userRolesByName => {
            const warnings$ = mapPromise(userRolesByName.toPairs(), ([name, userRole]) => {
                if (userRole) {
                    return this.api
                        .post(`/userRoles/${userRole.id}/dataSets`, {
                            additions: [{ id: dataset.id }],
                        })
                        .catch(
                            err =>
                                `Error adding dataset to userRole ${name}: ${JSON.stringify(err)}`
                        );
                } else {
                    return Promise.resolve(`This user cannot update the user role: ${name}`);
                }
            });
            return warnings$.then(warnings => this._addWarnings(saving, _.compact(warnings)));
        };
        const userRoleNamesForCoreCompetencies = this._getRequiredUserRoles();

        return getAssociatedUserRoles(userRoleNamesForCoreCompetencies).then(addDataset);
    }

    _addSharingToDataset(saving) {
        const { dataset } = saving;
        const userGroupSharingByName = _(saving.countryCodes)
            .flatMap(countryCode => [
                [countryCode + "_Users", { access: "r-------" }],
                [countryCode + "_Administrators", { access: "rw------" }],
            ])
            .fromPairs()
            .set("GL_GlobalAdministrator", { access: "rw------" })
            .value();

        const baseSharing = { object: { publicAccess: dataset.publicAccess } };
        const sharing = buildSharingFromUserGroupNames(
            baseSharing,
            saving.userGroups,
            userGroupSharingByName
        );
        const datasetWithSharing = update(dataset, sharing.object);
        return _.imerge(saving, { dataset: datasetWithSharing });
    }

    _processSections(saving) {
        const { dataset } = saving;
        const { coreCompetencies, initialCoreCompetencies } = this.associations;
        return Section.getSections(
            this.d2,
            this.config,
            dataset,
            initialCoreCompetencies,
            coreCompetencies
        ).then(sectionsArray => {
            const sections = _.keyBy(sectionsArray, "name");
            const { errors, dataset: newDataset } = this.processDatasetSections(dataset, sections);

            return _(errors).isEmpty()
                ? _.imerge(saving, { dataset: newDataset, richSections: sectionsArray })
                : Promise.reject("Cannot get sections. Go to sections step for more details");
        });
    }

    _saveSections(saving) {
        const { dataset } = saving;
        const { initialSections } = this.associations;
        const sections = collectionToArray(dataset.sections);

        const datasetId = dataset.id;
        const sectionsToSave = _(sections)
            .filter(section => section.dataElements.size > 0 || section.indicators.size > 0)
            .sortBy(section => section.name)
            .map(section => update(section, { dataSet: { id: datasetId } }))
            .value();
        const sectionsToSaveIds = sectionsToSave.map(section => section.id);
        const sectionsToDelete = initialSections.filter(
            existingSection =>
                existingSection.id && !_.includes(sectionsToSaveIds, existingSection.id)
        );

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
        return deleteSections$.then(() =>
            this._addMetadataOp(saving, { create_and_update: { sections: sectionsToSave } })
        );
    }

    _addMetadataOp(saving, metadata) {
        return deepMerge(saving, { metadata: metadata });
    }

    _addOrgUnitsToProject(saving) {
        const { dataset, project } = saving;
        const orgUnits = collectionToArray(dataset.organisationUnits);

        if (project && !_(orgUnits).isEmpty()) {
            const payload = { additions: orgUnits.map(ou => ({ id: ou.id })) };
            return this.api
                .post(`/categoryOptions/${project.id}/organisationUnits`, payload)
                .then(() => saving)
                .catch(err =>
                    this._addWarnings(saving, [
                        `Error adding orgUnits to project ${project.displayName}: ${JSON.stringify(
                            err
                        )}`,
                    ])
                );
        } else {
            return Promise.resolve(saving);
        }
    }

    _getUserGroupsForNotifications() {
        return _(this.associations.countries)
            .map(getCountryCode)
            .compact()
            .map(countryCode => countryCode + "_M&EDatasetCompletion")
            .concat(["GL_GlobalAdministrator"])
            .value();
    }

    _sendNotificationMessages(saving) {
        const { dataset, warnings } = saving;
        const d2 = this.d2;
        const userName = this.d2.currentUser.name;
        const op = this.action === "edit" ? "edited" : "created";
        const warningsList = warnings.map(s => "- " + s).join("\n");
        const msg = {
            subject:
                `Dataset ${op}: ${dataset.name}` +
                (_(warnings).isEmpty() ? "" : " (with warnings)"),
            body:
                `Dataset ${op}: ${dataset.name} by ${userName}.` +
                (_(warnings).isEmpty() ? "" : `\n\nWarnings: \n\n${warningsList}`),
        };
        const userGroupNames = this._getUserGroupsForNotifications();

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

    _notifyError(err) {
        const datasetName = this.dataset.name;
        const stringErr = err.message || err;
        const title = `[dataset-configuration] Error when saving dataset '${datasetName}'`;
        const currentUser = this.d2.currentUser;
        const currentUserInfo = `User: ${currentUser.username} (${currentUser.id})`;
        const body = [
            `There has been an error when dataset '${datasetName}' was being saved.`,
            currentUserInfo,
            stringErr,
        ].join("\n\n");
        const userGroupNames = this._getUserGroupsForNotifications();

        sendMessageToGroups(this.d2, userGroupNames, title, body);
        throw err;
    }

    _setCreatedByAttribute(saving) {
        const attributeId = this.config.createdByDataSetConfigurationAttributeId;

        if (!attributeId) {
            return this._notifyError({
                message: "Setting createdByDataSetConfigurationAttribute is not set",
            }).catch(() => Promise.resolve(saving));
        } else {
            const attributeValues = saving.dataset.attributeValues || [];
            const attributeValueExists = _(attributeValues).some(
                av => av.attribute.id === attributeId
            );
            let newAttributeValues;
            if (attributeValueExists) {
                newAttributeValues = attributeValues.map(av =>
                    av.attribute.id === attributeId ? _.imerge(av, { value: "true" }) : av
                );
            } else {
                const newAttributeValue = { value: "true", attribute: { id: attributeId } };
                newAttributeValues = attributeValues.concat([newAttributeValue]);
            }

            saving.dataset.attributeValues = newAttributeValues;
            return Promise.resolve(saving);
        }
    }

    _processSave(methods) {
        const reducer = (accPromise, method) => accPromise.then(method.bind(this));
        return methods
            .reduce(reducer, this._getInitialSaving())
            .catch(err => this._notifyError(err));
    }

    save() {
        return this._processSave([
            this._setCreatedByAttribute,
            this._setDatasetId,
            this._setDatasetCode,
            this._addSharingToDataset,
            this._processSections,
            this._processDisaggregation,
            this._saveSections,
            this._saveDataset,
            this._runMetadataOps,
            this._addOrgUnitsToProject,
            this._addDataSetToUserRoles,
            this._saveCustomForm,
            this._sendNotificationMessages,
        ]);
    }
}
