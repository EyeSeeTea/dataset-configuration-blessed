import _ from "lodash"
import React, { useState } from "react";
import { FormControlLabel, Switch } from "@material-ui/core";
import SharingDialog from "./SharingDialog";
import { mergeShareableAccesses } from "./utils";
import i18n from "./i18n";

const SharingDialogMultiple = props => {
    const { meta, objects, onSharingChanged, ...otherProps } = props;
    const initialStrategy = objects.length === 1 ? "replace" : "merge";
    const [strategy, setStrategy] = useState(initialStrategy);

    const names = _(objects)
        .map(obj => obj.displayName || obj.name)
        .take(4);
    const name = _.compact([
        objects.length > 1 ? `[${objects.length}] ` : null,
        names.join(", "),
        names.size() > objects.length ? `, ...` : null,
    ]).join("");

    const users = _.uniq(objects.map(obj => obj.user));
    const user = users.length === 1 ? users[0] : undefined;
    const object = { name, user, ...mergeShareableAccesses(objects) };
    const mergedObject = { object, meta };
    const controls =
        objects.length > 1 ? <StrategySwitch strategy={strategy} onChange={setStrategy} /> : null;

    const onChange = objects => onSharingChanged(objects, strategy);

    return (
        <SharingDialog
            {...otherProps}
            controls={controls}
            sharedObject={mergedObject}
            onSharingChanged={onChange}
        />
    );
};

const StrategySwitch = props => {
    const { strategy, onChange } = props;
    const strategies = { merge: i18n.t("Merge"), replace: i18n.t("Replace") };
    const label = [i18n.t("Update strategy"), ": ", strategies[strategy]].join("");

    return (
        <div style={{ textAlign: "right" }}>
            <FormControlLabel
                control={
                    <Switch
                        checked={strategy === "replace"}
                        onChange={ev => onChange(ev.target.checked ? "replace" : "merge")}
                        value="checkedB"
                        color="primary"
                    />
                }
                label={label}
            />
        </div>
    );
};

export default SharingDialogMultiple;
