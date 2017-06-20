import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';

const SessionDialog = React.createClass({
    mixins: [Translate],

    getInitialState() {
        return {open: false, checkServerIntervalId: null};
    },

    componentDidMount() {
        const checkServerIntervalId = setInterval(this.checkServer, 1000*60*15);
        this.setState({checkServerIntervalId});
    },

    componentWillUnmount() {
        clearInterval(this.state.checkServerIntervalId);
    },

    checkServer() {
        this.context.d2.system.configuration.get("systemId", true).catch(err => {
            this.setState({open: true});
        });
    },

    close() {
        this.setState({open: false});
    },

    redirectToLogin() {
        const {baseUrl} = this.context.d2.system.settings.api;
        const loginUrl = `${baseUrl}/dhis-web-commons/security/login.action`;
        window.location.assign(loginUrl);
    },

    render() {
        const actions = [
            <FlatButton
                label={this.getTranslation("close")}
                primary={true}
                onTouchTap={this.close}
            />,
            <FlatButton
                label={this.getTranslation("login")}
                primary={true}
                onTouchTap={this.redirectToLogin}
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