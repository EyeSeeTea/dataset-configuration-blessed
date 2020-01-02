import React from "react";
import createReactClass from 'create-react-class';
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import Translate from "d2-ui/lib/i18n/Translate.mixin";
import { redirectToLogin } from "../utils/Dhis2Helpers";

const SessionDialog = createReactClass({
    mixins: [Translate],

    getInitialState() {
        return { open: false, checkServerIntervalId: null };
    },

    componentDidMount() {
        const checkServerIntervalId = setInterval(this.checkServer, 1000 * 60 * 15);
        this.setState({ checkServerIntervalId });
    },

    componentWillUnmount() {
        clearInterval(this.state.checkServerIntervalId);
    },

    checkServer() {
        this.context.d2.system.configuration.get("systemId", true).catch(_err => {
            this.setState({ open: true });
        });
    },

    close() {
        this.setState({ open: false });
    },

    render() {
        const actions = [
            <FlatButton
                label={this.getTranslation("close")}
                primary={true}
                onClick={this.close}
            />,
            <FlatButton
                label={this.getTranslation("login")}
                primary={true}
                onClick={() => redirectToLogin(this.context.d2.system.settings.api.baseUrl)}
            />,
        ];

        return (
            <Dialog
                title={this.getTranslation("not_logged")}
                actions={actions}
                modal={true}
                open={this.state.open}
            >
                {this.getTranslation("not_logged_or_expired")}
            </Dialog>
        );
    },
});

export default SessionDialog;
