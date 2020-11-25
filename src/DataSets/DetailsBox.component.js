import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import classes from "classnames";
import FontIcon from "material-ui/FontIcon";
import Translate from "d2-ui/lib/i18n/Translate.mixin";
import camelCaseToUnderscores from "d2-utilizr/lib/camelCaseToUnderscores";
import _ from "lodash";
import moment from "moment";

import { mapPromise, accesses } from "../utils/Dhis2Helpers";
import { getCoreCompetencies, getProject } from "../models/dataset";

export default createReactClass({
    propTypes: {
        fields: PropTypes.array,
        showDetailBox: PropTypes.bool,
        source: PropTypes.object,
        onClose: PropTypes.func,
        config: PropTypes.object,
    },

    mixins: [Translate],

    styles: {
        ul: { marginTop: 3, paddingLeft: 20 },
        ulSharing: { marginTop: 3, paddingLeft: 0, listStyleType: "none" },
        liSharing: { fontStyle: "italic", fontWeight: 500 },
    },

    virtualFields: new Set(["sharing", "dataInputPeriod"]),

    getInitialState() {
        this.asyncFields = this.getAsyncFields();

        return _(this.asyncFields)
            .keys()
            .map(asyncField => [asyncField, { loaded: false, value: null }])
            .fromPairs()
            .value();
    },

    getDefaultProps() {
        return {
            fields: [
                "name",
                "shortName",
                "code",
                "displayDescription",
                "created",
                "lastUpdated",
                "id",
                "href",
                "linkedProject",
                "dataInputPeriod",
                "coreCompetencies",
                "sharing",
            ],
            showDetailBox: false,
            onClose: () => {},
        };
    },

    UNSAFE_componentWillReceiveProps(newProps) {
        const datasetChanged = this.props.source.id !== newProps.source.id;

        if (datasetChanged) {
            this.setState(this.getInitialState());
            this.componentDidMount();
        }
    },

    componentDidMount() {
        mapPromise(_.toPairs(this.asyncFields), async ([asyncField, getValue]) => {
            const value = await getValue.bind(this)(asyncField);
            this.setState({ [asyncField]: { loaded: true, value } });
        });
    },

    getDataInputPeriod(dataSet) {
        const { openingDate, closingDate } = (dataSet.dataInputPeriods || [])[0] || {};
        const format = isoDate => (isoDate ? moment(isoDate).format("L") : "-");
        return openingDate || closingDate
            ? [format(openingDate), format(closingDate)].join(" -> ")
            : null;
    },

    getAsyncFields() {
        const { d2 } = this.context;

        return {
            coreCompetencies: () =>
                getCoreCompetencies(d2, this.props.config, this.props.source).then(
                    coreCompetencies =>
                        _(coreCompetencies)
                            .toArray()
                            .map("name")
                            .join(", ") || "-"
                ),
            linkedProject: () =>
                getProject(d2, this.props.config, this.props.source).then(project =>
                    project ? project.displayName : this.getTranslation("no_project_linked")
                ),
        };
    },

    getValues() {
        const getRawValue = fieldName => {
            if (_(this.asyncFields).has(fieldName)) {
                return this.state[fieldName].loaded
                    ? this.state[fieldName].value
                    : this.getTranslation("loading");
            } else if (this.virtualFields.has(fieldName)) {
                return this.props.source;
            } else {
                return this.props.source[fieldName];
            }
        };

        return _(this.props.fields)
            .map(fieldName => {
                const rawValue = getRawValue(fieldName);
                return rawValue
                    ? { fieldName, valueToRender: this.getValueToRender(fieldName, rawValue) }
                    : null;
            })
            .compact()
            .value();
    },

    getDetailBoxContent() {
        if (!this.props.source) {
            return <div className="detail-box__status">Loading details...</div>;
        }

        return this.getValues().map(({ fieldName, valueToRender }) => {
            const classNameLabel = `detail-field__label detail-field__${fieldName}-label`;
            const classNameValue = `detail-field__value detail-field__${fieldName}`;

            return (
                <div key={fieldName} className="detail-field">
                    <div className={classNameLabel}>
                        {this.getTranslation(camelCaseToUnderscores(fieldName))}
                    </div>

                    <div className={classNameValue}>{valueToRender}</div>
                </div>
            );
        });
    },

    renderSharing(object) {
        const i18nSubKeys = {
            [accesses.none]: "none",
            [accesses.read]: "can_view",
            [accesses.write]: "can_edit",
        };
        const i18nSubKey = i18nSubKeys[object.publicAccess];
        const publicAccess = i18nSubKey ? this.getTranslation(`public_${i18nSubKey}`) : null;
        const getNames = objs =>
            _(objs)
                .map("displayName")
                .join(", ") || this.getTranslation("none");

        return [
            <div>
                <span style={this.styles.liSharing}>{this.getTranslation("public_access")}</span>:{" "}
                {publicAccess}
            </div>,
            <div>
                <span style={this.styles.liSharing}>{this.getTranslation("user_access")}</span>:{" "}
                {getNames(object.userAccesses)}
            </div>,
            <div>
                <span style={this.styles.liSharing}>
                    {this.getTranslation("user_group_access")}
                </span>
                : {getNames(object.userGroupAccesses)}
            </div>,
        ];
    },

    getValueToRender(fieldName, value) {
        const getDateString = dateValue => {
            return moment(dateValue).format("LLLL");
        };

        if (fieldName === "sharing") {
            const sharingItems = this.renderSharing(value).map((sharingItem, index) => {
                return <li key={"sharing_" + index}>{sharingItem}</li>;
            });
            return <ul style={this.styles.ulSharing}>{sharingItems}</ul>;
        }

        if (fieldName === "dataInputPeriod") {
            return this.getDataInputPeriod(this.props.source) || "-";
        }

        if (fieldName === "created" || fieldName === "lastUpdated") {
            return getDateString(value);
        }

        if (fieldName === "href") {
            // Suffix the url with the .json extension to always get the json representation of the api resource
            return (
                <a
                    style={{ wordBreak: "break-all" }}
                    href={`${value}.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {value}
                </a>
            );
        }

        if (_.isPlainObject(value) || value.modelDefinition) {
            return value.displayName || value.name || "-";
        }

        if (Array.isArray(value) && value.length) {
            const namesToDisplay = value
                .map(v => (v.displayName ? v.displayName : v.name))
                .filter(name => name);

            return (
                <ul style={this.styles.ul}>
                    {namesToDisplay.map(name => (
                        <li key={name}>{name}</li>
                    ))}
                </ul>
            );
        }

        return value;
    },

    render() {
        const classList = classes("details-box");

        if (this.props.showDetailBox === false) {
            return null;
        }

        return (
            <div className={classList}>
                <FontIcon
                    className="details-box__close-button material-icons"
                    onClick={this.props.onClose}
                >
                    close
                </FontIcon>
                <div>{this.getDetailBoxContent()}</div>
            </div>
        );
    },
});
