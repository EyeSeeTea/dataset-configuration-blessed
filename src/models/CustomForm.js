import velocity from "velocityjs";
import htmlencode from "htmlencode";
import I18n from "d2/lib/i18n/I18n";
import _ from "../utils/lodash-mixins";
import { getCategoryCombo } from "../utils/Dhis2Helpers";

/* eslint import/no-webpack-loader-syntax: off */
import customFormTemplate from "!!raw-loader!./custom-form-resources/sectionForm.vm";
import customFormJs from "!!raw-loader!./custom-form-resources/script.js";
import customFormCss from "!!raw-loader!./custom-form-resources/style.css";

const data = {
    template: customFormTemplate,
    css: customFormCss,
    js: customFormJs,
};

const a = obj => (obj.toArray ? obj.toArray() : obj);
const _a = (...args) => _(a(...args));

class Map {
    constructor(obj) {
        this.obj = obj;
    }

    keys() {
        return Object.keys(this.obj).sort();
    }

    get(key) {
        if (this.obj[key] !== undefined) {
            return this.obj[key];
        } else {
            const keys = JSON.stringify(Object.keys(this.obj), null, 4);
            throw new Error(
                `[post-custom-form] No key ${JSON.stringify(key)} in object with keys: ${keys}`
            );
        }
    }

    getOr(key, defaultValue) {
        return this.obj[key] !== undefined ? this.obj[key] : defaultValue;
    }
}

const map = obj => new Map(obj);

const createViewDataElement = de => ({
    id: de.id,
    displayFormName: de.displayName,
    url: de.href,
    hasUrl: () => !!de.href,
    valueType: de.valueType,
    optionSet: de.optionSetValue,
    hasDescription: () => !!de.description,
    displayDescription: de.description,
});

const getVisibleOptionCombos = (greyedFields, optionCombos, dataElements) =>
    _a(optionCombos)
        .filter(coc => _a(dataElements).some(de => !greyedFields[`${de.id}.${coc.id}`]))
        .value();

const getGroupedItems = sections =>
    _a(sections)
        .map(section => {
            const groupedItemsForSection = _a(section.items)
                .values()
                .filter(item => item.selected)
                .groupByKeys(["theme", "group"], map)
                .value();
            return [section.id, groupedItemsForSection];
        })
        .fromPairs()
        .value();

const getKey = cos =>
    _a(cos)
        .map("id")
        .sortBy()
        .uniq()
        .join("-");

const getOrderedCategoryOptionCombos = categoryCombos =>
    _a(categoryCombos)
        .map(categoryCombo => {
            const categoryOptionsForCategories = _.cartesianProduct(
                ...a(categoryCombo.categories).map(category => a(category.categoryOptions))
            );
            const cocByCosKey = _.keyBy(a(categoryCombo.categoryOptionCombos), coc =>
                getKey(coc.categoryOptions)
            );
            const orderedCocs = a(categoryOptionsForCategories).map(
                cos => cocByCosKey[getKey(cos)]
            );

            return [categoryCombo.id, orderedCocs];
        })
        .fromPairs()
        .value();

// coc.categoryOptionCombo.categoryOptions return an unorder set, so it cannot be used to
// univocaly relate a coc with its categoryOptions. Use sets comparison.
const getHeaders = (categories, categoryOptionCombos) => {
    const categoryOptionsForCategories = a(categories).map(category => a(category.categoryOptions));
    const allCategoryOptions = _.cartesianProduct(...categoryOptionsForCategories);
    const categoryOptionsByCategoryOptionKey = _.keyBy(allCategoryOptions, getKey);

    return a(categories).map((category, catIndex) =>
        _a(categoryOptionCombos)
            .map(coc => categoryOptionsByCategoryOptionKey[getKey(coc.categoryOptions)])
            .groupConsecutiveBy(cos =>
                _a(cos)
                    .map(co => co.id)
                    .take(catIndex + 1)
                    .value()
            )
            .map(group => {
                const categoryOption = group[0][catIndex];
                return {
                    colSpan: group.length,
                    name: categoryOption.name,
                    displayName: categoryOption.displayName,
                };
            })
            .value()
    );
};

