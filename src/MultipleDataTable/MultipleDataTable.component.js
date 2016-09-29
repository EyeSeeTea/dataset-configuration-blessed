import isArrayOfStrings from 'd2-utilizr/lib/isArrayOfStrings';
import isIterable from 'd2-utilizr/lib/isIterable';
import React from 'react';
import update from 'react-addons-update';
import MultipleDataTableRow from './MultipleDataTableRow.component';
import DataTableHeader from 'd2-ui/lib/data-table/DataTableHeader.component';
import MultipleDataTableContextMenu from './MultipleDataTableContextMenu.component';

const MultipleDataTable = React.createClass({
    propTypes: {
        contextMenuActions: React.PropTypes.object,
        contextMenuIcons: React.PropTypes.object,
        primaryAction: React.PropTypes.func,
        isContextActionAllowed: React.PropTypes.func,
        isMultipleSelectionAllowed: React.PropTypes.bool
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
            columns: isArrayOfStrings(props.columns) ? props.columns : ['name', 'lastUpdated'],
            dataRows
        };
    },

    renderContextMenu() {
        const actionAccessChecker = (this.props.isContextActionAllowed && this.props.isContextActionAllowed.bind(null, this.state.activeRow)) || (() => true);

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
                    activeItem={this.state.activeRow}
                    activeItems={this.state.activeRows}
                    icons={this.props.contextMenuIcons}
                />
        );
    },

    renderHeaders() {
        return this.state.columns.map((headerName, index) => {
            return (
                <DataTableHeader key={index} isOdd={Boolean(index % 2)} name={headerName} />
            );
        });
    },

    renderRows() {
        console.log("MultipleDataTable.renderRows");
        return this.state.dataRows
            .map((dataRowsSource, dataRowsId) => {
                return (
                    <MultipleDataTableRow
                        key={dataRowsId}
                        dataSource={dataRowsSource}
                        columns={this.state.columns}
                        isActive={this.isRowActive(dataRowsSource)}
                        
                        itemClicked={this.handleRowClick}
                        primaryClick={this.handlePrimaryClick}                                                                     
                    />
                );
            });
    },
    
    isRowActive(dataRowsSource){                
        if(!this.state.activeRows){
            return false;
        }
        for (var i=0;i<this.state.activeRows.length;i++) {
            const dataRow = this.state.activeRows[i];
            if(dataRow === dataRowsSource){
                console.log("MultipleDataTable.isRowActive: "+dataRowsSource.name+" -> true");
                return true;
            }              
        }        
        return false;
    },
    
    isEventCtrlClick(event){
        return this.props.isMultipleSelectionAllowed && event && event.ctrlKey;       
    },

    render() {
        console.log("MultipleDataTable.render");
        return (
           <div className="data-table">
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

    handleRowClick(event, rowSource) {
        //Update activeRows according to click|ctlr+click
        var newActiveRows;
        //A click on itemMenu clears selection        
        if(event.isIconMenuClick){
            newActiveRows = [];
        }else{
            //[Add to|Remove from] selection according to current state
            newActiveRows =this.isEventCtrlClick(event)?this.updateSelection(rowSource):this.state.activeRows;    
        }
          
        //Update state        
        this.setState({
            contextMenuTarget: event.currentTarget,
            showContextMenu: true,
            activeRows: newActiveRows,
            activeRow: rowSource !== this.state.activeRow ? rowSource : undefined,
        });       
    },
    
    handlePrimaryClick(event, rowSource) {        
        //Click -> Clears selection, Invoke external action (passing event)
        if(!this.isEventCtrlClick(event)){     
            this.setState({
                activeRows: []
            });            
            this.props.primaryAction(rowSource);
            return;
        }
        
        //Ctrl + Click -> Update selection
        const newActiveRows = this.updateSelection(rowSource);
        this.setState({
            activeRows:newActiveRows
        });
    },      
       
    _hideContextMenu() {
        this.setState({
            activeRow: undefined,            
            showContextMenu: false,
        });
    },    
    
    updateSelection(rowSource){        
        //Already selected ->Remove from selection         
        if(this.isRowActive(rowSource)){
            return this.state.activeRows.filter((nRow) => nRow!==rowSource);                      
        }
        
        //Add to selection
        return update(this.state.activeRows?this.state.activeRows:[], {$push: [rowSource]});            
    }
});

export default MultipleDataTable;
