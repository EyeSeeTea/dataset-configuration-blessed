import {generateUid} from 'd2/lib/uid';
import {collectionToArray} from '../utils/Dhis2Helpers';
import fp from 'lodash/fp';


/* Return an array of sections containing its data elements and associated indicators. Schema:

    [{
        name: string
        showRowTotals: boolean
        showColumnTotals: boolean
        items: {id: {
            type: "dataElement" | "indicator"
            id: string
            name: string
            selected: boolean
            origin: string
            disaggregation: string
            group: string
        }
    }]

Notes:

    * DataElements can only be used within one section. Since we are getting DataElements from
      indicators, we can have duplicated items that must be removed.
*/
export const getSections = (d2, config, dataset, d2Sections, initialCoreCompetencies, coreCompetencies) => {
    const data$ = [
        getDataElementGroupRelations(d2),
        getIndicatorsByGroupName(d2, coreCompetencies),
        getOutputDataElementsByCoreCompetencyId(d2, config, coreCompetencies),
    ];

    return Promise.all(data$).then(([degRelations, indicatorsByGroupName, dataElementsByCCId]) => {
		return Promise.all(_.flatMap(coreCompetencies, coreCompetency => {
            const opts = {
                d2, config, coreCompetency, degRelations,
                indicatorsByGroupName, dataElementsByCCId,
            };
            return [getOutputSection(opts), getOutcomeSection(opts)];
		})).then(sections => updateSectionsFromD2Sections(dataset, sections, d2Sections, initialCoreCompetencies));
	});
};

/* Return an object with the info of the sections and selected dataElements/indicators and errors:

    {
        sections: [d2.models.Section]
        dataSetElements: [dataElement]
        indicators: [Indicator]
        errors: [String]
    }
*/
export const getDataSetInfo = (d2, config, sections) => {
    const d2Sections = _(sections).flatMap(section => getD2Sections(d2, section)).value();
    const [selectedOutputDataElements, selectedIndicators] = _(sections)
        .flatMap(section => _(section.items).values().filter(de => de.selected).value())
        .partition(item => item.type == "dataElement");
    const selectedDataElements = _.concat(
        selectedOutputDataElements,
        _(selectedIndicators).flatMap("dataElements").value()
    );
    const dataSetElements = _(selectedDataElements)
        .map(dataElement => ({
            id: generateUid(),
            dataSet: {},
            categoryCombo: dataElement.categoryCombo,
            dataElement: {
                id: dataElement.id,
                displayName: dataElement.name,
                categoryCombo: dataElement.categoryCombo,
            },
        }))
        .value();
    const indicators = _(selectedIndicators)
        .uniqBy("id")
        .map(indicator => ({id: indicator.id}))
        .value();
    const dataElementsById = _(selectedDataElements).keyBy("id").value();
    const errors = _(selectedDataElements)
        .map(de => de.id)
        .countBy()
        .map((count, deId) => count > 1 ? deId : null)
        .compact()
        .map(repeatedDeId => {
            const invalidSections = sections
                .filter(section => _(section.dataElements).keys().includes(repeatedDeId))
                .map(section => section.name)
                .join(', ');
            const deName = dataElementsById[repeatedDeId].name;
            return `DataElement '${deName}' used in multiple sections`;
        })
        .value();

    return {sections: d2Sections, dataSetElements, indicators, errors};
};

/* Private functions */

const getSectionName = (d2Section) => {
    return d2Section.name.split("@")[0];
};

const updateSectionsFromD2Sections = (dataset, sections, d2Sections, initialCoreCompetencies) => {
    const d2SectionsByName = _(d2Sections).groupBy(getSectionName).value();
    const getItemIds = (d2Sections) =>
         _(d2Sections)
            .flatMap(d2s => [d2s.dataElements, dataset.indicators])
            .flatMap(collection => collectionToArray(collection).map(obj => obj.id))
            .value();
    const updateSection = section => {
        const d2SectionsForSection = d2SectionsByName[section.name];
        const sectionWasInInitialCoreCompetencies =
            _(initialCoreCompetencies).some(cc => cc.id === section.coreCompetency.id);

        if (d2SectionsForSection) {
            const d2Section = d2SectionsForSection[0];
            const itemsIds = new Set(getItemIds(d2SectionsForSection));

            section.showRowTotals = d2Section.showRowTotals;
            section.showColumnTotals = d2Section.showColumnTotals;
            section.items = _.mapValues(section.items,
                obj => fp.merge(obj, {selected: itemsIds.has(obj.id)}));
        } else if (sectionWasInInitialCoreCompetencies) {
            // This section was not persisted, but its core compentency was amongst the initial ones,
            // meaning that no items were selected. So clear all default _selected_ values.
            section.items = _.mapValues(section.items, obj => fp.merge(obj, {selected: false}));
        }
        return section;
    };

    return sections.map(updateSection);
};

