import TextField from 'd2-ui/lib/form-fields/TextField.js';
import Dropdown from './Dropdown.component';
import RichDropdown from './RichDropdown.component';
import CheckBox from 'd2-ui/lib/form-fields/CheckBox.component';
import MultiSelect from './MultiSelect.component';
import DateSelect from './form-fields/date-select';

function getLabel(label, isRequired) {
    return label + (isRequired ? " (*)" : "");
}

function getTextField({name, label, value = "", isRequired = false, multiLine = false, 
                       type = "string", validators = [], asyncValidators = []}) {
    return {
        name: name,
        value: (value || "").toString(),
        component: TextField,
        validators: validators,
        asyncValidators: asyncValidators,
        props: {
            type: type,
            multiLine: multiLine,
            style: {width: "100%"},
            changeEvent: "onBlur",
            floatingLabelText: getLabel(label, isRequired),
        },
    };
}

function getSelectField({name, label, options, value = undefined, isRequired = false}) {
    return {
        name: name,
        component: Dropdown,
        value: value,
        props: {
            options: options,
            isRequired: isRequired,
            labelText: getLabel(label, isRequired),
            style: {width: "100%"},
        },
    };
}

function getRichSelectField({name, label, options, filterOptions, 
                             value = undefined, isRequired = false, controls = []}) {
    return {
        name: name,
        component: RichDropdown,
        value: value,
        props: {
            options: options,
            filterOptions: filterOptions,
            isRequired: isRequired,
            labelText: getLabel(label, isRequired),
            style: {width: "100%"},
            controls: controls,
        },
    };
}

function getBooleanField({name, label, onChange, value = false}) {
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

function getMultiSelect({name, label, onChange, options = [], selected = [], errors = []}) {
    return {
        name: name,
        component: MultiSelect,
        props: {
            options: options,
            onChange: onChange,
            label: label,
            selected: selected,
            errors: errors,
        }
    };
}

function getDateField({name, label, onChange, value = undefined, isRequired = false}) {
    return {
        name: name,
        component: DateSelect,
        value: value || undefined,
        props: {
            labelText: getLabel(label, isRequired),
            onChange: (data) => onChange(data.target.value || undefined),
            fullWidth: true,
        },
    };
}

export default {
    getLabel, 
    getTextField, 
    getSelectField, 
    getRichSelectField,
    getBooleanField, 
    getMultiSelect,
    getDateField,
}