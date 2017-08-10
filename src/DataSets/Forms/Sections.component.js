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
import {Tabs, Tab} from 'material-ui-scrollable-tabs/Tabs';
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

    componentWillUnmount() {
        // Save state on back button (forward button saves state in componentWillReceiveProps)
        if (!this.props.validateOnRender) {
            this._updateModelSections();
        }
    },

    getInitialState() {
        return {
            isLoading: true,
            sections: null, // loaded on componentDidMount
            sidebarOpen: true,
            filters: {},
            filterName: null,
            sorting: null,
        };
    },

    componentDidMount() {
        const {d2} = this.context;
        const {config} = this.props;
        const {coreCompetencies, stateSections} = this.props.store.associations;

        Section.getSectionsFromCoreCompetencies(d2, config, coreCompetencies).then(sectionsArray => {
            const loadedSections = _.keyBy(sectionsArray, "name");
            this.setState({
                isLoading: false,
                sections: _.merge(loadedSections, _.pick(stateSections, _.keys(loadedSections))),
                currentSectionName: _.isEmpty(sectionsArray) ? null : sectionsArray[0].name,
            });
        });
    },

    _updateModelSections() {
        const errors = this.props.store.updateModelSections(this.state.sections);
        this.setState({errors: errors});
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
        const entries = _(dataElementsAll).values().map(column).uniq().compact()
            .map(value => ({value: value, text: value})).value();
        const defaultEntry = {value: null, text: ""};
        const allEntries = [defaultEntry].concat(entries);

        return (
            <SelectField
                style={{marginRight: 5, ...styles}}
                floatingLabelText={label}
                value={this.state.filters[column]}
                onChange={(event, index, value) => this._onFilter(column, value)}
            >
                {allEntries.map((e, idx) =>
                    <MenuItem key={idx} value={e.value} primaryText={e.text} />)}
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

    _onSelectedToggled(dataElement) {
        const {currentSectionName} = this.state;
        const path = ["sections", currentSectionName, "dataElements", dataElement.id, "selected"];
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

    _renderTabs(dataElements) {
        const subsectionsFromDE = _(dataElements)
            .map("theme")
            .uniq()
            .compact()
            .map(s => ({key: s, label: s}))
            .sortBy("label")
            .value();
        const subsections = [
            {key: '', label: this.getTranslation('all')}, 
            ...subsectionsFromDE
        ];

        if (subsectionsFromDE.length == 0) {
            return null;
        } else {
            return (
                <Tabs
                    style={{width: '100%', marginBottom: '0px'}}
                    key={this.state.currentSectionName}
                    tabType="scrollable-buttons"
                >
                    {subsections.map(subsection =>
                        <Tab
                            key={subsection.key}
                            style={{fontWeight: 'inherit', fontSize: '12px'}}
                            buttonStyle={{fontWeight: 'inherit', fontSize: '12px'}}
                            label={subsection.label}
                            onActive={() => this._onFilter("theme", subsection.key)}
                            isMultiLine={true}
                        />
                    )}
                </Tabs>
            );
        }
    },

    _renderForm() {
        const {sidebarOpen, currentSectionName, sections, filters} = this.state;
        const currentSection = this.state.sections[currentSectionName];
        if (!currentSection) {
            return (<div>{this.getTranslation("no_elements_found")}</div>);
        }
        
        const dataElementsAll = _.values(currentSection.dataElements);
        const dataElements = this._getFilteredDataElements(dataElementsAll);
        const selectedHeaderChecked =
            !_.isEmpty(dataElements) && dataElements.every(dr => dr.selected);
        const rows = _.map(dataElements, dataElement =>
            _.mapValues(dataElement, (value, name) =>
                // When there are many rows, material-ui's rich <Checkbox> slows down the rendering,
                // use a more simple checkbox and try to mimic the look.
                name != "selected" ? value :
                    <div onClick={() => this._onSelectedToggled(dataElement)}>
                        <input type="checkbox" readOnly={true}
                               checked={value} className="simple-checkbox">
                        </input>
                        <span></span>
                    </div>
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
            filters.theme ? null : {
                name: 'theme',
                sortable: true,
            },
            {
                name: 'group',
                sortable: true,
            },
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
                        {this._renderTabs(dataElementsAll)}
                    </div>

                    <SectionConfig section={currentSection} onChange={this._onChange} />

                    <div style={{marginTop: -15}}>
                        <SectionsSearchBox name={currentSectionName} onChange={this._setFilterName} />
                        {this._renderSelectFilter(dataElementsAll, 'group', {width: '30%'})}
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