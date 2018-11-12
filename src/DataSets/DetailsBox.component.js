import React from 'react';
import classes from 'classnames';
import FontIcon from 'material-ui/FontIcon';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import camelCaseToUnderscores from 'd2-utilizr/lib/camelCaseToUnderscores';

import { mapPromise } from '../utils/Dhis2Helpers';
import { getCoreCompetencies } from '../models/dataset';

export default React.createClass({
    propTypes: {
        fields: React.PropTypes.array,
        showDetailBox: React.PropTypes.bool,
        source: React.PropTypes.object,
        onClose: React.PropTypes.func,
        config: React.PropTypes.object,
    },

    mixins: [Translate],

    styles: {
        ul: { marginTop: 3, paddingLeft: 20 },
    },

    asyncFields: {
        coreCompetencies: function() {
            const dataset = this.props.source;
            return dataset.sections
                ? getCoreCompetencies(this.context.d2, this.props.config, dataset)
                : Promise.resolve(null);
        },
    },

    getInitialState() {
        return _(this.asyncFields)
            .keys()
            .map(asyncField => [asyncField, { loaded: false, value: null }])
            .fromPairs()
            .value()
    },

    getDefaultProps() {
        return {
            fields: [
                'name',
                'shortName',
                'code',
                'displayDescription',
                'created',
                'lastUpdated',
                'id',
                'href',
                'coreCompetencies',
            ],
            showDetailBox: false,
            onClose: () => {},
        };
    },

    componentWillReceiveProps(newProps) {
        const datasetChanged = this.props.source.id !== newProps.source.id;

        if (datasetChanged) {
            this.setState(this.getInitialState())
            this.componentDidMount();
        }
    },

    componentDidMount() {
        mapPromise(_.toPairs(this.asyncFields), async ([asyncField, getValue]) => {
            const value = await getValue.bind(this)(asyncField);
            this.setState({ [asyncField]: { loaded: true, value } });
        });
    },

    getValues() {
        const getAsyncValue = fieldName => (
            this.state[fieldName].loaded
                ? this.state[fieldName].value
                : this.getTranslation("loading")
        );

        return _(this.props.fields).map(fieldName => {
            const rawValue = _(this.asyncFields).has(fieldName)
                ? getAsyncValue(fieldName)
                : this.props.source[fieldName];
            return rawValue ? [fieldName, this.getValueToRender(fieldName, rawValue)] : null;
        }).compact().value();
    },

    getDetailBoxContent() {
        if (!this.props.source) {
            return (
                <div className="detail-box__status">Loading details...</div>
            );
        }

        return this.getValues().map(([fieldName, valueToRender]) => {
            return (
                <div key={fieldName} className="detail-field">
                    <div className={`detail-field__label detail-field__${fieldName}-label`}>
                        {this.getTranslation(camelCaseToUnderscores(fieldName))}
                    </div>

                    <div className={`detail-field__value detail-field__${fieldName}`}>
                        {valueToRender}
                    </div>
                </div>
            );
        });
    },

    getValueToRender(fieldName, value) {
        const getDateString = dateValue => {
            const stringifiedDate = new Date(dateValue).toString();

            return stringifiedDate === 'Invalid Date' ? dateValue : stringifiedDate;
        };

        if (Array.isArray(value) && value.length) {
            const namesToDisplay = value
                .map(v => v.displayName ? v.displayName : v.name)
                .filter(name => name);

            return (
                <ul style={this.styles.ul}>
                    {namesToDisplay.map(name => <li key={name}>{name}</li>)}
                </ul>
            );
        }

        if (fieldName === 'created' || fieldName === 'lastUpdated') {
            return getDateString(value);
        }

        if (fieldName === 'href') {
            // Suffix the url with the .json extension to always get the json representation of the api resource
            return <a style={{ wordBreak: 'break-all' }} href={`${value}.json`} target="_blank">{value}</a>;
        }

        return value;
    },

    render() {
        const classList = classes('details-box');

        if (this.props.showDetailBox === false) {
            return null;
        }

        return (
            <div className={classList}>
                <FontIcon className="details-box__close-button material-icons" onClick={this.props.onClose}>close</FontIcon>
                <div>
                    {this.getDetailBoxContent()}
                </div>
            </div>
        );
    },

});
