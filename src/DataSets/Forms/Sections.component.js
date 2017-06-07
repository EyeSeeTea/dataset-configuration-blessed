import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import FormHelpers from '../../forms/FormHelpers';
import SearchBox from '../../SearchBox/SearchBox.component';
import MultipleDataTable from '../../MultipleDataTable/MultipleDataTable.component';
import LoadingStatus from '../../LoadingStatus/LoadingStatus.component';
import ObserverRegistry from '../../utils/ObserverRegistry.mixin';
import Action from 'd2-ui/lib/action/Action';
import Sidebar from 'd2-ui/lib/sidebar/Sidebar.component';
import {Tabs, Tab} from 'material-ui/Tabs';
import SelectField from 'material-ui/SelectField/SelectField';
import MenuItem from 'material-ui/MenuItem/MenuItem';
import Checkbox from 'material-ui/Checkbox/Checkbox';
import CollapsibleBox from '../../components/collapsible-box/CollapsibleBox';
import Chip from 'material-ui/Chip/Chip';
import fp from 'lodash/fp';
import Popover from 'material-ui/Popover/Popover';
import MoreVert from 'material-ui/svg-icons/navigation/more-vert';
import IconButton from 'material-ui/IconButton/IconButton';
import PopoverAnimationDefault from 'material-ui/Popover/PopoverAnimationDefault';
import * as Section from '../../models/Section';
import Card from 'material-ui/Card/Card';
import CardHeader from 'material-ui/Card/CardHeader';
import CardText from 'material-ui/Card/CardText';

const ValidationFeedback = ({errors}) => {
    if (errors && !_(errors).isEmpty()) {
        return (
            <Card>
                <CardHeader title="Validation error" />
                <CardText>
                    <ul>
                        {errors.map((error, idx) => <li key={idx}>{error}</li>)}
                    </ul>
                </CardText>
            </Card>
        );
    } else {
        return null;
    }
};

const SectionsSearchBox = (props) => {
    const {name, debounce, onChange} = props;

    const wrapperStyle = {
        display: 'inline-block',
        width: '25%',
        position: 'relative',
        top: '-16px',
        marginLeft: '10px',
        marginRight: '10px',
    };

    return (
        <div style={wrapperStyle}>
            <SearchBox
                key={name}
                searchObserverHandler={onChange}
                debounce={debounce || 100}
            />
        </div>
    );
};

const SectionsSidebar = (props) => {
    const {open, sections, currentSection, width, onSectionChange, onCollapsibleToggle} = props;
    const sidebarSections = sections.map(section => ({key: section, label: section}));

    return (
        <CollapsibleBox
            open={open}
            styles={{wrapper: {open: {width: width + 75}}}}
            onToggle={onCollapsibleToggle}
        >
            <Sidebar
                sections={sidebarSections}
                styles={{leftBar: {width: width}}}
                onChangeSection={onSectionChange}
                currentSection={currentSection}
            />
        </CollapsibleBox>
    );
};

const SectionConfig = React.createClass({
    mixins: [Translate, ObserverRegistry],

    _onOpen(ev) {
        ev.preventDefault();
        this.setState({open: true, anchorEl: ev.currentTarget});
    },

    getInitialState() {
        return {open: false, anchorEl: null, errors: null};
    },

    render() {
        const {section, onChange} = this.props;
        const {open, anchorEl} = this.state;
        if (!section)
            return;

        return (
            <div style={{float: 'right', margin: '10px'}}>
                <IconButton
                    tooltip={this.getTranslation('section_config')}
                    onClick={this._onOpen}
                >
                    <MoreVert />
                </IconButton>

                <Popover
                    open={open}
                    anchorEl={anchorEl}
                    anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
                    targetOrigin={{horizontal: 'left', vertical: 'top'}}
                    onRequestClose={() => this.setState({open: false})}
                    style={{width: 300, padding: 15, overflowY: 'hidden'}}
                >
                    <Checkbox
                        style={{marginTop: 10, marginBottom: 15}}
                        label={this.getTranslation("show_row_totals")}
                        checked={section.showRowTotals}
                        onCheck={(ev, value) =>
                            onChange(section.name, "showRowTotals", value)}
                    />

                    <Checkbox
                        style={{marginTop: 10, marginBottom: 15}}
                        label={this.getTranslation("show_column_totals")}
                        checked={section.showColumnTotals}
                        onCheck={(ev, value) =>
                            onChange(section.name, "showColumnTotals", value)}
                    />
                </Popover>
            </div>
        );
    },
});

