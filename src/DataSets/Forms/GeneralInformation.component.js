import React from "react";
import _ from "lodash";
import Translate from "d2-ui/lib/i18n/Translate.mixin";
import FormBuilder from "d2-ui/lib/forms/FormBuilder.component";
import Validators from "d2-ui/lib/forms/Validators";
import LinearProgress from "material-ui/LinearProgress/LinearProgress";
import FormHelpers from "../../forms/FormHelpers";
import { currentUserHasAdminRole } from "../../utils/Dhis2Helpers";

const GeneralInformation = React.createClass({
    mixins: [Translate],

    styles: {
        error: {
            color: "red",
        },
    },

    propTypes: {
        config: React.PropTypes.object,
        store: React.PropTypes.object,
        onFieldsChange: React.PropTypes.func,
        validateOnRender: React.PropTypes.bool,
    },

    getInitialState() {
        return {
            error: null,
            isLoading: true,
            currentUserHasAdminRole: currentUserHasAdminRole(this.context.d2),
            isValid: undefined,
        };
    },

    componentDidMount() {
        this.context.d2.models.categoryCombos
            .list({
                filter: ["dataDimensionType:eq:ATTRIBUTE", "name:eq:default"],
                fields: "id,name",
                paging: false,
                rootJunction: "OR",
            })
            .then(collection => collection.toArray())
            .then(categoryCombinations =>
                this.setState({
                    isLoading: false,
                    categoryCombinations,
                })
            );
    },

    _onUpdateField(fieldPath, newValue) {
        this.props.onFieldsChange(fieldPath, newValue);
    },

    async _validateNameUniqueness(name) {
        const { dataset } = this.props.store;
        const dataSets = await this.context.d2.models.dataSets.list({
            fields: "id,name",
            filter: "name:^ilike:" + name,
        });
        const existsDataSetWithName = dataSets
            .toArray()
            .some(ds => ds.id !== dataset.id && ds.name.toLowerCase() === name.toLowerCase());

        if (existsDataSetWithName) {
            throw this.getTranslation("dataset_name_exists");
        } else {
            this.setState({ error: null });
        }
    },

    _getPeriodFields(years) {
        const { store } = this.props;
        const { associations } = this.props.store;
        const { getFormLabel, getDateField, getBooleanField } = FormHelpers;
        const t = this.getTranslation;

        const generateDateFieldPairs = type => {
            return _.flatMap(years, (year, index) => {
                const disabled = index > 0 && associations.periodDatesApplyToAll[type];
                const showApplyToAllYearsCheckbox = index === 0 && years.length > 1;
                const validators = [
                    {
                        validator: value => !value || value.getFullYear() === year,
                        message: this.getTranslation("date_not_in_period_year"),
                    },
                ];

                return _.compact([
                    getFormLabel({ value: year, type: "subtitle", forSection: type }),
                    getDateField({
                        name: `associations.periodDates.${type}.${year}.start`,
                        value: store.getPeriodValue(year, type, years, "start"),
                        label: t("output_start_date") + " " + year,
                        years: [year],
                        disabled,
                        validators,
                    }),
                    getDateField({
                        name: `associations.periodDates.${type}.${year}.end`,
                        value: store.getPeriodValue(year, type, years, "end"),
                        label: t("output_end_date") + " " + year,
                        years: [year],
                        disabled,
                    }),
                    showApplyToAllYearsCheckbox
                        ? getBooleanField({
                              name: `associations.periodDatesApplyToAll.${type}`,
                              label: t("apply_periods_to_all"),
                              value: associations.periodDatesApplyToAll[type],
                              onChange: this._onUpdateField,
                          })
                        : null,
                ]);
            });
        };

        return _(years).isEmpty()
            ? []
            : [
                  getFormLabel({ value: t("output_dates") + ":", type: "title" }),
                  ...generateDateFieldPairs("output"),
                  getFormLabel({ value: t("outcome_dates") + ":", type: "title" }),
                  ...generateDateFieldPairs("outcome"),
              ];
    },

    _renderForm() {
        const { store } = this.props;
        const { associations, dataset } = store;
        const { error } = this.state;
        const years = this.props.store.getPeriodYears();

        const fields = _.compact([
            FormHelpers.getTextField({
                name: "dataset.name",
                label: this.getTranslation("name"),
                value: dataset.name,
                isRequired: true,
                validators: [
                    {
                        validator: Validators.isRequired,
                        message: this.getTranslation(Validators.isRequired.message),
                    },
                ],
                asyncValidators: [name => this._validateNameUniqueness(name)],
            }),

            FormHelpers.getTextField({
                name: "dataset.description",
                label: this.getTranslation("description"),
                value: dataset.description,
                multiLine: true,
            }),

            this.state.currentUserHasAdminRole &&
                FormHelpers.getTextField({
                    name: "dataset.expiryDays",
                    label: this.getTranslation("expiry_days"),
                    help: this.getTranslation("expiry_days_help"),
                    value: dataset.expiryDays,
                    type: "number",
                }),

            this.state.currentUserHasAdminRole &&
                FormHelpers.getTextField({
                    name: "dataset.openFuturePeriods",
                    label: this.getTranslation("open_future_periods"),
                    value: dataset.openFuturePeriods,
                    type: "number",
                }),

            FormHelpers.getBooleanField({
                name: "dataset.notifyCompletingUser",
                label: this.getTranslation("notify_completing_user"),
                value: dataset.notifyCompletingUser,
                onChange: this._onUpdateField,
            }),

            FormHelpers.getDateField({
                name: "associations.dataInputStartDate",
                value: associations.dataInputStartDate,
                label: FormHelpers.getLabel(this.getTranslation("data_input_start_date")),
            }),

            FormHelpers.getDateField({
                name: "associations.dataInputEndDate",
                value: associations.dataInputEndDate,
                label: FormHelpers.getLabel(this.getTranslation("data_input_end_date")),
            }),

            ...this._getPeriodFields(years),
        ]);

        // FormBuilder only considers fields with values sent on the first render, so we need
        // to redraw the component (change its key) when years or the apply flag change.
        const formKey = JSON.stringify([years, associations.periodDatesApplyToAll]);

        return (
            <div>
                {error && <p style={this.styles.error}>{error}</p>}

                <FormBuilder
                    key={formKey}
                    fields={_.compact(fields)}
                    onUpdateField={this._onUpdateField}
                    onUpdateFormStatus={this._onUpdateFormStatus}
                    validateOnRender={_.isUndefined(this.state.isValid)}
                />
            </div>
        );
    },

    _onUpdateFormStatus(status) {
        const isValid = !status.validating && status.valid;
        this.setState({ isValid });
        this.props.formStatus(isValid);
    },

    async componentWillReceiveProps(props) {
        if (props.validateOnRender) {
            this.props.formStatus(this.state.isValid);
        }
    },

    render() {
        if (this.state.isLoading) {
            return <LinearProgress />;
        } else {
            return this._renderForm();
        }
    },
});

export default GeneralInformation;
