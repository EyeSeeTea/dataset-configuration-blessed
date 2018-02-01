import velocity from 'velocityjs';
import htmlencode from 'htmlencode';
import _ from '../utils/lodash-mixins';

const a = (obj) => obj.toArray ? obj.toArray() : obj;
const _a = (...args) => _(a(...args));

const map = (obj) => ({
  keys() {
    return Object.keys(obj);
  },

  get(key) {
    if (obj[key] !== undefined)
      return obj[key];
    else
      throw new Error("[post-custom-form] Unknown key: " +
        JSON.stringify(key) + " on object key with keys: " + JSON.stringify(Object.keys(obj), null, 4) + "\n");
  },

  getOr(key, defaultValue) {
    return obj[key] !== undefined ? obj[key] : defaultValue;
  },
});

const createViewDataElement = (de) => ({
  id: de.id,
  displayFormName: de.name,
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

const getGroupedItems = (sections) =>
  _a(sections)
    .map(section => {
      const groupedItemsForSection = _a(section.items).values()
        .filter(item => item.selected).groupByKeys(["theme", "group"], map).value();
      return [section.id, groupedItemsForSection];
    })
    .fromPairs()
    .value();

const getOrderedCategoryOptionCombos  = (categoryCombos) =>
  _a(categoryCombos)
      .map(categoryCombo => {
        const orderedCatOptsIds = _.cartesianProduct(
          ...a(categoryCombo.categories).map(cat => a(cat.categoryOptions).map(co => co.id))
        ).map(coIds => coIds.sort().join("."));
        const orderedCocs = _a(categoryCombo.categoryOptionCombos)
          .sortBy(coc => orderedCatOptsIds.indexOf(_a(coc.categoryOptions).map("id").sortBy().join(".")))
          .value();
        return [categoryCombo.id, orderedCocs];
      })
      .fromPairs()
      .value();

const getHeaders = (categories, visibleOptionCombos) => {
  // coc.categoryOptionCombo.categoryOptions from API is not sorted by categories, force sorting
  const indexes = _a(categories)
    .flatMap((cat, idx) => a(cat.categoryOptions).map(co => [co.id, idx]))
    .fromPairs()
    .value();
  return a(categories).map((category, catIndex) =>
    _a(visibleOptionCombos)
      .map(coc => _a(coc.categoryOptions).sortBy(co => indexes[co.id]).value())
      .groupConsecutiveBy(cos => _a(cos).map(co => co.id).take(catIndex + 1).value())
      .map(group => ({colSpan: group.length, name: group[0][catIndex] ? group[0][catIndex].displayName : "not-found"}))
      .value());
};

const getGreyedFields = (dataset) =>
  _a(dataset.sections)
    .flatMap(section => a(section.greyedFields))
    .map(field => [field.dataElement.id + "." + field.categoryOptionCombo.id, true])
    .fromPairs()
    .value();

const getRowTotalId = (dataElement, optionCombos) =>
  ["row", dataElement.id, ...a(optionCombos).map(coc => coc.id)].join("-");

const getContext = (dataset, sections, allCategoryCombos) => {
  const categoryComboByDataElementId = _a(dataset.dataSetElements)
    .map(dse => [dse.dataElement.id, dse.categoryCombo]).fromPairs().value();
  const categoryCombosId = _a(dataset.dataSetElements).map(dse => dse.categoryCombo.id).uniq().value();
  const categoryCombos = _a(allCategoryCombos).keyBy("id").at(categoryCombosId).value();
  const orderedCategoryOptionCombos = getOrderedCategoryOptionCombos(categoryCombos);
  const orderedCategories = _a(categoryCombos).map(cc => [cc.id, cc.categories]).fromPairs().value();
  const getDataElementsByCategoryCombo = (dataElements) =>
    _a(dataElements).groupBy(de => categoryComboByDataElementId[de.id].id).thru(map).value();
  const getDataElementsByCategoryComboForIndicators = (indicators) =>
    _a(indicators).flatMap("dataElements").groupBy(de => categoryComboByDataElementId[de.id].id).thru(map).value()
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
      getString: (key) => key,
    },
    encoder: {
      htmlEncode: htmlencode.htmlEncode,
    },
    auth: {
      // Used in automatic form, cannot be calculated for a static custom form, leave as true
      hasAccess: (app, key) => true,
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

const get = (dataset, sections, categoryCombos, data) => {
  const context = getContext(dataset, sections, categoryCombos);
  const htmlForm = velocity.render(data.template, context, {}, {env: "development"});
  const htmlFormWithJsCss = `<style>${data.css}</style><script>${data.js}</script>${htmlForm}`;
  return htmlFormWithJsCss.replace("__customFormStandalone__", "false");
};

exports.get = get;