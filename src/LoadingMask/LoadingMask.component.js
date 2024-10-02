import React from "react";
import createReactClass from "create-react-class";
import { CircularProgress } from "@material-ui/core";

export default createReactClass({
    render() {
        const style = {
            left: "45%",
            position: "fixed",
            top: "45%",
        };

        return <CircularProgress style={style} />;
    },
});