const getGreyedFields = dataset =>
    _a(dataset.sections)
        .flatMap(section => a(section.greyedFields))
        .map(field => [field.dataElement.id + "." + field.categoryOptionCombo.id, true])
        .fromPairs()
        .value();

const getRowTotalId = (dataElement, optionCombos) =>
    ["row", dataElement.id, ...a(optionCombos).map(coc => coc.id)].join("-");

const getContext = (d2, i18n, dataset, richSections, allCategoryCombos) => {
    const sections = richSections.filter(richSection =>
        _(richSection.items)
            .values()
            .some("selected")
    );
    const categoryComboByDataElementId = _a(dataset.dataSetElements)
        .map(dse => [dse.dataElement.id, getCategoryCombo(dse)])
        .fromPairs()
        .value();
    const categoryCombosId = _a(dataset.dataSetElements)
        .map(dse => getCategoryCombo(dse).id)
        .uniq()
        .value();
    const categoryCombos = _a(allCategoryCombos)
        .keyBy("id")
        .at(categoryCombosId)
        .value();
    const orderedCategoryOptionCombos = getOrderedCategoryOptionCombos(categoryCombos);
    const orderedCategories = _a(categoryCombos)
        .map(cc => [cc.id, cc.categories])
        .fromPairs()
        .value();
    const getDataElementsByCategoryCombo = dataElements =>
        _a(dataElements)
            .groupBy(de => categoryComboByDataElementId[de.id].id)
            .thru(map)
            .value();
    const getDataElementsByCategoryComboForIndicators = indicators =>
        _a(indicators)
            .flatMap("dataElements")
            .groupBy(de => categoryComboByDataElementId[de.id].id)
            .thru(map)
            .value();
    const greyedFields = getGreyedFields(dataset);

    return {
        helpers: {
            getDataElementsByCategoryCombo,
            getDataElementsByCategoryComboForIndicators,
            createViewDataElement,
            getHeaders,
            getVisibleOptionCombos: getVisibleOptionCombos.bind(null, greyedFields),
            getRowTotalId,
        },
        i18n: {
            getString: key => i18n.getTranslation(key),
        },
        encoder: {
            htmlEncode: htmlencode.htmlEncode,
        },
        auth: {
            // Used in automatic form, cannot be calculated for a static custom form, leave it as true
            hasAccess: (_app, _key) => true,
        },
        dataSet: {
            renderAsTabs: dataset.renderAsTabs,
            dataElementDecoration: dataset.dataElementDecoration,
        },
        sections: sections,
        groupedItems: map(getGroupedItems(sections)),
        orderedCategoryOptionCombos: map(orderedCategoryOptionCombos),
        orderedCategories: map(orderedCategories),
        greyedFields: map(greyedFields),
    };
};

// d2.i18n contains uiLocale translations, a custom form should use dbLocale translations.
const getI18n = d2 => {
    const { keyUiLocale, keyDbLocale } = d2.currentUser.settings;

    if (!keyDbLocale || keyDbLocale === keyUiLocale) {
        return Promise.resolve(d2.i18n);
    } else {
        const locales = _([keyDbLocale, "en"])
            .compact()
            .uniq()
            .value();
        const sources = locales.map(locale => `./i18n/i18n_module_${locale}.properties`);
        const i18n = new I18n(sources);
        return i18n.load().then(() => i18n);
    }
};

const get = async (d2, dataset, periodDates, sections, categoryCombos) => {
    const i18n = await getI18n(d2);
    const context = getContext(d2, i18n, dataset, sections, categoryCombos);
    const config = { env: "development", escape: false };
    const htmlForm = velocity.render(data.template, context, {}, config);

    return `
        <style>${data.css}</style>
        <script>
            ${data.js}
            setPeriodDates(${JSON.stringify(periodDates)});
        </script>
        ${htmlForm}
    `;
};

export default get;
