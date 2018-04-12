import Action from 'd2-ui/lib/action/Action';
import detailsStore from './details.store';
import deleteStore from './delete.store';
import orgUnitsStore from './orgUnits.store';
import logsStore from './logs.store';
import sharingStore from './sharing.store';
import { goToRoute } from '../router';
import Settings from '../models/Settings';
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

const requiredAuthorities = ["F_SECTION_DELETE", "F_SECTION_ADD"];

const hasRequiredAuthorities = (d2) =>
    requiredAuthorities.every(authority => d2.currentUser.authorities.has(authority));

const canCreate = (d2) =>
    d2.currentUser.canCreate(d2.models.dataSets) && hasRequiredAuthorities;

const canDelete = (d2, datasets) =>
    d2.currentUser.canDelete(d2.models.dataSets) &&
        _(datasets).every(dataset => dataset.access.delete) &&
        hasRequiredAuthorities;

const canUpdate = (d2, datasets) => {
    const publicDatasetsSelected = _(datasets).some(dataset => dataset.publicAccess.match(/^r/));
    const privateDatasetsSelected = _(datasets).some(dataset => dataset.publicAccess.match(/^-/));
    const datasetsUpdatable = _(datasets).every(dataset => dataset.access.update);
    const privateCondition = !privateDatasetsSelected || d2.currentUser.canCreatePrivate(d2.models.dataSets);
    const publicCondition = !publicDatasetsSelected || d2.currentUser.canCreatePublic(d2.models.dataSets);

    return hasRequiredAuthorities && privateCondition && publicCondition && datasetsUpdatable;
}

const hasAdminRole = (d2) =>
    new Settings(d2).currentUserHasAdminRole();

const {contextActions, contextMenuIcons, isContextActionAllowed} = setupActions([
    {
        name: 'edit',
        multiple: false,
        isActive: (d2, dataset) => canUpdate(d2, [dataset]),
        onClick: dataset => goToRoute(`/datasets/edit/${dataset.id}`),
    },
    {
        name: 'share',
        multiple: true,
        onClick: datasets => sharingStore.setState(datasets),
    },
    {
        name: 'define_associations',
        multiple: true,
        icon: "business",
        isActive: canUpdate,
        onClick: datasets => orgUnitsStore.setState(datasets),
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
        onClick: dataset => goToRoute(`/datasets/clone/${dataset.id}`),
    },
    {
        name: 'delete',
        multiple: true,
        isActive: canDelete,
        onClick: datasets => deleteStore.delete(datasets),
    },
    {
        name: 'logs',
        multiple: true,
        icon: "list",
        isActive: hasAdminRole,
        onClick: datasets => logsStore.setState(datasets),
    },
]);

exports.contextActions = contextActions;
exports.contextMenuIcons = contextMenuIcons;
exports.isContextActionAllowed = isContextActionAllowed;
