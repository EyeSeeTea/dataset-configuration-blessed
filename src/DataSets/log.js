import React from 'react';
import { getInstance as getD2 } from 'd2/lib/d2';

const maxLogsPerPage = 200;  // TODO: maybe make it readable from the dataStore
const maxLogPages = 100;


async function log(actionName, status, datasets) {
    // Log the name of the action that has been executed, its status
    // ("success", "failed"), by whom and on which datasets.
    const store = await getStore();
    const logs = await getLogs([0], store);
    logs.push(await makeEntry(actionName, status, datasets));
    setLogs(logs, store);
}

async function makeEntry(actionName, status, datasets) {
    // Return an object (a "dictionary") with the information we want to log.
    datasets = Array.isArray(datasets) ? datasets : [datasets];
    const user = await getD2().then(d2 => d2.currentUser);
    return {
        date: new Date().toISOString(),
        action: actionName,
        status: status,
        user: {
            displayName: user.name,
            username: user.username,
            id: user.id,
        },
        datasets: datasets.map(ds => ({
            displayName: ds.name,
            id: ds.id,
        })),
    };
}

async function getLogs(pages, store) {
    // Return the concatenated logs for the given pages (relative to
    // logsPageCurrent) if they exist, or an empty list otherwise.
    pages = pages || [-1, 0];
    store = store ? store : await getStore();
    const logsPageCurrent = await get('logs-page-current', 0, store);
    const pagesNames = pages.map(n => 'logs-page-' + mod(logsPageCurrent + n, maxLogPages));
    const logs = await Promise.all(pagesNames.map(name => get(name, [], store)));
    return [].concat(...logs);
}

async function setLogs(logs, store) {
    // Save the given list of logs in the current page index and
    // increase it if necessary.
    const logsPageCurrent = await get('logs-page-current', 0, store);
    store.set('logs-page-' + logsPageCurrent, logs);
    if (logs.length >= maxLogsPerPage)
        store.set('logs-page-current', mod(logsPageCurrent + 1, maxLogPages));
}

async function get(key, defaultValue, store) {
    // Return the value for key in the store.
    return await store.get(key).catch(() => defaultValue);
}

async function getStore() {
    // Retrieve and return our dataStore.
    const d2 = await getD2();
    return await d2.dataStore.get('dataset-configuration');
}

function mod(n, m) {
    return ((n % m) + m) % m;
    // Because javascript is retarded and the modulo operation can be negative.
}

// Simple component to show a log entry.
function LogEntry(props) {
    return (<div key={props.date} style={{paddingBottom: "15px"}}>
                <b>Date:</b> {props.date} <br />
                <b>Action:</b> {props.action} <br />
                <b>Status:</b> {props.status} <br />
                <b>User:</b> {props.user.displayName} ({props.user.username})<br />
                <b>Datasets:</b> {props.datasets.map(ds => `${ds.displayName} (${ds.id}) `).join(', ')} <br />
            </div>);
}


export { log, getLogs, LogEntry };
