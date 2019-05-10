import React from "react";
import _ from "lodash";
import moment from "moment";
import Translate from "d2-ui/lib/i18n/Translate.mixin";
import FormBuilder from "d2-ui/lib/forms/FormBuilder.component";
import Validators from "d2-ui/lib/forms/Validators";
import LinearProgress from "material-ui/LinearProgress/LinearProgress";
import FormHelpers from "../../forms/FormHelpers";
import { currentUserHasAdminRole } from "../../utils/Dhis2Helpers";

const GeneralInformation = React.createClass({
    mixins: [Translate],

    styles: {
        error: { color: "red" },
        dateFieldWrapStyle: { float: "left", marginRight: 20 },
        applyToAll: { marginLeft: 20, marginTop: 25, marginBottom: -15 },
        periodYearLabel: { float: "left", marginLeft: 20, marginTop: 41, marginRight: 20 },
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
        const { currentUserHasAdminRole } = this.state;
        const { associations } = this.props.store;
        const { getFormLabel, getDateField, getBooleanField, separator } = FormHelpers;
        const t = this.getTranslation;
        const startDate = associations.dataInputStartDate;
        const periodDates = store.getPeriodDates();
        const periodYears = store.getPeriodYears();

        if (!currentUserHasAdminRole || _.isEmpty(periodYears)) return [];

        const generateDateFieldPairs = type => {
            return _.flatMap(years, (year, index) => {
                const disabled = index > 0 && associations.periodDatesApplyToAll[type];
                const showApplyToAllYearsCheckbox = index === 0 && years.length > 1;
                const startDateMom = startDate ? moment(startDate).startOf("day") : null;
                const validators = [
                    {
                        validator: value => !value || moment(value).isSameOrAfter(startDateMom),
                        message: this.getTranslation("start_date_before_project_start"),
                    },
                ];

                return _.compact([
                    showApplyToAllYearsCheckbox
                        ? getBooleanField({
                              name: `associations.periodDatesApplyToAll.${type}`,
                              label: t("apply_periods_to_all"),
                              value: associations.periodDatesApplyToAll[type],
                              onChange: this._onUpdateField,
                              style: this.styles.applyToAll,
                          })
                        : null,
                    getFormLabel({
                        value: year,
                        forSection: type,
                        style: this.styles.periodYearLabel,
                    }),
                    getDateField({
                        name: `associations.periodDates.${type}.${year}.start`,
                        value: _(periodDates).get([type, year, "start"]),
                        label: t(`${type}_start_date`) + " " + year,
                        minDate: startDate,
                        disabled,
                        validators,
                        wrapStyle: this.styles.dateFieldWrapStyle,
                    }),
                    getDateField({
                        name: `associations.periodDates.${type}.${year}.end`,
                        value: _(periodDates).get([type, year, "end"]),
                        label: t(`${type}_end_date`) + " " + year,
                        minDate: startDate,
                        disabled,
                        wrapStyle: this.styles.dateFieldWrapStyle,
                    }),
                    separator(`${type}-${year}-end`),
                ]);
            });
        };

        return [
            getFormLabel({ value: t("output_dates") }),
            separator("output-dates"),
            ...generateDateFieldPairs("output"),
            getFormLabel({ value: t("outcome_dates") }),
            separator("outcome-dates"),
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
                wrapStyle: this.styles.dateFieldWrapStyle,
            }),

            FormHelpers.getDateField({
                name: "associations.dataInputEndDate",
                value: associations.dataInputEndDate,
                label: FormHelpers.getLabel(this.getTranslation("data_input_end_date")),
                wrapStyle: this.styles.dateFieldWrapStyle,
            }),

            FormHelpers.separator("period-fields"),

            ...this._getPeriodFields(years),
        ]);

        // FormBuilder only considers fields with values sent on the first render, so we need
        // to redraw the component (by changing its key) when the years or the apply flag change.
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
