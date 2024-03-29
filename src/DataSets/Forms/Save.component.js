import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import _ from "lodash";
import Translate from "d2-ui/lib/i18n/Translate.mixin";
import LinearProgress from "material-ui/LinearProgress/LinearProgress";
import snackActions from "../../Snackbar/snack.actions";
import { collectionString } from "../../utils/Dhis2Helpers";
import { log } from "../log";

const Save = createReactClass({
    mixins: [Translate],

    propTypes: {
        config: PropTypes.object,
        store: PropTypes.object,
        state: PropTypes.string,
        errors: PropTypes.arrayOf(PropTypes.string),
        afterSave: PropTypes.func.isRequired,
    },

    saveStates: {
        SHOW: "SHOW",
        SAVING: "SAVING",
        SAVE_ERROR: "SAVE_ERROR",
    },

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.saving) {
            this._save();
        }
    },

    getInitialState() {
        return { saveState: this.saveStates.SHOW, errors: [] };
    },

    _getLoggingMessage() {
        if (this.props.store.action === "add") {
            return "create new dataset";
        } else if (this.props.store.action === "edit") {
            return "edit dataset";
        } else if (this.props.store.action === "clone") {
            return "clone dataset";
        } else {
            return "unknown action";
        }
    },

    _redirectAfterSave() {
        const { dataset } = this.props.store;
        log(this._getLoggingMessage(), "success", dataset);
        snackActions.show({ message: "dataset_saved", action: "ok", translate: true });
        this.props.afterSave();
    },

    _saveErrors(error) {
        const { dataset } = this.props.store;
        log(this._getLoggingMessage(), "failed", dataset);
        console.trace(error);
        const message = _.isEmpty(error) ? error.toString() : JSON.stringify(error, null, 2);
        this.setState({ saveState: this.saveStates.SAVE_ERROR, errors: [message] });
    },

    _save() {
        this.setState({ saveState: this.saveStates.SAVING });
        this.props.store
            .save()
            .then(this._redirectAfterSave)
            .catch(this._saveErrors);
    },

    render() {
        const { d2 } = this.context;
        const { dataset, associations } = this.props.store;
        const { saveState, errors } = this.state;
        const ListItem = ({ field, value }) => {
            return (
                <li className="list-group-item">
                    <label style={{ fontWeight: "bold", marginRight: 5 }}>
                        {this.getTranslation(field)}:
                    </label>
                    <span>{value || "-"}</span>
                </li>
            );
        };

        const projectName = associations.project ? (
            associations.project.displayName
        ) : (
            <span>
                <span>- </span>
                <span style={{ color: "red" }}>[{this.getTranslation("select_a_project")}]</span>
            </span>
        );

        if (saveState === this.saveStates.SHOW || saveState === this.saveStates.SAVING) {
            return (
                <div style={{ fontSize: "1.2em", marginTop: 10 }}>
                    <div>
                        {saveState === "SAVING" ? (
                            <div>
                                <LinearProgress />
                                <p>
                                    <b>{this.getTranslation("wizard_save_message")}</b>
                                </p>
                            </div>
                        ) : (
                            this.getTranslation("wizard_presave_message")
                        )}
                    </div>

                    <ul className="list-group">
                        <ListItem field="name" value={dataset.name} />
                        <ListItem field="description" value={dataset.description} />
                        <ListItem
                            field="core_competencies"
                            value={associations.coreCompetencies.map(cc => cc.name).join(", ")}
                        />
                        <ListItem field="linked_project" value={projectName} />
                        <ListItem
                            field="orgunits_settings"
                            value={collectionString(
                                d2,
                                dataset.organisationUnits,
                                "displayName",
                                20
                            )}
                        />
                        <ListItem
                            field="countries"
                            value={(associations.countries || [])
                                .map(c => c.displayName)
                                .join(", ")}
                        />
                    </ul>
                </div>
            );
        } else if (saveState === this.saveStates.SAVE_ERROR) {
            return (
                <div className="alert alert-danger">
                    <p>
                        <b>{this.getTranslation("wizard_save_error_message")}</b>
                    </p>
                    {errors.map((error, idx) => (
                        <pre key={idx}>{error}</pre>
                    ))}
                </div>
            );
        }
    },
});

export default Save;
