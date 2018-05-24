import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import FormBuilder from 'd2-ui/lib/forms/FormBuilder.component';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import FormHelpers from '../../forms/FormHelpers';
import moment from 'moment';

const InitialConfig = React.createClass({
    mixins: [Translate],

    propTypes: {
        config: React.PropTypes.object,
        store: React.PropTypes.object,
        onFieldsChange: React.PropTypes.func,
    },

    getDefaultProps: function() {
        return {onFieldsChange: _.identity};
    },

    getInitialState() {
        return {isLoading: true, errors: {}};
    },

    _getCategoryOptions(categoryId, fields = [":all"]) {
        return this.context.d2
            .models.categoryOptions
            .filter().on("categories.id").equals(categoryId)
            .list({fields: `id,${fields.join(',')}`, paging: false})
            .then(collection => _.keyBy(collection.toArray(), "id"));
    },

    _getDataElementGroups(dataElementGroupSetId, fields = [":all"]) {
        return this.context.d2
            .models.dataElementGroups
            .filter().on("dataElementGroupSet.id").equals(dataElementGroupSetId)
            .list({fields: `id,${fields.join(',')}`, paging: false})
            .then(collection => _.keyBy(collection.toArray(), "id"));
    },

    _getProjects() {
        const fields = ["code", "name", "displayName", "startDate", "endDate", "organisationUnits[:all]"];
        return this._getCategoryOptions(this.props.config.categoryProjectsId, fields);
    },

    _getCoreCompetencies() {
        const fields = ["name", "displayName"];
        const degsId = this.props.config.dataElementGroupSetCoreCompetencyId;
        return this._getDataElementGroups(degsId, fields);
    },

    componentWillReceiveProps(props) {
        if (props.validateOnRender) {
            const {coreCompetencies} = this.props.store.associations;
            if (_.isEmpty(coreCompetencies)) {
                props.formStatus(false);
                const error = this.getTranslation("select_one_core_competency");
                this.setState({errors: {coreCompetencies: [error]}});
            } else {
                props.formStatus(true);
                this.setState({errors: {}});
            }
        }
    },

    componentDidMount() {
        Promise.all([this._getProjects(), this._getCoreCompetencies()])
            .then(([projects, coreCompetencies]) => {
                this.setState({
                    isLoading: false,
                    projects: projects, 
                    coreCompetencies: coreCompetencies, 
                });
            });
    },

    _filterProjects(projectOptions, controls) {
        const today = moment().startOf("day");
        const isProjectOpen = (project) =>
            project && (!project.endDate || moment(project.endDate) >= today)
        return projectOptions.filter(projectOption => 
            controls.seeAllProjects || isProjectOpen(this.state.projects[projectOption.value]));
    },

    _getOptionsFromIndexedObjects(objects) {
        return _(objects).values().map(obj => ({value: obj.id, text: obj.displayName})).value();
    },

    render() {
        if (this.state.isLoading) {
            return (<LinearProgress />);
        } else {
            return this._renderForm();
        }
    },

    _renderForm() {
        const {dataset, associations} = this.props.store;
        const fields = [
            FormHelpers.getRichSelectField({
                name: 'associations.project',
                label: this.getTranslation('linked_project'),
                value: associations.project ? associations.project.id : null,
                options: this._getOptionsFromIndexedObjects(this.state.projects),
                filterOptions: this._filterProjects,
                controls: [
                    {
                        name: "seeAllProjects",
                        label: this.getTranslation('show_closed_projects'),
                        value: false,
                    },
                ],
            }),

            FormHelpers.getMultiSelect({
                name: 'associations.coreCompetencies',
                options: this._getOptionsFromIndexedObjects(this.state.coreCompetencies),
                onChange: this._onCoreCompetenciesUpdate,
                label: this.getTranslation('core_competencies'),
                selected: _.map(associations.coreCompetencies, "id"),
                errors: this.state.errors.coreCompetencies,
            }),
        ];

        return (
            <FormBuilder
                fields={fields}
                onUpdateField={this._onUpdateField}
            />
        );
    },

    _onCoreCompetenciesUpdate(newIds) {
        const newCoreCompetencies = _.at(this.state.coreCompetencies, newIds);
        this.props.onFieldsChange("associations.coreCompetencies", newCoreCompetencies);
    },

    _onUpdateField(fieldPath, newValue) {
        if (fieldPath == "associations.project") {
            const project = this.state.projects[newValue];
            this.props.onFieldsChange(fieldPath, project);
        } else {
            this.props.onFieldsChange(fieldPath, newValue);
        }
    },
});

export default InitialConfig;
