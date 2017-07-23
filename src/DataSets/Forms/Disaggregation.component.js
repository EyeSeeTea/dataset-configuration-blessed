import React, { PropTypes } from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import DataSetElementCategoryComboSelectionDialog from '../../forms/DataSetElementCategoryComboSelectionDialog.component';
import {getCategoryCombos, getCustomCategoryCombo} from '../../utils/Dhis2Helpers';

const Disaggregation = React.createClass({
    mixins: [Translate],

    propTypes: {
        validateOnRender: React.PropTypes.bool,
    },

    getInitialState() {
        return {
            categoryCombos: null,
        };
    },

    componentDidMount() {
        getCategoryCombos(this.context.d2)
            .then(categoryCombos => this.setState({categoryCombos: categoryCombos.toArray()}));
    },

    componentWillReceiveProps(props) {
        props.formStatus(true);
    },

    _onCategoryComboSelected(dataSetElementId, categoryCombo) {
        const {dataSetElements} = this.props.store.dataset;
        const dataSetElementToUpdate = _(dataSetElements).find(dse => dse.id == dataSetElementId);
        const {dataElement} = dataSetElementToUpdate;
        const customCategoryCombo =
            getCustomCategoryCombo(this.context.d2, dataElement, this.state.categoryCombos, categoryCombo);
        dataSetElementToUpdate.categoryCombo = customCategoryCombo;
        this.forceUpdate();
    },

    _renderForm() {
        const {dataSetElements} = this.props.store.dataset;
        const {categoryCombos} = this.state;

        return (
            <div>
                <DataSetElementCategoryComboSelectionDialog
                    dataSetElements={dataSetElements}
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