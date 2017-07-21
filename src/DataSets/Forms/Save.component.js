import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import FormBuilder from 'd2-ui/lib/forms/FormBuilder.component';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import Card from 'material-ui/Card/Card';
import CardText from 'material-ui/Card/CardText';
import snackActions from '../../Snackbar/snack.actions';

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
        snackActions.show({message: 'dataset_saved', action: 'ok', translate: true});
        this.props.afterSave();
    },

    _saveErrors(error) {
        console.trace(error);
        const message = _.isEmpty(error) ? error.toString() : JSON.stringify(error, null, 2);
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
        }
    },
});

export default Save;