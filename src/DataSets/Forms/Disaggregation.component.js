import React from "react";
import _ from "lodash";
import Translate from "d2-ui/lib/i18n/Translate.mixin";
import ObserverRegistry from "../../utils/ObserverRegistry.mixin";
import LinearProgress from "material-ui/LinearProgress/LinearProgress";
import DataSetElementCategoryComboSelectionDialog from "../../forms/DataSetElementCategoryComboSelectionDialog.component";
import { getCategoryCombos, getDisaggregationForCategories } from "../../utils/Dhis2Helpers";
import SearchBox from "../../SearchBox/SearchBox.component";
import { getSections } from "../../models/Section";

const SearchBoxWrapper = props => {
    const { debounce, onChange } = props;

    const wrapperStyle = {
        display: "inline-block",
        width: "40%",
        position: "relative",
        margin: "5px 0px",
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
            dataSetElementsGroups: null,
            filter: "",
        };
    },

    async componentDidMount() {
        Promise.all([getCategoryCombos(this.context.d2), this._getDataSetElementsGroups()]).then(
            ([categoryCombos, dataSetElementsGroups]) => {
                this.setState({
                    categoryCombos: categoryCombos.toArray(),
                    dataSetElementsGroups,
                });
            }
        );
    },

    componentWillReceiveProps(props) {
        if (props.validateOnRender) props.formStatus(true);
    },

    async _getDataSetElementsGroups() {
        const { d2 } = this.context;
        const { config } = this.props;
        const { dataset, associations } = this.props.store;
        const { coreCompetencies: ccs, initialCoreCompetencies: initialCcs } = associations;
        const sections = await getSections(d2, config, dataset, initialCcs, ccs);

        const indicatorIdsByDeId = _(sections)
            .flatMap(section => _.values(section.items))
            .filter(item => item.type === "indicator")
            .flatMap(indItem => indItem.dataElementsNumeric.map(de => [de.id, indItem.id]))
            .fromPairs()
            .value();

        return _(dataset.dataSetElements)
            .groupBy(dse => indicatorIdsByDeId[dse.dataElement.id] || `de-${dse.dataElement.id}`)
            .values()
            .sortBy(dseGroup => dseGroup[0].dataElement.displayName)
            .value();
    },

    _onCategoriesSelected(dataSetElementIds, categories) {
        const { d2 } = this.context;
        const { dataSetElements } = this.props.store.dataset;
        const { categoryCombos } = this.state;

        _(dataSetElementIds).each(dseId => {
            const dataSetElementToUpdate = _(dataSetElements).find(dse => dse.id === dseId);
            const customCategoryCombo = getDisaggregationForCategories(
                d2,
                dataSetElementToUpdate.dataElement,
                categoryCombos,
                categories
            );
            dataSetElementToUpdate.categoryCombo = customCategoryCombo;
        });

        this.forceUpdate();
    },

    _onSearchChange(searchObserver) {
        this.registerDisposable(searchObserver.subscribe(s => this.setState({ filter: s })));
    },

    _renderForm() {
        const d2 = this.context.d2;
        const { categoryCombos, filter, dataSetElementsGroups } = this.state;
        const isSubstring = (s1, s2) => _.includes(s1.toLowerCase(), s2.toLowerCase());
        const canEdit = d2.currentUser.canCreate(d2.models.categoryCombos);
        const dataSetElementsGroupsFiltered = filter
            ? dataSetElementsGroups.filter(dseGroup =>
                  dseGroup.some(dse => isSubstring(dse.dataElement.displayName, filter))
              )
            : dataSetElementsGroups;

        return (
            <div>
                {canEdit ? null : (
                    <p>
                        <b>{this.getTranslation("cannot_disaggregate")}</b>
                    </p>
                )}

                <SearchBoxWrapper onChange={this._onSearchChange} />

                <DataSetElementCategoryComboSelectionDialog
                    dataSetElementsGroups={dataSetElementsGroupsFiltered}
                    categoryCombos={categoryCombos}
                    onCategoriesSelected={this._onCategoriesSelected}
                    d2={d2}
                    canEdit={canEdit}
                />
            </div>
        );
    },

    render() {
        return !this.state.categoryCombos || !this.state.dataSetElementsGroups ? (
            <LinearProgress />
        ) : (
            <div>{this._renderForm()}</div>
        );
    },
});

export default Disaggregation;
