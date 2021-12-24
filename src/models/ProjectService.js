import _ from "lodash";
import { collectionToArray } from "../utils/Dhis2Helpers";

export class ProjectsService {
    constructor(api, config) {
        this.api = api;
        this.config = config;
    }

    async updateOrgUnits(project, orgUnits) {
        const categoryOptionUrl = `/categoryOptions/${project.id}`;
        const categoryOption = await this.api.get(categoryOptionUrl, { fields: ":owner" });
        const payload = {
            ...categoryOption,
            organisationUnits: orgUnits.map(ou => ({ id: ou.id })),
        };
        return this.api.update(`/categoryOptions/${project.id}`, payload);
    }

    async updateOrgUnitsFromDataSets(dataSetRefs) {
        if (!this.config.categoryProjectsId) return;

        const projectCategoryUrl = `/categories/${this.config.categoryProjectsId}`;
        const projectCategory = await this.api.get(projectCategoryUrl, {
            fields: "categoryOptions[id,name]",
        });
        if (!projectCategory) return;

        const { dataSets } = await this.api.get("/dataSets", {
            fields: "id,name,organisationUnits[id]",
            filter: `id:in:[${dataSetRefs.map(ds => ds.id)}]`,
        });

        const allProjects = projectCategory.categoryOptions;

        const orgUnitsByProjectId = _(dataSets)
            .map(dataSet => {
                const project = allProjects.find(project => _.includes(dataSet.name, project.name));
                return project ? [project.id, collectionToArray(dataSet.organisationUnits)] : null;
            })
            .compact()
            .fromPairs()
            .value();

        const projectIds = _.keys(orgUnitsByProjectId);
        if (_.isEmpty(projectIds)) return;

        const res = await this.api.get(`/categoryOptions`, {
            fields: ":owner",
            filter: `id:in:[${projectIds.join(",")}]`,
        });

        const projects = res.categoryOptions || [];

        const projectsUpdated = projects.map(categoryOption => {
            const orgUnits = orgUnitsByProjectId[categoryOption.id];
            return { ...categoryOption, organisationUnits: orgUnits.map(ou => ({ id: ou.id })) };
        });

        const postRes = await this.api.post(`/metadata`, { categoryOptions: projectsUpdated });

        if (postRes.status !== "OK") {
            throw new Error(`Error updating projects: ${res.status}`);
        }
    }
}
