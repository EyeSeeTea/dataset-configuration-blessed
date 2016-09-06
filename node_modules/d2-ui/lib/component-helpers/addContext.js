"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = addContext;
function addContext(Component, contextTypes) {
    Component.contextTypes = Component.contextTypes || {};
    Object.assign(Component.contextTypes, contextTypes);

    return Component;
}