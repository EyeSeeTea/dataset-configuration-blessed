import React from "react";
import classNames from "classnames";
import IconButton from "material-ui/IconButton/IconButton";
import ArrowUp from "material-ui/svg-icons/hardware/keyboard-arrow-up.js";
import ArrowDown from "material-ui/svg-icons/hardware/keyboard-arrow-down.js";
import ArrowRight from "material-ui/svg-icons/hardware/keyboard-arrow-right.js";
import ArrowLeft from "material-ui/svg-icons/hardware/keyboard-arrow-left.js";
import _ from "../../utils/lodash-mixins";
import "./CollapsibleBox.scss";

const CollapsibleBox = React.createClass({
    propTypes: {
        open: React.PropTypes.bool,
        onToggle: React.PropTypes.func,
        styles: React.PropTypes.shape({
            wrapper: React.PropTypes.shape({
                open: React.PropTypes.object,
                close: React.PropTypes.object,
            }),
            iconButton: React.PropTypes.object,
            content: React.PropTypes.object,
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

    componentWillReceiveProps: function(newProps) {
        if (this.props.open != newProps.open) {
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
