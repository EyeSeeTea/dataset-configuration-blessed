import React, { PropTypes } from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import GreyFieldsTable from '../../forms/GreyFieldsTable.component';

const GreyFields = React.createClass({
    mixins: [Translate],

    propTypes: {
        validateOnRender: React.PropTypes.bool,
    },

    componentWillReceiveProps(props) {
        props.formStatus(true);
    },

    _save(greyedFields) {
        const {sections} = this.props.store.associations;
        console.log("save", greyedFields);
        this.props.store.setGreyedFields(greyedFields)
    },

    render() {
        const {sections} = this.props.store.associations;

        return (
            <div>
                <GreyFieldsTable
                    sections={sections}
                    dataSet={this.props.store.dataset}
                    onClose={this._save}
                />
            </div>
        );
    },
});

export default GreyFields;