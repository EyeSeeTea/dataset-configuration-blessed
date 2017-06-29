import { generateUid } from 'd2/lib/uid';

/* Return an array of sections containing its data elements and associated indicators. Schema:

    [{
        name: string
        showRowTotals: boolean
        showColumnTotals: boolean
        indicators: [Indicator]
        dataElements: ObjectOf(
            [key] dataElementId: string
            [value] dataElement: {
                id: string
                name: string
                selected: boolean
                origin: string
                disaggregation: string
                indicators: [Indicator] // Associated indicators
            }
        )
    }]

Notes:

    * DataElements can only be used within one section. Since we are getting DataElements from
      indicators, we can have duplicated items that must be removed.
*/
export const getSectionsFromCoreCompetencies = (d2, config, coreCompetencies) => {
    const initialDataPromises = [
        getDataElementGroupRelations(d2),
        getIndicatorsByGroupName(d2, coreCompetencies),
        getDataElements(d2, coreCompetencies.map(cc => ["dataElementGroups.id", cc.id])),
    ];

    return Promise.all(initialDataPromises).then(([relations, indicatorsByGroupName, dataElements]) => {
		return Promise.all(_.flatMap(coreCompetencies, coreCompetency => {
            const getSectionOpts = {d2, config, relations, indicatorsByGroupName, coreCompetency};
            return [
                getOutputSection(dataElements, getSectionOpts),
                getOutcomeSection(dataElements, getSectionOpts),
            ];
		}));
	});
};

/* Return an object with the info the sections:

    {
        section: Section // D2 Section
        dataSetElements: [dataElement] // Selected data elements through the required dataSetElements proxy.
        indicators: [Indicator] // Indicators associated to the selected data elements.
    }
*/
export const getDataSetInfo = (d2, sections) => {
    const d2Sections = sections.map(section => getD2Section(d2, section));
    const selectedDataElements = _(sections)
        .flatMap(section => _(section.dataElements).values().filter(de => de.selected).value())
    const dataSetElements = selectedDataElements
        .map(dataElement => ({
            id: generateUid(),
            categoryCombo: dataElement.categoryCombo,
            dataElement: {id: dataElement.id},
        }))
        .value();
    const indicators = selectedDataElements
        .flatMap(de => de.indicators)
        .uniqBy(indicator => indicator.id)
        .map(indicator => ({id: indicator.id}))
        .value();
    const dataElementsById = selectedDataElements.keyBy("id").value();
    const errors = selectedDataElements
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
            return `DataElement '${deName}' used in multiple sections: ${invalidSections}`;
        })
        .value();

    return {sections: d2Sections, dataSetElements, indicators, errors};
};

const getD2Section = (d2, section) => {
    const selectedDataElements = _(section.dataElements).values().filter(de => de.selected);
    const dataElements = selectedDataElements.map(de => ({id: de.id})).value();
    const indicators = selectedDataElements
        .flatMap(de => de.indicators.map(indicator => ({id: indicator.id})))
        .value();

    return d2.models.sections.create({
        name: section.name,
        showRowTotals: section.showRowTotals,
        showColumnTotals: section.showColumnTotals,
        dataElements: dataElements,
        indicators: indicators,
    });
};

const getOutputSection = (dataElements, opts) => {
    const {d2, config, coreCompetency} = opts;
    const sectionName = coreCompetency.name + " Outputs";
    const filteredDataElements =
        filterDataElements(dataElements, [coreCompetency.id, config.dataElementGroupOutputId])
    return getSection(sectionName, filteredDataElements, [], {}, opts);
};

const getOutcomeSection = (dataElements, opts) => {
    const {d2, config, indicatorsByGroupName, coreCompetency} = opts;
    const sectionName = coreCompetency.name + " Outcomes";
    const outcomeDataElements =
        filterDataElements(dataElements, [coreCompetency.id, config.dataElementGroupOutcomeId]);
    const indicators = indicatorsByGroupName[coreCompetency.name];
    const {filters, filtersToIndicators} = getDataElementFiltersFromIndicators(indicators || []);
    if (!indicators)
        console.error(`No IndicatorGroup with name ${coreCompetency.name} found`);

    return getDataElements(d2, filters)
        .then(dataElementsFromIndicators =>
            outcomeDataElements.concat(dataElementsFromIndicators))
        .then(dataElementsForSection =>
            getSection(sectionName, dataElementsForSection, indicators, filtersToIndicators, opts));
};

const getSection = (sectionName, dataElements, indicators, filtersToIndicators, opts) => {
    const {d2, config, relations, coreCompetency} = opts;
    const getDataElementInfo = (de) => {
        const indicators = _([
            filtersToIndicators["id." + de.id],
            filtersToIndicators["code." + de.code],
        ]).compact().flatten().value();
        const attributes = _(de.dataElementGroups.toArray())
            .map(deg => [relations[deg.id], deg]).fromPairs().value();
        const degSetOrigin = attributes[config.dataElementGroupSetOriginId];

        return {
            id: de.id,
            name: de.name,
            indicators: indicators,
            selected: degSetOrigin ?
                degSetOrigin.id == config.dataElementGroupGlobalIndicatorMandatoryId : false,
            origin: degSetOrigin ? degSetOrigin.name : "None",
            disaggregation: de.categoryCombo.name == "default" ? "None" : de.categoryCombo.name,
        };
    };
    const indexedDataElementsInfo = _(dataElements)
        .map(getDataElementInfo)
        .sortBy(de => [!de.selected, de.name])
        .keyBy("id")
        .value();

    return {
        name: sectionName,
        showRowTotals: false,
        showColumnTotals: false,
        dataElements: indexedDataElementsInfo,
    };
};

const getDataElementFiltersFromIndicators = (indicators) => {
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

    return {filtersToIndicators, filters};
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
        .list({fields: "id,name,dataElementGroups[id,name]"})
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
    return getFilteredItems(d2.models.dataElements, dataElementFilters,
        {fields: "id,name,code,categoryCombo[id,name],dataElementGroups[id,name]"});
};

const getIndicatorsByGroupName = (d2, coreCompetencies) => {
    const filters = coreCompetencies.map(cc => ["name", cc.name]);
    const listOptions = {fields: "id,name,indicators[id,numerator,denominator,code]"};

    return getFilteredItems(d2.models.indicatorGroups, filters, listOptions)
        .then(indicatorGroups =>
            _(indicatorGroups)
                .map(indGroup => [indGroup.name, indGroup.indicators.toArray()])
                .fromPairs().value()
        );
};