import React from "react";
import DatePicker from "material-ui/DatePicker/DatePicker";
import IconButton from "material-ui/IconButton/IconButton";

export default React.createClass({
    propTypes: {
        value: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.object]),
        labelText: React.PropTypes.string.isRequired,
        onChange: React.PropTypes.func.isRequired,
        disabled: React.PropTypes.bool,
        defaultDate: React.PropTypes.object,
        minDate: React.PropTypes.object,
        maxDate: React.PropTypes.object,
    },

    defaultProps: {
        disabled: false,
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

        const valueProp = value ? { value: new Date(value) } : {};

        return (
            <DatePicker
                {...other}
                {...valueProp}
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
