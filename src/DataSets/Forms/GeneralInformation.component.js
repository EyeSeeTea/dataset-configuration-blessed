import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import FormBuilder from 'd2-ui/lib/forms/FormBuilder.component';
import Validators from 'd2-ui/lib/forms/Validators';
import periodTypes from '../../config/periodTypes';
import DataInputPeriods from '../../forms/DataInputPeriods.component';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import FormHelpers from '../../forms/FormHelpers';
import Settings from '../../models/Settings';

const GeneralInformation = React.createClass({
    mixins: [Translate],

    propTypes: {
        config: React.PropTypes.object,
        store: React.PropTypes.object,
        onFieldsChange: React.PropTypes.func,
        validateOnRender: React.PropTypes.bool,
    },

    getInitialState() {
        const settings = new Settings(this.context.d2);
        return {isLoading: true, currentUserHasAdminRole: settings.currentUserHasAdminRole()};
    },

    componentDidMount() {
        this.context.d2
            .models.categoryCombos
            .list({
                filter: ["dataDimensionType:eq:ATTRIBUTE", "name:eq:default"], 
                fields: "id,name", 
                paging: false, 
                rootJunction: "OR",
            })
            .then(collection => collection.toArray())
            .then(categoryCombinations => this.setState({
                isLoading: false, 
                categoryCombinations,
            }));
    },

    _onUpdateField(fieldPath, newValue) {
        this.props.onFieldsChange(fieldPath, newValue);
    },

    _renderForm() {
        const {associations, dataset} = this.props.store;
        const fields = [
            FormHelpers.getTextField({
                name: "dataset.name",
                label: this.getTranslation("name"),
                value: dataset.name, 
                isRequired: true,
                validators: [{
                    validator: Validators.isRequired,
                    message: this.getTranslation(Validators.isRequired.message),
                }],
            }),

            FormHelpers.getTextField({
                name: "dataset.description",
                label: this.getTranslation("description"),
                value: dataset.description,
                multiLine: true,
            }),

            this.state.currentUserHasAdminRole ? FormHelpers.getTextField({
                name: "dataset.expiryDays",
                label: this.getTranslation("expiry_days"),
                help: this.getTranslation("expiry_days_help"),
                value: dataset.expiryDays,
                type: "number",
            }) : null,

            FormHelpers.getTextField({
                name: "dataset.openFuturePeriods",
                label: this.getTranslation("open_future_periods"),
                value: dataset.openFuturePeriods,
                type: "number",
            }),

            FormHelpers.getSelectField({
                name: "dataset.periodType", 
                label: this.getTranslation("period_type"),
                isRequired: true,
                options: periodTypes.map(pt => ({text: pt, value: pt})), 
                value: dataset.periodType,
            }),

            FormHelpers.getDateField({
                name: "associations.dataInputStartDate",
                value: associations.dataInputStartDate,
                label: FormHelpers.getLabel(this.getTranslation("data_input_start_date")),
                onChange: (date) => this._onUpdateField("associations.dataInputStartDate", date),
            }),

            FormHelpers.getDateField({
                name: "associations.dataInputEndDate",
                value: associations.dataInputEndDate,
                label: FormHelpers.getLabel(this.getTranslation("data_input_end_date")),
                onChange: (date) => this._onUpdateField("associations.dataInputEndDate", date),
            }),

            FormHelpers.getBooleanField({
                name: "dataset.notifyCompletingUser",
                label: this.getTranslation("notify_completing_user"),
                value: dataset.notifyCompletingUser,
                onChange: this._onUpdateField,
            }),
        ];

        return (
            <FormBuilder
                fields={_.compact(fields)}
                onUpdateField={this._onUpdateField}
                onUpdateFormStatus={this._onUpdateFormStatus}
                validateOnRender={this.props.validateOnRender}
            />
        );
    },

    _onUpdateFormStatus(status) {
        this.props.formStatus(status.valid);
    },

    render() {
        if (this.state.isLoading) {
            return (<LinearProgress />);
        } else {
            return this._renderForm();
        }
    },
});

export default GeneralInformation;