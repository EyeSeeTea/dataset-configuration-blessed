import Action from 'd2-ui/lib/action/Action';
import detailsStore from './details.store';
import deleteStore from './delete.store';
import orgUnitsStore from './orgUnits.store';
import sharingStore from './sharing.store';
import { goToRoute } from '../router';
import _ from 'lodash';

const setupActions = (actions) => {
    const actionsByName = _.keyBy(actions, "name");
    const contextActions = Action.createActionsFromNames(actions.map(a => a.name));
    const contextMenuIcons = _(actions).map(a => [a.name, a.icon || a.name]).fromPairs().value();

    const isContextActionAllowed = function(selection, actionName) {
        const action = actionsByName[actionName];

        if (!action || !selection) {
            return false;
        } else if (!action.multiple && selection.length != 1) {
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

const {contextActions, contextMenuIcons, isContextActionAllowed} = setupActions([
    {
        name: 'edit',
        multiple: false,
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
        onClick: dataset => goToRoute(`/datasets/clone/${dataset.id}`),
    },
    {
        name: 'delete',
        multiple: true,
        onClick: datasets => deleteStore.delete(datasets),
    },
]);

exports.contextActions = contextActions;
exports.contextMenuIcons = contextMenuIcons;
exports.isContextActionAllowed = isContextActionAllowed;
