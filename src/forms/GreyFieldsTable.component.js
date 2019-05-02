import React from "react";
import DropDown from "../forms/form-fields/drop-down";
import LinearProgress from "material-ui/LinearProgress/LinearProgress";
import { getCategoryCombos, getCategoryCombo } from "../utils/Dhis2Helpers";
import FormHelpers from "./FormHelpers";
import _ from "../utils/lodash-mixins";

const { SimpleCheckBox } = FormHelpers;

const styles = {
    table: {
        borderSpacing: 0,
        borderCollapse: "collapse",
        margin: "5px 0px",
    },
    th: {
        whiteSpace: "nowrap",
        textAlign: "center",
        border: "1px solid #e0e0e0",
        padding: 6,
    },
    thDataElements: {
        whiteSpace: "nowrap",
        border: "1px solid #e0e0e0",
        background: "#f0f0f0",
        textAlign: "left",
        padding: 6,
    },
    td: {
        whiteSpace: "nowrap",
        padding: 2,
        border: "1px solid #e0e0e0",
        textAlign: "center",
    },
    tdDataElement: {
        whiteSpace: "nowrap",
        padding: 6,
        border: "1px solid #e0e0e0",
        maxWidth: "33vw",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
};

// Return the key to use in structure cocByCategoryKey
const getKey = (categoryCombo, categoryOptions) => {
    // categoryOptionCombo.categoryOptions holds non-repeated IDs, in any order
    const sortedUniqueIds = _(categoryOptions)
        .map("id")
        .orderBy()
        .uniq()
        .value();
    return [categoryCombo.id, ...sortedUniqueIds].join(".");
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
        const d2 = this.context.d2;
        const cocFields = "id,categoryOptions[id]";

        const categoryComboIds = _(this.props.dataSet.dataSetElements)
            .map(dse => getCategoryCombo(dse).id)
            .uniq()
            .value();
        const options = { cocFields, filterIds: categoryComboIds };

        getCategoryCombos(d2, options).then(persistedCategoryCombos => {
            const categoryCombosById = _(this.props.dataSet.dataSetElements)
                .map(dse => getCategoryCombo(dse))
                .keyBy("id")
                .merge(_.keyBy(persistedCategoryCombos.toArray(), "id"))
                .value();

            // greyedFields: {"dataElementId.categoryOptionComboId": true | false}
            const greyedFields = _(this._sectionsMap(section => section.greyedFields))
                .map(gf => [gf.dataElement, gf.categoryOptionCombo].map(o => o.id).join("."))
                .map(fieldId => [fieldId, true])
                .fromPairs()
                .value();
            const cocByCategoryKey = _(categoryCombosById)
                .values()
                .flatMap(cc =>
                    cc.categoryOptionCombos
                        .toArray()
                        .map(coc => [getKey(cc, coc.categoryOptions.toArray()), coc])
                )
                .fromPairs()
                .value();

            this.setState({
                loaded: true,
                categoryCombosById,
                cocByCategoryKey,
                greyedFields,
            });
        });
    }

    _getGreyedFieldsBySections() {
        const { sections } = this.props;
        const ids = _(this.state.greyedFields)
            .map((v, k) => (v ? k : null))
            .compact()
            .value();
        const greyedFields = ids.map(id => {
            const [dataElementId, cocId] = id.split(".");
            return {
                dataElement: { id: dataElementId },
                categoryOptionCombo: { id: cocId },
            };
        });
        const greyedFieldsByDataElementId = _(greyedFields)
            .groupBy(field => field.dataElement.id)
            .value();
        return sections.map(section => {
            const dataElementIds = section.dataElements.toArray().map(de => de.id);
            return _(greyedFieldsByDataElementId)
                .at(dataElementIds)
                .flatten()
                .compact()
                .value();
        });
    }

    componentWillUnmount() {
        if (this.props.onClose && this.state.loaded) {
            this.props.onClose(this._getGreyedFieldsBySections());
        }
    }

    _renderHeaderCheckBox(label, dataSetElements, categoryOptionCombos) {
        const fieldIds = _(dataSetElements)
            .cartesianProduct(categoryOptionCombos)
            .flatMap(([dse, coc]) => [dse.dataElement.id, coc.id].join("."))
            .value();
        const allFieldsInColumnAreSelected = _(this.state.greyedFields)
            .at(fieldIds)
            .every(v => !v);
        const toggleAll = () => {
            const updatedGreyedFields = _(fieldIds)
                .map(fieldId => [fieldId, allFieldsInColumnAreSelected])
                .fromPairs()
                .value();
            this.setState({
                greyedFields: _.merge(this.state.greyedFields, updatedGreyedFields),
            });
        };

        return (
            <div onClick={toggleAll}>
                {(dataSetElements.length > 1 || categoryOptionCombos.length > 1) && (
                    <SimpleCheckBox
                        style={{ marginRight: 5 }}
                        checked={allFieldsInColumnAreSelected}
                    />
                )}
                {label === "default" ? "" : label}
            </div>
        );
    }

    _getCategoryOptionCombos(categoryComboId) {
        const categoryCombo = this.state.categoryCombosById[categoryComboId];
        const categories = categoryCombo.categories.toArray();
        const categoryOptions = categories.map(c => c.categoryOptions.toArray());
        return _.cartesianProduct(...categoryOptions);
    }

    renderTableHeader(dataSetElements, categoryCombo, categoryOptionCombos) {
        const nCategories = categoryOptionCombos[0].length;
        const rows = _.range(nCategories).map(idx => {
            return _(categoryOptionCombos)
                .groupConsecutiveBy(product => product.slice(0, idx + 1))
                .map(consecutiveProducts => {
                    const cocs = consecutiveProducts
                        .map(cos => getKey(categoryCombo, cos))
                        .map(key => this.state.cocByCategoryKey[key]);
                    return {
                        label: consecutiveProducts[0][idx].displayName,
                        cocs: _.compact(cocs),
                    };
                })
                .value();
        });

        return rows.map((row, rowNum) => {
            const isLastHeader = rowNum === rows.length - 1;

            return (
                <tr key={rowNum}>
                    <th style={styles.thDataElements}>
                        {isLastHeader && this.getTranslation("data_element")}
                    </th>

                    {row.map(({ label, cocs }, colNum) => (
                        <th key={[rowNum, colNum]} colSpan={cocs.length} style={styles.th}>
                            {this._renderHeaderCheckBox(label, dataSetElements, cocs)}
                        </th>
                    ))}
                </tr>
            );
        });
    }

    renderCheckbox(dataSetElement, categoryOptions) {
        const { dataElement } = dataSetElement;
        const key = getKey(getCategoryCombo(dataSetElement), categoryOptions);
        const categoryOptionCombo = this.state.cocByCategoryKey[key];
        if (!dataElement || !categoryOptionCombo) return;

        const fieldId = [dataElement.id, categoryOptionCombo.id].join(".");
        const isGreyed = !!this.state.greyedFields[fieldId];
        const toggleBoggle = () => {
            this.setState({
                greyedFields: _.merge(this.state.greyedFields, { [fieldId]: !isGreyed }),
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
        const currentSectionDataElementIds = this._sectionsMap(section =>
            section.dataElements.toArray().map(de => de.id)
        );

        return this.props.dataSet.dataSetElements
            .filter(dse => currentSectionDataElementIds.includes(dse.dataElement.id))
            .filter(dse => getCategoryCombo(dse).id === categoryCombo.id)
            .sort(
                (a, b) =>
                    currentSectionDataElementIds.indexOf(a.dataElement.id) -
                    currentSectionDataElementIds.indexOf(b.dataElement.id)
            );
    }

    renderDataElements(dataSetElements, categoryOptionCombos) {
        return dataSetElements.map((dse, deNum) => {
            return (
                <tr key={deNum} style={{ background: deNum % 2 === 0 ? "none" : "#f0f0f0" }}>
                    <td title={dse.dataElement.displayName} style={styles.tdDataElement}>
                        {dse.dataElement.displayName}
                    </td>
                    {categoryOptionCombos.map(cos => this.renderCheckbox(dse, cos))}
                </tr>
            );
        });
    }

    _sectionsMap(sectionMapper) {
        const { currentSection } = this.state;
        const sections = currentSection ? [currentSection] : this.props.sections;
        return _.flatMap(sections, sectionMapper);
    }

    _getCategoryComboLabel(categoryCombo) {
        if (categoryCombo) {
            return categoryCombo.displayName === "default"
                ? this.getTranslation("none")
                : categoryCombo.displayName;
        } else {
            return "";
        }
    }

    _renderForm() {
        const { currentCategoryCombo } = this.state;
        const sectionDataElementIds = new Set(
            this._sectionsMap(section => section.dataElements.toArray().map(de => de.id))
        );
        const categoryCombosForVisibleSections = _(this.props.dataSet.dataSetElements)
            .filter(dse => sectionDataElementIds.has(dse.dataElement.id))
            .map(dse => getCategoryCombo(dse))
            .uniqBy("id")
            .sortBy("displayName")
            .value();

        const categoryCombosToShow = currentCategoryCombo
            ? [currentCategoryCombo]
            : categoryCombosForVisibleSections;

        const renderTable = (categoryCombo, cocs) => {
            const dataSetElements = this._getDataSetElements(categoryCombo.id);
            const key = [categoryCombo, ..._.flatten(cocs)].map(x => x.id).join("-");

            return (
                <table key={key} style={styles.table}>
                    <tbody>
                        {this.renderTableHeader(dataSetElements, categoryCombo, cocs)}
                        {this.renderDataElements(dataSetElements, cocs)}
                    </tbody>
                </table>
            );
        };

        const renderTablesForCocs = (categoryCombo, cocs, categoryIndex) => {
            const nCategories = cocs[0].length;
            if (cocs.length <= 12 || categoryIndex >= nCategories - 1) {
                return renderTable(categoryCombo, cocs);
            } else {
                const tables = _(cocs)
                    .groupConsecutiveBy(cos => cos.slice(0, categoryIndex + 1))
                    .flatMap(splitCocs =>
                        renderTablesForCocs(categoryCombo, splitCocs, categoryIndex + 1)
                    )
                    .value();
                const key =
                    categoryCombo.id +
                    _(cocs)
                        .flatten()
                        .map("id")
                        .join("");
                return <div key={key}>{tables}</div>;
            }
        };

        const renderTables = categoryCombo => {
            const cocs = this._getCategoryOptionCombos(categoryCombo.id);
            return (
                <div key={categoryCombo.id}>
                    <h2>{this._getCategoryComboLabel(categoryCombo)}</h2>
                    {renderTablesForCocs(categoryCombo, cocs, 0)}
                </div>
            );
        };

        const changeSection = ev => {
            this.setState({
                currentSection: _(this.props.sections)
                    .keyBy("name")
                    .get(ev.target.value),
                currentCategoryCombo: null,
            });
        };

        const changeCategoryCombo = ev => {
            this.setState({
                currentCategoryCombo: _(categoryCombosForVisibleSections)
                    .keyBy("id")
                    .get(ev.target.value),
            });
        };

        return (
            <div>
                <DropDown
                    options={this.props.sections.map(section => ({
                        value: section.name,
                        text: section.name.replace("@", "->"),
                    }))}
                    labelText={this.getTranslation("section")}
                    value={this.state.currentSection && this.state.currentSection.name}
                    onChange={changeSection}
                    style={{ width: "33%", marginRight: 20 }}
                />

                <DropDown
                    options={categoryCombosForVisibleSections.map(cc => ({
                        value: cc.id,
                        text: cc.displayName,
                    }))}
                    labelText={this.getTranslation("category_combo")}
                    value={currentCategoryCombo && currentCategoryCombo.id}
                    onChange={changeCategoryCombo}
                    style={{ width: "33%" }}
                />

                {categoryCombosToShow.map(categoryCombo => renderTables(categoryCombo))}
            </div>
        );
    }

    render() {
        if (this.state.loaded) {
            return this._renderForm();
        } else {
            return <LinearProgress />;
        }
    }
}

GreyFieldsTable.contextTypes = { d2: React.PropTypes.any.isRequired };

GreyFieldsTable.propTypes = {
    sections: React.PropTypes.any.isRequired,
    dataSet: React.PropTypes.any.isRequired,
    onClose: React.PropTypes.func,
};

export default GreyFieldsTable;
