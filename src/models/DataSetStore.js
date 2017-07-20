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
        };
        const {associations, dataset} = this.getInitialState();
        this.associations = associations;
        this.dataset = dataset;
        console.log("store", this);
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

    saveDataset(dataSetModel) {
        return new Promise(async (complete, error) => {
            // maintenance-app uses a custom function to save the dataset as it needs to do
            // some processing  not allowed by dataset.save(). The code in this method is copied
            // from maintenance-app/src/EditModel/objectActions.js
            const d2 = this.d2;
            const api = d2.Api.getApi();
            const dataSetPayload = getOwnedPropertyJSON(dataSetModel);

            if (!dataSetPayload.id) {
                const dataSetId = await api.get('system/uid', { limit: 1 }).then(({ codes }) => codes[0]);
                dataSetPayload.id = dataSetId;
            }

            const dataSetElements = Array
                .from(dataSetModel.dataSetElements ? dataSetModel.dataSetElements.values() : [])
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
                    complete(dataSetPayload);
                } else {
                    const errorMessages = extractErrorMessagesFromResponse(response);

                    error(head(errorMessages) || 'Unknown error!');
                }
            } catch (err) {
                error(err);
            }
        });
    }

    applyDisaggregation(sourceDataset) {
        const dataset = sourceDataset.clone();

        return getCategoryCombos(this.d2).then(categoryCombos => {
            const newDataSetElements$ = Promise.map(sourceDataset.dataSetElements, dataSetElement => {
                const dataElementCategories = dataSetElement.dataElement.categoryCombo.categories;
                const dataSetElementCategories =
                    collectionToArray(dataSetElement.categoryCombo.categories);
                const categories = _(dataElementCategories)
                    .concat(dataSetElementCategories).uniqBy("id").value();
                const existingCategoryCombo = _(categoryCombos.toArray()).find(categoryCombo =>
                    _(categoryCombo.categories.toArray())
                        .orderBy("id")
                        .map(c => c.id)
                        .isEqual(_(categories).orderBy("id").map(c => c.id))
                );

                if (existingCategoryCombo) {
                    dataSetElement.categoryCombo = {id: existingCategoryCombo.id};
                    return Promise.resolve(dataSetElement);
                } else {
                    const newCategoryCombo = this.d2.models.categoryCombo.create({
                        name: _(categories).map("name").join("/"),
                        categories: _(categories).map(c => ({id: c.id})).value(),
                        dataDimensionType: "DISAGGREGATION",
                    })
                    newCategoryCombo.dirty = true;
                    return newCategoryCombo.save().then(res => {
                        dataSetElement.categoryCombo = {id: newCategoryCombo.id};
                        return dataSetElement;
                    });
                }
            }, {concurrency: 1});

            return newDataSetElements$.then(newDataSetElements => {
                dataset.dataSetElements = newDataSetElements;
                dataset.dirty = true;
                return dataset;
            })
        });
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
        return this.applyDisaggregation(this.dataset)
            .then(dataset => this.setCode(dataset))
            .then(dataset => this.saveDataset(dataset))
            .then(dataset => {
                const datasetId = dataset.id;
                const sections = _(this.associations.sections)
                    .sortBy(section => section.name)
                    .map(section => {
                        const clonedSection = section.clone();
                        clonedSection.dataSet = {id: datasetId};
                        return clonedSection;
                    })
                    .value();
                return Promise.map(sections, section => section.save(), {concurrency: 1});
            });
    }
}