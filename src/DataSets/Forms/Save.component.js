import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import FormBuilder from 'd2-ui/lib/forms/FormBuilder.component';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import Card from 'material-ui/Card/Card';
import CardText from 'material-ui/Card/CardText';

const Save = React.createClass({
    mixins: [Translate],

    states: {DATAENTRY: "DATAENTRY", SAVED: "SAVED", SAVE_ERROR: "SAVE_ERROR"},

    propTypes: {
        config: React.PropTypes.object,
        data: React.PropTypes.object,
        state: React.PropTypes.string,
        errors: React.PropTypes.arrayOf(React.PropTypes.string)
    },

    render() {
        const {dataset} = this.props.data;
        const {state, errors} = this.props;

        if (state == this.states.DATAENTRY) {
            return (
                <div>
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
        } else if (state == this.states.SAVE_ERROR) {
            return (
                <div className="alert alert-danger">
                    <div>{this.getTranslation("wizard_save_error_message")}</div>

                    <ul>
                        {errors.map((error, idx) => (<li key={idx}>{error}</li>))}
                    </ul>
                </div>
            );
        } else if (state == this.states.SAVED) {
            return (
                <div className="alert alert-success">
                    <div>{this.getTranslation("dataset_saved")}</div>
                </div>
            );

        }
    },
});

export default Save;