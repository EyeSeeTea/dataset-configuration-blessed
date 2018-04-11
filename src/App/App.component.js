import React from 'react';
import log from 'loglevel';

import headerBarStore$ from 'd2-ui/lib/app-header/headerBar.store';
import withStateFrom from 'd2-ui/lib/component-helpers/withStateFrom';
import HeaderBarComponent from 'd2-ui/lib/app-header/HeaderBar';
import AppWithD2 from 'd2-ui/lib/app/AppWithD2.component';
import LoadingMask from '../LoadingMask/LoadingMask.component';
import MainContent from 'd2-ui/lib/layout/main-content/MainContent.component';
import SinglePanelLayout from 'd2-ui/lib/layout/SinglePanel.component';
import { getInstance } from 'd2/lib/d2';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import appTheme from './app.theme';
import SnackbarContainer from '../Snackbar/SnackbarContainer.component';
import SessionDialog from '../SessionDialog/SessionDialog.component';
import feedbackOptions from '../config/feedback';
import {getUserGroups, sendMessage} from '../utils/Dhis2Helpers';
import _ from '../utils/lodash-mixins';

const HeaderBar = withStateFrom(headerBarStore$, HeaderBarComponent);

class App extends AppWithD2 {
    getChildContext() {
        return super.getChildContext();
    }

    componentDidMount() {
        super.componentDidMount();
        this.setupFeedback();
    }

    sendFeedbackToUserGroups(payload) {
        const {d2} = this.state;
        const userGroupNames = feedbackOptions.sendToDhis2UserGroups;
        const {title, body} = payload;

        if (d2 && !_(userGroupNames).isEmpty()) {
            return getUserGroups(d2, userGroupNames)
                .then(userGroups => sendMessage(d2, title, body, userGroups.toArray()))
                .catch(err => { alert("Cannot send dhis2 message"); });
        }
    }

    setupFeedback() {
        const options = _.imerge(feedbackOptions, {postFunction: this.sendFeedbackToUserGroups.bind(this)});
        $.feedbackGithub(options);
    }

    render() {
        if (!this.state.d2) {
            return (<LoadingMask />);
        }
        return (
            <MuiThemeProvider muiTheme={appTheme}>
                <div>
                    <HeaderBar showAppTitle="dataset-configuration" styles={{background: '#3c3c3c'}} />

                    <SinglePanelLayout style={{marginTop: "3.5rem"}}>
                        <MainContent>
                            {this.props.children}
                        </MainContent>
                    </SinglePanelLayout>

                    <SnackbarContainer />

                    <SessionDialog />
                </div>
            </MuiThemeProvider>
        );
    }
};

App.defaultProps = {
    d2: getInstance(),
};

App.childContextTypes = AppWithD2.childContextTypes;

export default App;
