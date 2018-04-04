import React from 'react';
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


// Simple component to show a log entry.
function LogEntry(props) {
    return (<div key={props.date} style={{paddingBottom: '10px'}}>
                <b>Date:</b> {props.date} <br />
                <b>Action:</b> {props.action} <br />
                <b>Status:</b> {props.status} <br />
                <b>User:</b> {props.user.displayName} ({props.user.username})<br />
                <b>Datasets:</b> {props.datasets.map(ds => ds.displayName)} <br />
            </div>);
}


export { log, LogEntry };
