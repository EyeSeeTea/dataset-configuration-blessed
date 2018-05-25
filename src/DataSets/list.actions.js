import Action from 'd2-ui/lib/action/Action';
import detailsStore from './details.store';
import sharingStore from './sharing.store';
import orgUnitsStore from './orgUnits.store';
import logsStore from './logs.store';
import { getInstance } from 'd2/lib/d2';
import { Observable } from 'rx';

const listActions = Action.createActionsFromNames([
  'hideDetailsBox',
  'hideSharingBox',
  'hideOrgUnitsBox',
  'hideLogs',
]);

listActions.hideDetailsBox.subscribe(() => {
    detailsStore.setState(null);
});

listActions.hideSharingBox.subscribe(() => {
    sharingStore.setState(null);
});

listActions.hideOrgUnitsBox.subscribe(() => {
    orgUnitsStore.setState(null);
});

listActions.hideLogs.subscribe(() => {
    logsStore.setState(null);
});

export default listActions;
