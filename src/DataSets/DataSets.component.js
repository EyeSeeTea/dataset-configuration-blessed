import React from 'react';
import fp from 'lodash/fp';
import _ from 'lodash';

import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import ObserverRegistry from '../utils/ObserverRegistry.mixin';
import MainContent from 'd2-ui/lib/layout/main-content/MainContent.component';
import SinglePanelLayout from 'd2-ui/lib/layout/SinglePanel.component';
import LoadingStatus from '../LoadingStatus/LoadingStatus.component';
import ListActionBar from '../ListActionBar/ListActionBar.component';
import Sidebar from 'd2-ui/lib/sidebar/Sidebar.component';
import SearchBox from '../SearchBox/SearchBox.component';
import Pagination from 'd2-ui/lib/pagination/Pagination.component';
import OrgUnitsDialog from 'd2-ui/lib/org-unit-dialog/OrgUnitsDialog.component';
import SharingDialog from 'd2-ui/lib/sharing/SharingDialog.component';
import '../Pagination/Pagination.scss';
import snackActions from '../Snackbar/snack.actions';

// import DataTable from 'd2-ui/lib/data-table/DataTable.component';
import MultipleDataTable from '../MultipleDataTable/MultipleDataTable.component';

import DetailsBoxWithScroll from './DetailsBoxWithScroll.component';
import listActions from './list.actions';
import { contextActions, contextMenuIcons, isContextActionAllowed } from './context.actions';
import detailsStore from './details.store';
import logsStore from './logs.store';
import deleteStore from './delete.store';
import orgUnitsStore from './orgUnits.store';
import sharingStore from './sharing.store';
import 'd2-ui/scss/DataTable.scss';
import { log, getLogs, LogEntry } from './log';

import Settings from '../models/Settings';
import SettingsDialog from '../Settings/Settings.component';
import IconButton from 'material-ui/IconButton';
import SettingsIcon from 'material-ui/svg-icons/action/settings';
import Checkbox from 'material-ui/Checkbox/Checkbox';
import Dialog from 'material-ui/Dialog/Dialog';
import FlatButton from 'material-ui/FlatButton/FlatButton';
import HelpOutlineIcon from 'material-ui/svg-icons/action/help-outline';
import ListIcon from 'material-ui/svg-icons/action/list';
import FormHelpers from '../forms/FormHelpers';
import {currentUserHasPermission} from '../utils/Dhis2Helpers';

const {SimpleCheckBox} = FormHelpers;

