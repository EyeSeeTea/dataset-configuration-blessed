import React from "react";
import PropTypes from "prop-types";

import headerBarStore$ from "d2-ui/lib/app-header/headerBar.store";
import withStateFrom from "d2-ui/lib/component-helpers/withStateFrom";
import HeaderBarComponent from "d2-ui/lib/app-header/HeaderBar";
import AppWithD2 from "d2-ui/lib/app/AppWithD2.component";
import LoadingMask from "../LoadingMask/LoadingMask.component";
import MainContent from "d2-ui/lib/layout/main-content/MainContent.component";
import SinglePanelLayout from "d2-ui/lib/layout/SinglePanel.component";
import { getInstance } from "d2/lib/d2";
import OldMuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import appTheme from "./app.theme";
import SnackbarContainer from "../Snackbar/SnackbarContainer.component";
import SessionDialog from "../SessionDialog/SessionDialog.component";
import { MuiThemeProvider } from "@material-ui/core/styles";
import { createGenerateClassName, StylesProvider } from "@material-ui/styles";
import { muiTheme } from "./dhis2.theme";

const HeaderBar = withStateFrom(headerBarStore$, HeaderBarComponent);

const generateClassName = createGenerateClassName({
    productionPrefix: "c",
});

class App extends AppWithD2 {
    getChildContext() {
        return super.getChildContext();
    }

    childContextTypes = {
        d2: PropTypes.object,
    };

    render() {
        if (!this.state.d2) {
            return <LoadingMask />;
        }
        return (
            <StylesProvider generateClassName={generateClassName}>
                <MuiThemeProvider theme={muiTheme}>
                    <OldMuiThemeProvider muiTheme={appTheme}>
                        <div>
                            <HeaderBar
                                showAppTitle="Dataset-Configuration"
                                styles={{ background: "#3c3c3c" }}
                            />

                            <SinglePanelLayout style={{ marginTop: "3.5rem" }}>
                                <MainContent>{this.props.children}</MainContent>
                            </SinglePanelLayout>

                            <SnackbarContainer />

                            <SessionDialog />
                        </div>
                    </OldMuiThemeProvider>
                </MuiThemeProvider>
            </StylesProvider>
        );
    }
}

App.defaultProps = {
    d2: getInstance(),
};

export default App;
