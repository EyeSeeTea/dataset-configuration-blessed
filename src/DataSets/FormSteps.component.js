import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import Wizard from '../Wizard/Wizard.component';
import { goToRoute } from '../router';

import InitialConfig from './Forms/InitialConfig.component';
import GeneralInformation from './Forms/GeneralInformation.component';
import OrganisationUnit from './Forms/OrganisationUnit.component';
import Sections from './Forms/Sections.component';
import Save from './Forms/Save.component';

import DataSetStore from '../models/DataSetStore';

const DataSetFormSteps = React.createClass({
    mixins: [Translate],
    propTypes: {},
    saveStates: {
        DATAENTRY: "DATAENTRY",
        SAVING: "SAVING",
        SAVED: "SAVED",
        SAVE_ERROR: "SAVE_ERROR",
    },

    getInitialState() {
        return {
            store: new DataSetStore(this.context.d2, this.getTranslation),
            active: 0,
            doneUntil: 0,
            validating: false,
            saveState: this.saveStates.DATAENTRY,
        };
    },

    _onFieldsChange(stepId, fieldPath, newValue) {
        this.state.store.updateField(fieldPath, newValue);
        this.setState({store: this.state.store});
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
        const message = JSON.stringify(error, Object.getOwnPropertyNames(error));
        this.setState({saveState: this.saveStates.SAVE_ERROR, errors: [message]})
    },

    _onSave() {
        this.setState({saveState: this.saveStates.SAVING});
        this.state.store
            .save()
            .then(this._redirectAfterSave)
            .catch(this._saveErrors);
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
            config: this.state.store.config,
            store: this.state.store,
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
                id: 'organisationUnit',
                title: this.getTranslation("organisation_unit"),
                component: OrganisationUnit,
                props: props,
            },
            {
                id: 'sections',
                title: this.getTranslation("step_sections"),
                component: Sections,
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