const getD2Sections = (d2, section) => {
    const getD2Section = (objs, d2SectionName) => {
        const dataElements = _(objs).map("dataElement").uniqBy("id").value();
        const indicators = _(objs).map("indicator").compact().uniqBy("id").value();

        return d2.models.sections.create({
            name: d2SectionName,
            displayName: d2SectionName,
            showRowTotals: section.showRowTotals,
            showColumnTotals: section.showColumnTotals,
            dataElements: dataElements.map(de => ({id: de.id})),
            // No indicators for section, just in the data set (they are not rendered in data-entry)
            indicators: [],
            greyedFields: [],
        });
    };
    const getObjs = item => {
        if (item.type === "dataElement") {
            return [{dataElement: item, indicator: null}];
        } else { // indicator
            return item.dataElements.map(de => ({dataElement: de, indicator: item}));
        }
    };
    const getSectionName = ({dataElement}) =>
        [section.name, dataElement.theme, dataElement.group].join("@").replace(/@*$/, '');

    return _(section.items).values().filter("selected").flatMap(getObjs).groupBy(getSectionName)
        .map(getD2Section).value();
};

const getOutputSection = (opts) => {
    const {d2, config, degRelations, coreCompetency, dataElementsByCCId} = opts;
    const sectionName = coreCompetency.name + " Outputs";
    const dataElements = dataElementsByCCId[coreCompetency.id];
    const getDataElementInfo = (dataElement) => {
        const groupSets = _(dataElement.dataElementGroups.toArray())
            .map(deg => [degRelations[deg.id], deg]).fromPairs().value();
        const degSetOrigin = groupSets[config.dataElementGroupSetOriginId];
        const theme = groupSets[config.dataElementGroupSetThemeId];
        const group = _(dataElement.attributeValues)
            .find(av => av.attribute.id === config.attributeGroupId)
        const mandatoryIndicatorId = config.dataElementGroupGlobalIndicatorMandatoryId;

        return {
            type: "dataElement",
            id: dataElement.id,
            name: dataElement.name,
            displayName: dataElement.name,
            coreCompetency: sectionName,
            theme: theme ? theme.name : null,
            group: group ? group.value : null,
            categoryCombo: dataElement.categoryCombo,
            selected: degSetOrigin ? degSetOrigin.id === mandatoryIndicatorId : false,
            origin: degSetOrigin ? degSetOrigin.name : null,
            disaggregation: dataElement.categoryCombo.name !== "default" ? dataElement.categoryCombo.name : "None",
        };
    };
    const indexedDataElementsInfo = _(dataElements)
        .map(getDataElementInfo)
        .sortBy(info => [!info.selected, info.name])
        .keyBy("id")
        .value();

    return {
        type: "output",
        name: sectionName,
        showRowTotals: false,
        showColumnTotals: false,
        items: indexedDataElementsInfo,
        coreCompetency,
    };
};

const getOutcomeSection = (opts) => {
    const {d2, config, degRelations, indicatorsByGroupName, coreCompetency} = opts;
    const sectionName = coreCompetency.name + " Outcomes";
    const indicators = indicatorsByGroupName[coreCompetency.name] || {};
    const getIndicatorInfo = (indicator, dataElements) => {
        const dataElement = dataElements[0];
        const groupSets = _(dataElements)
            .flatMap(de => de.dataElementGroups.toArray())
            .map(deg => [degRelations[deg.id], deg])
            .fromPairs()
            .value();
        const degSetOrigin = groupSets[config.dataElementGroupSetOriginId];
        const theme = groupSets[config.dataElementGroupSetThemeId];
        const group = _(dataElement.attributeValues)
            .find(av => av.attribute.id === config.attributeGroupId)
        const mandatoryIndicatorId = config.dataElementGroupGlobalIndicatorMandatoryId;

        return {
            type: "indicator",
            dataElements: dataElements,
            id: indicator.id,
            name: indicator.name,
            displayName: indicator.name,
            coreCompetency: sectionName,
            theme: theme ? theme.name : null,
            group: group ? group.value : null,
            categoryCombo: dataElement.categoryCombo,
            selected: degSetOrigin ? degSetOrigin.id === mandatoryIndicatorId : false,
            origin: degSetOrigin ? degSetOrigin.name : null,
            disaggregation: dataElement.categoryCombo.name !== "default" ? dataElement.categoryCombo.name : "None",
        };
    };

    return getDataElementsByIndicator(d2, indicators).then(dataElementsByIndicator => {
        const indexedIndicatorsInfo = _(indicators)
            .filter(indicator => !_(dataElementsByIndicator[indicator.id]).isEmpty())
            .map(indicator => getIndicatorInfo(indicator, dataElementsByIndicator[indicator.id]))
            .sortBy(info => [!info.selected, info.name])
            .keyBy("id")
            .value();

        return {
            type: "outcome",
            name: sectionName,
            showRowTotals: false,
            showColumnTotals: false,
            items: indexedIndicatorsInfo,
            coreCompetency,
        };
    });
};

