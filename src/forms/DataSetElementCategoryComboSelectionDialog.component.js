import React, { PropTypes } from 'react';
import withState from 'recompose/withState';
import withHandlers from 'recompose/withHandlers';
import compose from 'recompose/compose';
import getContext from 'recompose/getContext';
import IconButton from 'material-ui/IconButton/IconButton';
import BuildIcon from 'material-ui/svg-icons/action/build';
import Dialog from 'material-ui/Dialog/Dialog';
import FlatButton from 'material-ui/FlatButton/FlatButton';
import Column from 'd2-ui/lib/layout/Column.component';
import Row from 'd2-ui/lib/layout/Row.component';
import SelectField from 'material-ui/SelectField/SelectField';
import MenuItem from 'material-ui/MenuItem/MenuItem';
import { map, memoize } from 'lodash/fp';
import Translate from 'd2-ui/lib/i18n/Translate.component';
import { collectionToArray } from '../utils/Dhis2Helpers';

const enhance = compose(
    getContext({ d2: PropTypes.object }),
    withState('open', 'updateOpen', false),
    withHandlers({
        onRequestClose: props => () => {
            props.updateOpen(false);
        },
        onRequestOpen: props => () => {
            props.updateOpen(true);
        },
    })
);

const getCategoryOptions = (categoryCombo) =>
    !categoryCombo ? null : collectionToArray(categoryCombo.categories)
        .map(category => collectionToArray(category.categoryOptions).map(co => co.displayName).join(" - "))
        .join(" / ");

const getOptions = memoize(function (categoryCombos) {
    return categoryCombos.map(categoryCombo => {
        const {displayName, id} = categoryCombo;
        const categoryOptions = getCategoryOptions(categoryCombo);
        return (<MenuItem key={id} primaryText={displayName} value={id} title={categoryOptions} />);
    });
});

const enhanceCategoryComboSelectField = withHandlers({
        onChange: ({ categoryCombos = new Map, onChange }) => (event, index, value) => {
            onChange(categoryCombos.find(categoryCombo => categoryCombo.id === value));
        },
    });

const CategoryComboSelectField = enhanceCategoryComboSelectField(
    function CategoryComboSelectField({ categoryCombos, categoryCombo, onChange }) {
        const options = getOptions(categoryCombos)

        return (
            <span title={getCategoryOptions(categoryCombo)}>
                <SelectField
                    value={categoryCombo ? categoryCombo.id : null}
                    onChange={onChange}
                    fullWidth
                    floatingLabelText={<Translate>override_data_element_category_combo</Translate>}
                >
                    {options}
                </SelectField>
            </span>
        );
    }
);

const createGetCategoryCombosForSelect = (d2, categoryCombos) => {
    return memoize(dataElementCategoryCombo => {
        // Not in maintenance-app: show only category combos whose categories do not
        // intersect with the dataElement categories.
        const deCategoryIds = dataElementCategoryCombo.categories.map(category => category.id);
        const categoryCombosWithoutOverlap = categoryCombos.filter(categoryCombo => {
            const categoryIds = categoryCombo.categories.toArray().map(category => category.id);
            return (
                dataElementCategoryCombo.id == categoryCombo.id ||
                _(deCategoryIds).intersection(categoryIds).isEmpty()
            );
        });

        return categoryCombosWithoutOverlap
        .reduce((acc, categoryCombo) => {
            if (categoryCombo.id === dataElementCategoryCombo.id) {
                acc.unshift({
                    ...categoryCombo,
                    displayName: d2.i18n.getTranslation('no_override'),
                });
                return acc;
            }

            acc.push(categoryCombo);
            return acc;
        }, [])
        .filter(cc => !(
            cc.displayName !== d2.i18n.getTranslation('no_override') &&
            (cc.isDefault || collectionToArray(cc.categories).length > 1)
        ));
    });
};


function DataSetElementList({ dataSetElements, categoryCombos, onCategoryComboSelected }, { d2 }) {
    const styles = {
        elementListItem: {
            width: '49%',
        },

        noDataElementMessage: {
            paddingTop: '2rem',
        },

        originalCategoryCombo: {
            color: '#CCC',
            fontSize: '1rem',
            fontWeight: '300',
        },
    };

    const getCategoryCombosForSelect = createGetCategoryCombosForSelect(d2, categoryCombos);

    const dataSetElementsRows = dataSetElements
        .sort((left, right) => ((left.dataElement && left.dataElement.displayName || '').localeCompare(right.dataElement && right.dataElement.displayName)))
        .map(({ categoryCombo = {}, dataElement = {}, id }) => {
            const categoryCombosForSelect = getCategoryCombosForSelect(dataElement.categoryCombo);

            return (
                <Row key={id} style={{ alignItems: 'center' }}>
                    <div style={styles.elementListItem}>
                        <div>{dataElement.displayName}</div>
                        <div style={styles.originalCategoryCombo}>{dataElement.categoryCombo.displayName}</div>
                    </div>
                    <div style={styles.elementListItem}>
                        <CategoryComboSelectField
                            categoryCombos={categoryCombosForSelect}
                            categoryCombo={categoryCombo.source || categoryCombo}
                            onChange={(categoryCombo) => onCategoryComboSelected(id, categoryCombo)}
                        />
                    </div>
                </Row>
            )
        });

    if (dataSetElementsRows.length === 0) {
        return (
            <div style={styles.noDataElementMessage}>
                {d2.i18n.getTranslation('select_a_data_element_before_applying_an_override')}
            </div>
        );
    }

    return (
        <Column>
            {dataSetElementsRows}
        </Column>
    );
}

DataSetElementList.contextTypes = {
    d2: PropTypes.object,
}

export function DataSetElementCategoryComboSelection(props) {
    const {
        categoryCombos,
        dataSetElements,
        onCategoryComboSelected,
        d2: { i18n }
    } = props;

    const actions = [
        <FlatButton
            label={i18n.getTranslation('close')}
            primary={true}
            onTouchTap={props.onRequestClose}
        />,
    ];

    return (
        <div>
            <DataSetElementList
                dataSetElements={Array.from(dataSetElements || [])}
                categoryCombos={categoryCombos}
                onCategoryComboSelected={onCategoryComboSelected}
            />
        </div>
    );
}

export default enhance(DataSetElementCategoryComboSelection);
