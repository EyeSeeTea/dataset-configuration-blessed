import React from 'react';
import log from 'loglevel';

import headerBarStore$ from 'd2-ui/lib/app-header/headerBar.store';
import withStateFrom from 'd2-ui/lib/component-helpers/withStateFrom';
import HeaderBarComponent from 'd2-ui/lib/app-header/HeaderBar';
import AppWithD2 from 'd2-ui/lib/app/AppWithD2.component';
import ListActionBar from '../ListActionBar/ListActionBar.component';
import LoadingMask from '../LoadingMask/LoadingMask.component';
import MainContent from 'd2-ui/lib/layout/main-content/MainContent.component';
import SinglePanelLayout from 'd2-ui/lib/layout/SinglePanel.component';
import { getInstance } from 'd2/lib/d2';

const HeaderBar = withStateFrom(headerBarStore$, HeaderBarComponent);

class App extends AppWithD2 {
    getChildContext() {
        return super.getChildContext();
    }

    componentDidMount() {
        super.componentDidMount();  
    } 
    
    render() {
        if (!this.state.d2) {
            return (<LoadingMask />);
        }        
        return (
            <div>
                <HeaderBar />
                <ListActionBar />
                <SinglePanelLayout>
                    <MainContent>
                        {this.props.children}
                    </MainContent>
                </SinglePanelLayout>
            </div>
        );
    }       
         
};

App.defaultProps = {
    d2: getInstance(),
};

App.childContextTypes = AppWithD2.childContextTypes;

export default App;