export function calculatePageValue(pager) {
    const pageSize = 50; // TODO: Make the page size dynamic
    const { total, pageCount, page } = pager;
    const pageCalculationValue = total - (total - ((pageCount - (pageCount - page)) * pageSize));
    const startItem = 1 + pageCalculationValue - pageSize;
    const endItem = pageCalculationValue;

    return `${startItem} - ${endItem > total ? total : endItem}`;
}
const DataSets = React.createClass({
    propTypes: {
        name: React.PropTypes.string
    },

    contextTypes: {
        d2: React.PropTypes.object.isRequired,
    },

    mixins: [ObserverRegistry, Translate],

    childContextTypes: {
        d2: React.PropTypes.object,
    },

    getChildContext() {
        return {
            d2: this.context.d2,
        };
    },

    getInitialState() {
        const settings = new Settings(this.context.d2);

        return {
            isLoading: true,
            pager: { total: 0 },
            dataRows: [],
            d2: this.context.d2,
            currentUserHasAdminRole: settings.currentUserHasAdminRole(),
            settingsOpen: false,
            sorting: null,
            searchValue: null,
            orgUnits: null,
            helpOpen: false,
            logs: null,
        }
    },


    componentDidMount() {
        const d2 = this.context.d2;
        this.getDataSets();

        this.registerDisposable(detailsStore.subscribe(detailsObject => this.setState({detailsObject})));
        this.registerDisposable(deleteStore.subscribe(deleteObjects => this.getDataSets()));
        this.registerDisposable(this.subscribeToModelStore(sharingStore, "sharing"));
        this.registerDisposable(this.subscribeToModelStore(orgUnitsStore, "orgUnits"));
        this.registerDisposable(logsStore.subscribe(datasets => this.showDatasetsLogs(datasets)));
    },

    subscribeToModelStore(store, modelName) {
        return store.subscribe(datasets => {
            if (datasets) {
                const d2Datasets = datasets.map(dataset => d2.models.dataSets.create(dataset));
                this.setState({[modelName]: {models: d2Datasets}});
            } else {
                this.setState({[modelName]: null});
            }
        });
    },

    getDataSets() {
        const {sorting, searchValue} = this.state;
        const allDataSets = this.context.d2.models.dataSets;
        const filteredDataSets =
            searchValue ? allDataSets.filter().on('displayName').ilike(searchValue) : allDataSets;
        const order = sorting ? sorting.join(":") : undefined;
        const fields = "id,name,displayName,shortName,created,lastUpdated,publicAccess,user,access"

        filteredDataSets.list({order, fields}).then(da => {
            this.setState({
                isLoading: false,
                pager: da.pager,
                dataRows: da.toArray().map(dr => _.merge(dr, {selected: false}))
            });
        });
    },

    showDatasetsLogs(datasets) {
        // Set this.state.logs to the logs that include any of the given
        // datasets, and this.state.logsObject to a description of their contents.
        if (!datasets) {
            this.setState({logsObject: null});
        } else {
            getLogs().then(logs => {
                const idsSelected = new Set(datasets.map(ds => ds.id));
                const hasIds = (log) => log.datasets.some(ds => idsSelected.has(ds.id));
                const logsSelected = _(logs).filter(hasIds).orderBy('date', 'desc').value();
                this.setState({logs: logsSelected.map(LogEntry)});
            });
            this.setState({logsObject: datasets.map(ds => ds.id).join(", "), logs: this.getTranslation("logs_loading")});  // description of what it has
        }
    },

    searchListByName(searchObserver) {

        //bind key search listener
        const searchListByNameDisposable = searchObserver
            .subscribe((value) => {
                this.setState({
                    isLoading: true,
                    searchValue: value,
                }, this.getDataSets);
            });

        this.registerDisposable(searchListByNameDisposable);
    },

    openSettings() {
        this.setState({settingsOpen: true});
    },

    closeSettings() {
        this.setState({settingsOpen: false});
    },

    openLogs() {
        // Retrieve the logs and save them in this.state.logs, and set
        // this.state.logsObject to a description of their contents.
        getLogs().then(logs => {
            this.setState({logs: _(logs).orderBy('date', 'desc').value().map(LogEntry)});
        });
        this.setState({logsObject: this.getTranslation("all"), logs: this.getTranslation("logs_loading")});  // description of what it has
    },

    onSelectToggle(ev, dataset) {
        ev.preventDefault();
        ev.stopPropagation();
        this.setState({
            dataRows: this.state.dataRows
                .map(dr => dr.id === dataset.id ? _.merge(dr, {selected: !dr.selected}) : dr)
        });
    },

    onSelectAllToggle(value) {
        this.setState({
            dataRows: this.state.dataRows.map(dr => _.merge(dr, {selected: !value}))
        });
    },

    onActiveRowsChange(datasets) {
        const selectedIds = new Set(datasets.map(ds => ds.id));

        this.setState({
            dataRows: this.state.dataRows.map(dr => _.merge(dr, {selected: selectedIds.has(dr.id)}))
        });
    },

    _onColumnSort(sorting) {
        this.setState({sorting}, this.getDataSets);
    },

    _openHelp() {
        this.setState({helpOpen: true});
    },

    _closeHelp() {
        this.setState({helpOpen: false});
    },

    render() {
        const currentlyShown = calculatePageValue(this.state.pager);

        const paginationProps = {
            hasNextPage: () => Boolean(this.state.pager.hasNextPage) && this.state.pager.hasNextPage(),
            hasPreviousPage: () => Boolean(this.state.pager.hasPreviousPage) && this.state.pager.hasPreviousPage(),
            onNextPageClick: () => {
                this.setState({ isLoading: true });
                // listActions.getNextPage();
            },
            onPreviousPageClick: () => {
                this.setState({ isLoading: true });
                // listActions.getPreviousPage();
            },
            total: this.state.pager.total,
            currentlyShown,
        };

        const styles = {
            dataTableWrap: {
                display: 'flex',
                flexDirection: 'column',
                flex: 2,
            },

            detailsBoxWrap: {
                flex: 1,
                marginLeft: '1rem',
                marginRight: '1rem',
                opacity: 1,
                flexGrow: 0,
            },

            listDetailsWrap: {
                flex: 1,
                display: 'flex',
                flexOrientation: 'row',
            },
        };

        const rows = this.state.dataRows.map(dr => fp.merge(dr, {selected:
            (<SimpleCheckBox onClick={ev => this.onSelectToggle(ev, dr)} checked={dr.selected} />)}));
        const selectedHeaderChecked = !_.isEmpty(this.state.dataRows) &&
            this.state.dataRows.every(row => row.selected);
        const selectedColumnContents = (
            <Checkbox
                checked={selectedHeaderChecked}
                onCheck={() => this.onSelectAllToggle(selectedHeaderChecked)}
                iconStyle={{width: 'auto'}}
            />
        );

        const columns = [
            {
                name: 'selected',
                style: {width: 20},
                text: "",
                sortable: false,
                contents: selectedColumnContents,
            },
            {name: 'name', sortable: true},
            {name: 'publicAccess', sortable: true,},
            {name: 'lastUpdated', sortable: true},
        ];

        const activeRows = _(rows).keyBy("id")
            .at(this.state.dataRows.filter(dr => dr.selected).map(dr => dr.id)).value();

        const renderSettingsButton = () => (
            <div style={{float: 'right'}}>
                <IconButton onTouchTap={this.openSettings} tooltip={this.getTranslation('settings')}>
                  <SettingsIcon />
                </IconButton>
            </div>
        );

        const renderLogsButton = () => (
            <div style={{float: 'right'}}>
                <IconButton tooltip={this.getTranslation("logs")} onClick={this.openLogs}>
                    <ListIcon />
                </IconButton>
            </div>
        );

        const {d2} = this.context;
        const userCanCreateDataSets = currentUserHasPermission(d2, d2.models.dataSet, "CREATE_PRIVATE");

        const logActions = [
            <FlatButton
                label={this.getTranslation('close')}
                onClick={() => {
                    listActions.hideLogs();
                }}
            />,
        ];

        const helpActions = [
            <FlatButton
                label={this.getTranslation('close')}
                onClick={this._closeHelp}
            />,
        ];

        const renderHelp = () => (
            <div style={{float: 'right'}}>
                <IconButton tooltip={this.getTranslation("help")} onClick={this._openHelp}>
                    <HelpOutlineIcon />
                </IconButton>
            </div>
        );

        return (
            <div>
                <Dialog
                    title={this.getTranslation('help')}
                    actions={helpActions}
                    open={this.state.helpOpen}
                    onRequestClose={this._closeHelp}
                >
                    {this.getTranslation("help_landing_page")}
                </Dialog>
                <SettingsDialog open={this.state.settingsOpen} onRequestClose={this.closeSettings} />
                {this.state.orgUnits ? <OrgUnitsDialog
                     objects={this.state.orgUnits.models}
                     open={true}
                     onSave={datasets => log('change org units', 'success', datasets)}
                     onRequestClose={listActions.hideOrgUnitsBox}
                     contentStyle={{width: '1150px', maxWidth: 'none'}}
                     bodyStyle={{minHeight: '440px', maxHeight: '600px'}}
                 /> : null }

                {this.state.sharing ? <SharingDialog
                    objectsToShare={this.state.sharing.models}
                    open={true}
                    onRequestClose={() => {
                        log('change sharing settings', 'success', this.state.sharing.models);
                        listActions.hideSharingBox();}}
                    onError={err => {
                        log('change sharing settings', 'failed', this.state.sharing.models);
                        snackActions.show({message: err && err.message || 'Error'});}}
                    bodyStyle={{minHeight: '400px'}}
                /> : null }

                <div>
                    <div style={{ float: 'left', width: '75%' }}>
                        <SearchBox searchObserverHandler={this.searchListByName}/>
                    </div>
                    {this.getTranslation("help_landing_page") != '' && renderHelp()}
                    {this.state.currentUserHasAdminRole && renderLogsButton()}
                    {this.state.currentUserHasAdminRole && renderSettingsButton()}
                    <div>
                        <Pagination {...paginationProps} />
                    </div>
                </div>
                <LoadingStatus
                    loadingText="Loading datasets"
                    isLoading={this.state.isLoading}
                    />
                <div style={styles.listDetailsWrap}>
                    <div style={styles.dataTableWrap}>
                        <MultipleDataTable
                            rows={rows}
                            columns={columns}
                            onColumnSort={this._onColumnSort}
                            contextMenuActions={contextActions}
                            contextMenuIcons={contextMenuIcons}
                            primaryAction={contextActions.details}
                            isContextActionAllowed={(...args) => isContextActionAllowed(d2, ...args)}
                            activeRows={activeRows}
                            onActiveRowsChange={this.onActiveRowsChange}
                            isMultipleSelectionAllowed={true}
                            />
                        {this.state.dataRows.length || this.state.isLoading ? null : <div>No results found</div>}
                    </div>
                    {
                        this.state.detailsObject ?
                            <DetailsBoxWithScroll
                                style={styles.detailsBoxWrap}
                                detailsObject={this.state.detailsObject}
                                onClose={listActions.hideDetailsBox}
                            />
                        : null}
                    {
                        this.state.logsObject ? (
                            <Dialog
                                title={this.getTranslation("logs") + " (" + this.state.logsObject + ")"}
                                actions={logActions}
                                open={true}
                                bodyStyle={{padding: "20px"}}
                                onRequestClose={listActions.hideLogs}
                                autoScrollBodyContent={true}
                            >
                                {_(this.state.logs).isEmpty() ? this.getTranslation('logs_none') : this.state.logs}
                            </Dialog>)
                        : null}
                </div>

                {userCanCreateDataSets && <ListActionBar route="datasets/add" />}
            </div>
        );
    },
});

export default DataSets;
