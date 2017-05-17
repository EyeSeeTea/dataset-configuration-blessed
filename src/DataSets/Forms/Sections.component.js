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

        const sections = _([
            'Education', 'Education B', 
            'Shelter', 'Shelter B',
            'Food security', 'Food security B',
        ]).map((sectionName, idx) => ({key: String(idx), label: sectionName})).value();

        const subsections = [
            {key: '', label: 'All'},
            {key: 'Subsection 1', label: 'Subsection 1'},
            {key: 'Subsection 2', label: 'Subsection 2'},
        ];

        return {
            isLoading: true,
            dataRows: dataRows,
            currentSection: sections[0],
            sections: sections,
            subsections: subsections,
            sidebarOpen: true,
            filters: {},
            filterName: null,
            sorting: null,
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

    _renderSelectFilter(column, styles) {
        const label = this.getTranslation(column);
        const entries = _(this.state.dataRows).values().map(column).uniq()
            .map(value => ({value: value, text: value})).value();
        const defaultEntry = {value: null, text: ""};
        const allEntries = [defaultEntry].concat(entries);

        return (
            <SelectField
                floatingLabelText={label}
                value={this.state.filters[column]}
                onChange={(event, index, value) => this._onFilter(column, value)}
            >
                {allEntries.map(e => <MenuItem key={e.value} value={e.value} primaryText={e.text} />)}
            </SelectField>
        );
    },

    _selectRows(visibleDataRowIds, selectedHeaderChecked) {
        const newDataRows = _.mapValues(this.state.dataRows, (dataRow, id) => 
            !_.includes(visibleDataRowIds, id) ? dataRow :
                _.merge(dataRow, {selected: selectedHeaderChecked}));
        this.setState({dataRows: newDataRows});
    },

    _onActiveChecked(dataRow) {
        const {dataRows} = this.state;
        const path = [dataRow.id, "selected"];        
        const oldValue = _.get(dataRows, path);
        const newDataRows = _.set(dataRows, path, !oldValue);
        return this.setState({dataRows: newDataRows});
    },

    _onChangeSection(sectionKey) {
        const newCurrentSection = this.state.sections[sectionKey];
        this.setState({currentSection: newCurrentSection});
    },

    _renderForm() {
        const styles = {
            tabs: {
                width: '100%',
                marginBottom: '0px',
                backgroundColor: "#e4e4e4",
            },
        };

        const sidebarWidth = 250;
        const contextActions = Action.createActionsFromNames([]);
        const contextMenuIcons = {};

        const dataRows = this._getFilteredDataRows(this.state.dataRows);
        const selectedHeaderChecked = _.every(dataRows, dr => dr.selected);
        const rows = _.map(dataRows, dataRow =>
            _.mapValues(dataRow, (value, name) => 
                name != "selected" ? value :
                    <Checkbox checked={value} onCheck={() => this._onActiveChecked(dataRow)} />
            )
        );

        const {sections, subsections} = this.state;
        
        const columns = [
            {
                name: 'selected', 
                text: "",
                sortable: false,
                contents: 
                    <Checkbox checked={selectedHeaderChecked}
                              labelStyle={{color: ""}}
                              label={this.getTranslation("selected")}
                              onCheck={() => this._selectRows(_.map(dataRows, "id"), !selectedHeaderChecked)} />
            },
            {name: 'name', sortable: true}, 
            {name: 'subsection', sortable: true}, 
            {name: 'origin', sortable: true}, 
            {name: 'disaggregation', sortable: true},
        ];

        const {sidebarOpen, currentSection} = this.state;

        return (
            <div>
                <CollapsibleBox 
                    open={sidebarOpen} 
                    styles={{wrapper: {open: {width: sidebarWidth + 5}}}}
                    onToggle={isOpen => this.setState({sidebarOpen: isOpen})}
                >
                    <Sidebar
                        sections={sections}
                        styles={{leftBar: {width: sidebarWidth}}}
                        onChangeSection={this._onChangeSection}
                        currentSection={this.state.currentSection.key}
                    />
                </CollapsibleBox>

                <div>
                    {sidebarOpen ? null : <Chip style={{marginBottom: 10}}>{currentSection.label}</Chip>}

                    <Tabs style={styles.tabs} tabType="scrollable-buttons">
                        {subsections.map(subsection => 
                            <Tab 
                                key={subsection.key} 
                                label={subsection.label} 
                                onActive={() => this._onFilter("subsection", subsection.key)}
                            />)}
                    </Tabs>

                    <div>
                        <div style={{
                                display: 'inline-block', 
                                width: '30%', 
                                position: 'relative', 
                                top: '-16px',
                                marginLeft: '10px',
                                marginRight: '10px',
                              }}>
                            <SearchBox searchObserverHandler={this._setFilterName} debounce={100} />
                        </div>

                        {this._renderSelectFilter('origin', {width: '30%'})}
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

                <div style={{clear: 'both'}}></div>
            </div>
        );
    },

    render() {
        return this.state.isLoading ? <LinearProgress /> : this._renderForm();
    },
});

export default Sections;