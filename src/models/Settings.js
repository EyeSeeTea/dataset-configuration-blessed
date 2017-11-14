import _ from 'lodash';
import fp from 'lodash/fp';
import {getExistingUserRoleByName} from '../utils/Dhis2Helpers';
import camelCaseToUnderscores from 'd2-utilizr/lib/camelCaseToUnderscores';

export default class Settings {
    dataStoreNamespace = "dataset-configuration"

    dataStoreSettingsKey = "settings";

    adminRoleAttributes = {
        name: "DataSet Configuration admin",
        description: "Can change settings of the DataSet Configuration app",
        authorities: [
            "See DataSet Configuration",
            "M_dhis-web-maintenance-appmanager",
        ],
    };

    fieldDefinitions = [
        {
            name: "categoryProjectsId",
            model: "category",
            defaultFilter: "code:eq:GL_Project",
        },
        {
            name: "categoryComboId",
            model: "categoryCombo",
            defaultFilter: "code:eq:GL_CATBOMBO_ProjectCCTarAct",
        },
        {
            name: "dataElementGroupSetCoreCompetencyId",
            model: "dataElementGroupSet",
            defaultFilter: "code:eq:GL_CoreComp_DEGROUPSET",
        },
        {
            name: "dataElementGroupOutputId",
            model: "dataElementGroup",
            defaultFilter: "code:eq:GL_Output_DEGROUP",
        },
        {
            name: "dataElementGroupOutcomeId",
            model: "dataElementGroup",
            defaultFilter: "code:eq:GL_OUTCOME_DEGROUP",
        },
        {
            name: "dataElementGroupGlobalIndicatorMandatoryId",
            model: "dataElementGroup",
            defaultFilter: "code:eq:GL_MAND_DEGROUP",
        },
        {
            name: "dataElementGroupSetThemeId",
            model: "dataElementGroupSet",
            defaultFilter: "code:eq:GL_DETHEME_DEGROUPSET",
        },
        {
            name: "dataElementGroupSetOriginId",
            model: "dataElementGroupSet",
            defaultFilter: "code:eq:GL_DEORIGIN_DEGROUPSET",
        },
        {
            name: "indicatorGroupSetOriginId",
            model: "indicatorGroupSet",
            defaultFilter: "name:eq:Indicator Origin",
        },
        {
            name: "dataElementGroupSetStatusId",
            model: "dataElementGroupSet",
            defaultFilter: "code:eq:GL_DESTATUS_DEGROUPSET",
        },
        {
            name: "indicatorGroupSetStatusId",
            model: "indicatorGroupSet",
            defaultFilter: "name:eq:Status",
        },
        {
            name: "attributeGroupId",
            model: "attribute",
            defaultFilter: "code:eq:DE_IND_GROUP",
        },
        {
            name: "organisationUnitLevelForCountriesId",
            model: "organisationUnitLevel",
            defaultFilter: "name:eq:Country",
        },
    ];

    constructor(d2) {
        this.d2 = d2;
    }

    init() {
        if (this.currentUserIsSuperAdmin()) {
            return this._createOrUpdateAdminRole().then(this._saveInitialConfig.bind(this));
        } else {
            return Promise.resolve(true);
        }
    }

    get() {
        return this._getStoreNamespace().then(ns => ns.get(this.dataStoreSettingsKey));
    }

    save(config) {
        return this._save(saved => fp.merge(saved, config));
    }

    currentUserIsSuperAdmin() {
        return this.d2.currentUser.authorities.has("ALL");
    }

    currentUserHasAdminRole() {
        const authorities = this.d2.currentUser.authorities;
        return authorities.has("M_dhis-web-maintenance-appmanager") || authorities.has("ALL");
    }

    getFields() {
        const models = _(this.fieldDefinitions).map(fd => fd.model).uniq();
        const optionsForModelPairs$ = models.map(model =>
            this.d2.models[model].list({paging: false, fields: "id,displayName"})
                .then(collection => collection.toArray())
                .then(objects => objects.map(obj => ({text: obj.displayName, value: obj.id})))
                .then(options => [model, options])
        )

        return Promise.all(optionsForModelPairs$).then(_.fromPairs).then(optionsForModel => {
            return this.fieldDefinitions.map(fd => {
                return fp.merge(fd, {
                    options: optionsForModel[fd.model],
                    i18n_key: "setting_" + camelCaseToUnderscores(fd.name),
                });
            });
        });
    }

    _getStoreNamespace() {
        return this.d2.dataStore.get(this.dataStoreNamespace);
    }

    _save(merger) {
        const names = this.fieldDefinitions.map(fd => fd.name);

        return this._getStoreNamespace().then(namespace => {
            return namespace.get(this.dataStoreSettingsKey)
                .catch(() => ({}))
                .then(saved => {
                    const newConfig = _.pick(merger(saved), names);
                    if (_.isEqual(saved, newConfig)) {
                        return true;
                    } else {
                        return namespace.set(this.dataStoreSettingsKey, newConfig);
                    }
                });
        });
    }

    _saveInitialConfig() {
        return this._getDefaults()
            .then(defaults => this._save(saved => fp.merge(defaults, saved)));
    }

    _getDefaults() {
        const defaultValuesPairs$ = this.fieldDefinitions.map(fd =>
            this.d2.models[fd.model]
                .list({filter: fd.defaultFilter})
                .then(collection => [fd.name, collection.toArray().map(obj => obj.id)[0]])
        );
        return Promise.all(defaultValuesPairs$).then(_.fromPairs);
    }

    _createOrUpdateAdminRole() {
        const attrs = this.adminRoleAttributes;

        return getExistingUserRoleByName(this.d2, attrs.name).then(existingUserRole => {
            if (existingUserRole) {
                const existingUserRoleHasRequiredAuthorities =
                    _(attrs.authorities).difference(existingUserRole.authorities).isEmpty();
                if (existingUserRoleHasRequiredAuthorities) {
                    return true;
                } else {
                    existingUserRole.authorities =
                        _.union(existingUserRole.authorities, attrs.authorities);
                    existingUserRole.dirty = true;
                    return existingUserRole.save();
                }
            } else {
                const adminRole = this.d2.models.userRoles.create(attrs);
                return adminRole.create();
            }
        });
    }
}