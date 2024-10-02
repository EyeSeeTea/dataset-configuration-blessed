import { generateUid } from "d2/lib/uid";
import _ from "lodash";
import { update, collectionToArray, subQuery, getOwnedPropertyJSON } from "../utils/Dhis2Helpers";
import fp from "lodash/fp";
import memoize from "nano-memoize";

const toArray = collectionToArray;

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
export const getSections = (d2_, config, dataset, initialCoreCompetencies, coreCompetencies) => {
    const d2 = getCachedD2(d2_);

    const data$ = [
        getDataElementGroupRelations(d2),
        getIndicatorGroupRelations(d2),
        getIndicatorsByGroupName(d2, coreCompetencies),
        getOutputDataElementsByCoreCompetencyId(d2, config, coreCompetencies),
    ];

    return Promise.all(data$).then(
        ([degRelations, igRelations, indicatorsByGroupName, dataElementsByCCId]) => {
            return Promise.all(
                _.flatMap(coreCompetencies, coreCompetency => {
                    const opts = {
                        d2,
                        config,
                        coreCompetency,
                        degRelations,
                        igRelations,
                        indicatorsByGroupName,
                        dataElementsByCCId,
                    };
                    return [getOutputSection(opts), getOutcomeSection(opts)];
                })
            ).then(sections =>
                updateSectionsFromD2Sections(
                    sections,
                    collectionToArray(dataset.sections),
                    initialCoreCompetencies
                )
            );
        }
    );
};

// Cache d2.models[].list()
let cachedD2;

const getCachedD2 = d2 => {
    if (cachedD2) {
        return cachedD2;
    } else {
        const models = _(d2.models)
            .mapValues(model => {
                const model2 = model.clone();
                model2.list = memoize(opts => model.list(opts), { serializer: JSON.stringify });
                return model2;
            })
            .value();
        cachedD2 = { ...d2, models };
        return cachedD2;
    }
};

const validateCoreItemsSelectedForCurrentUser = (_d2, _config) => {
    return false;
};

/* Return an object with the info of the sections and selected dataElements/indicators and errors:

    {
        sections: [d2.models.Section]
        dataSetElements: [dataSetElement]
        indicators: [Indicator]
        errors: [String]
    }
*/
export const getDataSetInfo = (d2, config, dataset, sections) => {
    const validateCoreSelected = validateCoreItemsSelectedForCurrentUser(d2, config);

    const d2Sections = _(sections)
        .map(section => getD2Section(d2, dataset, section))
        .map((d2s, index) => _.set(d2s, "sortOrder", index))
        .value();
    const dataElements = _(d2Sections)
        .flatMap(d2s => toArray(d2s.dataElements))
        .value();
    const indicators = _(d2Sections)
        .flatMap(d2s => toArray(d2s.indicators))
        .value();
    const dataSetElements = dataElements.map(dataElement => ({
        id: generateUid(),
        dataSet: {},
        categoryCombo: dataElement.categoryCombo,
        dataElement: {
            id: dataElement.id,
            displayName: dataElement.displayName,
            categoryCombo: dataElement.categoryCombo,
        },
    }));
    const dataElementsById = _(dataElements)
        .keyBy("id")
        .value();
    const dataElementErrors = _(dataElements)
        .map("id")
        .countBy()
        .map((count, deId) => (count > 1 ? deId : null))
        .compact()
        .map(repeatedId => {
            const deName = dataElementsById[repeatedId].displayName;
            const invalidSections = d2Sections
                .filter(d2Section => d2Section.dataElements.has(repeatedId))
                .map(d2Section => d2Section.name);
            return {
                key: "data_element_in_multiple_sections",
                message: `Data element '${deName}' is used in multiple sections: ${invalidSections.join(
                    ", "
                )}`,
            };
        })
        .value();
    const emptyCoreCompetenciesErrors = _(sections)
        .groupBy(section => section.coreCompetency.name)
        .toPairs()
        .filter(
            ([_ccName, sectionsForCC]) =>
                !_(sectionsForCC)
                    .flatMap(section => _.values(section.items))
                    .some("selected")
        )
        .map(([ccName, _sectionsForCC]) => ({
            key: "core_competency_no_items",
            message: `Core competency ${ccName} has no data elements or indicators selected`,
        }))
        .value();

    const nonCoreItemsSelectedErrors = () =>
        _(sections)
            .groupBy(section => section.coreCompetency.name)
            .toPairs()
            .filter(
                ([_ccName, sectionsForCC]) =>
                    !_(sectionsForCC)
                        .flatMap(section => _.values(section.items))
                        .some(item => item.selected && item.isCore)
            )
            .map(([ccName, _sectionsForCC]) => ({
                key: "core_competency_no_core_items",
                message: `Core competency ${ccName} has no core data elements or indicators selected`,
            }))
            .value();

    const errors = _.concat(
        dataElementErrors,
        emptyCoreCompetenciesErrors,
        validateCoreSelected ? nonCoreItemsSelectedErrors() : []
    );
    return { sections: d2Sections, dataSetElements, indicators, errors };
};

