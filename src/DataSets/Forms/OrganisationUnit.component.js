import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import FormBuilder from 'd2-ui/lib/forms/FormBuilder.component';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import Card from 'material-ui/Card/Card';
import CardText from 'material-ui/Card/CardText';
import OrganisationUnitTreeMultiSelect from '../../forms/form-fields/orgunit-tree-multi-select';

import OrgUnitTree from 'd2-ui/lib/org-unit-tree/OrgUnitTree.component';
import OrgUnitSelectByLevel from 'd2-ui/lib/org-unit-select/OrgUnitSelectByLevel.component';
import OrgUnitSelectByGroup from 'd2-ui/lib/org-unit-select/OrgUnitSelectByGroup.component';
import OrgUnitSelectAll from 'd2-ui/lib/org-unit-select/OrgUnitSelectAll.component';

const OrganisationUnit = React.createClass({
    mixins: [Translate],

    propTypes: {
        config: React.PropTypes.object,
        store: React.PropTypes.object,
    },

    getInitialState() {
        return {};
    },

    componentWillReceiveProps(props) {
        props.formStatus(true);
    },

    render() {
        const modelDefinition = {plural: "dataSets"};
        const project = this.props.store.associations.project;
        const model = this.props.store.dataset;

        return (
            <OrganisationUnitTreeMultiSelect
                modelDefinition={modelDefinition}
                model={model}
                value={model.organisationUnits}
            />
        );
    },
});

export default OrganisationUnit;