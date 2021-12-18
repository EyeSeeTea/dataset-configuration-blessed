import React from "react";
import _ from "lodash";
import moment from "moment";
import PropTypes from "prop-types";
import SelectField from "material-ui/SelectField/SelectField";
import MenuItem from "material-ui/MenuItem/MenuItem";

const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

class YearlyDateSelector extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.getTranslation = context.d2.i18n.getTranslation.bind(context.d2.i18n);
        this.monthOptions = this.getMonthOptions();
    }

    onMonthChange = (event, index, value) => {
        const newValue = { month: value, day: 1 };
        this.notifyChange(newValue);
    };

    onDayChange = (event, index, value) => {
        const newValue = { ...this.props.value, day: value };
        this.notifyChange(newValue);
    };

    getDayOptionsForMonth(month) {
        return month && _.has(daysInMonths, month)
            ? _(1)
                  .range(daysInMonths[month - 1] + 1)
                  .map(ndays => ({ text: ndays, value: ndays }))
                  .value()
            : [];
    }

    getMonthOptions() {
        return moment
            .localeData("en")
            .monthsShort()
            .map(shortName => this.getTranslation(shortName.toLowerCase()))
            .map((name, index) => ({ text: name, value: index + 1 }));
    }

    notifyChange(value) {
        this.props.onChange({ target: { value } });
    }

    render() {
        const { labelText, value } = this.props;
        const dayOptions = this.getDayOptionsForMonth(value.month);

        return (
            <div>
                <SelectField
                    value={value.month}
                    style={styles.monthSelector}
                    onChange={this.onMonthChange}
                    floatingLabelText={labelText + " - " + this.getTranslation("month")}
                >
                    {this.renderOptions(this.monthOptions)}
                </SelectField>

                <SelectField
                    value={value.day}
                    onChange={this.onDayChange}
                    floatingLabelText={this.getTranslation("day")}
                >
                    {this.renderOptions(dayOptions)}
                </SelectField>
            </div>
        );
    }

    renderOptions(options) {
        return options.map((option, index) => (
            <MenuItem
                primaryText={option.text}
                key={index}
                value={option.value}
                label={option.text}
            />
        ));
    }
}

YearlyDateSelector.propTypes = {
    value: PropTypes.shape({
        month: PropTypes.number,
        day: PropTypes.number,
    }).isRequired,
    labelText: PropTypes.string.isRequired,
};

YearlyDateSelector.contextTypes = {
    d2: PropTypes.any,
};

const styles = {
    monthSelector: { marginRight: 20 },
};

export default YearlyDateSelector;
