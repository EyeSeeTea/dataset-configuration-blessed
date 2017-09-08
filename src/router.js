import React from 'react';
import { Router, Route, IndexRoute, hashHistory, IndexRedirect } from 'react-router';
import log from 'loglevel';
import App from './App/App.component';
import DataSets from './DataSets/DataSets.component';
import DataSetFormSteps from './DataSets/FormSteps.component';

const wizard = (action) =>
    (props) => (<DataSetFormSteps action={action} id={props.params.id} />)

const routes = (
    <Router history={hashHistory}>
        <Route path="/" component={App}>
            <IndexRedirect to="datasets" />
            
            <Route path="datasets" component={DataSets}/>
            <Route path="datasets/add" component={wizard('add')} />
            <Route path="datasets/edit/:id" component={wizard('edit')} />
            <Route path="datasets/clone/:id" component={wizard('clone')} />
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