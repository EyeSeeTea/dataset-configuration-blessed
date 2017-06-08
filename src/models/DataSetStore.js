import fp from 'lodash/fp';
import { generateUid } from 'd2/lib/uid';
import moment from 'moment';

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
        };
        const {associations, dataset} = this.getInitialState();
        this.associations = associations;
        this.dataset = dataset;
    }

    getInitialModel() {
        return this.d2.models.dataSet.create({
            name: undefined ,
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
            indicators: [],
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
            clonedDataset.code = project.code ? project.code + " Data Set" : "";
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

    save() {
        this.dataset.dirty = true;
        return this.dataset.save()
            .then(({response}) => {
                const sections = _(this.associations.sections)
                    .sortBy(section => section.name)
                    .map(section => {
                        let clonedSection = section.clone();
                        clonedSection.dataSet = {id: response.uid};
                        return clonedSection;
                    })
                    .value();
                return sections
                    .reduce((promise, section) => promise.then(() => section.save()), Promise.resolve());
            });
    }
}