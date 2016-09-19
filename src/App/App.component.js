import React from 'react';
import log from 'loglevel';

import headerBarStore$ from 'd2-ui/lib/app-header/headerBar.store';
import withStateFrom from 'd2-ui/lib/component-helpers/withStateFrom';
import HeaderBarComponent from 'd2-ui/lib/app-header/HeaderBar';
import MainContent from 'd2-ui/lib/layout/main-content/MainContent.component';
import SinglePanelLayout from 'd2-ui/lib/layout/SinglePanel.component';
import { getInstance } from 'd2/lib/d2';

const HeaderBar = withStateFrom(headerBarStore$, HeaderBarComponent);

const App= React.createClass({
    propTypes: {
        name: React.PropTypes.string,
        d2: React.PropTypes.object,
    },

    childContextTypes: {
        d2: React.PropTypes.object,
    },

    getChildContext() {
        return {
            d2: this.props.d2,
        };
    },

    render() {
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
    },
});

// App.defaultProps = {
//     d2: getInstance(),
// };

export default App;