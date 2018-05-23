const sharingFields = ["externalAccess", "publicAccess", "userGroupAccesses"];

function getNormalizedSharing(data) {
    const sharing = _.pick(data, sharingFields);
    const normalizedUserGroupAccesses = _(sharing.userGroupAccesses)
        .map(userGroup => _.pick(userGroup, ["id", "access"]))
        .sortBy("id")
        .value();
    return {...sharing, userGroupAccesses: normalizedUserGroupAccesses};
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