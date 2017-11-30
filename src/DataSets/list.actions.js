import Action from 'd2-ui/lib/action/Action';
import detailsStore from './details.store';
import sharingStore from './sharing.store';
import orgUnitsStore from './orgUnits.store';
import { getInstance } from 'd2/lib/d2';
import { Observable } from 'rx';

const listActions = Action.createActionsFromNames([
  'getNextPage',
  'getPreviousPage',
  'hideDetailsBox',
  'hideSharingBox',
  'hideOrgUnitsBox',
]);

// TODO: For simple action mapping like this we should be able to do something less boiler plate like
listActions.getNextPage.subscribe(() => {
    // listStore.getNextPage();
});

listActions.getPreviousPage.subscribe(() => {
    // listStore.getPreviousPage();
});

listActions.hideDetailsBox.subscribe(() => {
    detailsStore.setState(null);
});

listActions.hideSharingBox.subscribe(() => {
    sharingStore.setState(null);
});

listActions.hideOrgUnitsBox.subscribe(() => {
    orgUnitsStore.setState(null);
});

export default listActions;