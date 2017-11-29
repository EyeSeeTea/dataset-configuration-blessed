import React from 'react';
import ObservedEvents from '../utils/ObservedEvents.mixin';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import Dialog from 'material-ui/Dialog/Dialog';
import FlatButton from 'material-ui/FlatButton/FlatButton';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import RaisedButton from 'material-ui/RaisedButton/RaisedButton';
import Card from 'material-ui/Card/Card';
import CardText from 'material-ui/Card/CardText';
import {Tabs, Tab} from 'material-ui/Tabs';
import FormBuilder from 'd2-ui/lib/forms/FormBuilder.component';
import Settings from '../models/Settings';
import fp from 'lodash/fp';
import FormHelpers from '../forms/FormHelpers';
import _ from 'lodash';


const TabCard = ({fields, onUpdate}) => {
    return (
        <Card style={{padding: 10, margin: 10}}>
            <CardText>
                <FormBuilder fields={fields} onUpdateField={onUpdate} />
            </CardText>
        </Card>
    );
};

const SettingsDialog = React.createClass({
    propTypes: {
        open: React.PropTypes.bool.isRequired,
        onRequestClose: React.PropTypes.func.isRequired,
    },

    mixins: [ObservedEvents, Translate],

    tabs: {
        general: [
            "categoryProjectsId",
            "categoryComboId",
            "dataElementGroupSetCoreCompetencyId",
            "organisationUnitLevelForCountriesId",
        ],
        sections: {
            partition: [
                "dataElementGroupSetThemeId",
                "indicatorGroupSetThemeId",
                "attributeGroupId",
            ],
            other: [
                "dataElementGroupOutputId",
                "dataElementGroupOutcomeId",
                "dataElementGroupGlobalIndicatorMandatoryId",
                "indicatorGroupGlobalIndicatorMandatoryId",
                "dataElementGroupSetOriginId",
                "indicatorGroupSetOriginId",
                "dataElementGroupSetStatusId",
                "indicatorGroupSetStatusId",
            ],
        },
    },

    getInitialState() {
        this.settings = new Settings(this.context.d2);
        return {loaded: false};
    },

    componentWillReceiveProps(newProps) {
        if (newProps.open) {
            this.loadConfig();
        }
    },

    loadConfig() {
        Promise.all([this.settings.get(), this.settings.getFields()]).then(([config, fields]) =>
            this.setState({
                loaded: true,
                fields: fields,
                config: config,
                currentTab: "general",
            })
        );
    },

    save() {
        this.settings.save(this.state.config).then(() => this.props.onRequestClose());
    },

    onUpdateField(key, value) {
        const newState = fp.set(["config", key], value, this.state);
        this.setState(newState);
    },

    getFields(key) {
        const {fields, config} = this.state;
        const keys = _.get(this.tabs, key);
        const tabFields = _(fields).keyBy("name").at(keys).value();

        return tabFields.map(field =>
            FormHelpers.getSelectField({
                name: field.name,
                label: this.getTranslation(field.i18n_key),
                isRequired: true,
                options: field.options,
                value: config[field.name],
            })
        );
    },

    onChangeTab(value) {
        this.setState({currentTab: value});
    },

    render() {
        const {loaded, fields, config} = this.state;
        const actions = [
            <FlatButton
                label={this.getTranslation('cancel')}
                onTouchTap={this.props.onRequestClose}
                style={{ marginRight: 16 }}
            />,
            loaded ? <RaisedButton
                primary
                label={this.getTranslation('save')}
                onTouchTap={this.save}
            /> : null,
        ];

        return (
            <Dialog
                autoScrollBodyContent
                autoDetectWindowHeight
                repositionOnUpdate
                title={this.getTranslation('settings')}
                style={{maxWidth: 'none'}}
                contentStyle={{maxWidth: 'none'}}
                open={this.props.open}
                onRequestClose={this.props.onRequestClose}
                actions={_.compact(actions)}
            >
                {!loaded ? <LinearProgress /> :
                    <Tabs style={{paddingTop: 10}} value={this.state.currentTab} onChange={this.onChangeTab}>
                        <Tab value="general" label={this.getTranslation("config_tab_general")}>
                            <TabCard fields={this.getFields("general")} onUpdate={this.onUpdateField} />
                        </Tab>

                        <Tab value="sections" label={this.getTranslation("config_tab_sections")}>
                            <TabCard fields={this.getFields("sections.partition")} onUpdate={this.onUpdateField} />
                            <TabCard fields={this.getFields("sections.other")} onUpdate={this.onUpdateField} />
                        </Tab>
                    </Tabs>
                }
            </Dialog>
        );
    },
});

export default SettingsDialog;
