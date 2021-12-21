import { getDataSetsForPeriods, saveDataSets } from "../models/data-periods";
import DataSetStore from "../models/DataSetStore";
import Settings from "../models/Settings";
import { mapPromise } from "../utils/Dhis2Helpers";

export default async function run(d2, options_) {
    const { dataSetNamePattern } = options_ || {};
    const api = d2.Api.getApi();
    const config = await new Settings(d2).get();
    const createdByAppId = config.createdByDataSetConfigurationAttributeId;

    const dataSetsUrl = "/dataSets.json?paging=false&fields=id,name,attributeValues";
    const allDataSets = (await api.get(dataSetsUrl)).dataSets;
    const dataSetRefs = allDataSets
        .filter(ds =>
            _.some(
                ds.attributeValues,
                av => av.attribute.id === createdByAppId && av.value === "true"
            )
        )
        .filter(ds => !dataSetNamePattern || ds.name.includes(dataSetNamePattern));

    console.log(`Datasets count: ${dataSetRefs.length}`);
    if (dataSetRefs.length === 0) return;

    return mapPromise(dataSetRefs, async ({ id, name }) => {
        console.log(`Get dataset: ${name} (${id})`);
        const { dataSets, store } = await getDataSetsForPeriods(d2, [id]);

        const res = _.first(await saveDataSets(d2, store, dataSets));
        console.log(`Dataset saved: ${name} (${id})`, res.status);
    });
}
