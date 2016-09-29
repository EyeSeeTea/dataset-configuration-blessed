import Action from 'd2-ui/lib/action/Action';
import { config, getInstance as getD2 } from 'd2/lib/d2';
import detailsStore from './details.store';
import log from 'loglevel';
import { goToRoute } from '../router';
import { Subject } from 'rx';

export const afterDeleteHook$ = new Subject();

const contextActions = Action.createActionsFromNames([
    'edit',
    'share',
    'delete',
    'details',
    'assignToOrgUnits'
]);

const confirm = (message) => new Promise((resolve, reject) => {
    if (window.confirm(message)) {
        resolve();
    }
    reject();
});

contextActions.details
    .subscribe(({ data: model }) => {
        console.log(model)
        detailsStore.setState(model);
    });

contextActions.edit
    .subscribe(({ data: model }) => getD2()
        .then(d2 => {
            console.log(model)
            goToRoute("wizard");
        })
    );

contextActions.share
    .subscribe(({ data: model }) => getD2()
        .then(d2 => {
            alert("TODO sharing dataset: ",model.displayName);
            console.log(model.id);
        })
    );

contextActions.delete
    .subscribe(({ data: model }) => getD2()
        .then(d2 => {            
            alert("TODO deleting dataset: ");
        })
    );

contextActions.assignToOrgUnits
    .subscribe(({ data: model }) => getD2()
        .then(d2 => {
            alert("TODO assignToOrgUnits dataset: ");
        })
    );

const contextMenuIcons = {
    sharing: 'share',
    assignToOrgUnits: 'business',
};

const isContextActionAllowed = function(model, action) {
    return true;
};

exports.contextActions = contextActions;
exports.contextMenuIcons = contextMenuIcons;
exports.isContextActionAllowed = isContextActionAllowed;
