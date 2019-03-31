import React from "react";
import FloatingActionButton from "material-ui/FloatingActionButton";
import FontIcon from "material-ui/FontIcon";
import Auth from "d2-ui/lib/auth/Auth.mixin";
import { goToRoute } from "../router";

const ListActionBar = React.createClass({
    propTypes: {
        route: React.PropTypes.string,
    },

    contextTypes: {
        d2: React.PropTypes.object.isRequired,
    },

    mixins: [Auth],

    _addClick() {
        goToRoute(this.props.route);
    },

    render() {
        const cssStyles = {
            textAlign: "right",
            marginTop: "1rem",
            bottom: "1.5rem",
            right: "1.5rem",
            position: "fixed",
            zIndex: 10,
        };

        return (
            <div style={cssStyles}>
                <FloatingActionButton backgroundColor="#ff9800" onClick={this._addClick}>
                    <FontIcon className="material-icons">add</FontIcon>
                </FloatingActionButton>
            </div>
        );
    },
});

export default ListActionBar;
