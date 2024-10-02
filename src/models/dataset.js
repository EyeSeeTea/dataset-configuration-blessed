import _ from "lodash";

export function getCoreCompetencies(d2, config, dataset) {
    const extractCoreCompetenciesCodesFromSection = section => {
        const { code } = section;
        if (!code) {
            console.error(`Section has not code: ${section.id}`);
            return;
        }
        const [_prefix, _type, ...ccCodeParts] = section.code.split("_");
        return ccCodeParts.join("_");
    };

    const coreCompetencyCodes = _(dataset.sections.toArray())
        .map(extractCoreCompetenciesCodesFromSection)
        .compact()
        .uniq()
        .value();

    return d2.models.dataElementGroups
        .filter()
        .on("groupSets.id")
        .equals(config.dataElementGroupSetCoreCompetencyId)
        .list({
            paging: false,
            filter: `code:in:[${coreCompetencyCodes.join(",")}]`,
            fields: "id,code,name,displayName",
        })
        .then(collection => collection.toArray());
}

export function getProject(d2, config, dataset) {
    if (dataset.name) {
        return d2.models.categoryOptions
            .filter()
            .on("categories.id")
            .equals(config.categoryProjectsId)
            .list({ fields: "id,code,displayName", paging: false })
            .then(collection => collection.toArray())
            .then(projects =>
                _(projects).find(project => _.includes(dataset.name, project.displayName))
            );
    } else {
        return Promise.resolve(null);
    }
}
