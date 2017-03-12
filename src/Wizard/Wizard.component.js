import React from 'react';
import ObservedEvents from '../utils/ObservedEvents.mixin';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import TextField from 'material-ui/lib/text-field';

const Wizard = React.createClass({
    propTypes: {
    },

    mixins: [ObservedEvents, Translate],

    getInitialState() {
    },

    componentWillMount() {
    },

    componentDidMount() {
    },

    componentWillUnmount() {
    },

    render() {
        return (
            <div>
            Hello Pepito
            </div>
        );
    }
});

export default Wizard;