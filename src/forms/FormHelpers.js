import React from "react";
import TextField from "d2-ui/lib/form-fields/TextField.js";
import Dropdown from "./Dropdown.component";
import RichDropdown from "./RichDropdown.component";
import CheckBox from "d2-ui/lib/form-fields/CheckBox.component";
import MultiSelect from "./MultiSelect.component";
import DateSelect from "./form-fields/date-select";

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

function getBooleanField({ name, label, onChange, value = false, style }) {
    return {
        name: name,
        component: CheckBox,
        value: value,
        props: {
            checked: value,
            label: getLabel(label),
            onCheck: (ev, newValue) => onChange(name, newValue),
            style,
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

function getFormLabel({ value, forSection, style }) {
    return {
        name: `${value}_${forSection}`,
        component: FormLabel,
        props: {
            value,
            style: { fontSize: 16, marginTop: 16, marginBottom: -15, ...style },
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
    minDate = undefined,
    maxDate = undefined,
    wrapStyle = undefined,
}) {
    return {
        name: name,
        component: DateSelect,
        value: value ? new Date(value) : undefined,
        validators: validators,
        props: {
            wrapStyle,
            labelText: getLabel(label, isRequired),
            changeEvent: "onChange",
            fullWidth: false,
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

function separator(name) {
    return { name, component: () => null, props: { wrapStyle: { clear: "both" } } };
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
    separator,
};
