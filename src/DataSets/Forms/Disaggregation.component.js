import React, { PropTypes } from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import ObserverRegistry from '../../utils/ObserverRegistry.mixin';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import DataSetElementCategoryComboSelectionDialog from '../../forms/DataSetElementCategoryComboSelectionDialog.component';
import {getCategoryCombos, getDisaggregationCategoryCombo} from '../../utils/Dhis2Helpers';
import SearchBox from '../../SearchBox/SearchBox.component';

const SearchBoxWrapper = (props) => {
    const {debounce, onChange} = props;

    const wrapperStyle = {
        display: 'inline-block',
        width: '40%',
        position: 'relative',
        margin: '5px 0px'
    };

    return (
        <div style={wrapperStyle}>
            <SearchBox searchObserverHandler={onChange} debounce={debounce || 50} />
        </div>
    );
};

const Disaggregation = React.createClass({
    mixins: [Translate, ObserverRegistry],

    propTypes: {
        validateOnRender: React.PropTypes.bool,
    },

    getInitialState() {
        return {
            categoryCombos: null,
            filter: "",
        };
    },

    componentDidMount() {
        getCategoryCombos(this.context.d2).then(categoryCombos => {
            this.setState({
                categoryCombos: categoryCombos.toArray(),
            });
        });
    },

    componentWillReceiveProps(props) {
        props.formStatus(true);
    },

    _onCategoryComboSelected(dataSetElementId, categoryCombo) {
        const {dataSetElements} = this.props.store.dataset;
        const dataSetElementToUpdate = _(dataSetElements).find(dse => dse.id == dataSetElementId);
        const {dataElement} = dataSetElementToUpdate;
        const customCategoryCombo =
            getDisaggregationCategoryCombo(this.context.d2, dataElement, this.state.categoryCombos, categoryCombo);
        dataSetElementToUpdate.categoryCombo = customCategoryCombo;
        this.forceUpdate();
    },

    _onSearchChange(searchObserver) {
        this.registerDisposable(searchObserver.subscribe(s => this.setState({filter: s})));
    },

    _renderForm() {
        const {dataSetElements} = this.props.store.dataset;
        const {categoryCombos, filter} = this.state;
        const isSubstring = (s1, s2) => _.includes(s1.toLowerCase(), s2.toLowerCase());
        const filteredDataSetElements = dataSetElements
            .filter(dse => !filter || isSubstring(dse.dataElement.displayName, filter));

        return (
            <div>
                <SearchBoxWrapper onChange={this._onSearchChange} />

                <DataSetElementCategoryComboSelectionDialog
                    dataSetElements={filteredDataSetElements}
                    categoryCombos={categoryCombos}
                    onCategoryComboSelected={this._onCategoryComboSelected}
                    d2={this.context.d2}
                />
            </div>
        );
    },

    render() {
        return !this.state.categoryCombos ? <LinearProgress /> :
            <div>{this._renderForm()}</div>;
    },
});


export default Disaggregation;