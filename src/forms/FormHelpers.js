import TextField from 'd2-ui/lib/form-fields/TextField.js';
import Dropdown from './Dropdown.component';
import CheckBox from 'd2-ui/lib/form-fields/CheckBox.component';

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

export default {getLabel, getTextField, getSelectField, getBooleanField}