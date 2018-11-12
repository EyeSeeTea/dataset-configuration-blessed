import _ from 'lodash';

export function getCoreCompetencies(d2, config, dataset) {
    const extractCoreCompetenciesFromSection = section => {
        const match = section.name.match(/^(.*) (Outputs|Outcomes)(@|$)/);
        return match ? match[1] : null;
    };

    const coreCompetencyNames = _(dataset.sections.toArray())
        .map(extractCoreCompetenciesFromSection)
        .compact()
        .uniq()

    return d2.models.dataElementGroups
        .filter().on("dataElementGroupSet.id").equals(config.dataElementGroupSetCoreCompetencyId)
        .list({paging: false, filter: `name:in:[${coreCompetencyNames.join(',')}]`, fields: "id,name,displayName"})
        .then(collection => collection.toArray())
}
