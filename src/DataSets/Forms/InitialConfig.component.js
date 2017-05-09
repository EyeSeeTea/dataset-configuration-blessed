import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import FormBuilder from 'd2-ui/lib/forms/FormBuilder.component';
import CheckBox from 'd2-ui/lib/form-fields/CheckBox.component';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import FormHelpers from '../../forms/FormHelpers';
import moment from 'moment';

const InitialConfig = React.createClass({
    mixins: [Translate],

    propTypes: {
        config: React.PropTypes.object,
        data: React.PropTypes.object,
        onFieldsChange: React.PropTypes.func,
    },

    getDefaultProps: function() {
        return {onFieldsChange: _.identity};
    },

    getInitialState() {
        return {isLoading: true};
    },

    _getCategoryOptions(categoryId, fields = [":all"]) {
        return this.context.d2
            .models.categoryOptions
            .filter().on("categories.id").equals(categoryId)
            .list({fields: `id,${fields.join(',')}`, paging: false})
            .then(categoryOptionsCollection => _.keyBy(categoryOptionsCollection.toArray(), "id"));
    },

    _getProjects() {
        const fields = ["code", "displayName", "startDate", "endDate", "organisationUnits[:all]"];
        return this._getCategoryOptions(this.props.config.categoryProjectsId, fields);
    },

    _getCoreCompetencies() {
        const fields = ["displayName"];
        return this._getCategoryOptions(this.props.config.categoryCoreCompetencyId, fields);
    },

    componentWillReceiveProps(props) {
        if (props.validateOnRender) {
            props.formStatus(true);
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

    _getProjectOptions() {
        return _.values(this.state.projects).map(project => ({
            value: project.id, 
            text: project.displayName, 
        }));
    },

    _getCoreCompetenciesOptions() {
        return _.values(this.state.coreCompetencies).map(cc => ({
            value: cc.id, 
            text: cc.displayName, 
        }));
    },

    render() {
        if (this.state.isLoading) {
            return (<LinearProgress />);
        } else {
            return this._renderForm();
        }        
    },

    _renderForm() {
        const {associations} = this.props.data;
        const fields = [
            FormHelpers.getRichSelectField({
                name: 'associations.project',
                label: this.getTranslation('linked_project'),
                value: associations.project ? associations.project.id : null,
                options: this._getProjectOptions(),
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
                options: this._getCoreCompetenciesOptions(),
                onChange: this._onCoreCompetenciesUpdate,
                label: this.getTranslation('core_competencies'),
                selected: _.map(associations.coreCompetencies, "id"),
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
        }
    },
});

export default InitialConfig;