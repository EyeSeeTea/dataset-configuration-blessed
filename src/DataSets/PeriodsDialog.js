import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton/FlatButton";
import RaisedButton from "material-ui/RaisedButton/RaisedButton";
import DataSetPeriods from "./DataSetPeriods";
import LinearProgress from "material-ui/LinearProgress/LinearProgress";
import snackActions from "../Snackbar/snack.actions";
import {
    getDataSetsForPeriods,
    getDataSetsForPeriodsEndDate,
    saveDataSets,
    saveDataSetsEndDate,
    getPeriodsValidationsErrors,
} from "../models/data-periods";

export default class PeriodsDialog extends React.Component {
    static propTypes = {
        onRequestClose: PropTypes.func.isRequired,
        endYear: PropTypes.number,
    };

    static contextTypes = {
        d2: PropTypes.any,
    };

    state = {
        saving: false,
        dataSets: null,
        store: null,
        warning: null,
        error: null,
    };

    styles = {
        warning: { color: "rgb(255, 152, 0)", marginBottom: -10 },
        error: { fontSize: "1m", color: "red", marginTop: 15 },
        noMaxWidth: { maxWidth: "none" },
    };

    constructor(props, context) {
        super(props);
        this.getTranslation = context.d2.i18n.getTranslation.bind(context.d2.i18n);

        const { endYear } = props;
        this.getDataSetsForPeriods = endYear ? getDataSetsForPeriodsEndDate : getDataSetsForPeriods;
        this.saveDataSets = endYear ? saveDataSetsEndDate : saveDataSets;
    }

    async componentDidMount() {
        const { dataSets, store, warning, error } = await this.getDataSetsForPeriods(
            this.context.d2,
            this.props.dataSets.map(ds => ds.id),
            this.props.endYear
        ).catch(err => ({ error: err.message }));

        if (error) {
            snackActions.show({ message: error });
            this.props.onRequestClose();
        } else {
            this.setState({ dataSets, store, warning });
        }
    }

    getActions(validationErrors) {
        const { onRequestClose } = this.props;
        const { saving } = this.state;

        return [
            <FlatButton
                label={this.getTranslation("cancel")}
                onClick={onRequestClose}
                style={{ marginRight: 16 }}
            />,
            <RaisedButton
                primary
                label={this.getTranslation("save")}
                disabled={saving || validationErrors.length > 0}
                onClick={this.save}
            />,
        ];
    }

    save = async () => {
        const { d2 } = this.context;
        const { onRequestClose, endYear } = this.props;
        const { store, dataSets } = this.state;

        this.setState({ saving: true, error: null });

        try {
            const response = _.first(await this.saveDataSets(d2, store, dataSets, endYear));
            if (response && response.status === "OK") {
                onRequestClose();
                snackActions.show({ message: this.getTranslation("dataset_saved") });
            } else {
                this.setState({ error: JSON.stringify(response, null, 2) });
            }
        } catch (err) {
            console.error(err);
            this.setState({ error: (err && err.message) || "Error" });
        } finally {
            this.setState({ saving: false });
        }
    };

    onUpdateField = (fieldPath, newValue) => {
        const { store } = this.state;

        store.updateField(fieldPath, newValue);
        this.forceUpdate();
    };

    render() {
        const { onRequestClose, endYear } = this.props;
        const { saving, dataSets, store, warning } = this.state;

        if (!store) return <LinearProgress />;

        const validationErrors = this.getValidationErrors();
        const errors = _.compact([this.state.error, ...validationErrors]);
        const actions = this.getActions(validationErrors);

        const baseTitle = endYear
            ? this.getTranslation("period_dates_for_year", { year: endYear })
            : this.getTranslation("period_dates");

        const title = baseTitle + ": " + this.getNames(dataSets);

        return (
            <Dialog
                autoScrollBodyContent
                autoDetectWindowHeight
                repositionOnUpdate
                title={title}
                style={this.styles.noMaxWidth}
                contentStyle={this.styles.noMaxWidth}
                open={true}
                onRequestClose={onRequestClose}
                actions={actions}
            >
                {saving && <LinearProgress />}
                {warning && <p style={this.styles.warning}> {warning}</p>}

                <DataSetPeriods
                    store={store}
                    onFieldChange={this.onUpdateField}
                    endYear={endYear}
                />

                <div style={this.styles.error}>
                    {errors.map(error => (
                        <div key={error}>{error}</div>
                    ))}
                </div>

                {this.renderEndYearWarnings()}
            </Dialog>
        );
    }

    getValidationErrors() {
        return getPeriodsValidationsErrors(this.state.store, {
            validateOutputOutcome: !this.props.endYear,
        });
    }

    renderEndYearWarnings() {
        const { store } = this.state;
        const { endYear } = this.props;
        const { associations } = store;
        if (!endYear) return null;

        const outputEndYear = associations.periodDates.output[endYear];
        const outcomeEndYear = associations.periodDates.outcome[endYear];
        const someEmptyValues = !outputEndYear.end || !outcomeEndYear.end;
        if (!someEmptyValues) return null;

        return (
            <div style={{ marginTop: 10, color: "orange" }}>
                {this.getTranslation("end_dates_empty")}
            </div>
        );
    }

    getNames(dataSets) {
        const maxShown = 5;
        const remanining = dataSets.length - maxShown;

        const baseNames = _(dataSets)
            .take(maxShown)
            .map(ds => ds.displayName)
            .join(", ");

        return remanining > 0
            ? this.getTranslation("this_and_n_others", { this: baseNames, n: remanining })
            : baseNames;
    }
}
