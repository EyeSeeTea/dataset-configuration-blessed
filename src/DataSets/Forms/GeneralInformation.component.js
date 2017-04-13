import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import FormBuilder from 'd2-ui/lib/forms/FormBuilder.component';
import CheckBox from 'd2-ui/lib/form-fields/CheckBox.component';
import TextField from 'd2-ui/lib/form-fields/TextField.js';
import Dropdown from '../../forms/Dropdown.component';
import MultiSelect from '../../forms/MultiSelect.component';
import Validators from 'd2-ui/lib/forms/Validators';
import periodTypes from '../../config/periodTypes';
import DataInputPeriods from '../../forms/DataInputPeriods.component';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';

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

    _getLabel(name, isRequired = false) {
        const translationKey = _.snakeCase(_.last(name.split(".")));
        return this.getTranslation(translationKey) + (isRequired ? " (*)" : "");
    },

    _getTextField({
                name, 
                value = "", 
                isRequired = false, 
                multiLine = false, 
                type = "string", 
                validators = [],
                asyncValidators = [],
            }, otherProps = {}) {
        return {
            name: name,
            value: (value || "").toString(),
            component: TextField,
            validators: validators,
            asyncValidators: asyncValidators,
            props: {
                type: type,
                multiLine: multiLine,
                style: {width: "100%"},
                changeEvent: "onBlur",
                floatingLabelText: this._getLabel(name, isRequired),
                ...otherProps,
            },
        };
    },

    _getSelectField({name, options, value = undefined, isRequired = false} = {}) {
        return {
            name: name,
            component: Dropdown,
            value: value,
            props: {
                options: options,
                isRequired: isRequired,
                labelText: this._getLabel(name, isRequired),
            },
        };
    },

    _getBooleanField({name, onChange, value = false} = {}) {
        return {
            name: name,
            component: CheckBox,
            value: value,
            props: {
                checked: value,
                label: this._getLabel(name),
                onCheck: (ev, newValue) => onChange(name, newValue),
            },
        };
    },

    _onUpdateField(fieldPath, newValue) {
        this.props.onFieldsChange(fieldPath, newValue);
    },

    _getAsyncUniqueValidator(model, field, uid) {
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
            this._getTextField({
                name: "dataset.name",
                value: dataset.name, 
                isRequired: true,
                validators: [{
                    validator: Validators.isRequired,
                    message: this.getTranslation(Validators.isRequired.message),
                }],
            }),
            this._getTextField({
                name: "dataset.code",
                value: dataset.code,
                asyncValidators: [
                    this._getAsyncUniqueValidator(this.context.d2.models.dataSet, "code", null),
                ],
            }),
            this._getTextField({
                name: "dataset.description",
                value: dataset.description,
                multiLine: true,
            }),
            this._getTextField({
                name: "dataset.expiryDays",
                value: dataset.expiryDays,
                type: "number",
            }),
            this._getTextField({
                name: "dataset.openFuturePeriods",
                value: dataset.openFuturePeriods,
                type: "number",
            }),
            this._getSelectField({
                name: "dataset.periodType", 
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
            this._getBooleanField({
                name: "dataset.notifyCompletingUser",
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