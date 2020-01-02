import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import DatePicker from "material-ui/DatePicker/DatePicker";
import IconButton from "material-ui/IconButton/IconButton";

const DateSelect = createReactClass({
    propTypes: {
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        labelText: PropTypes.string.isRequired,
        onChange: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
        defaultDate: PropTypes.object,
        minDate: PropTypes.object,
        maxDate: PropTypes.object,
    },

    renderDatePicker() {
        const {
            labelText,
            referenceType,
            referenceProperty,
            isInteger,
            translateOptions,
            isRequired,
            options,
            model,
            models,
            modelDefinition,
            disabled,
            defaultDate,
            minDate,
            maxDate,
            value,
            ...other
        } = this.props;

        // Set an empty object instead of undefined for the no-value case, otherwise the component
        // assumes it's being used in un-controlled state and does not react properly to changes
        const valueProp = value ? new Date(value) : {};

        return (
            <DatePicker
                {...other}
                value={valueProp}
                mode="portrait"
                autoOk
                disabled={disabled}
                floatingLabelText={labelText}
                onChange={this._onDateSelect}
                defaultDate={defaultDate}
                minDate={minDate}
                maxDate={maxDate}
            />
        );
    },

    render() {
        const styles = {
            closeButton: {
                position: "absolute",
                right: "-16px",
                top: "28px",
                zIndex: 1,
            },
            closeIcon: {
                color: "#888888",
            },
        };

        return (
            <div>
                {!this.props.isRequired &&
                this.props.value !== undefined &&
                this.props.value !== "" &&
                !this.props.disabled ? (
                    <IconButton
                        iconClassName="material-icons"
                        style={styles.closeButton}
                        iconStyle={styles.closeIcon}
                        onClick={this._clearDate}
                    >
                        close
                    </IconButton>
                ) : null}
                {this.renderDatePicker()}
            </div>
        );
    },

    _clearDate() {
        this._onDateSelect(undefined, "");
    },

    _onDateSelect(event, date) {
        this.props.onChange({
            target: {
                value: date,
            },
        });
    },
});

DateSelect.defaultProps = {
    disabled: false,
};

export default DateSelect;
