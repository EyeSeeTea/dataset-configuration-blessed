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
        getIndicatorGroupRelations(d2),
        getIndicatorsByGroupName(d2, coreCompetencies),
        getOutputDataElementsByCoreCompetencyId(d2, config, coreCompetencies),
    ];

    return Promise.all(data$).then(([degRelations, igRelations, indicatorsByGroupName, dataElementsByCCId]) => {
		return Promise.all(_.flatMap(coreCompetencies, coreCompetency => {
            const opts = {
                d2, config, coreCompetency, degRelations, igRelations,
                indicatorsByGroupName, dataElementsByCCId,
            };
            return [getOutputSection(opts), getOutcomeSection(opts)];
		})).then(sections => updateSectionsFromD2Sections(sections, d2Sections, initialCoreCompetencies));
	});
};

/* Return an object with the info of the sections and selected dataElements/indicators and errors:

    {
        sections: [d2.models.Section]
        dataSetElements: [dataSetElement]
        indicators: [Indicator]
        errors: [String]
    }
*/
export const getDataSetInfo = (d2, config, sections) => {
    const d2Sections = _(sections).flatMap(section => getD2Sections(d2, section))
        .map((d2s, index) => _.set(d2s, "sortOrder", index)).value();
    const dataElements = _(d2Sections).flatMap(d2s => d2s.dataElements.toArray()).value();
    const indicators = _(d2Sections).flatMap(d2s => d2s.indicators.toArray()).value();
    const dataSetElements = dataElements.map(dataElement => ({
        id: generateUid(),
        dataSet: {},
        categoryCombo: dataElement.categoryCombo,
        dataElement: {
            id: dataElement.id,
            displayName: dataElement.name,
            categoryCombo: dataElement.categoryCombo,
        },
    }));
    const dataElementsById = _(dataElements).keyBy("id").value();
    const errors = _(dataElements)
        .map("id").countBy().map((count, deId) => count > 1 ? deId : null).compact()
        .map(repeatedId => {
            const deName = dataElementsById[repeatedId].name;
            const invalidSections = d2Sections
                .filter(d2Section => d2Section.dataElements.has(repeatedId))
                .map(d2Section => d2Section.name);
            return `Data element '${deName}' is used in multiple sections: ${invalidSections.join(', ')}`;
        })
        .value();

    return {sections: d2Sections, dataSetElements, indicators, errors};
};

/* Return status key of item (dataElement or indicator). 

    Values: "unknown" | "active" | "inactive" | "phased-out"
*/
export const getItemStatus = (item) => {
    if (!item.status) {
        return "unknown";
    } else if (item.status.startsWith("Active")) {
        return "active";
    } else if (item.status.startsWith("Inactive")) {
        return "inactive";
    } else if (item.status.startsWith("Phased")) {
        return "phased-out";
    } else {
        return "unknown";
    }
};

/* Private functions */

const sectionSep = "@";

const getSectionName = (d2Section) => {
    return d2Section.name.split(sectionSep)[0];
};

const updateSectionsFromD2Sections = (sections, d2Sections, initialCoreCompetencies) => {
    const d2SectionsByName = _(d2Sections).groupBy(getSectionName).value();
    const getItemIds = (d2Sections) =>
         _(d2Sections)
            .flatMap(d2s => [d2s.dataElements, d2s.indicators])
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

        // Add attribute selectedOnLoad required to sort items by the default criteria
        section.items = _(section.items).mapValues(obj => _.set(obj, "selectedOnLoad", obj.selected)).value();
        return section;
    };

    return sections.map(updateSection);
};

