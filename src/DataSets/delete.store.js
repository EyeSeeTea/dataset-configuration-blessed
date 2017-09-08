import { getInstance as getD2 } from 'd2/lib/d2';
import snackActions from '../Snackbar/snack.actions';
import Store from 'd2-ui/lib/store/Store';

export default Store.create({
  delete(datasets) {
    getD2().then(d2 => {
        snackActions.show({
            message: d2.i18n.getTranslation("confirm_delete_dataset"),
            action: 'confirm',
            onActionTouchTap: () => {
                const payload = {dataSets: datasets.map(ds => ({id: ds.id}))};
                d2.Api.getApi().post(`metadata?importStrategy=DELETE`, payload)
                    .then(response => {
                        snackActions.show({message: d2.i18n.getTranslation("dataset_deleted")});
                        this.setState(response);
                    })
                    .catch(response => {
                        snackActions.show({message: response.message || 'Error'});
                    });
            }
        });
    });
  }
});
