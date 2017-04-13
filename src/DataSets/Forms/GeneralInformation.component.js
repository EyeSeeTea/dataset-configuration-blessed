import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import FormBuilder from 'd2-ui/lib/forms/FormBuilder.component';
import Validators from 'd2-ui/lib/forms/Validators';
import periodTypes from '../../config/periodTypes';
import DataInputPeriods from '../../forms/DataInputPeriods.component';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import FormHelpers from '../../forms/FormHelpers';

const GeneralInformation = React.createClass({
    mixins: [Translate],

    propTypes: {
        config: React.PropTypes.object,
        data: React.PropTypes.object,
        onFieldsChange: React.PropTypes.func,
        validateOnRender: React.PropTypes.bool,
    },

    getInitialState() {
        return {isLoading: true};
    },

    componentDidMount() {
        const categoryCombination = this.context.d2
            .models.categoryCombos
            .list({
                filter: ["dataDimensionType:eq:ATTRIBUTE", "name:eq:default"], 
                fields: "id, displayName", 
                paging: false, 
                rootJunction: "OR",
            })
            .then(collection => collection.toArray())
            .then(categoryCombinations => this.setState({
                isLoading: false, 
                categoryCombinations,
            }));
    },

    _getLabel(name, isRequired) {
        const translationKey = _.snakeCase(_.last(name.split(".")));
        return this.getTranslation(translationKey) + (isRequired ? " (*)" : "");
    },

    _onUpdateField(fieldPath, newValue) {
        this.props.onFieldsChange(fieldPath, newValue);
    },

    _getAsyncUniqueValidator(model, field, uid = null) {
        return (value) => {
            if (!value || !value.trim()) {
                return Promise.resolve(true);
            } else {
                const baseFilteredModel = model.filter().on(field).equals(value);
                const filteredModel = !uid ? baseFilteredModel : 
                    baseFilteredModel.filter().on('id').notEqual(uid);

                return filteredModel.list().then(collection => {
                    if (collection.size > 0) {
                        return Promise.reject(this.getTranslation('value_not_unique'));
                    } else {
                        return Promise.resolve(true);
                    }
                });
            }
        };
    },

    _renderForm() {
        const {associations, dataset} = this.props.data;
        const projectCode = associations.project && associations.project.code;
        const fields = [
            FormHelpers.getTextField({
                name: "dataset.name",
                getLabel: this._getLabel,
                value: dataset.name, 
                isRequired: true,
                validators: [{
                    validator: Validators.isRequired,
                    message: this.getTranslation(Validators.isRequired.message),
                }],
            }),
            FormHelpers.getTextField({
                name: "dataset.code",
                getLabel: this._getLabel,
                value: dataset.code,
                asyncValidators: [
                    this._getAsyncUniqueValidator(this.context.d2.models.dataSet, "code"),
                ],
            }),
            FormHelpers.getTextField({
                name: "dataset.description",
                getLabel: this._getLabel,
                value: dataset.description,
                multiLine: true,
            }),
            FormHelpers.getTextField({
                name: "dataset.expiryDays",
                getLabel: this._getLabel,
                value: dataset.expiryDays,
                type: "number",
            }),
            FormHelpers.getTextField({
                name: "dataset.openFuturePeriods",
                getLabel: this._getLabel,
                value: dataset.openFuturePeriods,
                type: "number",
            }),
            FormHelpers.getSelectField({
                name: "dataset.periodType", 
                getLabel: this._getLabel,
                isRequired: true,
                options: periodTypes.map(pt => ({text: pt, value: pt})), 
                value: dataset.periodType,
            }),
            {
                name: "dataset.dataInputPeriods",
                component: DataInputPeriods,
                value: dataset.dataInputPeriods,
                props: {
                    model: dataset,
                    onChange: (data) => 
                        this._onUpdateField("dataset.dataInputPeriods", data.target.value),
                    labelText: this._getLabel("dataInputPeriods", false),
                },
            },
            FormHelpers.getBooleanField({
                name: "dataset.notifyCompletingUser",
                getLabel: this._getLabel,
                value: dataset.notifyCompletingUser,
                onChange: this._onUpdateField,
            })
        ];

        return (
            <FormBuilder 
                fields={fields} 
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