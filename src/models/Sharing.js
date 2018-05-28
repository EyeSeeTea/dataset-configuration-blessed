const sharingFields = ["externalAccess", "publicAccess", "userAccesses", "userGroupAccesses"];

function normalizeAccesses(accesses) {
    return _(accesses || [])
        .map(info => _.pick(info, ["id", "access"]))
        .sortBy("id")
        .value();
}

function getNormalizedSharing(data) {
    const sharing = _.pick(data, sharingFields);
    return {
        ...sharing,
        userGroupAccesses: normalizeAccesses(sharing.userGroupAccesses),
        userAccesses: normalizeAccesses(sharing.userAccesses),
    };
}

export function getChanges(models, newSharings) {
    const sharingById = _(newSharings).keyBy(sharing => sharing.model.id).value();
    const newModels = models.map(model => {
        const sharing = sharingById[model.id];
        const sharingChanged = sharing &&
            !_(getNormalizedSharing(model)).isEqual(getNormalizedSharing(sharing));
        return sharingChanged ? {...model, ...sharing} : model;
    });
    const updatedModels = _(models).zip(newModels)
        .map(([model, newModel]) => model !== newModel ? newModel : null)
        .compact()
        .value();

    return {updated: updatedModels, all: newModels};
}