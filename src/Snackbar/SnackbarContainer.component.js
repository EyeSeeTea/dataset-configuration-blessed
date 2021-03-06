import React from "react";
import createReactClass from 'create-react-class';
import Snackbar from "material-ui/Snackbar/Snackbar";
import snackStore from "./snack.store";
import ObserverRegistry from "../utils/ObserverRegistry.mixin";
import log from "loglevel";

const SnackBarContainer = createReactClass({
    mixins: [ObserverRegistry],

    getInitialState() {
        return {
            show: false,
            snack: {
                message: "",
            },
        };
    },

    UNSAFE_componentWillMount() {
        const snackStoreDisposable = snackStore.subscribe(snack => {
            if (snack) {
                this.setState({
                    snack,
                    show: true,
                });
            } else {
                this.setState({
                    show: false,
                });
            }
        }, log.debug.bind(log));

        this.registerDisposable(snackStoreDisposable);
    },

    _closeSnackbar() {
        this.setState({
            show: false,
        });
    },

    render() {
        if (!this.state.snack) {
            return null;
        }

        return (
            <Snackbar
                style={{ maxWidth: "auto", zIndex: 5 }}
                bodyStyle={{
                    maxWidth: "auto",
                    maxHeight: "800px",
                    height: "auto",
                    lineHeight: "28px",
                    padding: 10,
                    whiteSpace: "pre-line",
                }}
                ref="snackbar"
                message={this.state.snack.message}
                action={this.state.snack.action}
                autoHideDuration={0}
                open={this.state.show}
                onActionClick={this.state.snack.onActionClick}
                onRequestClose={this._closeSnackbar}
            />
        );
    },
});

export default SnackBarContainer;
