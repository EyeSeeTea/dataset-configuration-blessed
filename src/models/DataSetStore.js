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
    getCategoryCombo,
    setAttributes,
} from "../utils/Dhis2Helpers";

import { getCoreCompetencies, getProject } from "./dataset";
import * as Section from "./Section";
import getCustomForm from "./CustomForm";
import * as dataPeriods from "./data-periods";

const toArray = collectionToArray;
const dataInputPeriodDatesFormat = "YYYYMMDD";

function parseDate(value) {
    const date = moment(value, dataInputPeriodDatesFormat);
    return value && date.isValid() ? date.toDate() : undefined;
}

function parsePeriodDates(stringDate) {
    // Example: "2018=20180501-20180531,2019=20190501-20190531"
    return _((stringDate || "").split(","))
        .map(stringDateForYear => {
            const [year, stringDateInterval] = stringDateForYear.split("=");
            const [start, end] = (stringDateInterval || "").split("-").map(parseDate);
            return year ? [year, { start, end }] : null;
        })
        .compact()
        .fromPairs()
        .value();
}

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
                dse.dataSet = { id: undefined };
            });
            toArray(dataset.sections).forEach(section => {
                section.id = undefined;
            });
            // On dataset clone, the custom form is reused, clear the field explicitly
            dataset.dataEntryForm = undefined;
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
            "*,dataSetElements[*,categoryCombo[*,categories[id,displayName]],dataElement[*,categoryCombo[*]]]",
            "sections[*,href],organisationUnits[*],dataEntryForm[id]",
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
                sections: collectionToArray(dataset.sections),
                countries: sharingCountries,
                userRoles,
                ...dataPeriods.getDataInputDates(dataset),
                ...this.getPeriodAssociations(dataset),
            })
        );
    }

    getPeriodAssociations(dataset) {
        const { dataPeriodOutputDatesAttributeId, dataPeriodOutcomeDatesAttributeId } = this.config;

        const valueByAttrId = _(dataset.attributeValues)
            .map(av => [av.attribute.id, av.value])
            .fromPairs()
            .value();

        const output = parsePeriodDates(valueByAttrId[dataPeriodOutputDatesAttributeId]);
        const outcome = parsePeriodDates(valueByAttrId[dataPeriodOutcomeDatesAttributeId]);

        const hasSameDatesAcrossYears = datesByYear => {
            return _(datesByYear)
                .values()
                .map(dates =>
                    _(dates)
                        .values()
                        .map(date => (date ? moment(date).format("MM-DD") : undefined))
                        .value()
                )
                .unzip()
                .every(datesGroup => datesGroup.length > 1 && _.uniq(datesGroup).length === 1);
        };

        return {
            periodDatesApplyToAll: {
                output: hasSameDatesAcrossYears(output),
                outcome: hasSameDatesAcrossYears(outcome),
            },
            periodDates: { output, outcome },
        };
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

    getPeriodYears() {
        const { dataInputStartDate, dataInputEndDate } = this.associations;
        if (!dataInputStartDate || !dataInputEndDate) {
            return [];
        } else {
            const startYear = moment(dataInputStartDate).year();
            const endYear = moment(dataInputEndDate)
                .add(1, "year")
                .year();
            return _.range(startYear, endYear);
        }
    }

    getPeriodDates() {
        const { associations } = this;
        const { periodDatesApplyToAll, periodDates } = associations;
        const years = this.getPeriodYears();
        const firstYear = years[0];
        const processDate = (date, index) =>
            date
                ? moment(date)
                      .add(index, "years")
                      .format("YYYY-MM-DD")
                : undefined;

        return _(periodDates)
            .mapValues((datesByYear, type) => {
                const datesFirstYear = periodDates[type][firstYear];
                const applyToAll = periodDatesApplyToAll[type];
                return _(years)
                    .map((year, index) => {
                        const dates = datesByYear[year];
                        const value =
                            applyToAll && datesFirstYear
                                ? {
                                      start: processDate(datesFirstYear.start, 0),
                                      end: processDate(datesFirstYear.end, index),
                                  }
                                : {
                                      start: dates ? processDate(dates.start, 0) : undefined,
                                      end: dates ? processDate(dates.end, 0) : undefined,
                                  };
                        return [year, value];
                    })
                    .fromPairs()
                    .value();
            })
            .value();
    }

    async _getCustomForm(saving, categoryCombos_) {
        const { richSections, dataset } = saving;
        const periodDates = this.getPeriodDates();
        const categoryCombos =
            categoryCombos_ ||
            (await getCategoryCombos(this.d2, { cocFields: "id,categoryOptions[id]" }));
        const id = (dataset.dataEntryForm ? dataset.dataEntryForm.id : null) || generateUid();

        return getCustomForm(this.d2, dataset, periodDates, richSections, categoryCombos).then(
            htmlCode => ({
                id: id,
                style: "NORMAL",
                htmlCode,
                name: [dataset.id, id].join("-"), // Form name must be unique
            })
        );
    }

    getDataInputPeriods({ dataInputStartDate: startDate, dataInputEndDate: endDate }) {
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
                currentDate.add(1, "month").startOf("month");
            }
            return periods;
        } else {
            return [];
        }
    }

    getOpenFuturePeriods(endDate) {
        if (endDate) {
            const endDateM = moment(endDate);
            const currentDate = moment();
            const monthsDiff = Math.ceil(moment(endDateM).diff(currentDate, "months", true));
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

            newDataset.name = project.displayName ? `${project.displayName} DataSet` : "";
            newAssociations.dataInputStartDate = project.startDate
                ? new Date(project.startDate)
                : undefined;
            newAssociations.dataInputEndDate = project.endDate
                ? new Date(project.endDate)
                : undefined;
            newDataset.openFuturePeriods = this.getOpenFuturePeriods(
                newAssociations.dataInputEndDate
            );
            newDataset.dataInputPeriods = this.getDataInputPeriods(newAssociations);
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
            newDataset.dataInputPeriods = this.getDataInputPeriods(newAssociations);
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
                .at(toArray(dataset.organisationUnits).map(ou => ou.id))
                .compact()
                .value();
        }
    }

    setDefaultPeriodValues() {
        const { dataInputStartDate, dataInputEndDate } = this.associations;
        if (!(dataInputStartDate && dataInputEndDate)) return;

        const years = this.getPeriodYears();

        const getPeriodDates = (years, { month }) =>
            _(years)
                .map(year => {
                    const period = {
                        start:
                            dataInputStartDate.getFullYear() === year
                                ? dataInputStartDate
                                : new Date(year, 0, 1),
                        end: new Date(year + 1, month - 1, 1),
                    };
                    return [year, period];
                })
                .fromPairs()
                .value();

        _.assign(this.associations, {
            periodDatesApplyToAll: {
                output: false,
                outcome: false,
            },
            periodDates: {
                output: getPeriodDates(years, { month: 4 }),
                outcome: getPeriodDates(years, { month: 5 }),
            },
        });
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
                    this.setDefaultPeriodValues();
                }
                break;
            case "associations.dataInputStartDate":
            case "associations.dataInputEndDate":
                const { dataInputEndDate } = associations;
                this.setDefaultPeriodValues();
                this.dataset.openFuturePeriods = this.getOpenFuturePeriods(dataInputEndDate);
                this.dataset.dataInputPeriods = this.getDataInputPeriods(associations);
                break;
            case "associations.organisationUnits":
                this.associations.countries = this.getSharingCountries();
                break;
            default:
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
            throw new Error("setGreyedFields: invalid input array length");
        }
        _(sections)
            .zip(greyedFieldsForSections)
            .each(([section, greyedFields]) => update(section, { greyedFields }));
    }

    hasSections() {
        return collectionToArray(this.dataset.sections).length > 0;
    }

    /* Save */

    _getInitialSaving() {
        const { countries, project } = this.associations;
        const userGroups$ = this.d2.models.userGroups.list({ paging: false, fields: "id,name" });
        const project$ = project
            ? this.d2.models.categoryOption.get(project.id)
            : Promise.resolve(null);
        const categoryCombos$ = getCategoryCombos(this.d2, { cocFields: "id,categoryOptions[id]" });
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
                    userGroups: toArray(userGroups),
                    metadata: {},
                    categoryCombos: categoryCombos,
                };
            }
        );
    }

    _processDisaggregation(saving) {
        const { dataset, categoryCombos } = saving;

        const existingCategoryCombos = new Set(toArray(categoryCombos).map(cc => cc.id));
        const dataSetElements = collectionToArray(dataset.dataSetElements);
        const removeUnusedGreyedFields = (sections, newCategoryCombos) => {
            const categoryComboOptionsByCCId = _(collectionToArray(saving.categoryCombos))
                .concat(newCategoryCombos)
                .map(cc => [cc.id, toArray(cc.categoryOptionCombos).map(coc => coc.id)])
                .fromPairs()
                .value();

            const allowedGreyedFieldKeys = new Set(
                _(dataSetElements)
                    .flatMap(dse =>
                        _([dse.dataElement.id])
                            .cartesianProduct(categoryComboOptionsByCCId[getCategoryCombo(dse).id])
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
            .map(getCategoryCombo)
            .uniqBy(cc => cc.id)
            .filter(cc => !existingCategoryCombos.has(cc.id))
            .map(cc => this._addSharingToCategoryCombo(saving, cc))
            .value();
        const newCategoryComboOptions = _(newCategoryCombos)
            .flatMap(cc => toArray(cc.categoryOptionCombos))
            .value();

        dataset.sections = removeUnusedGreyedFields(dataset.sections, newCategoryCombos);

        const savingWithAllCategoryCombos = {
            ...saving,
            categoryCombos: saving.categoryCombos.toArray().concat(newCategoryCombos),
        }

        return this._addMetadataOp(savingWithAllCategoryCombos, {
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

    async _saveDataset(saving) {
        const { dataset, categoryCombos } = saving;

        const form = await this._getCustomForm(saving, categoryCombos);

        // Cleanup dataSetElements to avoid "circular references" error on POST
        const datasetPayload = getOwnedPropertyJSON(dataset);
        const newDataSetElements = dataset.dataSetElements.map(dataSetElement => ({
            dataSet: { id: dataset.id },
            dataElement: { id: dataSetElement.dataElement.id },
            categoryCombo: { id: getCategoryCombo(dataSetElement).id },
        }));
        datasetPayload.dataSetElements = newDataSetElements;
        datasetPayload.dataEntryForm = { id: form.id };

        return this._addMetadataOp(saving, {
            create_and_update: {
                dataSets: [datasetPayload],
                dataEntryForms: [form],
            },
        });
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

    _getUserGroupName(coreCompetency, countryCode) {
        // coreCompetency.name = "FOOD SECURITY" -> "${countryCode}_foodsecurityUsers"
        const key = coreCompetency.name.toLocaleLowerCase().replace(/\W+/g, "");
        return `${countryCode}_${key}Users`;
    }

    _addWarnings(saving, msgs) {
        return _.imerge(saving, { warnings: saving.warnings.concat(msgs) });
    }

    _addSharingToDataset(saving) {
        const { dataset } = saving;
        const { coreCompetencies } = this.associations;

        const coreCompetenciesSharing = _.cartesianProduct(coreCompetencies, saving.countryCodes).map(
            ([coreCompetency, countryCode]) => {
                const userGroupName = this._getUserGroupName(coreCompetency, countryCode);
                return [userGroupName, { access: "r-rw----" }];
            }
        );

        const userGroupSharingByName = _(saving.countryCodes)
            .flatMap(countryCode => [
                [countryCode + "_Users", { access: "r-rw----" }],
                [countryCode + "_Administrators", { access: "rwrw----" }],
            ])
            .concat(coreCompetenciesSharing)
            .concat([["GL_GlobalAdministrator", { access: "rwrw----" }]])
            .fromPairs()
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
            .then(toArray)
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

    _setAttributes(saving) {
        const attributeKeys = ["createdByDataSetConfigurationAttributeId"];

        const missingAttributeKeys = attributeKeys.filter(key => !this.config[key]);

        if (!_(missingAttributeKeys).isEmpty()) {
            this._notifyError({
                message: `Missing settings: ${missingAttributeKeys.join(", ")}`,
            });
            return Promise.resolve(saving);
        }

        const attributeValues = dataPeriods.getAttributeValues(this, saving.dataset);
        const valuesByKey = {
            createdByDataSetConfigurationAttributeId: "true",
        };
        const values = _.mapKeys(valuesByKey, (_value, key) => this.config[key]);
        const newAttributeValues = setAttributes(attributeValues, values);
        saving.dataset.attributeValues = newAttributeValues;
        return Promise.resolve(saving);
    }

    _processSave(methods) {
        const reducer = (accPromise, method) => accPromise.then(method.bind(this));
        return methods
            .reduce(reducer, this._getInitialSaving())
            .catch(err => this._notifyError(err));
    }

    buildCustomForm(categoryCombos) {
        return this._processSections({ dataset: this.dataset }).then(saving =>
            this._getCustomForm(saving, categoryCombos)
        );
    }

    save() {
        return this._processSave([
            this._setAttributes,
            this._setDatasetId,
            this._setDatasetCode,
            this._addSharingToDataset,
            this._processSections,
            this._processDisaggregation,
            this._saveSections,
            this._saveDataset,
            this._runMetadataOps,
            this._addOrgUnitsToProject,
            this._sendNotificationMessages,
        ]);
    }
}
