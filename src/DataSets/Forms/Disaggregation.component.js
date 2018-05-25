import React, { PropTypes } from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import ObserverRegistry from '../../utils/ObserverRegistry.mixin';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import DataSetElementCategoryComboSelectionDialog from '../../forms/DataSetElementCategoryComboSelectionDialog.component';
import {getCategoryCombos, getDisaggregationForCategories} from '../../utils/Dhis2Helpers';
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
        if (props.validateOnRender)
            props.formStatus(true);
    },

    _onCategoriesSelected(dataSetElementId, categories) {
        const {dataSetElements} = this.props.store.dataset;
        const dataSetElementToUpdate = _(dataSetElements).find(dse => dse.id == dataSetElementId);
        const {dataElement} = dataSetElementToUpdate;
        const customCategoryCombo =
            getDisaggregationForCategories(this.context.d2, dataElement, this.state.categoryCombos, categories);
        dataSetElementToUpdate.categoryCombo = customCategoryCombo;
        this.forceUpdate();
    },

    _onSearchChange(searchObserver) {
        this.registerDisposable(searchObserver.subscribe(s => this.setState({filter: s})));
    },

    _renderForm() {
        const d2 = this.context.d2;
        const {dataSetElements} = this.props.store.dataset;
        const {categoryCombos, filter} = this.state;
        const isSubstring = (s1, s2) => _.includes(s1.toLowerCase(), s2.toLowerCase());
        const filteredDataSetElements = dataSetElements
            .filter(dse => !filter || isSubstring(dse.dataElement.displayName, filter));
        const canEdit = d2.currentUser.canCreate(d2.models.categoryCombos);

        return (
            <div>
                {canEdit ? null : <p><b>{this.getTranslation("cannot_disaggregate")}</b></p>}

                <SearchBoxWrapper onChange={this._onSearchChange} />

                <DataSetElementCategoryComboSelectionDialog
                    dataSetElements={filteredDataSetElements}
                    categoryCombos={categoryCombos}
                    onCategoriesSelected={this._onCategoriesSelected}
                    d2={d2}
                    canEdit={canEdit}
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
