import Action from 'd2-ui/lib/action/Action';
import sharingStore from './sharing.store';
import { getInstance as getD2 } from 'd2/lib/d2';
import {mapPromise} from '../utils/Dhis2Helpers';

const actions = Action.createActionsFromNames([
    'externalAccessChanged',
    'loadObjectSharingState',
    'publicAccessChanged',
    'userGroupAcessesChanged',
    'saveChangedState',
]);

actions.loadObjectSharingState
    .subscribe(({ data: sharableObjects, complete, error }) => {
        if (_(sharableObjects).some(obj => !obj.modelDefinition || !obj.modelDefinition.name)) {
            error({
                actionName: 'sharing.loadObjectSharingState',
                message: 'sharableObjects should contain a modelDefinition property',
            });
        }

        getD2()
            .then(d2 => {
                const api = d2.Api.getApi();
                return mapPromise(sharableObjects, sharableObject => {
                    const objectType = sharableObject.modelDefinition.name;
                    return api.get('sharing', { type: objectType, id: sharableObject.id }, { contentType: 'text/plain' });
                });
            })
            .then(responses => {
                const pairs = _(sharableObjects).zip(responses).value();
                const sharableStates = pairs.map(([sharableObject, { meta, object }]) => {
                    const objectType = sharableObject.modelDefinition.name;
                    const sharableState = {
                        objectType,
                        meta,
                        user: object.user,
                        externalAccess: object.externalAccess,
                        publicAccess: object.publicAccess,
                        userGroupAccesses: object.userGroupAccesses || [],
                    };
                    sharableState.model = sharableObject;
                    sharableState.isSaving = false;
                    return sharableState;
                });
                sharingStore.setState(sharableStates);
            })
            .then(complete)
            .catch(error);
    });

actions.externalAccessChanged
    .subscribe(({ data }) => {
        const newSharableStates = sharingStore.getState()
            .map(sharableState => Object.assign({}, sharableState, { externalAccess : data }));
        sharingStore.setState(newSharableStates);
        actions.saveChangedState();
    });

actions.publicAccessChanged
    .subscribe(({ data: publicAccess }) => {
        const newSharableStates = sharingStore.getState()
            .map(sharableState => Object.assign({}, sharableState, { publicAccess }));
        sharingStore.setState(newSharableStates);
        actions.saveChangedState();
    });

actions.userGroupAcessesChanged
    .subscribe(({ data: {models: userGroupAccesses, strategy} }) => {
        const getUserGroupAccesses = (sharableState) => {
            switch(strategy) {
                case "merge":
                    const ids = _(sharableState.userGroupAccesses).map("id")
                        .concat(_.map(userGroupAccesses, "id")).uniq().value();
                    return _(sharableState.userGroupAccesses).keyBy("id")
                        .merge(_.keyBy(userGroupAccesses, "id")).at(ids).value();
                case "replace":
                    return userGroupAccesses;
                default:
                    throw new Error("Unknown strategy: " + strategy);
            }
        };
        const newSharableStates = sharingStore.getState().map(sharableState => {
            return _.extend({}, sharableState, {userGroupAccesses: getUserGroupAccesses(sharableState)});
        });

        sharingStore.setState(newSharableStates);
        actions.saveChangedState();
    });

function saveSharingToServer(action) {
    return getD2()
        .then((d2) => {
            const api = d2.Api.getApi();

            return mapPromise(sharingStore.getState(), sharingState => {
                const {
                    meta,
                    model,
                    externalAccess,
                    publicAccess,
                    userGroupAccesses,
                    objectType,
                } = sharingState;

                const sharingDataToPost = {
                    meta,
                    object: {
                        externalAccess,
                        publicAccess,
                        userGroupAccesses: userGroupAccesses.filter(userGroupAccess => {
                            if (userGroupAccess.access !== '--------') {
                                return true;
                            }
                            return false;
                        }),
                    },
                };

                return api.post(`sharing?type=${objectType}&id=${model.id}`, sharingDataToPost)
                    .then(({ httpStatus, message }) => {
                        if (httpStatus === 'OK') {
                            action.complete(message);
                        } else {
                            action.error(message);
                        }
                        return message;
                    })
                    .catch(({ message }) => {
                        action.error(message);
                        return message;
                    });
            });
        });
}

actions.saveChangedState
    .debounce(500)
    .map(saveSharingToServer)
    .concatAll()
    .subscribe(() => {
        actions.loadObjectSharingState(sharingStore.getState().map(sharingState => sharingState.model));
    });

export default actions;
