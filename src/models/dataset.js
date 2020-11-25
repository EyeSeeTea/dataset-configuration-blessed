import _ from "lodash";

export function getCoreCompetencies(d2, config, dataset) {
    const extractCoreCompetenciesFromSection = section => {
        const match = section.name.match(/^(.*) (Outputs|Outcomes)(@|$)/);
        return match ? match[1] : null;
    };

    const coreCompetencyNames = _(dataset.sections.toArray())
        .map(extractCoreCompetenciesFromSection)
        .compact()
        .uniq();

    return d2.models.dataElementGroups
        .filter()
        .on("groupSets.id")
        .equals(config.dataElementGroupSetCoreCompetencyId)
        .list({
            paging: false,
            filter: `name:in:[${coreCompetencyNames.join(",")}]`,
            fields: "id,name,displayName",
        })
        .then(collection => collection.toArray());
}

export function getProject(d2, config, dataset) {
    if (dataset.name) {
        return d2.models.categoryOptions
            .filter()
            .on("categories.id")
            .equals(config.categoryProjectsId)
            .list({ fields: "id,displayName", paging: false })
            .then(collection => collection.toArray())
            .then(projects =>
                _(projects).find(project => _.includes(dataset.name, project.displayName))
            );
    } else {
        return Promise.resolve(null);
    }
}
