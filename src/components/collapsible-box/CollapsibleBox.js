import React from "react";
import createReactClass from 'create-react-class';
import PropTypes from "prop-types";
import classNames from "classnames";
import IconButton from "material-ui/IconButton/IconButton";
import ArrowRight from "material-ui/svg-icons/hardware/keyboard-arrow-right.js";
import ArrowLeft from "material-ui/svg-icons/hardware/keyboard-arrow-left.js";
import _ from "../../utils/lodash-mixins";
import "./CollapsibleBox.scss";

const CollapsibleBox = createReactClass({
    propTypes: {
        open: PropTypes.bool,
        onToggle: PropTypes.func,
        styles: PropTypes.shape({
            wrapper: PropTypes.shape({
                open: PropTypes.object,
                close: PropTypes.object,
            }),
            iconButton: PropTypes.object,
            content: PropTypes.object,
        }),
    },

    getDefaultProps: function() {
        return {
            open: true,
            styles: {},
        };
    },

    getInitialState: function() {
        return { open: this.props.open };
    },

    UNSAFE_componentWillReceiveProps: function(newProps) {
        if (this.props.open !== newProps.open) {
            this.setState({ open: newProps.open });
        }
    },

    toggleOpen: function() {
        const newOpen = !this.state.open;
        this.props.onToggle && this.props.onToggle(newOpen);
        this.setState({ open: newOpen });
    },

    render: function() {
        const defaultStyles = {
            wrapper: { open: {}, close: {} },
            iconButton: { width: "100%" },
            content: {},
        };
        const styles = _.deepMerge(defaultStyles, this.props.styles);
        const { open } = this.state;
        const wrapperClass = classNames(["collapsible-box", open ? "open" : "close"]);
        const wrapperStyle = open ? styles.wrapper.open : styles.wrapper.close;

        return (
            <div className={wrapperClass} style={wrapperStyle}>
                <IconButton onClick={this.toggleOpen} className="toggle" style={styles.iconButton}>
                    {open ? <ArrowLeft /> : <ArrowRight />}
                </IconButton>

                <div className="content" style={styles.content}>
                    {this.props.children}
                </div>
            </div>
        );
    },
});

export default CollapsibleBox;
