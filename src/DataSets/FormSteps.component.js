import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import Wizard from '../Wizard/Wizard.component';
import { goToRoute } from '../router';

import InitialConfig from './Forms/InitialConfig.component';
import GeneralInformation from './Forms/GeneralInformation.component';
import OrganisationUnit from './Forms/OrganisationUnit.component';
import Sections from './Forms/Sections.component';
import Disaggregation from './Forms/Disaggregation.component';
import Sharing from './Forms/Sharing.component';
import GreyFields from './Forms/GreyFields.component';
import Save from './Forms/Save.component';
import snackActions from '../Snackbar/snack.actions';

import DataSetStore from '../models/DataSetStore';
import Settings from '../models/Settings';

const DataSetFormSteps = React.createClass({
    mixins: [Translate],
    propTypes: {},

    getInitialState() {
        return {
            store: null,
            active: 0,
            doneUntil: 0,
            validating: false,
            saving: false,
        };
    },

    componentDidMount() {
        const {d2} = this.context;
        const settings = new Settings(d2);
        const {action, id: datasetId} = this.props;

        const getStore = (config) => {
            if (action === "add") {
                return DataSetStore.add(d2, config);
            } else if (action === "edit") {
                return DataSetStore.edit(d2, config, datasetId);
            } else if (action === "clone") {
                return DataSetStore.clone(d2, config, datasetId);
            } else {
                throw `Unknown action: ${action}`;
            }
        };

        settings.get()
            .then(config => {
                return getStore(config)
                    .then(store => this.setState({store}))
                    .catch(err => snackActions.show({route: "/", message: `Cannot edit dataset: ${err}`}));
            })
            .catch(err => {
                snackActions.show({route: "/", message: `Error: settings not found: ${err}`});
            });
    },

    _onFieldsChange(stepId, fieldPath, newValue, update = true) {
        this.state.store.updateField(fieldPath, newValue);
        if (update) {
            this.forceUpdate();
        }
    },

    _afterSave() {
        goToRoute("/");
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
        if (!this.state.store)
            return null;

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
                onClick: () => this.setState({saving: true}),
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
                actionsBar: ["top", "bottom"],
                props: props,
            },
            {
                id: 'disaggregation',
                title: this.getTranslation("step_disaggregation"),
                component: Disaggregation,
                actionsBar: ["top", "bottom"],
                props: props,
            },
            {
                id: 'grey_fields',
                title: this.getTranslation("step_grey_fields"),
                component: GreyFields,
                actionsBar: ["top", "bottom"],
                props: props,
            },
            {
                id: 'sharing',
                title: this.getTranslation("step_sharing"),
                component: Sharing,
                actionsBar: ["bottom"],
                props: props,
            },
            {
                id: 'save',
                title: this.getTranslation("save"),
                component: Save,
                props: _.merge(props,
                    {saving: this.state.saving, afterSave: this._afterSave}),
            },
        ].filter(step => !step.disabled);

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
