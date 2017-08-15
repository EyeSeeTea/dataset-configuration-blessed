import React, { PropTypes } from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import RichDropdown from '../../forms/RichDropdown.component';
import Validators from 'd2-ui/lib/forms/Validators';
import FormBuilder from 'd2-ui/lib/forms/FormBuilder.component';
import FormHelpers from '../../forms/FormHelpers';

const getCode = (orgUnit) => orgUnit ? orgUnit.code.split("_")[0] : null;

const Sharing = React.createClass({
    mixins: [Translate],

    getInitialState() {
        return {
            loaded: false,
            countriesByCode: null,
            errors: {},
        };
    },

    propTypes: {
        validateOnRender: React.PropTypes.bool,
    },

    componentWillReceiveProps(props) {
        if (props.validateOnRender) {
            const {countries} = this.props.store.associations;
            if (_.isEmpty(countries)) {
                props.formStatus(false);
                const error = this.getTranslation("select_at_least_one_country");
                this.setState({errors: {countries: [error]}});
            } else {
                props.formStatus(true);
                this.setState({errors: {}});
            }
        }
    },

    _getCountries() {
        const countryLevelId = this.props.config.organisationUnitLevelForCountriesId;

        return this.context.d2.models.organisationUnitLevels.get(countryLevelId).then(ouLevel => {
            return this.context.d2.models.organisationUnits.list({
                    fields: 'id,displayName,code',
                    filter: "level:eq:" + ouLevel.level,
                    order: 'displayName:asc',
                    paging: false,
                })
                .then(collection => collection.toArray());
        });
    },

    _getCurrentUserCountryCode() {
        // d2.currentUser contains no userGroups, get the info
        return this.context.d2.models.users.list({
                fields: 'id,userGroups[id,displayName]',
                filter: "id:eq:" + this.context.d2.currentUser.id,
                order: 'displayName:asc',
                paging: false,
            })
            .then(usersCollection =>
                _(usersCollection.toArray())
                    .flatMap(user => user.userGroups.toArray())
                    .find(userGroup => userGroup.displayName.match(/_users$/i))
            )
            .then(userGroup => userGroup ? userGroup.displayName.split("_")[0] : null);
    },

    countrySelected(value) {
        const selectedCountry = this.state.countriesByCode[value];
        this.props.onFieldsChange("associations.country", selectedCountry);
    },

    componentDidMount() {
        const setInitialCountries = () => {
            const {countries} = this.props.store.associations;
            if (_(countries).isEmpty()) {
                this.props.onFieldsChange("associations.countries", this._getInitialCountries());
            }
        };

        this._getCountries().then(countries => {
            this.setState({
                loaded: true,
                countriesByCode: _.keyBy(countries, getCode),
            }, setInitialCountries);
        });
    },

    _onCountriesUpdate(codes) {
        const countries = _.at(this.state.countriesByCode, codes);
        this.props.onFieldsChange("associations.countries", countries);
    },

    _getInitialCountries() {
        const {dataset} = this.props.store;
        const {project} = this.props.store.associations;
        const projectCountryCode =
            project && project.code ? project.code.slice(0, 2).toUpperCase() : null;
        const {countriesByCode} = this.state;

        if (projectCountryCode && countriesByCode[projectCountryCode]) {
            return [countriesByCode[projectCountryCode]];
        } else {
            const countryLevel = this.props.config.organisationUnitLevelForCountries;
            return dataset.organisationUnits.toArray().filter(ou => ou.level === countryLevel);
        }
    },

    render() {
        if (!this.state.loaded) {
            return (<LinearProgress />);
        } else {
            const {countriesByCode} = this.state;
            const selectedCountries = this.props.store.associations.countries.map(getCode);
            const countryOptions = _(countriesByCode)
                .map((country, code) => ({value: code, text: country.displayName}))
                .value();

            const fields = [
                FormHelpers.getMultiSelect({
                    name: 'associations.countries',
                    options: countryOptions,
                    onChange: this._onCountriesUpdate,
                    label: this.getTranslation('sharing_countries_description'),
                    selected: selectedCountries,
                    errors: this.state.errors.countries,
                }),
            ];

            return (
                <FormBuilder
                    fields={fields}
                    onUpdateField={() => {}}
                />
            );
        }
    },
});

export default Sharing;