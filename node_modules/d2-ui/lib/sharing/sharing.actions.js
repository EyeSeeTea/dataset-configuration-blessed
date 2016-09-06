'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Action = require('../action/Action');

var _Action2 = _interopRequireDefault(_Action);

var _sharing = require('./sharing.store');

var _sharing2 = _interopRequireDefault(_sharing);

var _d = require('d2/lib/d2');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var actions = _Action2.default.createActionsFromNames(['externalAccessChanged', 'loadObjectSharingState', 'publicAccessChanged', 'userGroupAcessesChanged', 'saveChangedState']);

actions.externalAccessChanged.subscribe(function (_ref) {
    var data = _ref.data;

    _sharing2.default.setState(Object.assign({}, _sharing2.default.getState(), { externalAccess: data }));

    actions.saveChangedState();
});

actions.loadObjectSharingState.subscribe(function (_ref2) {
    var sharableObject = _ref2.data;
    var complete = _ref2.complete;
    var error = _ref2.error;

    if (!sharableObject.modelDefinition || !sharableObject.modelDefinition.name) {
        error({
            actionName: 'sharing.loadObjectSharingState',
            message: 'shareableObject should contain a modelDefinition property'
        });
    }

    var objectType = sharableObject.modelDefinition.name;

    (0, _d.getInstance)().then(function (d2) {
        var api = d2.Api.getApi();

        return api.get('sharing', { type: objectType, id: sharableObject.id }, { contentType: 'text/plain' });
    }).then(function (_ref3) {
        var meta = _ref3.meta;
        var object = _ref3.object;

        var sharableState = {
            objectType: objectType,
            meta: meta,
            user: object.user,
            externalAccess: object.externalAccess,
            publicAccess: object.publicAccess,
            userGroupAccesses: object.userGroupAccesses || []
        };
        sharableState.model = sharableObject;
        sharableState.isSaving = false;
        _sharing2.default.setState(sharableState);
    }).then(complete).catch(error);
});

actions.publicAccessChanged.subscribe(function (_ref4) {
    var publicAccess = _ref4.data;

    _sharing2.default.setState(Object.assign({}, _sharing2.default.getState(), { publicAccess: publicAccess }));

    actions.saveChangedState();
});

actions.userGroupAcessesChanged.subscribe(function (_ref5) {
    var userGroupAccesses = _ref5.data;

    _sharing2.default.setState(Object.assign({}, _sharing2.default.getState(), { userGroupAccesses: userGroupAccesses }));

    actions.saveChangedState();
});

function saveSharingToServer(action) {
    return (0, _d.getInstance)().then(function (d2) {
        var api = d2.Api.getApi();

        var _sharingStore$getStat = _sharing2.default.getState();

        var meta = _sharingStore$getStat.meta;
        var model = _sharingStore$getStat.model;
        var externalAccess = _sharingStore$getStat.externalAccess;
        var publicAccess = _sharingStore$getStat.publicAccess;
        var userGroupAccesses = _sharingStore$getStat.userGroupAccesses;
        var objectType = _sharingStore$getStat.objectType;


        var sharingDataToPost = {
            meta: meta,
            object: {
                externalAccess: externalAccess,
                publicAccess: publicAccess,
                userGroupAccesses: userGroupAccesses.filter(function (userGroupAccess) {
                    if (userGroupAccess.access !== '--------') {
                        return true;
                    }
                    return false;
                })
            }
        };

        return api.post('sharing?type=' + objectType + '&id=' + model.id, sharingDataToPost).then(function (_ref6) {
            var httpStatus = _ref6.httpStatus;
            var message = _ref6.message;

            if (httpStatus === 'OK') {
                action.complete(message);
            } else {
                action.error(message);
            }
            return message;
        }).catch(function (_ref7) {
            var message = _ref7.message;

            action.error(message);
            return message;
        });
    });
}

actions.saveChangedState.debounce(500).map(saveSharingToServer).concatAll().subscribe(function () {
    actions.loadObjectSharingState(_sharing2.default.getState().model);
});

exports.default = actions;