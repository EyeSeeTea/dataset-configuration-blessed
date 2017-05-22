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
//import {Tabs, Tab} from 'material-ui-scrollable-tabs/Tabs';
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

const Sections = React.createClass({
    mixins: [Translate, ObserverRegistry],

    propTypes: {
        validateOnRender: React.PropTypes.bool,
    },

    componentWillReceiveProps(props) {
        if (props.validateOnRender) {
            props.formStatus(true);
        }
    },

    getInitialState() {
        const dataRows = _.keyBy([
            {
                id: "1",
                selected: true,
                name: 'GL-SB1A: % of temporary shelter units handed over that are observed to be in use after time X (e.g. 2 weeks 1 month)',
                subsection: "Subsection 1",
                origin: 'Global Indicators (Mandatory)',
                disaggregation: 'ConstructionType',
            }, 
            {
                id: "2",
                selected: true,
                name: 'CO-A01: # of instances where NRC/IDMC recommendations are reflected in targeted HLP policies',
                origin: 'Global Indicators (Mandatory)',
                subsection: "Subsection 2",
                disaggregation: 'ConstructionType',
            },
            {
                id: "3",
                selected: false,
                name: 'CO-EO1-E106: % (sample) teachers trained on Education in Emergencies who can replicate info/skills/msg',
                origin: 'Local Indicators',
                subsection: "Subsection 1",
                disaggregation: 'Sex',
            },
        ], "id");

        const sectionNames = [
            'Education', 'Education B', 
            'Shelter', 'Shelter B',
            'Food security', 'Food security B',
        ];

        const sections = _(sectionNames).map((sectionName, idx) => ({
            key: String(idx), 
            label: sectionName,
            config: {show_row_totals: false, show_column_totals: false},
        })).value();

        const subsections = [
            {key: '', label: 'All'},
            {key: 'Subsection 1', label: 'Subsection 1'},
            {key: 'Subsection 2', label: 'Subsection 2'},
        ];

        return {
            isLoading: true,
            dataRowsBySection: 
                _(sections).map(section => [section.key, _.clone(dataRows)]).fromPairs().value(),
            currentSectionKey: sections[0].key,
            sections: sections,
            subsections: subsections,
            sidebarOpen: true,
            filters: {},
            filterName: null,
            sorting: null,
            sectionConfig: {open: false, anchorEl: null},
        };
    },

    componentDidMount() {
        this.setState({isLoading: false});
    },

    _setFilterName(searchObserver) {
        this.registerDisposable(searchObserver.subscribe(s => this.setState({filterName: s})));
    },

    _getFilteredDataRows(dataRows) {
        const {filters, filterName, sorting} = this.state;
        const getFiltered = (rows) => 
            _.reduce(filters, (rows_, value, key) => 
                rows_.filter(row => !key || !value || row[key] == value), 
                rows);
        const getFilteredByName = (rows) => 
            !filterName ? rows :
                rows.filter(row => _.includes(row.name.toLowerCase(), filterName.toLowerCase()));
        const getSorted = (rows) => 
            !sorting ? rows : _(rows).orderBy([sorting[0]], [sorting[1]]).value();
        return getSorted(getFilteredByName(getFiltered(_.values(dataRows))));
    },

    _onColumnSort(sorting) {
        this.setState({sorting});
    },

    _onFilter(key, value) {
        const newFilters = _.merge(this.state.filters, {[key]: value});
        this.setState({filters: newFilters});
    },

    _renderSelectFilter(dataRowsAll, column, styles) {
        const label = this.getTranslation(column);
        const entries = _(dataRowsAll).values().map(column).uniq()
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

    _renderSearchBox() {
        const {currentSectionKey} = this.state;
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
                    key={currentSectionKey}
                    searchObserverHandler={this._setFilterName}
                    debounce={100}
                />
            </div>
        );
    },

    _selectRows(visibleDataRows, selectedHeaderChecked) {
        const newState = visibleDataRows.reduce(
            (state, row) => {
                const path = ["dataRowsBySection", this.state.currentSectionKey, row.id, "selected"];
                return fp.set(path, selectedHeaderChecked, state);
            },
            this.state);
        this.setState(newState);
    },

    _onActiveToggled(dataRow) {
        const {currentSectionKey} = this.state;
        const path = ["dataRowsBySection", currentSectionKey, dataRow.id, "selected"];        
        const oldValue = fp.get(path, this.state);
        this.setState(fp.set(path, !oldValue, this.state));
    },

    _onChangeSection(sectionKey) {
        this.setState({currentSectionKey: sectionKey, filters: {}, filterName: null});
    },

    _onSectionConfig(currentSectionKey, key, value) {
        const {sections} = this.state;
        const newSections = _(sections)
            .map(sec => sec.key == currentSectionKey ? fp.set(["config", key], value, sec) : sec)
            .value();
        this.setState({sections: newSections});
    },

    _onSectionConfigRequestOpen(ev) {
        ev.preventDefault();
        this.setState({sectionConfig: {open: true, anchorEl: ev.currentTarget}});
    },

    _onSectionConfigRequestClose() {
        this.setState(fp.set("sectionConfig.open", false, this.state));
    },

    _renderSectionConfig() {
        const {currentSectionKey, sections, sectionConfig} = this.state;
        const currentSection = sections[currentSectionKey];

        return (
            <div style={{float: 'right', margin: '10px'}}>
                <IconButton 
                    tooltip={this.getTranslation('section_config')} 
                    onClick={this._onSectionConfigRequestOpen}
                >
                    <MoreVert />
                </IconButton>

                <Popover 
                    open={sectionConfig.open}
                    anchorEl={sectionConfig.anchorEl}
                    anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
                    targetOrigin={{horizontal: 'left', vertical: 'top'}}
                    onRequestClose={this._onSectionConfigRequestClose}
                    style={{width: 300, padding: 15, overflowY: 'hidden'}}
                >
                    <Checkbox 
                        style={{marginTop: 10, marginBottom: 15}}
                        label={this.getTranslation("show_row_totals")}
                        checked={currentSection.config.show_row_totals}
                        onCheck={(ev, value) =>
                            this._onSectionConfig(currentSection.key, "show_row_totals", value)} 
                    />

                    <Checkbox 
                        style={{marginTop: 10, marginBottom: 15}}
                        label={this.getTranslation("show_column_totals")}
                        checked={currentSection.config.show_column_totals}
                        onCheck={(ev, value) => 
                            this._onSectionConfig(currentSection.key, "show_column_totals", value)} 
                    />
                </Popover>
            </div>
        );
    },

    _renderTabs() {
        const {subsections, filters} = this.state;
        const currentSubsectionKey = filters.subsection || subsections[0].key;

        return (
            <Tabs style={{width: '100%', marginBottom: '0px'}} key={this.state.currentSectionKey}>
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

    _renderSidebar() {
        const {sidebarOpen, sections, currentSectionKey} = this.state;
        const currentSection = sections[currentSectionKey];
        const sidebarWidth = 250;

        return (
            <CollapsibleBox 
                open={sidebarOpen} 
                styles={{wrapper: {open: {width: sidebarWidth + 5}}}}
                onToggle={isOpen => this.setState({sidebarOpen: isOpen})}
            >
                <Sidebar
                    sections={sections}
                    styles={{leftBar: {width: sidebarWidth}}}
                    onChangeSection={this._onChangeSection}
                    currentSection={currentSection.key}
                />
            </CollapsibleBox>
        );
    },

    _renderForm() {
        const contextActions = Action.createActionsFromNames([]);
        const contextMenuIcons = {};
        const {sidebarOpen, currentSectionKey, sections, subsections, filters} = this.state;
        const dataRowsAll = this.state.dataRowsBySection[currentSectionKey];
        const dataRows = this._getFilteredDataRows(dataRowsAll);
        const selectedHeaderChecked = !_.isEmpty(dataRows) && _.every(dataRows, dr => dr.selected);
        const rows = _.map(dataRows, dataRow =>
            _.mapValues(dataRow, (value, name) => 
                name != "selected" ? value :
                    <Checkbox 
                        checked={value} 
                        iconStyle={{width: 'auto'}} 
                        onCheck={() => this._onActiveToggled(dataRow)} 
                    />
            )
        );
        const currentSection = sections[currentSectionKey];
        const selectedColumnContents = (
            <Checkbox 
                checked={selectedHeaderChecked}
                onCheck={() => this._selectRows(dataRows, !selectedHeaderChecked)} 
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
            filters.subsection ? null : {
                name: 'subsection', 
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
                {this._renderSidebar()}

                <div style={{width: '100%'}}>
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                        {sidebarOpen ? null : 
                            <Chip style={{marginRight: 10}}>{currentSection.label}</Chip>}
                        {this._renderTabs()}
                    </div>

                    {this._renderSectionConfig()}

                    <div style={{marginTop: -10}}>
                        {this._renderSearchBox()}
                        {this._renderSelectFilter(dataRowsAll, 'origin', {width: '30%'})}
                    </div>

                    <MultipleDataTable
                        styles={{table: {width: 'auto'}}}
                        columns={columns}
                        onColumnSort={this._onColumnSort}
                        rows={rows}
                        contextMenuActions={contextActions}
                        contextMenuIcons={contextMenuIcons}
                        primaryAction={() => {}}
                        isContextActionAllowed={(model, action) => true}
                        isMultipleSelectionAllowed={true}
                    />
                    {rows.length || this.state.isLoading ? 
                        null : <div>{this.getTranslation("no_elements_found")}</div>}
                </div>
            </div>
        );
    },

    render() {
        return this.state.isLoading ? <LinearProgress /> : this._renderForm();
    },
});

export default Sections;