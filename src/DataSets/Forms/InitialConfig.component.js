import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import FormBuilder from 'd2-ui/lib/forms/FormBuilder.component';
import CheckBox from 'd2-ui/lib/form-fields/CheckBox.component';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import Dropdown from '../../forms/Dropdown.component';
import MultiSelect from '../../forms/MultiSelect.component';

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

    _getCategoryOptions(categoryCode, fields = ["*"]) {
        return this.context.d2
            .models.categories
            .filter().on("id").equals(categoryCode)
            .list({fields: `id, categoryOptions[id, ${fields.join(',')}]`, paging: false})
            .then(categoriesCollection => 
                _(categoriesCollection.toArray())
                    .flatMap(category => category.categoryOptions.toArray())
                    .keyBy("id")
                    .value());
    },

    _getProjects() {
        const fields = ["code", "displayName", "startDate", "endDate", "organisationUnits[*]"];
        return this._getCategoryOptions(this.props.config.categoryOptionsProjectsId, fields);
    },

    _getCoreCompetencies() {
        const fields = ["displayName"];
        return this._getCategoryOptions(this.props.config.categoryOptionsCoreCompetencyId, fields);
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
                    seeAllProjects: false,
                    projects: projects, 
                    coreCompetencies: coreCompetencies, 
                });
            });
    },

    _onSeeAllProjectToggle(ev, newValue) {
        this.setState({seeAllProjects: newValue});
    },

    _getProjectOptions() {
        let projects;
        if (this.state.seeAllProjects) {
            projects = _.values(this.state.projects);
        } else {
            const now = new Date().toISOString();
            const isProjectOpen = (project) => 
                (!project.startDate || project.startDate <= now) &&
                (!project.endDate   || project.endDate > now);
            projects = _.values(this.state.projects).filter(isProjectOpen);
        }

        return projects.map(project => ({
            value: project.id, 
            text: project.displayName, 
            startDate: project.startDate, 
            endDate: project.endDate,
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
            {
                name: 'associations.project',
                component: Dropdown,
                value: associations.project && associations.project.id,
                props: {
                    options: this._getProjectOptions(),
                    labelText: this.getTranslation('linked_project'),
                    style: {width: "100%"},
                },
            },
            {
                name: 'associations.seeAllProjects',
                value: this.state.seeAllProjects,
                component: CheckBox,
                props: {
                    label: this.getTranslation('show_closed_projects'),
                    onCheck: this._onSeeAllProjectToggle,
                },
            },
            {
                name: 'associations.coreCompetencies',
                component: MultiSelect,
                props: {
                    options: this._getCoreCompetenciesOptions(),
                    onChange: this._onCoreCompetenciesUpdate,
                    label: this.getTranslation('core_competencies'),
                }
            },
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