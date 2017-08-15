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
import camelCaseToUnderscores from 'd2-utilizr/lib/camelCaseToUnderscores';

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

const FilterSelectField = ({label, value, onChange, items, styles = {}, emptyLabel = ""}) => {
    const defaultItem = {value: null, text: emptyLabel};
    const allItems = [defaultItem].concat(items);

    return (
        <SelectField
            style={{marginRight: 5, ...styles}}
            floatingLabelText={label}
            value={value}
            onChange={(event, index, value) => onChange(value)}
        >
            {allItems.map((item, idx) =>
                <MenuItem key={idx} value={item.value} primaryText={item.text} />)
            }
        </SelectField>
    );
};

const SectionsSearchBox = (props) => {
    const {name, debounce, onChange} = props;

    const wrapperStyle = {
        display: 'inline-block',
        width: '20%',
        position: 'relative',
        margin: '5px 0px'
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
    if (props.visible == false)
        return null;
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
        const {sections, onChange} = this.props;
        const {open, anchorEl} = this.state;
        const sectionForCurrentValues = _.first(sections);
        const sectionNames = sections.map(section => section.name);
        if (!sectionForCurrentValues)
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
                        checked={sectionForCurrentValues.showRowTotals}
                        onCheck={(ev, value) =>
                            onChange(sectionNames, "showRowTotals", value)}
                    />

                    <Checkbox
                        style={{marginTop: 10, marginBottom: 15}}
                        label={this.getTranslation("show_column_totals")}
                        checked={sectionForCurrentValues.showColumnTotals}
                        onCheck={(ev, value) =>
                            onChange(sectionNames, "showColumnTotals", value)}
                    />
                </Popover>
            </div>
        );
    },
});

const ThemeTabs = ({title, dataElements, allLabel, onSelected, visible = true}) => {
    if (!visible)
        return null;

    const renderTabs = (dataElements) => {
        const themesFromDataElements = _(dataElements)
            .map("theme").uniq().compact()
            .map(s => ({key: s, label: s})).sortBy("label").value();
        const themes = [{key: '', label: allLabel}, ...themesFromDataElements];

        if (_(themesFromDataElements).isEmpty()) {
            return null;
        } else {
            return (
                <Tabs style={{width: '100%', marginBottom: '15px'}} tabType="scrollable-buttons">
                    {themes.map(theme =>
                        <Tab
                            key={theme.key}
                            style={{fontWeight: 'inherit', fontSize: '12px'}}
                            buttonStyle={{fontWeight: 'inherit', fontSize: '12px'}}
                            label={theme.label}
                            onActive={() => onSelected(theme.key)}
                            isMultiLine={true}
                        />
                    )}
                </Tabs>
            );
        }
    };

    return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            {title && <Chip style={{marginRight: 10}}>{title}</Chip>}
            {renderTabs(dataElements)}
        </div>
    );
};

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
            const sectionNames = sectionsArray.map(section => section.name);
            const sections = _.merge(loadedSections, _.pick(stateSections, _.keys(loadedSections)));

            this.setState({
                isLoading: false,
                sections: sections,
                sectionNames: sectionNames,
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
            _.reduce(filters, (dataElements_, val, key) =>
                dataElements_.filter(de => !key || val === null || val === undefined || de[key] == val),
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
        const label = this.getTranslation(camelCaseToUnderscores(column));
        const items = _(dataElementsAll).values().map(column).uniq().compact()
            .map(value => ({value: value, text: value})).value();

        return (
            <FilterSelectField
                label={label}
                value={this.state.filters[column]}
                onChange={value => this._onFilter(column, value)}
                items={items}
            />
        );
    },

    _selectRows(visibleDataElements, selectedHeaderChecked) {
        const newState = visibleDataElements.reduce(
            (state, dataElement) => {
                const path = [
                    "sections", dataElement.coreCompetency, "dataElements",
                    dataElement.id, "selected",
                ];
                return fp.set(path, selectedHeaderChecked, state);
            },
            this.state);
        this.setState(newState);
    },

    _onSelectedToggled(dataElement) {
        const path = ["sections", dataElement.coreCompetency, "dataElements", dataElement.id, "selected"];
        const oldValue = fp.get(path, this.state);
        this.setState(fp.set(path, !oldValue, this.state));
    },

    _onChangeSection(sectionName) {
        this.setState({currentSectionName: sectionName, filters: {}, filterName: null});
    },

    _onChangeSectionsConfig(sectionNames, key, value) {
        const newState =_.reduce(sectionNames,
            (state, sectionName) => fp.set(["sections", sectionName, key], value, state),
            this.state
        );
        this.setState(newState);
    },

    _sectionsVisible() {
        return this.props.store.dataset.renderAsTabs;
    },

    _getVisibleSections() {
        const {currentSectionName, sections, sectionNames} = this.state;
        const currentSection = sections[currentSectionName];
        return this._sectionsVisible() ? [currentSection] : _.at(sections, sectionNames);
    },

    _getDataElements() {
        return _.flatMap(this._getVisibleSections(), section => _.values(section.dataElements));
    },

    _renderForm() {
        const {sidebarOpen, currentSectionName, sections, filters} = this.state;
        const currentSection = this.state.sections[currentSectionName];
        if (!currentSection) {
            return (<div>{this.getTranslation("no_elements_found")}</div>);
        }
        
        const dataElementsAll = this._getDataElements();
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
            this._sectionsVisible() ? null : {
                name: 'coreCompetency',
                sortable: true,
            },
            filters.theme && this._sectionsVisible() ? null : {
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

        const visibleSections = this._getVisibleSections();

        return (
            <div style={{display: 'flex'}}>
                <SectionsSidebar
                    visible={this._sectionsVisible()}
                    open={sidebarOpen}
                    sections={_(sections).values().map("name").value()}
                    currentSection={currentSection ? currentSection.name : null}
                    width={250}
                    onSectionChange={this._onChangeSection}
                    onCollapsibleToggle={isOpen => this.setState({sidebarOpen: isOpen})}
                />

                <div style={{width: '100%'}}>
                    <ThemeTabs
                        title={sidebarOpen ? null : currentSection.name}
                        visible={this._sectionsVisible()}
                        onSelected={themeKey => this._onFilter("theme", themeKey)}
                        dataElements={dataElementsAll}
                        allLabel={this.getTranslation('all')}
                    />

                    <SectionConfig sections={visibleSections} onChange={this._onChangeSectionsConfig} />

                    <div style={{marginTop: -15}}>
                        <div>
                            <SectionsSearchBox name={currentSectionName} onChange={this._setFilterName} />
                        </div>
                        <div style={{marginTop: -30}}>
                            {!this._sectionsVisible() &&
                                this._renderSelectFilter(dataElementsAll, 'coreCompetency', {width: '20%'})}

                            {!this._sectionsVisible() &&
                                this._renderSelectFilter(dataElementsAll, 'theme', {width: '20%'})}

                            {this._renderSelectFilter(dataElementsAll, 'group', {width: '20%'})}

                            {this._renderSelectFilter(dataElementsAll, 'origin', {width: '20%'})}

                            <FilterSelectField
                                label={this.getTranslation('selected')}
                                value={this.state.filters.selected}
                                onChange={value => this._onFilter("selected", value)}
                                items={[
                                    {value: true, text: this.getTranslation('yes')},
                                    {value: false, text: this.getTranslation('no')},
                                ]}
                            />
                        </div>
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