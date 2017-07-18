import React from 'react';
import DropDown from '../forms/form-fields/drop-down';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import {getCategoryCombos, collectionToArray} from '../utils/Dhis2Helpers';
import FormHelpers from './FormHelpers';
import {cartesianProduct, groupConsecutive} from '../utils/lodash-mixins';

const {SimpleCheckBox} = FormHelpers;

const styles = {
    table: {
        borderSpacing: 0,
        borderCollapse: 'collapse',
        margin: '0px',
    },
    th: {
        whiteSpace: 'nowrap',
        textAlign: 'center',
        border: '1px solid #e0e0e0',
        padding: 6,
    },
    thDataElements: {
        whiteSpace: 'nowrap',
        border: '1px solid #e0e0e0',
        background: '#f0f0f0',
        textAlign: 'left',
        padding: 6,
    },
    td: {
        whiteSpace: 'nowrap',
        padding: 2,
        border: '1px solid #e0e0e0',
        textAlign: 'center',
    },
    tdDataElement: {
        whiteSpace: 'nowrap',
        padding: 6,
        border: '1px solid #e0e0e0',
    },
};

class GreyFieldsTable extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            loaded: false,
            categories: [],
            categoryCombos: null,
            currentSection: null,
            currentCategoryCombo: null,
        };

        this.getTranslation = context.d2.i18n.getTranslation.bind(context.d2.i18n);
    }

    componentDidMount() {
        getCategoryCombos(this.context.d2).then(persistedCategoryCombos => {
            const categoryCombosById = _(this.props.dataSet.dataSetElements)
                    .map(dse => dse.categoryCombo)
                    .keyBy("id")
                    .merge(_.keyBy(persistedCategoryCombos.toArray(), "id"))
                    .value();
            const categoryCombos = _.values(categoryCombosById);
            const categoryOptionsByCocId =
                _(categoryCombos)
                    .flatMap(cc => cc.categoryOptionCombos.toArray()
                        .map(coc => [coc.id, coc.categoryOptions.toArray()]))
                    .fromPairs()
                    .value();
            // greyedFields: {"dataElementId.categoryOptionComboId": true | false}
            const greyedFields = _(this._sectionsMap(section => section.greyedFields))
                .map(gf => {
                    return [gf.dataElement, gf.categoryOptionCombo].map(o => o.id).join(".");
                })
                .map(fieldId => [fieldId, true])
                .fromPairs().value();
            const optionCount = _(categoryCombos)
                .map(cc => [cc.id, cc.categories.toArray().map(c => c.categoryOptions.size)])
                .fromPairs().value();

            const cocByCategoryOptionsKey = _(categoryCombosById)
                .values()
                .flatMap(cc => cc.categoryOptionCombos.toArray())
                .map(coc => [coc.categoryOptions.toArray().map(co => co.id).sort().join("."), coc])
                .fromPairs()
                .value();

            this.setState({
                loaded: true,
                categoryCombosById,
                cocByCategoryOptionsKey,
                optionCount,
                greyedFields,
            });
        });
    }

    _getGreyedFieldsBySections() {
        const {categoryCombosById} = this.state;
        const {sections} = this.props;
        const ids = _(this.state.greyedFields).map((v, k) => v ? k : null).compact().value();
        const greyedFields = ids.map(id => {
            const [dataElementId, cocId] = id.split(".");
            return {
                dataElement: {id: dataElementId},
                categoryOptionCombo: {id: cocId},
            };
        });
        const greyedFieldsByDataElementId =
            _(greyedFields).groupBy(field => field.dataElement.id).value();
        return sections.map(section => {
            const dataElementIds = section.dataElements.toArray().map(de => de.id);
            return _(greyedFieldsByDataElementId).at(dataElementIds).flatten().compact().value();
        });
    }

    componentWillUnmount() {
        if (this.props.onClose && this.state.loaded) {
            this.props.onClose(this._getGreyedFieldsBySections());
        }
    }

    _renderHeaderCheckBox(dataSetElements, categoryOptionCombo) {
        const fieldIds = _(dataSetElements)
            .map(dse => [dse.dataElement.id, categoryOptionCombo.id].join("."))
            .value();
        const allFieldsInColumnAreSelected = _(this.state.greyedFields).at(fieldIds).every(v => !v);
        const toggleAll = () => {
            const updatedGreyedFields = _(fieldIds)
                .map(fieldId => [fieldId, allFieldsInColumnAreSelected]).fromPairs().value();
            this.setState({
                greyedFields: _.merge(this.state.greyedFields, updatedGreyedFields),
            });
        };

        return (
            <SimpleCheckBox
                style={{marginRight: 5}}
                onClick={toggleAll}
                checked={allFieldsInColumnAreSelected}
            />
        );
    }

    renderTableHeader(dataSetElements, categoryComboId) {
        const categoryCombo = this.state.categoryCombosById[categoryComboId];
        const categoryOptionsArray = cartesianProduct(
            ...categoryCombo.categories.toArray().map(c => c.categoryOptions.toArray())
        );
        const rows = _.zip(...categoryOptionsArray);
        const cocsForLastRow = categoryOptionsArray
            .map(cos => cos.map(co => co.id).sort().join("."))
            .map(id => this.state.cocByCategoryOptionsKey[id]);

        return rows.map((row, rowNum) => {
            const grouped = groupConsecutive(row)
                .map(group => ({label: group[0].displayName, count: group.length}));
            const isLastHeader = rowNum === rows.length - 1;

            return (
                <tr key={rowNum}>
                    <th style={styles.thDataElements}>
                        {isLastHeader && this.getTranslation('data_element')}
                    </th>

                    {grouped.map(({label, count}, colNum) =>
                        <th key={[rowNum, colNum]}
                            colSpan={count}
                            style={styles.th}
                        >
                            {isLastHeader && dataSetElements.length > 1 &&
                                this._renderHeaderCheckBox(dataSetElements, cocsForLastRow[colNum])}
                            {label === 'default' ? '' : label}
                        </th>
                    )}
                </tr>
            );
        });
    }

    renderCheckbox(dataElement, categoryOptionCombo) {
        if (!dataElement || !categoryOptionCombo)
            return;
        const fieldId = [dataElement.id, categoryOptionCombo.id].join(".");
        const isGreyed = !!this.state.greyedFields[fieldId];
        const toggleBoggle = () => {
            this.setState({
                greyedFields: _.merge(this.state.greyedFields, {[fieldId]: !isGreyed}),
            });
        };

        return (
            <td key={fieldId} style={styles.td}>
                <SimpleCheckBox onClick={toggleBoggle} checked={!isGreyed} />
            </td>
        );
    }

    _getDataSetElements(categoryComboId) {
        const categoryCombo = this.state.categoryCombosById[categoryComboId];
        const currentSectionDataElementIds =
            this._sectionsMap(section => section.dataElements.toArray().map(de => de.id));

        return this.props.dataSet.dataSetElements
            .filter(dse =>
                currentSectionDataElementIds.includes(dse.dataElement.id))
            .filter(dse =>
                (dse.categoryCombo ? dse.categoryCombo.id : dse.dataElement.categoryCombo.id) === categoryCombo.id)
            .sort((a, b) =>
                currentSectionDataElementIds.indexOf(a.dataElement.id) - currentSectionDataElementIds.indexOf(b.dataElement.id));
    }

    renderDataElements(dataSetElements) {
        return dataSetElements
            .map((dse, deNum) => {
                const categoryOptionsArray = cartesianProduct(
                    ...collectionToArray(dse.categoryCombo.categories)
                        .map(cat => collectionToArray(cat.categoryOptions))
                );
                const {dataElement} = dse;
                return (
                    <tr key={deNum} style={{ background: deNum % 2 === 0 ? 'none' : '#f0f0f0' }}>
                        <td style={styles.tdDataElement}>{dataElement.displayName}</td>
                        {categoryOptionsArray.map(cos => this.renderCheckbox(dataElement,
                            this.state.cocByCategoryOptionsKey[cos.map(co => co.id).sort().join(".")]))}
                    </tr>
                );
            });
    }

    _sectionsMap(sectionMapper) {
        const {currentSection} = this.state;
        const sections = currentSection ? [currentSection] : this.props.sections;
        return _.flatMap(sections, sectionMapper);
    }

    _getCategoryComboLabel(categoryCombo) {
        if (categoryCombo) {
            return categoryCombo.displayName === "default" ?
                this.getTranslation("none") : categoryCombo.displayName;
        } else {
            return "";
        }
    }

    _renderForm() {
        const {currentCategoryCombo} = this.state;
        const sectionDataElementIds =
            new Set(this._sectionsMap(section => section.dataElements.toArray().map(de => de.id)));
        const categoryCombosForVisibleSections =
            _(this.props.dataSet.dataSetElements)
                .filter(dse => sectionDataElementIds.has(dse.dataElement.id))
                .map(dse => dse.categoryCombo)
                .uniqBy("id")
                .value();

        const categoryCombosToShow = currentCategoryCombo ?
            [currentCategoryCombo] : categoryCombosForVisibleSections;

        const renderTable = (categoryCombo) => {
            const dataSetElements = this._getDataSetElements(categoryCombo.id);

            return (
                <div key={categoryCombo.id}>
                    <h2>{this._getCategoryComboLabel(categoryCombo)}</h2>

                    <table style={styles.table}>
                        <tbody>
                            {this.renderTableHeader(dataSetElements, categoryCombo.id)}
                            {this.renderDataElements(dataSetElements)}
                        </tbody>
                    </table>
                </div>
            );
        };


        return (
            <div>
                <DropDown
                    options={this.props.sections.map(section =>
                        ({value: section.name, text: section.name}))}
                    labelText={this.getTranslation('section')}
                    value={this.state.currentSection && this.state.currentSection.name}
                    onChange={e => this.setState({
                        currentSection: _(this.props.sections).keyBy("name").get(e.target.value),
                    })}
                    style={{ width: '33%', marginRight: 20 }}
                />

                <DropDown
                    options={categoryCombosForVisibleSections.map(cc =>
                        ({value: cc.id, text: cc.displayName}))}
                    labelText={this.getTranslation('category_combo')}
                    value={currentCategoryCombo && currentCategoryCombo.id}
                    onChange={e => this.setState({
                        currentCategoryCombo:
                            _(categoryCombosForVisibleSections).keyBy("id").get(e.target.value),
                    })}
                    style={{ width: '33%' }}
                />

                {categoryCombosToShow.map(categoryCombo => renderTable(categoryCombo))}
            </div>
        );
    }

    render() {
        if (this.state.loaded) {
            return this._renderForm();
        } else {
            return (<LinearProgress />)
        }
    }
}

GreyFieldsTable.contextTypes = {d2: React.PropTypes.any.isRequired};

GreyFieldsTable.propTypes = {
    sections: React.PropTypes.any.isRequired,
    dataSet: React.PropTypes.any.isRequired,
    onClose: React.PropTypes.func,
};

export default GreyFieldsTable;
