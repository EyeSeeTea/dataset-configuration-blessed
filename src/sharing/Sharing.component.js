import { PropTypes, createClass, default as React } from 'react';
import Heading from 'd2-ui/lib/headings/Heading.component';
import CreatedBy from './CreatedBy.component';
import ExternalAccess from './ExternalAccess.component';
import PublicAccess from './PublicAccess.component';
import sharingActions from './sharing.actions';
import sharingStore from './sharing.store';
import UserGroupAccesses from './UserGroupAccesses.component';
import LoadingMask from 'd2-ui/lib/loading-mask/LoadingMask.component';
import AutoComplete from 'd2-ui/lib/auto-complete/AutoComplete.component';
import Toggle from 'material-ui/Toggle/Toggle';
import { config } from 'd2/lib/d2';
import log from 'loglevel';
import fp from 'lodash/fp';

config.i18n.strings.add('external_access');
config.i18n.strings.add('public_access');

function noop() {}

export default createClass({
    propTypes: {
        objectsToShare: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired,
            user: PropTypes.object.isRequired,
        })).isRequired,
    },

    contextTypes: {
        d2: React.PropTypes.object.isRequired,
    },

    getInitialState() {
        return {
            objectsToShare: null,
            updateStrategy: this.props.objectsToShare.length > 1 ? "merge" : "replace",
        };
    },

    componentWillMount() {
        sharingActions.loadObjectSharingState(this.props.objectsToShare)
            .subscribe(noop, (error) => {
                log.error(error.message);
            });

        this.disposable = sharingStore
            .subscribe((newState) => {
                this.setState({
                    objectsToShare: newState,
                });
            });
    },

    componentWillReceiveProps(newProps) {
        sharingActions.loadObjectSharingState(newProps.objectsToShare);
    },

    componentWillUnmount() {
        this.disposable && this.disposable.dispose();
    },

    getTitle(objects) {
        const base = objects.map(obj => obj.name).join(", ");

        if (objects.length <= 2) {
            return base;
        } else {
            return this.context.d2.i18n.getTranslation("this_and_n_others", {
                this: base,
                n: objects.length - 2,
            });
        }
    },

    render() {
        const loadingMaskStyle = {
            position: 'relative',
        };

        if (!this.state.objectsToShare) {
            return (
                <LoadingMask style={loadingMaskStyle} size={1} />
            );
        }

        function doesNotContainItemWithId(collection = []) {
            return function checkForItemWithId(object = {}) {
                return collection.every(item => item.id !== object.id);
            };
        }

        const canSetExternalAccess = () => {
            return _(this.state.objectsToShare)
                .every(obj => obj.meta && obj.meta.allowExternalAccess);
        };

        const canSetPublicAccess = () => {
            return _(this.state.objectsToShare)
                .every(obj => obj.meta && obj.meta.allowPublicAccess);
        };

        // TODO: Is it true that the user should not be able to see externalAccess when he/she can not set it?
        const getExternalAccessValue = () => {
            if (canSetExternalAccess()) {
                return _(this.state.objectsToShare).every(o => o.externalAccess);
            }
            return false;
        };

        const title = this.getTitle(this.props.objectsToShare);
        const user = _(this.state.objectsToShare).map("user").uniqBy("id").size() === 1 ?
            this.state.objectsToShare[0].user : null;
        const userGroupAccesses = this.mergeUserGroupAccesses(this.state.objectsToShare);
        const publicAccess = this.mergeAccesses(this.state.objectsToShare.map(obj => obj.publicAccess));

        return (
            <div>
                <Heading text={title} level={2} />
                {user ? <CreatedBy user={user} /> : null}
                {this.renderStrategyToggle()}
                <div>
                    <AutoComplete forType="userGroup"
                      onSuggestionClicked={this.addUserGroup}
                      filterForSuggestions={doesNotContainItemWithId(userGroupAccesses)}
                    />
                </div>
                <ExternalAccess disabled={!canSetExternalAccess()} externalAccess={getExternalAccessValue()} onChange={this.updatedExternalAccess} />
                <PublicAccess disabled={!canSetPublicAccess()} publicAccess={publicAccess} onChange={this.updatePublicAccess} />
                <UserGroupAccesses userGroupAccesses={userGroupAccesses} onChange={this.updateUserGroupAccesses} />
            </div>
        );
    },

    mergeAccesses(accesses, defaultAccess = "--------") {
        return _.zip(...accesses.map(access => (access || defaultAccess).split("")))
            .map(vals => _.uniq(vals).length == 1 ? vals[0] : "-").join("");
    },

    renderStrategyToggle() {
        if (this.state.objectsToShare && this.state.objectsToShare.length > 1) {
            const getTranslation = this.context.d2.i18n.getTranslation.bind(this.context.d2.i18n);
            const label = getTranslation('update_strategy') + ": " +
                getTranslation('update_strategy_' + this.state.updateStrategy);

            return (
                <Toggle
                    label={label}
                    checked={this.state.updateStrategy === "replace"}
                    onToggle={(ev, newValue) => this.setState({updateStrategy: newValue ? "replace" : "merge"})}
                />
            );
        } else {
            return null;
        }
    },

    mergeUserGroupAccesses(objects) {
        const commonUserGroupAccesses = _.intersectionBy(...objects.map(o => o.userGroupAccesses), "id");

        return _(objects)
            .flatMap("userGroupAccesses")
            .groupBy("id")
            .at(commonUserGroupAccesses.map(obj => obj.id))
            .values()
            .map(ugas => fp.merge(ugas[0], {access: this.mergeAccesses(ugas.map(uga => uga.access))}))
            .value();
    },

    addUserGroup(newUserGroupAccess) {
        const userGroupAccesses = this.mergeUserGroupAccesses(this.state.objectsToShare);
        const newUserGroupAccesses = userGroupAccesses.concat(newUserGroupAccess)
        sharingActions.userGroupAcessesChanged({strategy: this.state.updateStrategy, models: newUserGroupAccesses});
    },

    updateUserGroupAccesses(userGroupAccesses) {
        sharingActions.userGroupAcessesChanged({strategy: this.state.updateStrategy, models: userGroupAccesses});
    },

    updatePublicAccess(publicAccessValue) {
        sharingActions.publicAccessChanged(publicAccessValue);
    },

    updatedExternalAccess(externalAccessValue) {
        sharingActions.externalAccessChanged(externalAccessValue);
    },
});
