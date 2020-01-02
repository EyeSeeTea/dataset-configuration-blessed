import React from "react";
import createReactClass from 'create-react-class';
import PropTypes from "prop-types";
import LinearProgress from "material-ui/LinearProgress";

export default createReactClass({
    propTypes: {
        isLoading: PropTypes.bool.isRequired,
    },

    getDefaultProps() {
        return {
            isLoading: false,
        };
    },

    render() {
        if (!this.props.isLoading) {
            return null;
        }

        return <LinearProgress mode="indeterminate" style={{ backgroundColor: "lightblue" }} />;
    },
});
