import React from 'react';
import { Router, Route, IndexRoute, browserHistory, IndexRedirect } from 'react-router';
import log from 'loglevel';
import App from './App/App.component';
import Datasets from './DataSets/DataSets.component';
import Wizard from './Wizard/Wizard.component';

const routes = (
    <Router history={browserHistory}>
        <Route path="/" component={App}>
            <IndexRedirect to="datasets" />
            <Route path="datasets" component={Datasets}/>
            <Route path="wizard" component={Wizard}/>
        </Route>
    </Router>
);

export function goToRoute(url) {
    hashHistory.push(url);
}

export function goBack() {
    hashHistory.goBack();
}

export default routes;