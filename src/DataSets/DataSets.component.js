import React from 'react';
import log from 'loglevel';
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
import SharingDialog from 'd2-ui/lib/sharing/SharingDialog.component';
import '../Pagination/Pagination.scss';

// import DataTable from 'd2-ui/lib/data-table/DataTable.component';
import MultipleDataTable from '../MultipleDataTable/MultipleDataTable.component';

import DetailsBoxWithScroll from './DetailsBoxWithScroll.component';
import listActions from './list.actions';
import { contextActions, contextMenuIcons, isContextActionAllowed } from './context.actions';
import detailsStore from './details.store';
import deleteStore from './delete.store';
import sharingStore from './sharing.store';
import 'd2-ui/scss/DataTable.scss';

import Settings from '../models/Settings';
import SettingsDialog from '../Settings/Settings.component';
import IconButton from 'material-ui/IconButton';
import SettingsIcon from 'material-ui/svg-icons/action/settings';
import Checkbox from 'material-ui/Checkbox/Checkbox';
import FormHelpers from '../forms/FormHelpers';

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
        }
    },


    componentDidMount() {
        const d2 = this.context.d2;
        this.getDataSets();
        
        //Sets listener to update detailsbox
        const detailsStoreDisposable = detailsStore.subscribe(detailsObject => {
            this.setState({ detailsObject });
        });
        
        this.registerDisposable(detailsStoreDisposable);

        this.registerDisposable(deleteStore.subscribe(deleteObject => {
            this.getDataSets();
        }));

        this.registerDisposable(sharingStore.subscribe(datasets => {
            const d2Datasets = datasets.map(dataset => d2.models.dataSets.create(dataset));
            this.setState({sharing: {models: d2Datasets}});
        }));
    },

    getDataSets() {
        const {sorting, searchValue} = this.state;
        const allDataSets = this.context.d2.models.dataSets;
        const filteredDataSets =
            searchValue ? allDataSets.filter().on('displayName').ilike(searchValue) : allDataSets;
        const order = sorting ? sorting.join(":") : undefined;

        filteredDataSets.list({order}).then(da => {
            this.setState({
                isLoading: false,
                pager: da.pager,
                dataRows: da.toArray().map(dr => _.merge(dr, {selected: false}))
            });
        });
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

        return (
            <div>
                <SettingsDialog open={this.state.settingsOpen} onRequestClose={this.closeSettings} />

                {this.state.sharing ? <SharingDialog
                    objectsToShare={this.state.sharing.models}
                    open={true}
                    onRequestClose={() => this.setState({sharing: null})}
                    bodyStyle={{minHeight: '400px'}}
                /> : null }

                <div>
                    <div style={{ float: 'left', width: '75%' }}>
                        <SearchBox searchObserverHandler={this.searchListByName}/>
                    </div>
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
                            isContextActionAllowed={isContextActionAllowed}
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
                </div>
                <ListActionBar route="datasets/add" />
            </div>            
        );
    },
});

export default DataSets;

