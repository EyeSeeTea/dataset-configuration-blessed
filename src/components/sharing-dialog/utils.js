import _ from "lodash";
import { getOwnedPropertyJSON } from "d2/lib/model/helpers/json";

export const cachedAccessTypeToString = (canView, canEdit) => {
    if (canView) {
        return canEdit ? "rw------" : "r-------";
    }

    return "--------";
};

export const transformAccessObject = (access, type) => ({
    id: access.id,
    name: access.name,
    displayName: access.displayName,
    type,
    canView: access.access && access.access.includes("r"),
    canEdit: access.access && access.access.includes("rw"),
});

export const accessStringToObject = access => {
    if (!access) {
        return {
            data: { canView: false, canEdit: false },
            meta: { canView: false, canEdit: false },
        };
    }

    const metaAccess = access.substring(0, 2);
    const dataAccess = access.substring(2, 4);

    return {
        meta: {
            canView: metaAccess.includes("r"),
            canEdit: metaAccess.includes("rw"),
        },
        data: {
            canView: dataAccess.includes("r"),
            canEdit: dataAccess.includes("rw"),
        },
    };
};

export const accessObjectToString = accessObject => {
    const convert = ({ canEdit, canView }) => {
        if (canEdit) {
            return "rw";
        }

        return canView ? "r-" : "--";
    };

    let accessString = "";
    accessString += convert(accessObject.meta);
    accessString += convert(accessObject.data);
    accessString += "----";

    return accessString;
};

/* Batch mode helpers */

export function mergeShareableAccesses(objects) {
    return {
        publicAccess: mergeAccesses(objects, "publicAccess"),
        externalAccess: _(objects)
            .map(obj => obj.externalAccess)
            .uniq()
            .isEqual([true]),
        userAccesses: mergeEntityAccesses(objects, "userAccesses"),
        userGroupAccesses: mergeEntityAccesses(objects, "userGroupAccesses"),
    };
}

function mergeAccesses(objects, field, defaultAccess = "--------") {
    return _.zip(...objects.map(objects => (objects[field] || defaultAccess).split("")))
        .map(vals => (_.uniq(vals).length === 1 ? vals[0] : "-"))
        .join("");
}

function mergeEntityAccesses(objects, field) {
    const commonAccesses = _.intersectionBy(...objects.map(o => o[field]), "id");

    return _(objects)
        .flatMap(field)
        .groupBy("id")
        .at(commonAccesses.map(obj => obj.id))
        .values()
        .map(permissions => ({ ...permissions[0], access: mergeAccesses(permissions, "access") }))
        .value();
}

function mergePermissions(object, newAttributes, field, strategy, commonPermissionIds) {
    const objPermissions = object[field] || [];
    const newPermissions = newAttributes[field];
    if (!newPermissions) return {};

    switch (strategy) {
        case "merge":
            // If a permission id was commont but it's not pressent in the newPermissions, it means
            // the user removed it from the list.
            const idsToRemove = _.difference(commonPermissionIds, newPermissions.map(p => p.id));
            const ids = _(objPermissions)
                .map("id")
                .concat(_.map(newPermissions, "id"))
                .uniq()
                .value();
            const newObjPermissions = _(objPermissions)
                .keyBy("id")
                .merge(_.keyBy(newPermissions, "id"))
                .omit(idsToRemove)
                .at(ids)
                .compact()
                .value();
            return { [field]: newObjPermissions };
        case "replace":
            return { [field]: newPermissions };
        default:
            throw new Error("Unknown strategy: " + strategy);
    }
}

export function save(d2, objects, sharingAttributes, strategy) {
    const plainObjects = objects.map(object =>
        object.modelDefinition ? getOwnedPropertyJSON(object) : object
    );

    const commonIds = _(objects)
        .flatMap(obj => [...(obj.userAccesses || []), ...(obj.userGroupAccesses || [])])
        .countBy(permission => permission.id)
        .pickBy(count => count === objects.length)
        .keys()
        .value();

    const dataSetsUpdated = plainObjects.map(object => ({
        ...object,
        ...mergePermissions(object, sharingAttributes, "userAccesses", strategy, commonIds),
        ...mergePermissions(object, sharingAttributes, "userGroupAccesses", strategy, commonIds),
        ..._.pick(sharingAttributes, ["publicAccess", "externalAccess"]),
    }));
    const api = d2.Api.getApi();
    const payload = { dataSets: dataSetsUpdated };

    return api
        .post("metadata", payload)
        .then(response => ({ status: response.status === "OK", ...payload }))
        .catch(_err => ({ status: "ERROR" }));
}
