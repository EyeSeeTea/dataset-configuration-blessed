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

    _onUpdateYearlyDatesFields(type, fieldPath, newDate, oldValue, year) {
        let newValue;
        if (!oldValue) {
            newValue = Object.assign({}, { [`${year}`]: { [type]: newDate } });
        } else if (!oldValue[`${year}`]) {
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

        const outputDates = years
            ? years.map(year => [
                  FormHelpers.getFormLabel({
                      value: `${year}`,
                      type: "subtitle",
                      forSection: "output",
                  }),
                  FormHelpers.getDateField({
                      name: `associations.outputDates.${year}.start`,
                      value:
                          associations.outputDates[`${year}`] &&
                          associations.outputDates[`${year}`].start,
                      label: `Output Start Date ${year}`,
                      onChange: date =>
                          this._onUpdateYearlyDatesFields(
                              "start",
                              `associations.outputDates`,
                              date,
                              associations.outputDates,
                              year
                          ),
                  }),
                  FormHelpers.getDateField({
                      name: `associations.outputDates.${year}.end`,
                      value:
                          associations.outputDates[`${year}`] &&
                          associations.outputDates[`${year}`].end,
                      label: `Output End Date ${year}`,
                      onChange: date =>
                          this._onUpdateYearlyDatesFields(
                              "end",
                              `associations.outputDates`,
                              date,
                              associations.outputDates,
                              year
                          ),
                  }),
              ])
            : [];

        const outcomeDates = years
            ? years.map(year => [
                  FormHelpers.getFormLabel({
                      value: `${year}`,
                      type: "subtitle",
                      forSection: "outcome",
                  }),
                  FormHelpers.getDateField({
                      name: `associations.outcomeDates.${year}.start`,
                      value:
                          associations.outcomeDates[`${year}`] &&
                          associations.outcomeDates[`${year}`].start,
                      label: `Outcome Start Date ${year}`,
                      onChange: date =>
                          this._onUpdateYearlyDatesFields(
                              "start",
                              `associations.outcomeDates`,
                              date,
                              associations.outcomeDates,
                              year
                          ),
                  }),
                  FormHelpers.getDateField({
                      name: `associations.outcomeDates.${year}.end`,
                      value:
                          associations.outcomeDates[`${year}`] &&
                          associations.outcomeDates[`${year}`].end,
                      label: `Outcome End Date ${year}`,
                      onChange: date =>
                          this._onUpdateYearlyDatesFields(
                              "end",
                              `associations.outcomeDates`,
                              date,
                              associations.outcomeDates,
                              year
                          ),
                  }),
              ])
            : [];

        const fields = [
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
            ..._.flatten(outputDates),
            datesSet && FormHelpers.getFormLabel({ value: "Outcome Dates:", type: "title" }),
            ..._.flatten(outcomeDates),

            FormHelpers.getBooleanField({
                name: "dataset.notifyCompletingUser",
                label: this.getTranslation("notify_completing_user"),
                value: dataset.notifyCompletingUser,
                onChange: this._onUpdateField,
            }),
        ];

        const formKey = datesSet ? "refreshForm" : "form";
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
