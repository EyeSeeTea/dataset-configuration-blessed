import React from 'react';
import ObservedEvents from '../utils/ObservedEvents.mixin';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import Dialog from 'material-ui/Dialog/Dialog';
import FlatButton from 'material-ui/FlatButton/FlatButton';
import RaisedButton from 'material-ui/RaisedButton/RaisedButton';
import Card from 'material-ui/Card/Card';
import CardText from 'material-ui/Card/CardText';
import FormBuilder from 'd2-ui/lib/forms/FormBuilder.component';
import Settings from '../models/Settings';
import fp from 'lodash/fp';
import FormHelpers from '../forms/FormHelpers';
import _ from 'lodash';

const SettingsDialog = React.createClass({
    propTypes: {
        open: React.PropTypes.bool.isRequired,
        onRequestClose: React.PropTypes.func.isRequired,
    },

    mixins: [ObservedEvents, Translate],

    getInitialState() {
        return {
            loaded: false,
            fields: null,
            config: {},
        };
    },

    componentDidMount() {
        this.settings = new Settings(this.context.d2);
        Promise.all([this.settings.get(), this.settings.getFields()]).then(([config, fields]) =>
            this.setState({
                loaded: true,
                fields: fields,
                config: config,
            })
        );
    },

    save() {
        this.settings.save(this.state.config)
            .then(() => this.props.onRequestClose());
    },

    onUpdateField(key, value) {
        const newState = fp.set(["config", key], value, this.state);
        this.setState(newState);
    },

    render() {
        const {loaded, fields, config} = this.state;
        const formFields = (fields || []).map(field =>
            FormHelpers.getSelectField({
                name: field.name,
                label: this.getTranslation(field.i18n_key),
                isRequired: true,
                options: field.options,
                value: config[field.name],
            })
        );
        const actions = [
            <FlatButton
                label={this.getTranslation('cancel')}
                onTouchTap={this.props.onRequestClose}
                style={{ marginRight: 16 }}
            />,
            loaded &&
                <RaisedButton
                    primary
                    label={this.getTranslation('save')}
                    onTouchTap={this.save}
                />
            ,
        ];

        return (
            <Dialog
                autoScrollBodyContent
                autoDetectWindowHeight
                title={this.getTranslation('settings')}
                style={{maxWidth: 'none'}}
                contentStyle={{maxWidth: 'none'}}
                open={this.props.open}
                onRequestClose={this.props.onRequestClose}
                actions={_.compact(actions)}
            >
                <Card style={{padding: 10, margin: 10}}>
                    <CardText>
                        {loaded ?
                            <FormBuilder
                                fields={formFields}
                                onUpdateField={this.onUpdateField}
                            />
                            : null
                        }
                    </CardText>
                </Card>
            </Dialog>
        );
    },
});

export default SettingsDialog;
