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
            yearsPeriod: 0,
        };
    },

    componentDidUpdate() {
        const {
            associations: { dataInputEndDate, dataInputStartDate },
        } = this.props.store;
        const newYearsPeriod =
            dataInputStartDate && dataInputEndDate
                ? _.range(
                      moment(dataInputStartDate).year(),
                      moment(dataInputEndDate)
                          .add(1, "y")
                          .year()
                  )
                : [];
        if (this.state.yearsPeriod !== newYearsPeriod.length) {
            this.setState({ yearsPeriod: newYearsPeriod.length });
        }
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

    _onUpdateYearlyDatesFields(type, fieldPath, newDate, oldValue, year) {
        let newValue;
        if (!oldValue[`${year}`]) {
            newValue = Object.assign(oldValue, { [`${year}`]: { [type]: newDate } });
        } else {
            const yearlyValue = Object.assign(oldValue[`${year}`], { [type]: newDate });
            newValue = Object.assign(oldValue, yearlyValue);
        }
        this.props.onFieldsChange(fieldPath, newValue);
    },

    async _validateNameUniqueness(name) {
        const dataSets = await this.context.d2.models.dataSets.list({
            filter: "name:^ilike:" + name,
        });
        const existsDataSetWithName = dataSets
            .toArray()
            .some(ds => ds.name.toLowerCase() === name.toLowerCase());

        if (existsDataSetWithName) {
            throw this.getTranslation("dataset_name_exists");
        } else {
            this.setState({ error: null });
        }
    },

    _renderForm() {
        const { associations, dataset } = this.props.store;
        const { error } = this.state;
        const datesSet = associations.dataInputStartDate && associations.dataInputEndDate;

        const years = datesSet
            ? _.range(
                  moment(associations.dataInputStartDate).year(),
                  moment(associations.dataInputEndDate)
                      .add(1, "y")
                      .year()
              )
            : null;

        const getDateValue = (year, type, array, period) => {
            // only being called for first year on checkbox click => BUG
            if (associations[type][`${year}`] && year === 2020) {
                console.log({
                    sameDates: associations.sameDates[type],
                    firstYear: array[0],
                    realValue: associations[type][`${year}`][period],
                });
            }
            return (
                associations[type][`${year}`] &&
                (associations.sameDates[type]
                    ? associations[type][`${array[0]}`][period]
                    : associations[type][`${year}`][period])
            );
        };

        const generateDateFieldPairs = (years, type) => {
            if (!years) return [];
            // BUG: After clicking on the sameDates checkbox, values for years other than the first year don't update till touched.
            // Updating key on checkbox mark doesn't solve it, but either if it did we'd be relying on the user entering first year dates
            // before clicking on the checkbox.
            return years.map((year, index, array) =>
                _.compact([
                    FormHelpers.getFormLabel({
                        value: `${year}`,
                        type: "subtitle",
                        forSection: type,
                    }),
                    FormHelpers.getDateField({
                        name: `associations.${type}.${year}.start`,
                        value: getDateValue(year, type, array, "start"),
                        label: `Output Start Date ${year}`,
                        disabled: false, // index === 0 ? false : associations.sameDates[type],
                        onChange: date =>
                            this._onUpdateYearlyDatesFields(
                                "start",
                                `associations.${type}`,
                                date,
                                associations[type],
                                year
                            ),
                    }),
                    FormHelpers.getDateField({
                        name: `associations.${type}.${year}.end`,
                        value: getDateValue(year, type, array, "end"),
                        label: `Output End Date ${year}`,
                        disabled: false, //index === 0 ? false : associations.sameDates[type],
                        onChange: date =>
                            this._onUpdateYearlyDatesFields(
                                "end",
                                `associations.${type}`,
                                date,
                                associations[type],
                                year
                            ),
                    }),
                    index === 0 &&
                        FormHelpers.getBooleanField({
                            name: `associations.sameDates.${type}`,
                            label: "Apply same date for every year",
                            value: associations.sameDates[type],
                            onChange: this._onUpdateField,
                        }),
                ])
            );
        };

        const outputDatesFields = generateDateFieldPairs(years, "outputDates");
        const outcomeDatesFields = generateDateFieldPairs(years, "outcomeDates");

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

            FormHelpers.getDateField({
                name: "associations.dataInputStartDate",
                value: associations.dataInputStartDate,
                label: FormHelpers.getLabel(this.getTranslation("data_input_start_date")),
                onChange: date => this._onUpdateField("associations.dataInputStartDate", date),
            }),

            FormHelpers.getDateField({
                name: "associations.dataInputEndDate",
                value: associations.dataInputEndDate,
                label: FormHelpers.getLabel(this.getTranslation("data_input_end_date")),
                onChange: date => this._onUpdateField("associations.dataInputEndDate", date),
            }),

            datesSet && FormHelpers.getFormLabel({ value: "Output Dates:", type: "title" }),
            ..._.flatten(outputDatesFields),
            datesSet && FormHelpers.getFormLabel({ value: "Outcome Dates:", type: "title" }),
            ..._.flatten(outcomeDatesFields),

            FormHelpers.getBooleanField({
                name: "dataset.notifyCompletingUser",
                label: this.getTranslation("notify_completing_user"),
                value: dataset.notifyCompletingUser,
                onChange: this._onUpdateField,
            }),
        ]);

        const { yearsPeriod } = this.state;
        const {
            associations: {
                sameDates: { outcomeDates, outputDates },
            },
        } = this.props.store;
        const formKey = `${yearsPeriod}-${outcomeDates}-${outputDates}`;
        console.log(formKey);
        return (
            <div>
                {error && <p style={this.styles.error}>{error}</p>}
                <FormBuilder
                    key={formKey}
                    fields={_.compact(fields)}
                    onUpdateField={this._onUpdateField}
                    onUpdateFormStatus={this._onUpdateFormStatus}
                    validateOnRender={this.props.validateOnRender}
                />
            </div>
        );
    },

    async validate() {
        const { dataset } = this.props.store;

        if (!dataset.name || !dataset.name.trim()) {
            this.props.formStatus(false);
        } else {
            try {
                await this._validateNameUniqueness(dataset.name);
                this.props.formStatus(true);
                this.setState({ error: null });
            } catch (err) {
                this.props.formStatus(false);
                this.setState({ error: err.toString() });
            }
        }
    },

    async componentWillReceiveProps(props) {
        if (props.validateOnRender) {
            this.validate();
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
