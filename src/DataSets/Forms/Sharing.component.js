import React, { PropTypes } from "react";
import Translate from "d2-ui/lib/i18n/Translate.mixin";
import LinearProgress from "material-ui/LinearProgress/LinearProgress";
import RichDropdown from "../../forms/RichDropdown.component";
import Validators from "d2-ui/lib/forms/Validators";
import FormBuilder from "d2-ui/lib/forms/FormBuilder.component";
import FormHelpers from "../../forms/FormHelpers";
import { getCountryCode } from "../../utils/Dhis2Helpers";

const Sharing = React.createClass({
    mixins: [Translate],

    getInitialState() {
        this.countriesByCode = this.props.store.countriesByCode;

        return {
            errors: {},
        };
    },

    propTypes: {
        validateOnRender: React.PropTypes.bool,
    },

    componentWillReceiveProps(props) {
        if (props.validateOnRender) {
            const { countries } = this.props.store.associations;

            if (_.isEmpty(countries)) {
                props.formStatus(false);
                const error = this.getTranslation("select_at_least_one_country");
                this.setState({ errors: { countries: [error] } });
            } else {
                props.formStatus(true);
                this.setState({ errors: {} });
            }
        }
    },

    _getCurrentUserCountryCode() {
        // d2.currentUser contains no userGroups, get the info
        return this.context.d2.models.users
            .list({
                fields: "id,userGroups[id,displayName]",
                filter: "id:eq:" + this.context.d2.currentUser.id,
                order: "displayName:asc",
                paging: false,
            })
            .then(usersCollection =>
                _(usersCollection.toArray())
                    .flatMap(user => user.userGroups.toArray())
                    .find(userGroup => userGroup.displayName.match(/_users$/i))
            )
            .then(userGroup => (userGroup ? userGroup.displayName.split("_")[0] : null));
    },

    countrySelected(value) {
        const selectedCountry = this.countriesByCode[value];
        this.props.onFieldsChange("associations.country", selectedCountry);
    },

    _onCountriesUpdate(codes) {
        const countries = _.at(this.countriesByCode, codes);
        this.props.onFieldsChange("associations.countries", countries);
    },

    render() {
        const selectedCountries = this.props.store.associations.countries.map(getCountryCode);
        const countryOptions = _(this.countriesByCode)
            .map((country, code) => ({ value: code, text: country.displayName }))
            .value();

        const fields = [
            FormHelpers.getMultiSelect({
                name: "associations.countries",
                options: countryOptions,
                onChange: this._onCountriesUpdate,
                label: this.getTranslation("sharing_countries_description"),
                selected: selectedCountries,
                errors: this.state.errors.countries,
            }),
        ];

        return <FormBuilder fields={fields} onUpdateField={() => {}} />;
    },
});

export default Sharing;
