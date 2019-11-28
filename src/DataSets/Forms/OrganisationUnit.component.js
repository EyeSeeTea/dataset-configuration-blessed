import React from "react";
import createReactClass from 'create-react-class';
import PropTypes from "prop-types";
import _ from "lodash";
import Translate from "d2-ui/lib/i18n/Translate.mixin";
import OrganisationUnitTreeMultiSelect from "d2-ui/lib/org-unit-select/orgunit-tree-multi-select";
import scrollToComponent from "react-scroll-to-component";
import { collectionToArray } from "../../utils/Dhis2Helpers";

const OrganisationUnit = createReactClass({
    mixins: [Translate],

    propTypes: {
        config: PropTypes.object,
        store: PropTypes.object,
    },

    getInitialState() {
        return { errors: null };
    },

    UNSAFE_componentWillReceiveProps(props) {
        if (props.validateOnRender) {
            const organisationUnits = collectionToArray(this.props.store.dataset.organisationUnits);
            if (_(organisationUnits).isEmpty()) {
                this.setState({ errors: this.getTranslation("select_one_organisation_unit") });
                scrollToComponent(this.refs.errors);
            } else {
                props.formStatus(true);
            }
        }
    },

    _renderSharingWarning() {
        const { project, countries } = this.props.store.associations;
        if (!project && !_.isEmpty(countries)) {
            return <p>{this.getTranslation("sharing_warning")}</p>;
        }
    },

    _renderErrors() {
        return (
            <p ref="errors" style={{ color: "red" }}>
                {this.state.errors}
            </p>
        );
    },

    _onChange(orgUnits) {
        this.props.onFieldsChange("associations.organisationUnits", orgUnits, false);
    },

    render() {
        const modelDefinition = { plural: "dataSets" };
        const model = this.props.store.dataset;

        return (
            <div>
                {this._renderSharingWarning()}
                {this._renderErrors()}
                <OrganisationUnitTreeMultiSelect
                    modelDefinition={modelDefinition}
                    model={model}
                    value={model.organisationUnits || []}
                    onChange={this._onChange}
                    filters={{ levels: "name:in:[Area,Facility Level]" }}
                />
            </div>
        );
    },
});

export default OrganisationUnit;
