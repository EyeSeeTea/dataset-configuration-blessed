import React from 'react';
import log from 'loglevel';

import headerBarStore$ from 'd2-ui/lib/app-header/headerBar.store';
import withStateFrom from 'd2-ui/lib/component-helpers/withStateFrom';
import ObserverRegistry from '../utils/ObserverRegistry.mixin';
import HeaderBarComponent from 'd2-ui/lib/app-header/HeaderBar';
import MainContent from 'd2-ui/lib/layout/main-content/MainContent.component';
import SinglePanelLayout from 'd2-ui/lib/layout/SinglePanel.component';
import LoadingStatus from './LoadingStatus.component';
import Sidebar from 'd2-ui/lib/sidebar/Sidebar.component';
import SearchBox from '../SearchBox/SearchBox.component';
import Pagination from 'd2-ui/lib/pagination/Pagination.component';
import DataTable from 'd2-ui/lib/data-table/DataTable.component';
import 'd2-ui/scss/DataTable.scss';


const HeaderBar = withStateFrom(headerBarStore$, HeaderBarComponent);

export function calculatePageValue(pager) {
    const pageSize = 50; // TODO: Make the page size dynamic
    const { total, pageCount, page } = pager;
    const pageCalculationValue = total - (total - ((pageCount - (pageCount - page)) * pageSize));
    const startItem = 1 + pageCalculationValue - pageSize;
    const endItem = pageCalculationValue;

    return `${startItem} - ${endItem > total ? total : endItem}`;
}

export default React.createClass({
    propTypes: {
        name: React.PropTypes.string,
        d2: React.PropTypes.object,
    },

    mixins: [ObserverRegistry],

    childContextTypes: {
        d2: React.PropTypes.object,
    },

    getChildContext() {
        return {
            d2: this.props.d2,
        };
    },

    getInitialState() {
        return {
            isLoading: true,
            pager: { total: 0 },
            dataRows: []
        }
    },

    componentDidMount() {
        this.doSearch();
    },

    doSearch(value) {
        let dataSets = this.props.d2.models.dataSets;
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
                <HeaderBar />
                <SinglePanelLayout>
                    <MainContent>
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
                                    <DataTable
                                        rows={this.state.dataRows}
                                        columns={['name']}
                                        // contextMenuActions={availableActions}
                                        // contextMenuIcons={contextMenuIcons}
                                        // primaryAction={availableActions.edit}
                                        // isContextActionAllowed={this.isContextActionAllowed}
                                        />
                                    {this.state.dataRows.length || this.state.isLoading ? null : <div>No results found</div>}
                                </div>
                            </div>
                        </div>
                    </MainContent>
                </SinglePanelLayout>
            </div>
        );
    },
});