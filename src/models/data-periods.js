import moment from "moment";

import _ from "../utils/lodash-mixins";
import { setAttributes, postMetadata } from "../utils/Dhis2Helpers";
import Settings from "./Settings";
import DataSetStore from "./DataSetStore";
import { getOwnedPropertyJSON } from "d2/lib/model/helpers/json";

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

    const [dataSetsClean, dataEntryFormsUpdated] = _(dataSetsWithForms)
        .map(dataSet => {
            const htmlCode = (dataSet.dataEntryForm && dataSet.dataEntryForm.htmlCode) || "";
            // Regenerating the full form for a group of datasets would be very slow.
            // Instead, we only replace the JS code that sets the period dates. This assumes
            // that the data sets involved have been at least saved once with the periods
            // infrastructure active and have the last version of the forms.
            const newHtmlCode = htmlCode.replace(
                /setPeriodDates\({.*}\)/,
                `setPeriodDates(${JSON.stringify(periodDates)})`
            );
            const dataEntryFormUpdated = htmlCode
                ? { ...dataSet.dataEntryForm, htmlCode: newHtmlCode }
                : null;
            const dataSetClean = Object.assign(dataSet, {
                dataEntryForm: { id: dataSet.dataEntryForm.id },
            });

            return [dataSetClean, dataEntryFormUpdated];
        })
        .unzip()
        .value();

    const dataSetsUpdated = dataSetsClean.map(dataSet => ({
        ...getOwnedPropertyJSON(dataSet),
        attributeValues: getAttributeValues(store, dataSet),
        dataInputPeriods: store.getDataInputPeriods(associations),
        openFuturePeriods: storeDataset.openFuturePeriods,
    }));

    const payload = {
        update: {
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
