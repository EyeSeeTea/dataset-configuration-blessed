import { getInstance as getD2 } from 'd2/lib/d2';
import Action from 'd2-ui/lib/action/Action';
import detailsStore from './details.store';
import deleteStore from './delete.store';
import orgUnitsStore from './orgUnits.store';
import logsStore from './logs.store';
import sharingStore from './sharing.store';
import { goToRoute } from '../router';
import {currentUserHasPermission} from '../utils/Dhis2Helpers';
import _ from 'lodash';

const setupActions = (actions) => {
    const actionsByName = _.keyBy(actions, "name");
    const contextActions = Action.createActionsFromNames(actions.map(a => a.name));
    const contextMenuIcons = _(actions).map(a => [a.name, a.icon || a.name]).fromPairs().value();

    const isContextActionAllowed = function(d2, selection, actionName) {
        const action = actionsByName[actionName];
        const arg = action && !action.multiple && _.isArray(selection) ? selection[0] : selection;

        if (!action || !selection || selection.length == 0) {
            return false;
        } else if (!action.multiple && selection.length != 1) {
            return false;
        } else if (action.isActive && !action.isActive(d2, arg)) {
            return false;
        } else {
            return true;
        }
    };

    actions.filter(a => a.onClick).forEach(action => {
        contextActions[action.name].subscribe(({data}) => {
            const arg = action.multiple && !_.isArray(data) ? [data] : data;
            action.onClick(arg);
        });
    });

    return {contextActions, contextMenuIcons, isContextActionAllowed};
};

const canCreate = (d2) =>
    currentUserHasPermission(d2, d2.models.dataSet, "CREATE_PRIVATE");

const canDelete = (d2, datasets) =>
    currentUserHasPermission(d2, d2.models.dataSet, "DELETE") &&
        _(datasets).every(dataset => dataset.access.delete);

const canUpdate = (d2, datasets) => {
    const publicDatasetsSelected = _(datasets).some(dataset => dataset.publicAccess.match(/^r/));
    const privateDatasetsSelected = _(datasets).some(dataset => dataset.publicAccess.match(/^-/));

    return (
        (!privateDatasetsSelected ||
            currentUserHasPermission(d2, d2.models.dataSet, "CREATE_PRIVATE")) &&
        (!publicDatasetsSelected ||
            currentUserHasPermission(d2, d2.models.dataSet, "CREATE_PUBLIC")) &&
        _(datasets).every(dataset => dataset.access.update)
    );
}

function logNRun(actionName, f) {
    // Return a function that, when called with a dataset, logs the
    // actionName and some info related to the dataset, and then calls
    // f(dataset)
    async function log(actionName, dataset) {
        const d2 = await getD2();
        const store = await d2.dataStore.get('dataset-configuration');
        const logs = await store.get('logs').catch(() => []);
        logs.push({date: Date(),
                   action: actionName,
                   user: {displayName: d2.currentUser.name,
                          username: d2.currentUser.username,
                          id: d2.currentUser.id},
                   dataset: {displayName: dataset.name,
                             id: dataset.id}});
        store.set('logs', logs);
    }
    return (dataset) => {
        log(actionName, dataset);
        f(dataset);
    }
}

const {contextActions, contextMenuIcons, isContextActionAllowed} = setupActions([
    {
        name: 'edit',
        multiple: false,
        isActive: (d2, dataset) => canUpdate(d2, [dataset]),
        onClick: logNRun('edit', dataset => goToRoute(`/datasets/edit/${dataset.id}`)),
    },
    {
        name: 'share',
        multiple: true,
        onClick: logNRun('share', datasets => sharingStore.setState(datasets)),
    },
    {
        name: 'define_associations',
        multiple: true,
        icon: "business",
        isActive: canUpdate,
        onClick: logNRun('define associations', datasets => orgUnitsStore.setState(datasets)),
    },
    {
        name: 'details',
        multiple: false,
        onClick: dataset => detailsStore.setState(dataset),
    },
    {
        name: 'clone',
        multiple: false,
        icon: "content_copy",
        isActive: canCreate,
        onClick: logNRun('clone', dataset => goToRoute(`/datasets/clone/${dataset.id}`)),
    },
    {
        name: 'delete',
        multiple: true,
        isActive: canDelete,
        onClick: logNRun('delete', datasets => deleteStore.delete(datasets)),
    },
    {
        name: 'logs',
        multiple: true,
        icon: "list",
        onClick: datasets => logsStore.setState(datasets),
    },
]);

exports.contextActions = contextActions;
exports.contextMenuIcons = contextMenuIcons;
exports.isContextActionAllowed = isContextActionAllowed;
