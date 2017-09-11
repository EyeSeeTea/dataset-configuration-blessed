import isArrayOfStrings from 'd2-utilizr/lib/isArrayOfStrings';
import isIterable from 'd2-utilizr/lib/isIterable';
import React from 'react';
import update from 'immutability-helper';
import MultipleDataTableRow from './MultipleDataTableRow.component';
import DataTableHeader from 'd2-ui/lib/data-table/DataTableHeader.component';
import MultipleDataTableContextMenu from './MultipleDataTableContextMenu.component';
import _ from '../utils/lodash-mixins';

const MultipleDataTable = React.createClass({
    propTypes: {
        contextMenuActions: React.PropTypes.object,
        contextMenuIcons: React.PropTypes.object,
        primaryAction: React.PropTypes.func,
        isContextActionAllowed: React.PropTypes.func,
        isMultipleSelectionAllowed: React.PropTypes.bool,
        columns: React.PropTypes.arrayOf(React.PropTypes.object),
        hideRowsActionsIcon: React.PropTypes.bool,
        onColumnSort: React.PropTypes.func,
        styles: React.PropTypes.shape({
            table: React.PropTypes.object,
            header: React.PropTypes.object,
        }),
        activeRows: React.PropTypes.arrayOf(React.PropTypes.object),
        onActiveRowsChange: React.PropTypes.func,
    },

    getDefaultProps() {
        return {
            styles: {},
            activeRows: [],
            onActiveRowsChange: () => {},
        };
    },

    getInitialState() {
        return this.getStateFromProps(this.props);
    },

    componentWillReceiveProps(newProps) {
        this.setState(this.getStateFromProps(newProps));
    },

    getStateFromProps(props) {
        let dataRows = [];

        if (isIterable(props.rows)) {
            dataRows = props.rows instanceof Map ? Array.from(props.rows.values()) : props.rows;
        }

        return {
            columns: props.columns || [{name: 'name'}, {name: 'lastUpdated'}],
            activeRows: props.activeRows,
            dataRows,
        };
    },

    renderContextMenu() {
        const actionAccessChecker = this.props.isContextActionAllowed ?
            this.props.isContextActionAllowed.bind(null, this.state.activeRows) : () => true;

        const actionsToShow = Object.keys(this.props.contextMenuActions || {})
            .filter(actionAccessChecker)
            .reduce((availableActions, actionKey) => {
                availableActions[actionKey] = this.props.contextMenuActions[actionKey];
                return availableActions;
            }, {});

        return (
                <MultipleDataTableContextMenu
                    target={this.state.contextMenuTarget}
                    onRequestClose={this._hideContextMenu}
                    actions={actionsToShow}
                    activeItems={this.state.activeRows}
                    showContextMenu={this.state.showContextMenu}
                    icons={this.props.contextMenuIcons}
                />
        );
    },

    _onColumnSortingToggle(headerName) {
        const newSortingDirection = this.state.sorting && this.state.sorting[0] == headerName ?
            (this.state.sorting[1] == "asc" ? "desc" : "asc") : "asc";
        const newSorting = [headerName, newSortingDirection];
        this.setState({sorting: newSorting});
        this.props.onColumnSort && this.props.onColumnSort(newSorting);
    },

    renderHeaders() {
        const sortableColumns = this.props.sortableColumns || [];
        const [currentSortedColumn, currentSortedDirection] = (this.state.sorting || []);

        return this.state.columns.map((column, index) => (
            <DataTableHeader 
                key={column.name}
                style={column.style}
                isOdd={Boolean(index % 2)}
                name={column.name}
                contents={column.contents}
                text={column.text}
                sortable={!!column.sortable}
                sorting={currentSortedColumn == column.name ? currentSortedDirection : null}
                onSortingToggle={this._onColumnSortingToggle.bind(this, column.name)}
            />
        ));
    },

    renderRows() {
        return this.state.dataRows
            .map((dataRowsSource, dataRowsId) => {
                return (
                    <MultipleDataTableRow
                        key={dataRowsId}
                        dataSource={dataRowsSource}
                        columns={this.state.columns.map(c => c.name)}
                        hideActionsIcon={this.props.hideRowsActionsIcon}
                        isActive={this.isRowActive(dataRowsSource)}                        
                        itemClicked={this.handleRowClick}
                        primaryClick={this.handlePrimaryClick}                                                                     
                    />
                );
            });
    },
    
    render() {
        const defaultStyles = {
            table: {},
            header: {},
        }
        const styles = _.deepMerge(defaultStyles, this.props.styles);

        return (
           <div className="data-table" style={styles.table}>
               <div className="data-table__headers">
                    {this.renderHeaders()}
                    <DataTableHeader />
               </div>
               <div className="data-table__rows">
                   {this.renderRows()}
               </div>
               {this.renderContextMenu()}
           </div>
        );
    },    
    
    isRowActive(rowSource){                
        if(!this.state.activeRows){
            return false;
        }
        return _.includes(this.state.activeRows, rowSource);
    },
    
    isEventCtrlClick(event){
        return this.props.isMultipleSelectionAllowed && event && event.ctrlKey;       
    },

    notifyActiveRows() {
        this.props.onActiveRowsChange(this.state.activeRows);
    },

    handleRowClick(event, rowSource) {
        //Update activeRows according to click|ctlr+click
        var newActiveRows;
        if(event.isIconMenuClick){
            newActiveRows = [rowSource];
        }else if (this.isEventCtrlClick(event) || this.isRowActive(rowSource)){
            //Remain selection + rowSource if not already selected
            newActiveRows = this.updateContextSelection(rowSource);                            
        }else{
            //Context click just selects current row
            newActiveRows =[rowSource];
        }
          
        //Update state        
        this.setState({
            contextMenuTarget: event.currentTarget,
            showContextMenu: true,
            activeRows: newActiveRows
        }, this.notifyActiveRows);       
    },
    
    handlePrimaryClick(event, rowSource) {        
        //Click -> Clears selection, Invoke external action (passing event)
        if(!this.isEventCtrlClick(event)){     
            this.setState({
                activeRows: []
            }, this.notifyActiveRows);            
            this.props.primaryAction(rowSource);
            return;
        }
        
        //Ctrl + Click -> Update selection
        const newActiveRows = this.updatePrimarySelection(rowSource);
        this.setState({
            activeRows:newActiveRows,
            showContextMenu: false,
        }, this.notifyActiveRows);
    },      
       
    _hideContextMenu() {
        this.setState({
            activeRows: [],         
            showContextMenu: false,
        }, this.notifyActiveRows);
    },    
    
    updateContextSelection(rowSource){
        return this.updateSelection(rowSource,true);        
    },
    
    updatePrimarySelection(rowSource){
        return this.updateSelection(rowSource, false);        
    },    
    
    updateSelection(rowSource, isContextClick){   
        const alreadySelected = this.isRowActive(rowSource);      
        
        //ctx click + Already selected -> Same selection
        if(isContextClick && alreadySelected){
            return this.state.activeRows
        }
                 
        //click + Already selected -> Remove from selection
        if(alreadySelected){
            return this.state.activeRows.filter((nRow) => nRow!==rowSource);                      
        }
        
        //!already selected -> Add to selection
        return update(this.state.activeRows?this.state.activeRows:[], {$push: [rowSource]});            
    }
});

export default MultipleDataTable;