const getDataElementsByIndicator = (d2, indicators) => {
    const filtersWithIndicadors = _(indicators)
        .flatMap(indicator => {
            const fromNumerator = getDeIdsFromFormula(indicator.numerator).map(id => ["id", id]);
            const fromDenominator = getDeIdsFromFormula(indicator.denominator).map(id => ["id", id]);
            const fromComments = [["code", indicator.code + "-C"]];
            return _([fromNumerator, fromDenominator, fromComments])
                .flatten()
                .map(filter => ({indicator, filter}))
                .value();
        }).value();
    const filtersToIndicators = _(filtersWithIndicadors)
        .map(({filter, indicator}) => [filter.join("."), indicator])
        .groupBy(([filterKey, indicatorId]) => filterKey)
        .map((vs, k) => [k, vs.map(([filterKey, indicator]) => indicator)])
        .fromPairs()
        .value();
    const filters = filtersWithIndicadors.map(fi => fi.filter);

    return getDataElements(d2, filters).then(dataElements => {
        return _(dataElements)
            .flatMap(dataElement => {
                const indicators = _([
                    filtersToIndicators["id." + dataElement.id],
                    filtersToIndicators["code." + dataElement.code],
                ]).compact().flatten().value();
                return indicators.map(indicator => ({indicatorId: indicator.id, dataElements: dataElement}));
            })
            .groupBy("indicatorId")
            .map((objs, indicatorId) => [indicatorId, _(objs).flatMap("dataElements").value()])
            .fromPairs()
            .value();
    });

    const getFilters = indicator => {
        const fromNumerator = getDeIdsFromFormula(indicator.numerator).map(id => ["id", id]);
        const fromDenominator = getDeIdsFromFormula(indicator.denominator).map(id => ["id", id]);
        const fromComments = [["code", indicator.code + "-C"]];
        return _.concat(fromNumerator, fromDenominator, fromComments);
    };

    return _(indicators)
        .map(indicator => [indicator.id, getDataElements(d2, getFilters(indicator))])
        .fromPairs()
        .value();
};

const matchAll = (string, re) => {
    let match, matches = [];
    const globalRe = new RegExp(re, "g");
    while (match = globalRe.exec(string)) {
        matches.push(match[1]);
    }
    return matches;
};

const getDeIdsFromFormula = (formula) => {
    return matchAll(formula, /#{(\w+)/);
};

const filterDataElements = (dataElements, requiredDegIds) => {
    return dataElements.filter(dataElement => {
        const degIds = new Set(dataElement.dataElementGroups.toArray().map(deg => deg.id));
        return requiredDegIds.every(requiredDegId => degIds.has(requiredDegId));
    });
};

/* Return object {dataElementGroupId: dataElementGroupSetId} */
const getDataElementGroupRelations = (d2) => {
    return d2
        .models.dataElementGroupSets
        .list({fields: "id,name,displayName,dataElementGroups[id,name,displayName]"})
        .then(collection =>
            collection.toArray().map(degSet =>
                _(degSet.dataElementGroups.toArray())
                    .map(deg => [deg.id, degSet.id]).fromPairs().value()
            )
        )
        .then(relationsArray => _.reduce(relationsArray, _.extend, {}));
};

/* Return a promise with an array of d2 items filtered by an array of [field, value] pairs */
const getFilteredItems = (model, filters, listOptions) => {
	// As d2 filtering does not implement operator <in> (see dhis2/d2/issues/60),
    // we must use a reduce folding filtering with the <eq> operator and rootJunction=OR
    if (_.isEmpty(filters)) {
        return Promise.resolve([]);
    } else {
        return _(filters)
            .reduce((model_, [key, value]) => model_.filter().on(key).equals(value), model)
            .list(_.merge({paging: false, rootJunction: "OR"}, listOptions))
            .then(collection => collection.toArray());
    }
};

const getDataElements = (d2, dataElementFilters) => {
    const fields = [
        "id",
        "name",
        "code",
        "categoryCombo[id,name,displayName,categoryOptionCombos[id,displayName,categoryOptions[id,displayName]]," +
            "categories[id,name,displayName,categoryOptions[id,displayName]]]",
        "dataElementGroups[id,name,displayName]",
        "attributeValues[value,attribute]",
    ];
    return getFilteredItems(d2.models.dataElements, dataElementFilters, {fields: fields.join(",")});
};

const getOutputDataElementsByCoreCompetencyId = (d2, config, coreCompetencies) => {
    const ccFilters = coreCompetencies.map(cc => ["dataElementGroups.id", cc.id])
    return getDataElements(d2, ccFilters).then(dataElements => {
        return _(coreCompetencies)
            .map(cc => [cc.id, filterDataElements(dataElements, [cc.id, config.dataElementGroupOutputId])])
            .fromPairs()
            .value();
    });
};

const getIndicatorsByGroupName = (d2, coreCompetencies) => {
    const filters = coreCompetencies.map(cc => ["name", cc.name]);
    const listOptions = {fields: "id,name,displayName,indicators[*]"};

    return getFilteredItems(d2.models.indicatorGroups, filters, listOptions)
        .then(indicatorGroups =>
            _(indicatorGroups)
                .map(indGroup => [indGroup.name, indGroup.indicators.toArray()])
                .fromPairs()
                .value()
        );
};