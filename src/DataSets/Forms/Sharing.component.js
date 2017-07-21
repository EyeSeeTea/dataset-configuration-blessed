import React, { PropTypes } from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import LinearProgress from 'material-ui/LinearProgress/LinearProgress';
import RichDropdown from '../../forms/RichDropdown.component';

const getCode = (orgUnit) => orgUnit ? orgUnit.code.split("_")[0] : null;

const Sharing = React.createClass({
    mixins: [Translate],

    getInitialState() {
        return {loaded: false};
    },

    propTypes: {
        validateOnRender: React.PropTypes.bool,
    },

    componentWillReceiveProps(props) {
        if (props.validateOnRender) {
            props.formStatus(true);
        }
    },

    _getCountries() {
        return this.context.d2.models.organisationUnits.list({
                fields: 'id,displayName,code',
                filter: "level:eq:" + this.props.config.organisationUnitLevelForCountries,
                order: 'displayName:asc',
                paging: false,
            })
            .then(collection => collection.toArray());
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
        Promise.all([
            this._getCountries(),
            this._getCurrentUserCountryCode(),
        ]).then(([countries, currentUserCountryCode]) => {
            this.setState({
                loaded: true,
                currentUserCountryCode,
                countriesByCode: _.keyBy(countries, getCode),
            }, () => { this.countrySelected(currentUserCountryCode); });
        });
    },

    render() {
        if (!this.state.loaded) {
            return (<LinearProgress />);
        } else {
            const {countriesByCode, currentUserCountryCode} = this.state;
            const selectedCountry = this.props.store.associations.country;
            const countryOptions = _(countriesByCode)
                .map((country, code) => ({value: code, text: country.displayName}))
                .value();

            return (
                <div>
                    <p>{this.getTranslation("sharing_help")}:</p>
                    
                    <RichDropdown
                        value={getCode(selectedCountry) || currentUserCountryCode}
                        options={countryOptions}
                        isRequired={true}
                        labelText={this.getTranslation("country")}
                        controls={[]}
                        onChange={(ev) => this.countrySelected(ev.target.value)}
                    />
                </div>
            );
        }
    },
});

export default Sharing;