/* Return status key of item (dataElement or indicator).

    Values: "unknown" | "active" | "inactive" | "phased-out"
*/
export const getItemStatus = item => {
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

export const processDatasetSections = (d2, config, dataset, stateSections) => {
    const { sections, dataSetElements, indicators, errors } = getDataSetInfo(
        d2,
        config,
        dataset,
        _.values(stateSections)
    );

    const prevSections = collectionToArray(dataset.sections);
    const sectionsByName = _(sections)
        .keyBy("name")
        .value();
    const prevSectionsByName = _(prevSections)
        .keyBy("name")
        .value();
    const allNames = _(sections)
        .concat(prevSections)
        .map("name")
        .uniq()
        .value();

    const mergedSections = allNames.map(name => {
        const section = sectionsByName[name];
        if (section) {
            // Keep id/href/greyedFields for existing sections
            const prevSection = prevSectionsByName[name] || {};
            update(section, _.pick(prevSection, ["id", "href", "greyedFields"]));
            return section;
        } else {
            // Section has no DE/indicators in this new configuration
            const section = prevSectionsByName[name];
            section.dataElements.clear();
            section.indicators.clear();
            return section;
        }
    });

    // Don't override dataSetElements (disaggregation)
    const newDataSetElements = _.keyBy(dataSetElements, dse => dse.dataElement.id);
    const prevDataSetElements = _.keyBy(dataset.dataSetElements || [], dse => dse.dataElement.id);
    const mergedDataSetElements = _({ ...newDataSetElements, ...prevDataSetElements })
        .at(_.keys(newDataSetElements))
        .value();

    const newDataset = update(dataset, {
        sections: mergedSections,
        dataSetElements: mergedDataSetElements,
        indicators: indicators,
    });
    return { errors, dataset: newDataset };
};

export const sectionSelectedItemsCount = sections => {
    return _(sections)
        .flatMap((section, _sectionName) => _.values(section.items))
        .filter(item => item.selected)
        .flatMap(item => (item.type === "dataElement" ? 1 : item.dataElements.length + 1))
        .sum();
};

/* Private functions */

const sectionSep = "@";

const getSectionName = d2Section => {
    return d2Section.name.split(sectionSep)[0];
};

const updateSectionsFromD2Sections = (sections, d2Sections, initialCoreCompetencies) => {
    const d2SectionsByName = _(d2Sections)
        .groupBy(getSectionName)
        .value();
    const updateSection = section => {
        const d2SectionsForSection = d2SectionsByName[section.name];
        const sectionWasInInitialCoreCompetencies = _(initialCoreCompetencies).some(
            cc => cc.id === section.coreCompetency.id
        );

        if (d2SectionsForSection) {
            const d2Section = d2SectionsForSection[0];
            const itemsIds = new Set(
                _(d2SectionsForSection)
                    .flatMap(d2s => [
                        collectionToArray(d2s.dataElements).map(de => "dataElement-" + de.id),
                        collectionToArray(d2s.indicators).map(ind => "indicator-" + ind.id),
                    ])
                    .flatten()
                    .value()
            );

            section.showRowTotals = d2Section.showRowTotals;
            section.showColumnTotals = d2Section.showColumnTotals;
            section.items = _.mapValues(section.items, item =>
                fp.merge(item, { selected: itemsIds.has(item.type + "-" + item.id) })
            );
        } else if (sectionWasInInitialCoreCompetencies) {
            // This section was not persisted, but its core compentency was amongst the initial ones,
            // meaning that no items were selected. So clear all default _selected_ values.
            section.items = _.mapValues(section.items, obj => fp.merge(obj, { selected: false }));
        }

        // Add attribute selectedOnLoad required to sort items by the default criteria
        section.items = _(section.items)
            .mapValues(obj => _.set(obj, "selectedOnLoad", obj.selected))
            .value();
        return section;
    };

    return sections.map(updateSection);
};

const getD2Section = (d2, dataset, section) => {
    const items = _(section.items)
        .values()
        .filter("selected")
        .value();
    const dataElements = _(items)
        .flatMap(item => (item.type === "dataElement" ? [item] : item.dataElements))
        .map(de => ({
            id: de.id,
            displayName: de.displayName,
            categoryCombo: de.categoryCombo,
        }))
        .uniqBy("id")
        .value();
    const indicators = _(items)
        .flatMap(item => (item.type === "indicator" ? [item] : []))
        .map(ind => ({ id: ind.id, displayName: ind.displayName, name: ind.displayName }))
        .uniqBy("id")
        .value();
    const sectionTypeCode = section.type.toUpperCase() + "S";

    // On creation, a data set has no ID, use a random string (prefix used only to observe uniqueness)
    const randomId = dataset.id || getRandomString();

    return d2.models.sections.create({
        name: section.name,
        code: [randomId, sectionTypeCode, section.coreCompetency.code].join("_"),
        displayName: section.name,
        showRowTotals: section.showRowTotals,
        showColumnTotals: section.showColumnTotals,
        dataElements: dataElements,
        indicators: indicators,
        greyedFields: [],
    });
};

const getOutputSection = opts => {
    const { config, degRelations, coreCompetency, dataElementsByCCId } = opts;
    const sectionName = coreCompetency.name + " Outputs";
    const dataElements = dataElementsByCCId[coreCompetency.id];
    const getDataElementInfo = dataElement => {
        const groupSets = _(toArray(dataElement.dataElementGroups))
            .map(deg => [degRelations[deg.id], deg])
            .fromPairs()
            .value();
        const degSetOrigin = groupSets[config.dataElementGroupSetOriginId];
        const theme = groupSets[config.dataElementGroupSetThemeId];
        const group = _(dataElement.attributeValues).find(
            av => av.attribute.id === config.attributeGroupId
        );
        const attributes = _(dataElement.attributeValues)
            .map(av => [av.attribute.id, av.value])
            .fromPairs()
            .value();
        const mandatoryIndicatorId = config.dataElementGroupGlobalIndicatorMandatoryId;
        const degSetStatus = groupSets[config.dataElementGroupSetStatusId];
        const status = degSetStatus ? degSetStatus.displayName : null;

        return {
            type: "dataElement",
            id: dataElement.id,
            code: dataElement.code,
            name: dataElement.name,
            displayName: dataElement.displayName,
            description: dataElement.description,
            sectionName: sectionName,
            coreCompetency: coreCompetency,
            theme: theme ? theme.displayName : null,
            group: group ? group.value : null,
            categoryCombo: dataElement.categoryCombo,
            isCore: degSetOrigin && degSetOrigin.id === mandatoryIndicatorId,
            selected: false,
            origin: degSetOrigin ? degSetOrigin.displayName : null,
            status: status,
            hidden: attributes[config.hideInDataSetAppAttributeId] === "true",
            disaggregation:
                dataElement.categoryCombo.name !== "default"
                    ? dataElement.categoryCombo.displayName
                    : "None",
        };
    };
    const indexedDataElementsInfo = _(dataElements)
        .map(getDataElementInfo)
        .filter(item => getItemStatus(item) !== "inactive" && !item.hidden)
        .keyBy("id")
        .value();

    return {
        type: "output",
        id: coreCompetency.id + "-output",
        name: sectionName,
        showRowTotals: false,
        showColumnTotals: false,
        items: indexedDataElementsInfo,
        coreCompetency: getOwnedPropertyJSON(coreCompetency),
    };
};

const getOutcomeSection = opts => {
    const { d2, config, igRelations, indicatorsByGroupName, coreCompetency } = opts;
    const sectionName = coreCompetency.name + " Outcomes";
    const indicators = indicatorsByGroupName[coreCompetency.name] || [];
    const getIndicatorInfo = (indicator, dataElements) => {
        const indicatorGroupSets = _(toArray(indicator.indicatorGroups))
            .map(ig => [igRelations[ig.id], ig])
            .fromPairs()
            .value();
        const origin = indicatorGroupSets[config.indicatorGroupSetOriginId];
        const theme = indicatorGroupSets[config.indicatorGroupSetThemeId];
        const group = _(indicator.attributeValues).find(
            av => av.attribute.id === config.attributeGroupId
        );
        const attributes = _(indicator.attributeValues)
            .map(av => [av.attribute.id, av.value])
            .fromPairs()
            .value();
        const mandatoryIndicatorId = config.indicatorGroupGlobalIndicatorMandatoryId;
        const igSetStatus = indicatorGroupSets[config.indicatorGroupSetStatusId];
        const status = igSetStatus ? igSetStatus.displayName : null;

        return {
            type: "indicator",
            dataElements: dataElements.map(de =>
                _.assign(getOwnedPropertyJSON(de), { displayName: de.displayName })
            ),
            dataElementsNumeric: dataElements.filter(de => de.code && !de.code.endsWith("-C")),
            id: indicator.id,
            code: indicator.code,
            name: indicator.name,
            displayName: indicator.displayName,
            description: indicator.description,
            sectionName: sectionName,
            coreCompetency: coreCompetency,
            theme: theme ? theme.displayName : null,
            group: group ? group.value : indicator.displayName,
            categoryCombo: null,
            selected: false,
            isCore: origin && origin.id === mandatoryIndicatorId,
            origin: origin ? origin.displayName : null,
            status: status,
            disaggregation: null,
            hidden: attributes[config.hideInDataSetAppAttributeId] === "true",
        };
    };

    return getDataElementsByIndicator(d2, indicators).then(dataElementsByIndicator => {
        const indexedIndicatorsInfo = _(indicators)
            .filter(indicator => !_(dataElementsByIndicator[indicator.id]).isEmpty())
            .map(indicator => getIndicatorInfo(indicator, dataElementsByIndicator[indicator.id]))
            .filter(item => getItemStatus(item) !== "inactive" && !item.hidden)
            .keyBy("id")
            .value();

        return {
            type: "outcome",
            id: coreCompetency.id + "-outcome",
            name: sectionName,
            showRowTotals: false,
            showColumnTotals: false,
            items: indexedIndicatorsInfo,
            coreCompetency: getOwnedPropertyJSON(coreCompetency),
        };
    });
};

const getDataElementsByIndicator = (d2, indicators) => {
    const filtersForIndicator = indicators.map(indicator => {
        const fromNumerator = getDeIdsFromFormula(indicator.numerator).map(id => ["id", id]);
        const fromDenominator = getDeIdsFromFormula(indicator.denominator).map(id => ["id", id]);
        const fromComments = indicator.code ? [["code", indicator.code + "-C"]] : [];
        return { indicator, filters: _.flatten([fromNumerator, fromDenominator, fromComments]) };
    });
    const getMapping = dataElements => {
        return _(filtersForIndicator)
            .map(({ indicator, filters }) => {
                const dataElementsForIndicator = _(filters)
                    .flatMap(([key, value]) => dataElements.filter(de => de[key] === value))
                    .value();
                return [indicator.id, dataElementsForIndicator];
            })
            .fromPairs()
            .value();
    };
    const allFilters = _(filtersForIndicator)
        .flatMap("filters")
        .value();

    return getDataElements(d2, allFilters).then(getMapping);
};

const matchAll = (string, re) => {
    let match,
        matches = [];
    const globalRe = new RegExp(re, "g");
    do {
        match = globalRe.exec(string);
        if (match) {
            matches.push(match[1]);
        }
    } while (match);
    return matches;
};

const getDeIdsFromFormula = formula => {
    return matchAll(formula, /#{(\w+)/);
};

const filterDataElements = (dataElements, requiredDegIds) => {
    return dataElements.filter(dataElement => {
        const degIds = new Set(toArray(dataElement.dataElementGroups).map(deg => deg.id));
        return requiredDegIds.every(requiredDegId => degIds.has(requiredDegId));
    });
};

/* Return object {dataElementGroupId: dataElementGroupSetId} */
const getDataElementGroupRelations = d2 => {
    return d2.models.dataElementGroupSets
        .list({ fields: "id,name,displayName,dataElementGroups[id,name,displayName]" })
        .then(collection =>
            toArray(collection).map(degSet =>
                _(toArray(degSet.dataElementGroups))
                    .map(deg => [deg.id, degSet.id])
                    .fromPairs()
                    .value()
            )
        )
        .then(relationsArray => _.reduce(relationsArray, _.extend, {}));
};

/* Return object {indicatorGroupId: indicatorGroupSetId} */
const getIndicatorGroupRelations = d2 => {
    return d2.models.indicatorGroupSets
        .list({ fields: "id,displayName,indicatorGroups[id,displayName]" })
        .then(collection =>
            toArray(collection).map(igSet =>
                _(toArray(igSet.indicatorGroups))
                    .map(ig => [ig.id, igSet.id])
                    .fromPairs()
                    .value()
            )
        )
        .then(relationsArray => _.reduce(relationsArray, _.extend, {}));
};

/* Return a promise with an array of d2 items filtered by an array of [field, value] pairs */
const getFilteredItems = (model, filters, listOptions) => {
    if (_.isEmpty(filters)) {
        return Promise.resolve([]);
    } else {
        // rootJunction=OR does not work on 2.26 (it returns all unfiltered objects)
        // build a request for each filter (we have at most 2), and join the results.
        const requests = _(filters)
            .groupBy(([key, _value]) => key)
            .mapValues(pairs => pairs.map(([_key, value]) => value))
            .map((values, field) =>
                model
                    .list({
                        paging: false,
                        filter: `${field}:in:[${values.join(",")}]`,
                        ...listOptions,
                    })
                    .then(collectionToArray)
            );
        return Promise.all(requests).then(_.flatten);
    }
};

const getDataElements = async (d2, dataElementFilters) => {
    const fields = [
        "id",
        "displayName",
        "code",
        "description",
        "valueType",
        "categoryCombo[id]",
        "dataElementGroups[id]",
        "attributeValues[value,attribute[id]]",
    ];

    const dataElementGroupsFields = "id,name,displayName";

    const categoryComboFields =
        "id,name,displayName,categoryOptionCombos[id,name,displayName,categoryOptions[id,displayName]]," +
        "categories[id,name,displayName,categoryOptions[id,name,displayName]]";

    const dataElements = await getFilteredItems(d2.models.dataElements, dataElementFilters, {
        fields: fields.join(","),
    });

    const dataElementsWithCatCombos = await subQuery(
        d2,
        dataElements,
        "categoryCombo",
        categoryComboFields
    );

    const dataElementsWithGroups = await subQuery(
        d2,
        dataElementsWithCatCombos,
        "dataElementGroups",
        dataElementGroupsFields
    );

    return dataElementsWithGroups;
};

const getOutputDataElementsByCoreCompetencyId = (d2, config, coreCompetencies) => {
    const ccFilters = coreCompetencies.map(cc => ["dataElementGroups.id", cc.id]);
    return getDataElements(d2, ccFilters).then(dataElements => {
        return _(coreCompetencies)
            .map(cc => [
                cc.id,
                filterDataElements(dataElements, [cc.id, config.dataElementGroupOutputId]),
            ])
            .fromPairs()
            .value();
    });
};

const getIndicatorsByGroupName = (d2, coreCompetencies) => {
    const filters = coreCompetencies.map(cc => ["name", cc.name]);
    const fields = [
        "id",
        "name",
        "displayName",
        "indicators[id,displayName,code,numerator,denominator,indicatorGroups[id,displayName],attributeValues[value,attribute]]",
    ].join(",");

    return getFilteredItems(d2.models.indicatorGroups, filters, { fields }).then(indicatorGroups =>
        _(indicatorGroups)
            .map(indGroup => [indGroup.displayName, toArray(indGroup.indicators)])
            .fromPairs()
            .value()
    );
};

function getRandomString() {
    return (new Date().getTime().toString() + Math.random()).replace(".", "");
}
