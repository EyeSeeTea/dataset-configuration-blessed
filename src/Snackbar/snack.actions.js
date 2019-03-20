import Action from "d2-ui/lib/action/Action";
import snackStore from "./snack.store";
import { config, getInstance as getD2 } from "d2/lib/d2";
import { goToRoute } from "../router";

const snackActions = Action.createActionsFromNames(["show", "showAndRedirect", "hide"]);

snackActions.show.subscribe(actionConfig => {
    const {
        message,
        action,
        autoHideDuration,
        onActionTouchTap,
        translate,
        route,
    } = actionConfig.data;

    if (route) {
        goToRoute(route);
    }

    getD2().then(d2 => {
        snackStore.setState({
            message: translate ? d2.i18n.getTranslation(message) : message,
            action: action || "ok",
            autoHideDuration,
            onActionTouchTap:
                onActionTouchTap ||
                (() => {
                    snackActions.hide();
                }),
        });
    });
});

snackActions.hide.subscribe(() => {
    snackStore.setState(null);
});

export default snackActions;
