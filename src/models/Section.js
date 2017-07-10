import { generateUid } from 'd2/lib/uid';

/* Return an array of sections containing its data elements and associated indicators. Schema:

    [{
        name: string
        showRowTotals: boolean
        showColumnTotals: boolean
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

/* Return an object with the info of the sections and selected dataElements:

    {
        sections: [e2.models.Section]
        dataSetElements: [dataElement]
        indicators: [Indicator]
    }
*/
export const getDataSetInfo = (d2, config, sections) => {
    const d2Sections = _(sections).flatMap(section => getD2Sections(d2, section)).value();
    const selectedDataElements = _(sections)
        .flatMap(section => _(section.dataElements).values().filter(de => de.selected).value())
    const dataSetElements = selectedDataElements
        .map(dataElement => ({
            id: generateUid(),
            dataSet: {},
            dataElement: {id: dataElement.id},
            categoryCombo: dataElement.categoryCombo,
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

const getD2Sections = (d2, section) => {
    const getD2Section = (dataElements, d2SectionName) => {
        return d2.models.sections.create({
            name: d2SectionName,
            showRowTotals: section.showRowTotals,
            showColumnTotals: section.showColumnTotals,
            dataElements: dataElements.map(de => ({id: de.id})),
            indicators: _(dataElements).flatMap("indicators").map(ind => ({id: ind.id})).value(),
        });
    };

    return _(section.dataElements)
        .values()
        .filter(de => de.selected)
        .groupBy(de => [section.name, de.theme, de.group].join("@").replace(/@*$/, ''))
        .map(getD2Section)
        .value();
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
        const groupSets = _(de.dataElementGroups.toArray())
            .map(deg => [relations[deg.id], deg]).fromPairs().value();
        const degSetOrigin = groupSets[config.dataElementGroupSetOriginId];
        const theme = groupSets[config.dataElementGroupSetThemeId];
        const group = _(de.attributeValues)
            .find(av => av.attribute.id === config.attributeGroupId)
        const mandatoryIndicatorId = config.dataElementGroupGlobalIndicatorMandatoryId;

        return {
            id: de.id,
            name: de.name,
            indicators: indicators,
            theme: theme ? theme.name : null,
            group: group ? group.value : null,
            categoryCombo: de. categoryCombo,
            selected: degSetOrigin ? degSetOrigin.id === mandatoryIndicatorId : false,
            origin: degSetOrigin ? degSetOrigin.name : null,
            disaggregation: de.categoryCombo.name !== "default" ? de.categoryCombo.name : "None",
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
    const fields = [
        "id",
        "name",
        "code",
        "categoryCombo[id,name]",
        "dataElementGroups[id,name]",
        "attributeValues[value,attribute]",
    ];
    return getFilteredItems(d2.models.dataElements, dataElementFilters, {fields: fields.join(",")});
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