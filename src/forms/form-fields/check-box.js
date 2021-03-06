import React from "react";
import createReactClass from 'create-react-class';
import PropTypes from "prop-types";
import Checkbox from "material-ui/Checkbox/Checkbox";

function isTrueOrTheStringTrue(value) {
    return value === true || value === "true";
}

export default createReactClass({
    propTypes: {
        onChange: PropTypes.func.isRequired,
        labelText: PropTypes.string.isRequired,
        value: PropTypes.bool,
    },

    render() {
        // Do not pass the value on to the CheckBox component
        const {
            value,
            errorStyle,
            errorText,
            labelText,
            modelDefinition,
            models,
            referenceType,
            referenceProperty,
            isInteger,
            multiLine,
            fullWidth,
            translateOptions,
            isRequired,
            options,
            model,
            ...otherProps
        } = this.props;

        return (
            <div style={{ marginTop: 12, marginBottom: 12 }}>
                <Checkbox
                    onClick={this._onClick}
                    {...otherProps}
                    label={this.props.labelText}
                    defaultChecked={isTrueOrTheStringTrue(this.props.value)}
                />
            </div>
        );
    },

    _onClick() {
        this.props.onChange({
            target: {
                value: !isTrueOrTheStringTrue(this.props.value),
            },
        });
    },
});
