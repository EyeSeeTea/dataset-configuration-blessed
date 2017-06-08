import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import FormBuilder from 'd2-ui/lib/forms/FormBuilder.component';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import Card from 'material-ui/Card/Card';
import CardText from 'material-ui/Card/CardText';

const Save = React.createClass({
    mixins: [Translate],

    propTypes: {
        config: React.PropTypes.object,
        store: React.PropTypes.object,
        state: React.PropTypes.string,
        errors: React.PropTypes.arrayOf(React.PropTypes.string),
        afterSave: React.PropTypes.func.isRequired,
    },

    saveStates: {
        SHOW: "SHOW",
        SAVING: "SAVING",
        SAVED: "SAVED",
        SAVE_ERROR: "SAVE_ERROR",
    },

    componentWillReceiveProps(nextProps) {
        if (nextProps.saving) {
            this._save();
        }
    },

    getInitialState() {
        return {saveState: this.saveStates.SHOW, errors: []};
    },

    _redirectAfterSave() {
        this.setState({saveState: this.saveStates.SAVED})
        this.props.afterSave();
    },

    _saveErrors(error) {
        const message = JSON.stringify(error);
        this.setState({saveState: this.saveStates.SAVE_ERROR, errors: [message]})
    },

    _save() {
        this.setState({saveState: this.saveStates.SAVING});
        this.props.store
            .save()
            .then(this._redirectAfterSave)
            .catch(this._saveErrors);
    },

    render() {
        const {dataset} = this.props.store;
        const {saveState, errors} = this.state;

        if (saveState === this.saveStates.SHOW || saveState === this.saveStates.SAVING) {
            return (
                <div>
                    {saveState === "SAVING" ? <LinearProgress /> : null}

                    <div>{this.getTranslation("wizard_presave_message")}</div>

                    <ul className="list-group">
                        <li className="list-group-item">
                            <label>{this.getTranslation("name")}:</label>
                            {dataset.name}
                        </li>

                        <li className="list-group-item">
                            <label>{this.getTranslation("code")}:</label>
                            {dataset.code}
                        </li>
                    </ul>
                </div>
            );
        } else if (saveState === this.saveStates.SAVE_ERROR) {
            return (
                <div className="alert alert-danger">
                    <div>{this.getTranslation("wizard_save_error_message")}</div>

                    <ul>
                        {errors.map((error, idx) => (<li key={idx}>{error}</li>))}
                    </ul>
                </div>
            );
        } else if (saveState === this.saveStates.SAVED) {
            return (
                <div className="alert alert-success">
                    <div>{this.getTranslation("dataset_saved")}</div>
                </div>
            );

        }
    },
});

export default Save;