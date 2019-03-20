import React from "react";
import { getInstance as getD2 } from "d2/lib/d2";

const maxLogsPerPage = 200; // TODO: maybe make it readable from the dataStore
const maxLogPages = 100;

async function log(actionName, status, datasets) {
    // Log the name of the action that has been executed, its status
    // ("success", "failed"), by whom and on which datasets.
    const logs = ((await getLogs([0])) || { logs: [] }).logs;
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

async function getLogs(pages = [0, 1]) {
    // Return the concatenated logs for the given pages (relative to
    // currentPage) if they exist, or an empty list otherwise.
    // It returns null when there are no more log pages.
    if (pages.every(n => n >= maxLogPages)) return null;

    const store = await getStore();
    const currentPage = await getCurrentPage(store);
    const pagesNames = pages.map(n => "logs-page-" + mod(currentPage - n, maxLogPages));
    const storeKeys = new Set(await store.getKeys());
    const existingPageNames = pagesNames.filter(name => storeKeys.has(name));

    if (_(existingPageNames).isEmpty()) {
        return null;
    } else {
        const existingPages = _(Array.from(storeKeys))
            .map(key => key.match(/^logs-page-(\d+)$/))
            .map(match => (match ? parseInt(match[1]) : null))
            .reject(_.isNull)
            .value();
        const nextPage = _.max(pages) + 1;
        const nextPageIndex = mod(currentPage - nextPage, maxLogPages);
        const hasMore = nextPage < maxLogPages && existingPages.includes(nextPageIndex);
        const logs = await Promise.all(existingPageNames.map(name => store.get(name)));
        const orderedLogs = _(logs)
            .filter()
            .flatten()
            .orderBy("date", "desc")
            .value();

        return { logs: orderedLogs, hasMore };
    }
}

function getCurrentPage(store) {
    return store.get("logs-page-current").catch(err => {
        if (err.httpStatusCode === 404) {
            return store.set("logs-page-current", 0).then(() => 0);
        } else {
            throw err;
        }
    });
}

async function setLogs(logs) {
    // Save the given list of logs in the current page index and update the page index.
    const store = await getStore();
    const currentPage = await getCurrentPage(store);
    const nextCurrentPage =
        logs.length < maxLogsPerPage ? currentPage : mod(currentPage + 1, maxLogPages);

    return Promise.all([
        store.set("logs-page-" + currentPage, logs),
        ...(nextCurrentPage === currentPage
            ? []
            : [
                  store.set("logs-page-current", nextCurrentPage),
                  store.set(`logs-page-${nextCurrentPage}`, []),
              ]),
    ]);
}

async function getStore() {
    const d2 = await getD2();
    return d2.dataStore.get("dataset-configuration");
}

function mod(n, m) {
    return ((n % m) + m) % m; // the modulo operation can be negative otherwise...
}

function formatDate(isoDate) {
    return new Date(isoDate).toLocaleString();
}

// Simple component to show a log entry.
function LogEntry(props) {
    return (
        <div key={props.date} style={{ paddingBottom: "15px" }}>
            <b>Date:</b> {formatDate(props.date)} <br />
            <b>Action:</b> {props.action} <br />
            <b>Status:</b> {props.status} <br />
            <b>User:</b> {props.user.displayName} ({props.user.username})<br />
            <b>Datasets:</b> {props.datasets.map(ds => `${ds.displayName} (${ds.id})`).join(", ")}{" "}
            <br />
        </div>
    );
}

export { log, getLogs, LogEntry };
