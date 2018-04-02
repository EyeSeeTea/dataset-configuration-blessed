import { getInstance as getD2 } from 'd2/lib/d2';


async function log(actionName, status, dataset) {
    // Log the name of the action that has been executed, its status
    // ("success", "failed"), by whom and on which datasets.
    const maxLogs = 4;

    const d2 = await getD2();
    const store = await d2.dataStore.get('dataset-configuration');

    const logIndex = await store.get('logIndex').catch(() => 0);
    const logs = await store.get('logs').catch(() => []);

    const datasets = Array.isArray(dataset) ? dataset : [dataset];

    const newLog = {date: Date(),
                    action: actionName,
                    status: status,
                    user: {displayName: d2.currentUser.name,
                           username: d2.currentUser.username,
                           id: d2.currentUser.id},
                    datasets: datasets.map(ds => ({displayName: ds.name,
                                                   id: ds.id}))};

    if (logs.length < maxLogs)
        logs.push(newLog)
    else
        logs[logIndex] = newLog;

    store.set('logIndex', (logIndex + 1) % maxLogs);
    store.set('logs', logs);
}


function prettyPrint(log) {
    // Return a pretty string describing the log entry.
    return (`Date: ${log.date}\n` +
            `Action: ${log.action}\n`);
    // JSON.stringify(logs)});
}

export { log, prettyPrint };
