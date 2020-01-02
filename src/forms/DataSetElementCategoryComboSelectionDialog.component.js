import React from "react";
import PropTypes from "prop-types";
import withState from "recompose/withState";
import withHandlers from "recompose/withHandlers";
import compose from "recompose/compose";
import getContext from "recompose/getContext";
import Column from "d2-ui/lib/layout/Column.component";
import Row from "d2-ui/lib/layout/Row.component";
import SelectField from "material-ui/SelectField/SelectField";
import MenuItem from "material-ui/MenuItem/MenuItem";
import Translate from "d2-ui/lib/i18n/Translate.component";
import { collectionToArray } from "../utils/Dhis2Helpers";
import _ from "lodash";

const enhance = compose(
    getContext({ d2: PropTypes.object }),
    withState("open", "updateOpen", false),
    withHandlers({
        onRequestClose: props => () => {
            props.updateOpen(false);
        },
        onRequestOpen: props => () => {
            props.updateOpen(true);
        },
    })
);

const getCategoryOptions = categoryCombo => {
    if (!categoryCombo || categoryCombo.isDefault) {
        return "";
    } else {
        return collectionToArray(categoryCombo.categories)
            .map(category =>
                collectionToArray(category.categoryOptions)
                    .map(co => co.displayName)
                    .join(" - ")
            )
            .join(" / ");
    }
};

const getOptions = (selectableCategories, selectedCategories) => {
    const selectedCategoryIds = new Set(selectedCategories.map(cat => cat.id));

    return selectableCategories.map(category => {
        const { displayName, id } = category;
        const categoryOptions = collectionToArray(category.categoryOptions)
            .map(co => co.displayName)
            .join(" - ");
        const checked = selectedCategoryIds.has(category.id);

        return (
            <MenuItem
                key={id}
                insetChildren={true}
                checked={checked}
                primaryText={displayName}
                value={id}
                title={categoryOptions}
            />
        );
    });
};

const CategoriesSelectField = ({
    hintText,
    selectableCategories,
    selectedCategories,
    onChange,
}) => {
    const options = getOptions(selectableCategories, selectedCategories);
    const title = _(selectedCategories)
        .map("displayName")
        .sortBy()
        .join(" / ");
    const selectableCategoriesById = _.keyBy(selectableCategories, "id");
    const onChangeSelect = (event, index, categoryIds) =>
        onChange(_.at(selectableCategoriesById, categoryIds));
    const selectionRenderer = categoryIds => {
        return _(selectableCategoriesById)
            .at(categoryIds)
            .map(category => category.displayName)
            .join(", ");
    };

    return (
        <SelectField
            multiple={true}
            hintText={hintText}
            value={selectedCategories.map(cat => cat.id)}
            title={title}
            onChange={onChangeSelect}
            fullWidth={true}
            selectionRenderer={selectionRenderer}
            floatingLabelText={<Translate>override_data_element_category_combo</Translate>}
        >
            {options}
        </SelectField>
    );
};

function DataSetElementList(
    { dataSetElementsGroups, categoryCombos, onCategoriesSelected, canEdit },
    { d2 }
) {
    const styles = {
        elementListItem: { width: "49%" },
        elementListItemDataElement: { width: "49%", marginTop: "2.5%" },
        noDataElementMessage: { paddingTop: "2rem" },
        originalCategoryCombo: { color: "#CCC", fontSize: "1rem", fontWeight: "300" },
    };
    const categoryCombosById = _.keyBy(categoryCombos, "id");
    const toArray = collectionToArray;
    const categories = _(categoryCombos)
        .filter(cc => !cc.isDefault)
        .flatMap(cc => collectionToArray(cc.categories))
        .uniqBy("id")
        .sortBy("displayName")
        .value();

    const dataSetElementsRows = _.flatMap(dataSetElementsGroups, dseGroup => {
        const { categoryCombo = {}, dataElement = {} } = dseGroup[0];
        const dseIds = dseGroup.map(dse => dse.id);
        const dataElementCategoryIds = new Set(
            toArray(dataElement.categoryCombo.categories).map(cat => cat.id)
        );
        const selectableCategories = categories.filter(
            category => !dataElementCategoryIds.has(category.id)
        );
        const selectedCategories = _.differenceBy(
            toArray(categoryCombo.categories),
            toArray(dataElement.categoryCombo.categories),
            "id"
        );
        const categoryOptions = getCategoryOptions(
            categoryCombosById[dataElement.categoryCombo.id]
        );

        return (
            <Row
                key={dataElement.id}
                style={{ alignItems: "center", marginBottom: canEdit ? 0 : 10 }}
            >
                <div style={styles.elementListItemDataElement}>
                    {dseGroup.map(dse => (
                        <div key={dse.dataElement.id}>{dse.dataElement.displayName}</div>
                    ))}
                    <span title={categoryOptions} style={styles.originalCategoryCombo}>
                        {dataElement.categoryCombo.displayName}
                    </span>
                </div>

                {canEdit ? (
                    <div style={styles.elementListItem}>
                        <CategoriesSelectField
                            hintText={d2.i18n.getTranslation("no_override")}
                            selectableCategories={selectableCategories}
                            selectedCategories={selectedCategories}
                            onChange={categories => onCategoriesSelected(dseIds, categories)}
                        />
                    </div>
                ) : (
                    <div />
                )}
            </Row>
        );
    });

    if (dataSetElementsRows.length === 0) {
        return (
            <div style={styles.noDataElementMessage}>
                {d2.i18n.getTranslation("select_a_data_element_before_applying_an_override")}
            </div>
        );
    } else {
        return <Column>{dataSetElementsRows}</Column>;
    }
}

DataSetElementList.contextTypes = {
    d2: PropTypes.object,
};

export function DataSetElementCategoryComboSelection(props) {
    const { categoryCombos, dataSetElementsGroups, onCategoriesSelected, canEdit } = props;

    return (
        <div>
            <DataSetElementList
                dataSetElementsGroups={dataSetElementsGroups}
                categoryCombos={categoryCombos}
                onCategoriesSelected={onCategoriesSelected}
                canEdit={canEdit}
            />
        </div>
    );
}

export default enhance(DataSetElementCategoryComboSelection);
