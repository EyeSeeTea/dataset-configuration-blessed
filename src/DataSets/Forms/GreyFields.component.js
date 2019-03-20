import React from "react";
import Translate from "d2-ui/lib/i18n/Translate.mixin";
import GreyFieldsTable from "../../forms/GreyFieldsTable.component";
import { collectionToArray } from "../../utils/Dhis2Helpers";

const GreyFields = React.createClass({
    mixins: [Translate],

    propTypes: {
        validateOnRender: React.PropTypes.bool,
    },

    componentWillReceiveProps(props) {
        if (props.validateOnRender) props.formStatus(true);
    },

    _save(greyedFields) {
        this.props.store.setGreyedFields(greyedFields);
    },

    render() {
        const { dataset } = this.props.store;
        const sections = collectionToArray(dataset.sections);

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
