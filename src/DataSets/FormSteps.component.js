import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import fp from 'lodash/fp';
import Wizard from '../Wizard/Wizard.component';
import { goToRoute } from '../router';

import InitialConfig from './Forms/InitialConfig.component';
import GeneralInformation from './Forms/GeneralInformation.component';
import OrganizationUnit from './Forms/OrganizationUnit.component';
import Save from './Forms/Save.component';

const DataSetFormSteps = React.createClass({
    mixins: [Translate],

    saveStates: {DATAENTRY: "DATAENTRY", SAVED: "SAVED", SAVE_ERROR: "SAVE_ERROR"},

    propTypes: {
    },

    config: {
        categoryOptionsProjectsId: "MRwzyV0kXv9",
        categoryOptionsCoreCompetencyId: "ouNRBWIbnxY",
        categoryComboId: "GmXXE8fiCK5",
    },

    _update(model, attributes) {
        _.forEach(attributes, (k, v) => { model[k] = v; });
        return model;
    },

    _getInitialModel() {
        return this.context.d2.models.dataSet.create({
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
        });
    },

    _updateDatasetFromAssociations(dataset, associations) {
        const {project} = associations;
        const clonedDataset = dataset.clone();

        if (project) {
            const getOrgUnitIds = (ds) => ds.organisationUnits.toArray().map(ou => ou.id);
            clonedDataset.name = project.displayName ? project.displayName : "";
            clonedDataset.code = project.code ? project.code + " Data Set" : "";
            clonedDataset.organisationUnits = project.organisationUnits;
            const overwritten = (
                (dataset.name && (dataset.name !== clonedDataset.name)) || 
                (dataset.code && (dataset.code !== clonedDataset.code)) ||
                (!_.isEmpty(getOrgUnitIds(dataset)) &&
                    !_.isEqual(getOrgUnitIds(dataset), getOrgUnitIds(clonedDataset)))
            );
            return {dataset: clonedDataset, overwritten};
        } else {
            return {dataset: dataset, overwritten: false};
        }
    },

    getInitialState() {
        const associations = {
            project: null,
            coreCompetencies: [],
        }
        const datasetBase = this._getInitialModel();
        const {dataset} = this._updateDatasetFromAssociations(datasetBase, associations);
        const data = {associations: associations, dataset: dataset};
        return {
            data: data,
            active: 0,
            doneUntil: 0,
            validating: false,
            saveState: this.saveStates.DATAENTRY,
        };
    },

    _associationUpdates(fieldPath, oldValue, newValue) {
        if (fieldPath == "associations.project") {
            const {dataset, associations} = this.state.data;
            const {dataset: newDataset, overwritten} = 
                this._updateDatasetFromAssociations(dataset, associations);

            if (!overwritten || confirm(this.getTranslation("confirm_project_updates"))) {
                this.state.data.dataset = newDataset;
            }
        }
    },

    _onFieldsChange(stepId, fieldPath, newValue) {
        const oldValue = fp.get(fieldPath, this.state.data);
        _.set(this.state.data, fieldPath, newValue);
        this._associationUpdates(fieldPath, oldValue, newValue);
        this.setState({data: this.state.data});
    },

    _onCancel() {
        if (confirm(this.getTranslation("confirm_wizard_cancel"))) {
            goToRoute("/");
        }
    },

    _onStepChange(newIndex) {
        if (newIndex > this.state.active) {
            this.setState({stepAfterValidation: newIndex});    
        } else {
            this.setState({active: newIndex, doneUntil: newIndex});
        }
    },

    _redirectAfterSave() {
        this.setState({saveState: this.saveStates.SAVED})
        _.delay(() => goToRoute("/"), 3000);
    },

    _saveErrors(error) {
        let errors;

        if (error instanceof String) {
            errors = [error];
        } else if (error.response && error.response.errorReports instanceof Array) {
            errors = error.response.errorReports.map(msg => msg.message);
        } else if (error.messages instanceof Array) {
            errors = error.messages.map(msg => msg.message);
        } else {
            errors = ["Unknown error"]
        }
        this.setState({saveState: this.saveStates.SAVE_ERROR, errors: errors})
    },

    _onSave() {
        const {dataset} = this.state.data;
        dataset.save().then(this._redirectAfterSave).catch(this._saveErrors)
    },

    _showButtonFunc(step) {
        return step.id === "save";
    },

    _formStatus(isValid) {
        const newIndex = this.state.stepAfterValidation;

        if (isValid && newIndex) {
            this.setState({stepAfterValidation: null, active: newIndex, doneUntil: newIndex});
        } else {
            this.setState({stepAfterValidation: null});
        }
    },

    render() {
        const props = {
            config: this.config,
            data: this.state.data,
            validateOnRender: !!this.state.stepAfterValidation,
            formStatus: this._formStatus,
        };
        const buttons = [
            {
                id: 'cancel',
                label: this.getTranslation("cancel"),
                onClick: this._onCancel,
            },
            {
                id: 'save',
                label: this.getTranslation("save"),
                onClick: this._onSave,
                showFunc: this._showButtonFunc,
            },
        ];

        const steps = [
            {
                id: 'initialConfig',
                title: this.getTranslation("step_initial_configuration"),
                component: InitialConfig,
                props: props,
            },
            {
                id: 'generalInformation',
                title: this.getTranslation("step_general_information"),
                component: GeneralInformation,
                props: props,
            },
            {
                id: 'organizationUnit',
                title: this.getTranslation("organisation_unit"),
                component: OrganizationUnit,
                props: props,
            },
            {
                id: 'save',
                title: this.getTranslation("save"),
                component: Save,
                props: _.merge(props, {state: this.state.saveState, errors: this.state.errors}),
            },
        ];

        return (
            <Wizard 
                steps={steps} 
                onFieldsChange={this._onFieldsChange} 
                onStepChange={this._onStepChange}
                active={this.state.active}
                doneUntil={this.state.doneUntil}
                buttons={buttons}
            />
        );
    },
});

export default DataSetFormSteps;