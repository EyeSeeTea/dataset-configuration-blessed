import moment from "moment";
import { generateUid } from "d2/lib/uid";

import _ from "../utils/lodash-mixins";
import { setAttributes, postMetadata, getCategoryCombos, mapPromise, getOwnedPropertyJSON } from "../utils/Dhis2Helpers";
import Settings from "./Settings";
import DataSetStore from "./DataSetStore";

const dataInputPeriodDatesFormat = "YYYYMMDD";

export async function getDataSets(d2, ids) {
    return await d2.models.dataSets
        .list({
            fields: "id,attributeValues,dataInputPeriods[id,openingDate,closingDate,period]",
            filter: `id:in:[${ids.join(",")}]`,
            paging: false,
        })
        .then(collection => collection.toArray());
}

export function getAttributeValues(store, dataset) {
    const { config } = store;
    const attributeKeys = ["dataPeriodOutputDatesAttributeId", "dataPeriodOutcomeDatesAttributeId"];
    const missingAttributeKeys = attributeKeys.filter(key => !config[key]);
    const oldAttributeValues = (dataset && dataset.attributeValues) || [];

    if (!_(missingAttributeKeys).isEmpty()) {
        console.error(`Missing settings: ${missingAttributeKeys.join(", ")}`);
        return oldAttributeValues;
    }

    const periodDates = store.getPeriodDates();
    const years = store.getPeriodYears();
    const valuesByKey = {
        dataPeriodOutputDatesAttributeId: formatPeriodDates(periodDates.output, years),
        dataPeriodOutcomeDatesAttributeId: formatPeriodDates(periodDates.outcome, years),
    };
    const newValues = _.mapKeys(valuesByKey, (_value, key) => config[key]);

    return setAttributes(oldAttributeValues, newValues);
}

let categoryCombos = null;

async function getCachedCategoryCombos(d2) {
    categoryCombos =
        categoryCombos || (await getCategoryCombos(d2, { cocFields: "id,categoryOptions[id]" }));
    return categoryCombos;
}

export async function saveDataSets(d2, store, dataSets) {
    const { dataset: storeDataset, associations } = store;

    const dataSetsWithForms = await d2.models.dataSets
        .list({
            fields: ":owner,dataEntryForm[:owner]",
            filter: `id:in:[${dataSets.map(ds => ds.id).join(",")}]`,
            paging: false,
        })
        .then(collection => collection.toArray());

    const periodDates = store.getPeriodDates();
    categoryCombos = null;

    const pairs = await mapPromise(dataSetsWithForms, async dataSet => {
        const htmlCode = (dataSet.dataEntryForm && dataSet.dataEntryForm.htmlCode) || "";
        const regexp = /setPeriodDates\({.*}\)/;
        const newJsCode = `setPeriodDates(${JSON.stringify(periodDates)})`;

        const formPayload = htmlCode.match(regexp)
            ? { htmlCode: htmlCode.replace(regexp, newJsCode) }
            : await store.buildCustomForm(await getCachedCategoryCombos(d2));

        const id = (dataSet.dataEntryForm ? dataSet.dataEntryForm.id : null) || generateUid();
        const dataEntryFormUpdated = {
            ...dataSet.dataEntryForm,
            ...formPayload,
            id: id,
            name: [dataSet.id, id].join("-"),
        };
        dataSet.dataEntryForm = { id: dataEntryFormUpdated.id };

        return [dataSet, dataEntryFormUpdated];
    });
    const [dataSetsClean, dataEntryFormsUpdated] = _.unzip(pairs);

    const dataSetsUpdated = dataSetsClean.map(dataSet => ({
        ...getOwnedPropertyJSON(dataSet),
        attributeValues: getAttributeValues(store, dataSet),
        dataInputPeriods: store.getDataInputPeriods(associations),
        openFuturePeriods: storeDataset.openFuturePeriods,
    }));

    const payload = {
        create_and_update: {
            dataSets: dataSetsUpdated,
            dataEntryForms: _.compact(dataEntryFormsUpdated),
        },
    };

    return postMetadata(d2, payload);
}

export async function getDataSetsForPeriods(d2, dataSetIds) {
    const dataSets = await getDataSets(d2, dataSetIds);
    const config = await new Settings(d2).get();
    const store = await DataSetStore.edit(d2, config, dataSetIds[0]);
    const [startDates, endDates] = _(dataSets)
        .map(getDataInputDates)
        .map(o => [o.dataInputStartDate, o.dataInputEndDate])
        .unzip()
        .value();
    const areDatesEqual = dates =>
        _(dates)
            .map(date => (date ? date.toISOString() : null))
            .uniq()
            .thru(dates => dates.length === 1)
            .value();

    const allDatesEqual = areDatesEqual(startDates) && areDatesEqual(endDates);

    if (!allDatesEqual) {
        _.assign(store.associations, {
            dataInputStartDate: undefined,
            dataInputEndDate: undefined,
            periodDatesApplyToAll: {
                output: false,
                outcome: false,
            },
            periodDates: {
                output: {},
                outcome: {},
            },
        });
    }
    return { store, dataSets, allDatesEqual };
}

export function getDataInputDates(dataset) {
    const getDate = value => (value ? new Date(value) : undefined);

    const dataInputStartDate = getDate(
        _(dataset.dataInputPeriods)
            .map("openingDate")
            .compact()
            .min()
    );
    const dataInputEndDate = getDate(
        _(dataset.dataInputPeriods)
            .map("closingDate")
            .compact()
            .max()
    );

    return { dataInputStartDate, dataInputEndDate };
}

function formatDate(value) {
    const date = moment(value);
    return value && date.isValid() ? date.format(dataInputPeriodDatesFormat) : "";
}

function formatPeriodDates(dates, years) {
    return _(dates)
        .toPairs()
        .sortBy(([year, _period]) => year)
        .filter(([year, _period]) => years.includes(parseInt(year)))
        .map(([year, { start, end }]) => `${year}=${formatDate(start)}-${formatDate(end)}`)
        .join(",");
}
