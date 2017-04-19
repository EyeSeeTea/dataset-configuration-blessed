import React from 'react';
import log from 'loglevel';

import ObserverRegistry from '../utils/ObserverRegistry.mixin';
import MainContent from 'd2-ui/lib/layout/main-content/MainContent.component';
import SinglePanelLayout from 'd2-ui/lib/layout/SinglePanel.component';
import LoadingStatus from '../LoadingStatus/LoadingStatus.component';
import ListActionBar from '../ListActionBar/ListActionBar.component';
import Sidebar from 'd2-ui/lib/sidebar/Sidebar.component';
import SearchBox from '../SearchBox/SearchBox.component';
import Pagination from 'd2-ui/lib/pagination/Pagination.component';
import '../Pagination/Pagination.scss';

// import DataTable from 'd2-ui/lib/data-table/DataTable.component';
import MultipleDataTable from '../MultipleDataTable/MultipleDataTable.component';

import DetailsBoxWithScroll from './DetailsBoxWithScroll.component';
import listActions from './list.actions';
import { contextActions, contextMenuIcons, isContextActionAllowed } from './context.actions';
import detailsStore from './details.store';
import 'd2-ui/scss/DataTable.scss';

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

    mixins: [ObserverRegistry],

    childContextTypes: {
        d2: React.PropTypes.object,
    },

    getChildContext() {
        return {
            d2: this.context.d2,
        };
    },

    getInitialState() {
        return {
            isLoading: true,
            pager: { total: 0 },
            dataRows: [],
            d2: this.context.d2
        }
    },

    componentDidMount() {
        this.doSearch();
        
        //Sets listener to update detailsbox
        const detailsStoreDisposable = detailsStore.subscribe(detailsObject => {
            this.setState({ detailsObject });
        });
        
        this.registerDisposable(detailsStoreDisposable);
    },

    doSearch(value) {
        let dataSets = this.context.d2.models.dataSets;
        if (value) {
            dataSets = dataSets.filter().on('displayName').ilike(value);
        }

        dataSets.list()
            .then(da => {
                this.setState({
                    isLoading: false,
                    pager: da.pager,
                    dataRows: da.toArray()
                });
            }
            );
    },
    
    searchListByName(searchObserver) {

        //bind key search listener
        const searchListByNameDisposable = searchObserver
            .subscribe((value) => {
                this.setState({
                    isLoading: true,
                });
                this.doSearch(value);                
            });

        this.registerDisposable(searchListByNameDisposable);
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

        return (            
            <div>
                <div>
                    <div style={{ float: 'left', width: '75%' }}>
                        <SearchBox searchObserverHandler={this.searchListByName}/>
                    </div>
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
                            rows={this.state.dataRows}
                            columns={['name', 'publicAccess', 'lastUpdated']}
                            contextMenuActions={contextActions}
                            contextMenuIcons={contextMenuIcons}
                            primaryAction={contextActions.details}
                            isContextActionAllowed={isContextActionAllowed}
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

