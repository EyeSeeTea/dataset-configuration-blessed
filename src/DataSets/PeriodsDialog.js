import React from "react";
import createReactClass from 'create-react-class';
import PropTypes from "prop-types";
import _ from "lodash";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton/FlatButton";
import RaisedButton from "material-ui/RaisedButton/RaisedButton";
import DataSetPeriods from "./DataSetPeriods";
import LinearProgress from "material-ui/LinearProgress/LinearProgress";
import { getDataSetsForPeriods, saveDataSets } from "../models/data-periods";
import snackActions from "../Snackbar/snack.actions";

export default class PeriodsDialog extends React.Component {
    static propTypes = {
        onRequestClose: PropTypes.func.isRequired,
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
        warning: { color: "red", marginBottom: -10 },
        error: { fontSize: "0.8em" },
        noMaxWidth: { maxWidth: "none" },
    };

    constructor(props, context) {
        super(props);
        this.getTranslation = context.d2.i18n.getTranslation.bind(context.d2.i18n);
    }

    async componentDidMount() {
        const { dataSets, store, allDatesEqual } = await getDataSetsForPeriods(
            this.context.d2,
            this.props.dataSets.map(ds => ds.id)
        );
        const warning = allDatesEqual ? null : this.getTranslation("no_match_start_end_dates");
        this.setState({ dataSets, store, warning });
    }

    getActions() {
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
                disabled={saving}
                onClick={this.save}
            />,
        ];
    }

    save = async () => {
        const { d2 } = this.context;
        const { onRequestClose } = this.props;
        const { store, dataSets } = this.state;

        this.setState({ saving: true, error: null });
        try {
            const response = _.first(await saveDataSets(d2, store, dataSets));
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
        this.state.store.updateField(fieldPath, newValue);
        this.forceUpdate();
    };

    render() {
        const { onRequestClose } = this.props;
        const { saving, dataSets, store, warning, error } = this.state;
        const actions = this.getActions();

        if (!store) return <LinearProgress />;

        return (
            <Dialog
                autoScrollBodyContent
                autoDetectWindowHeight
                repositionOnUpdate
                title={this.getTranslation("period_dates") + ` [${dataSets.length}]`}
                style={this.styles.noMaxWidth}
                contentStyle={this.styles.noMaxWidth}
                open={true}
                onRequestClose={onRequestClose}
                actions={actions}
            >
                {saving && <LinearProgress />}
                {warning && <p style={this.styles.warning}> {warning}</p>}
                {error && <pre style={this.styles.error}>{error}</pre>}

                <DataSetPeriods store={store} onFieldChange={this.onUpdateField} />
            </Dialog>
        );
    }
}