const getD2Sections = (d2, section) => {
    const getD2Section = (items, d2SectionName) => {
        const dataElements = _(items)
            .flatMap(item => item.type === "dataElement" ? [item] : item.dataElements)
            .map(de => ({id: de.id, name: de.name, categoryCombo: de.categoryCombo}))
            .uniqBy("id").value();
        const indicators = _(items).flatMap(item => item.type === "indicator" ? [item] : [])
            .map(ind => ({id: ind.id, name: ind.name}))
            .uniqBy("id").value();

        return d2.models.sections.create({
            name: d2SectionName,
            displayName: d2SectionName,
            showRowTotals: section.showRowTotals,
            showColumnTotals: section.showColumnTotals,
            dataElements: dataElements,
            indicators: indicators,
            greyedFields: [],
        });
    };
    const sectionName = (item) => {
        let values;
        if (item.type === "dataElement") {
            values = [section.name, item.theme, item.group];
        } else { // Indicator. When group is not present, use the indicator code itself to group
            const group = item.group || item.code;
            values = [section.name, item.theme, group];
        }
        return values.join(sectionSep).replace(new RegExp(sectionSep + "*$"), '');
    }

    return _(section.items).values().filter("selected").groupBy(sectionName).map(getD2Section).value();
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
        const degSetStatus = groupSets[config.dataElementGroupSetStatusId];

        return {
            type: "dataElement",
            id: dataElement.id,
            code: dataElement.code,
            name: dataElement.name,
            displayName: dataElement.name,
            coreCompetency: sectionName,
            theme: theme ? theme.name : null,
            group: group ? group.value : null,
            categoryCombo: dataElement.categoryCombo,
            selected: degSetOrigin ? degSetOrigin.id === mandatoryIndicatorId : false,
            origin: degSetOrigin ? degSetOrigin.name : null,
            status: degSetStatus ? degSetStatus.name : null,
            disaggregation: dataElement.categoryCombo.name !== "default" ? dataElement.categoryCombo.name : "None",
        };
    };
    const indexedDataElementsInfo = _(dataElements)
        .map(getDataElementInfo)
        .filter(item => getItemStatus(item) !== "inactive")
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
    const {d2, config, degRelations, igRelations, indicatorsByGroupName, coreCompetency} = opts;
    const sectionName = coreCompetency.name + " Outcomes";
    const indicators = indicatorsByGroupName[coreCompetency.name] || [];
    const getIndicatorInfo = (indicator, dataElements) => {
        const indicatorGroupSets = _(indicator.indicatorGroups.toArray())
            .map(ig => [igRelations[ig.id], ig]).fromPairs().value();
        const origin = indicatorGroupSets[config.indicatorGroupSetOriginId];
        const theme = indicatorGroupSets[config.indicatorGroupSetThemeId];
        const group = _(indicator.attributeValues).find(av => av.attribute.id === config.attributeGroupId);
        const mandatoryIndicatorId = config.indicatorGroupGlobalIndicatorMandatoryId;
        const igSetStatus = indicatorGroupSets[config.indicatorGroupSetStatusId];

        return {
            type: "indicator",
            dataElements: dataElements,
            id: indicator.id,
            code: indicator.code,
            name: indicator.name,
            displayName: indicator.name,
            coreCompetency: sectionName,
            theme: theme ? theme.name : null,
            group: group ? group.value : null,
            categoryCombo: null,
            selected: origin ? origin.id === mandatoryIndicatorId : false,
            origin: origin ? origin.name : null,
            status: igSetStatus ? igSetStatus.name : null,
            disaggregation: null,
        };
    };

    return getDataElementsByIndicator(d2, indicators).then(dataElementsByIndicator => {
        const indexedIndicatorsInfo = _(indicators)
            .filter(indicator => !_(dataElementsByIndicator[indicator.id]).isEmpty())
            .map(indicator => getIndicatorInfo(indicator, dataElementsByIndicator[indicator.id]))
            .filter(item => getItemStatus(item) !== "inactive")
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
    const filtersForIndicator = indicators.map(indicator => {
        const fromNumerator = getDeIdsFromFormula(indicator.numerator).map(id => ["id", id]);
        const fromDenominator = getDeIdsFromFormula(indicator.denominator).map(id => ["id", id]);
        const fromComments = indicator.code ? [["code", indicator.code + "-C"]] : [];
        return {indicator, filters: _.flatten([fromNumerator, fromDenominator, fromComments])};
    });
    const getMapping = (dataElements) => {
        return _(filtersForIndicator)
            .map(({indicator, filters}) => {
                const dataElementsForIndicator = _(filters)
                    .flatMap(([key, value]) => dataElements.filter(de => de[key] === value)).value();
                return [indicator.id, dataElementsForIndicator];
            })
            .fromPairs()
            .value();
    };
    const allFilters = _(filtersForIndicator).flatMap("filters").value();

    return getDataElements(d2, allFilters).then(getMapping);
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

/* Return object {indicatorGroupId: indicatorGroupSetId} */
const getIndicatorGroupRelations = (d2) => {
    return d2
        .models.indicatorGroupSets
        .list({fields: "id,name,displayName,indicatorGroups[id,name,displayName]"})
        .then(collection =>
            collection.toArray().map(igSet =>
                _(igSet.indicatorGroups.toArray())
                    .map(ig => [ig.id, igSet.id]).fromPairs().value()
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
    const listOptions = {fields: "id,name,displayName,indicators[*, indicatorGroups[*]]"};

    return getFilteredItems(d2.models.indicatorGroups, filters, listOptions)
        .then(indicatorGroups =>
            _(indicatorGroups)
                .map(indGroup => [indGroup.name, indGroup.indicators.toArray()])
                .fromPairs()
                .value()
        );
};