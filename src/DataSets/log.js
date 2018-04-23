import React from 'react';
import { getInstance as getD2 } from 'd2/lib/d2';

const maxLogsPerPage = 200;  // TODO: maybe make it readable from the dataStore
const maxLogPages = 100;


async function log(actionName, status, datasets) {
    // Log the name of the action that has been executed, its status
    // ("success", "failed"), by whom and on which datasets.
    const logs = await getLogs([0]);
    logs.push(await makeEntry(actionName, status, datasets));
    return setLogs(logs);
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

async function getLogs(pages) {
    // Return the concatenated logs for the given pages (relative to
    // logsPageCurrent) if they exist, or an empty list otherwise.
    // It returns null when there are no more log pages.
    pages = pages || [0, 1];  // by default, take the last two pages
    if (pages.every(n => n >= maxLogPages))
        return null;

    const store = await getStore();
    const logsPageCurrent = await store.get('logs-page-current').catch(() => 0);
    const pagesNames = pages.map(n => 'logs-page-' + mod(logsPageCurrent - n, maxLogPages));
    const logs = await Promise.all(pagesNames.map(name => store.get(name).catch(() => null)));
    if (logs.every(log => log === null))
        return null;
    else
        return _.flatten(_.filter(logs));
}

async function setLogs(logs) {
    // Save the given list of logs in the current page index and
    // update the page index.
    const store = await getStore();
    const logsPageCurrent = await store.get('logs-page-current').catch(() => 0);
    return Promise.all([
        store.set('logs-page-' + logsPageCurrent, logs),
        store.set('logs-page-current', logs.length < maxLogsPerPage ?
                  logsPageCurrent : mod(logsPageCurrent + 1, maxLogPages)),
        ]);
}

async function getStore() {
    const d2 = await getD2();
    return d2.dataStore.get('dataset-configuration');
}

function mod(n, m) {
    return ((n % m) + m) % m;  // the modulo operation can be negative otherwise...
}

// Simple component to show a log entry.
function LogEntry(props) {
    return (
        <div key={props.date} style={{paddingBottom: "15px"}}>
            <b>Date:</b> {props.date} <br />
            <b>Action:</b> {props.action} <br />
            <b>Status:</b> {props.status} <br />
            <b>User:</b> {props.user.displayName} ({props.user.username})<br />
            <b>Datasets:</b> {props.datasets.map(ds => `${ds.displayName} (${ds.id}) `).join(', ')} <br />
        </div>
    );
}


export { log, getLogs, LogEntry };
