import React from "react";
import TextField from "d2-ui/lib/form-fields/TextField.js";
import Dropdown from "./Dropdown.component";
import RichDropdown from "./RichDropdown.component";
import CheckBox from "d2-ui/lib/form-fields/CheckBox.component";
import MultiSelect from "./MultiSelect.component";
import DateSelect from "./form-fields/date-select";
import _ from "lodash";

function getLabel(label, isRequired, help = null) {
    return label + (help ? ` (${help})` : "") + (isRequired ? " (*)" : "");
}

function getTextField({
    name,
    label,
    value = "",
    isRequired = false,
    multiLine = false,
    type = "string",
    help = null,
    validators = [],
    asyncValidators = [],
}) {
    return {
        name: name,
        value: value !== null && value !== undefined ? value.toString() : "",
        component: TextField,
        validators: validators,
        asyncValidators: asyncValidators,
        props: {
            type: type,
            multiLine: multiLine,
            style: { width: "100%" },
            changeEvent: "onBlur",
            floatingLabelText: getLabel(label, isRequired, help),
        },
    };
}

function getSelectField({ name, label, options, value = undefined, isRequired = false }) {
    return {
        name: name,
        component: Dropdown,
        value: value,
        props: {
            options: options,
            isRequired: isRequired,
            labelText: getLabel(label, isRequired),
            style: { width: "100%" },
        },
    };
}

function getRichSelectField({
    name,
    label,
    options,
    filterOptions,
    value = undefined,
    isRequired = false,
    controls = [],
    description = undefined,
    validators = [],
    asyncValidators = [],
}) {
    return {
        name: name,
        component: ({ description, ...otherProps }) => {
            return (
                <div>
                    {description ? <p>{description}:</p> : null}
                    <RichDropdown {...otherProps} />
                </div>
            );
        },
        value: value,
        validators: validators,
        asyncValidators: asyncValidators,
        props: {
            options: options,
            filterOptions: filterOptions,
            isRequired: isRequired,
            labelText: getLabel(label, isRequired),
            style: { width: "30%" },
            description: description,
            controls: controls,
        },
    };
}

function getBooleanField({ name, label, onChange, value = false }) {
    return {
        name: name,
        component: CheckBox,
        value: value,
        props: {
            checked: value,
            label: getLabel(label),
            onCheck: (ev, newValue) => onChange(name, newValue),
        },
    };
}

function getMultiSelect({ name, label, onChange, options = [], selected = [], errors = [] }) {
    return {
        name: name,
        component: MultiSelect,
        props: {
            options: options,
            onChange: onChange,
            label: label,
            selected: selected,
            errors: errors,
        },
    };
}

function getFormLabel({ value, type, forSection }) {
    return {
        name: `${value}_${forSection}`,
        component: FormLabel,
        props: {
            value,
            style:
                type === "title"
                    ? { fontSize: 20, marginTop: 10 }
                    : { fontSize: 18, marginTop: 10, marginBottom: -15 },
        },
    };
}

function getDateField({
    name,
    label,
    value = undefined,
    isRequired = false,
    disabled = false,
    validators = undefined,
    years,
}) {
    const [minDate, maxDate] = years
        ? [new Date(_.min(years), 0, 1), new Date(_.max(years), 11, 31)]
        : [];
    return {
        name: name,
        component: DateSelect,
        value: value ? new Date(value) : undefined,
        validators: validators,
        props: {
            labelText: getLabel(label, isRequired),
            changeEvent: "onChange",
            fullWidth: true,
            disabled,
            minDate,
            maxDate,
        },
    };
}

function SimpleCheckBox({ onClick, checked, ...otherProps }) {
    return (
        <span onClick={onClick} {...otherProps}>
            <input type="checkbox" readOnly={true} checked={checked} className="simple-checkbox" />
            <span />
        </span>
    );
}

function FormLabel({ value, style }) {
    return <div style={style}>{value}</div>;
}

export default {
    getLabel,
    getTextField,
    getSelectField,
    getRichSelectField,
    getBooleanField,
    getMultiSelect,
    getDateField,
    SimpleCheckBox,
    getFormLabel,
};