const Sections = React.createClass({
    mixins: [Translate, ObserverRegistry],

    propTypes: {
        validateOnRender: React.PropTypes.bool,
    },

    componentWillReceiveProps(props) {
        if (props.validateOnRender) {
            const isValid = this._updateModelSections();
            props.formStatus(isValid);
        }
    },

    getInitialState() {
        return {
            isLoading: true,
            sections: null, // loaded on componentDidMount
            subsections: null, // loaded on componentDidMount
            sidebarOpen: true,
            filters: {},
            filterName: null,
            sorting: null,
        };
    },

    componentDidMount() {
        const {d2} = this.context;
        const {coreCompetencies, stateSections: sections} = this.props.store.associations;
        const {config} = this.props;

        const sections$ = sections ? Promise.resolve(sections) :
            Section.getSectionsFromCoreCompetencies(d2, config, coreCompetencies);
        sections$.then(sections => {
            this.setState({
                isLoading: false,
                sections: _.keyBy(sections, "name"),
                subsections: [], // [{key: '', label: 'All'}, ...];
                currentSectionName: _.isEmpty(sections) ? null : sections[0].name,
            });
        });
    },

    _updateModelSections() {
        const {d2} = this.context;
        const stateSections = _.values(this.state.sections);
        const {sections, dataSetElements, indicators, errors} = 
            Section.getDataSetInfo(d2, stateSections);
        this.setState({errors: errors});

        this.props.onFieldsChange("associations.stateSections", stateSections);
        this.props.onFieldsChange("associations.sections", sections);
        this.props.onFieldsChange("dataset.dataSetElements", dataSetElements);
        this.props.onFieldsChange("dataset.indicators", indicators);
        return _(errors).isEmpty();
    },

    _setFilterName(searchObserver) {
        this.registerDisposable(searchObserver.subscribe(s => this.setState({filterName: s})));
    },

    _getFilteredDataElements(dataElements) {
        const {filters, filterName, sorting} = this.state;
        const getFiltered = (dataElements) =>
            _.reduce(filters, (dataElements_, value, key) =>
                dataElements_.filter(de => !key || !value || de[key] == value),
                dataElements);
        const getFilteredByName = (dataElements) =>
            !filterName ? dataElements :
                dataElements.filter(de => _.includes(de.name.toLowerCase(), filterName.toLowerCase()));
        const getSorted = (dataElements) =>
            !sorting ? dataElements : _(dataElements).orderBy([sorting[0]], [sorting[1]]).value();
        return getSorted(getFilteredByName(getFiltered(_.values(dataElements))));
    },

    _onColumnSort(sorting) {
        this.setState({sorting});
    },

    _onFilter(key, value) {
        const newFilters = _.merge(this.state.filters, {[key]: value});
        this.setState({filters: newFilters});
    },

    _renderSelectFilter(dataElementsAll, column, styles) {
        const label = this.getTranslation(column);
        const entries = _(dataElementsAll).values().map(column).uniq()
            .map(value => ({value: value, text: value})).value();
        const defaultEntry = {value: null, text: ""};
        const allEntries = [defaultEntry].concat(entries);

        return (
            <SelectField
                floatingLabelText={label}
                value={this.state.filters[column]}
                onChange={(event, index, value) => this._onFilter(column, value)}
            >
                {allEntries.map(e => 
                    <MenuItem key={e.value} value={e.value} primaryText={e.text} />)}
            </SelectField>
        );
    },

    _selectRows(visibleDataElements, selectedHeaderChecked) {
        const newState = visibleDataElements.reduce(
            (state, dataElement) => {
                const path = ["sections", this.state.currentSectionName, "dataElements", dataElement.id, "selected"];
                return fp.set(path, selectedHeaderChecked, state);
            },
            this.state);
        this.setState(newState);
    },

    _onSelectedToggled(dataElement, currentSectionName) {
        const path = ["sections", this.state.currentSectionName, "dataElements", dataElement.id, "selected"];
        const oldValue = fp.get(path, this.state);
        this.setState(fp.set(path, !oldValue, this.state));
    },

    _onChangeSection(sectionName) {
        this.setState({currentSectionName: sectionName, filters: {}, filterName: null});
    },

    _onChange(currentSectionName, key, value) {
        const path = ["sections", currentSectionName, key];
        this.setState(fp.set(path, value, this.state));
    },

    _renderTabs() {
        if (_.isEmpty(subsections)) {
            return;
        }

        const {subsections, filters} = this.state;
        const currentSubsectionIdx = filters.subsection || subsections[0].key;
        return (
            <Tabs style={{width: '100%', marginBottom: '0px'}} key={this.state.currentSectionName}>
                {subsections.map(subsection =>
                    <Tab
                        key={subsection.key}
                        style={{fontWeight: 'inherit', fontSize: '12px'}}
                        buttonStyle={{fontWeight: 'inherit', fontSize: '12px'}}
                        label={subsection.label}
                        onActive={() => this._onFilter("subsection", subsection.key)}
                    />
                )}
            </Tabs>
        );
    },

    _renderForm() {
        const {sidebarOpen, currentSectionName, sections, subsections, filters} = this.state;
        const currentSection = this.state.sections[currentSectionName];
        const dataElementsAll = _.values(currentSection.dataElements);
        const dataElements = this._getFilteredDataElements(dataElementsAll);
        const selectedHeaderChecked =
            !_.isEmpty(dataElements) && dataElements.every(dr => dr.selected);
        const rows = _.map(dataElements, dataElement =>
            _.mapValues(dataElement, (value, name) =>
                name != "selected" ? value :
                    <Checkbox
                        checked={value}
                        iconStyle={{width: 'auto'}}
                        onCheck={() => this._onSelectedToggled(dataElement, currentSectionName)}
                    />
            )
        );
        const selectedColumnContents = (
            <Checkbox
                checked={selectedHeaderChecked}
                onCheck={() => this._selectRows(dataElements, !selectedHeaderChecked)}
                iconStyle={{width: 'auto'}}
            />
        );
        const columns = _.compact([
            {
                name: 'selected',
                style: {width: 20},
                text: "",
                sortable: false,
                contents: selectedColumnContents,
            },
            {
                name: 'name',
                sortable: true,
                style: {width: '33%'},
            },
            /*filters.subsection ? null : {
                name: 'subsection',
                sortable: true,
            }, */
            {
                name: 'origin',
                sortable: true,
            },
            {
                name: 'disaggregation',
                sortable: true,
            },
        ]);

        return (
            <div style={{display: 'flex'}}>

                <SectionsSidebar
                    open={sidebarOpen}
                    sections={_(sections).values().map("name").value()}
                    currentSection={currentSection ? currentSection.name : null}
                    width={250}
                    onSectionChange={this._onChangeSection}
                    onCollapsibleToggle={isOpen => this.setState({sidebarOpen: isOpen})}
                />

                <div style={{width: '100%'}}>
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                        {sidebarOpen ? null :
                            <Chip style={{marginRight: 10}}>{currentSection.name}</Chip>}
                        {this._renderTabs()}
                    </div>

                    <SectionConfig section={currentSection} onChange={this._onChange} />

                    <div style={{marginTop: -15}}>
                        <SectionsSearchBox name={currentSectionName} onChange={this._setFilterName} />
                        {this._renderSelectFilter(dataElementsAll, 'origin', {width: '30%'})}
                    </div>

                    {rows.length == 0 ? <div>{this.getTranslation("no_elements_found")}</div> :
                        <MultipleDataTable
                            styles={{table: {width: 'auto'}}}
                            columns={columns}
                            onColumnSort={this._onColumnSort}
                            rows={rows}
                            contextMenuActions={Action.createActionsFromNames([])}
                            contextMenuIcons={{}}
                            primaryAction={() => {}}
                            isContextActionAllowed={(model, action) => true}
                            isMultipleSelectionAllowed={true}
                        />
                    }
                </div>
            </div>
        );
    },

    render() {
        return this.state.isLoading ? <LinearProgress /> : (
            <div>
                {this._renderForm()}
                <ValidationFeedback errors={this.state.errors} />
            </div>
        );
    },
});

export default Sections;