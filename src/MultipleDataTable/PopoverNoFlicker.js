/* eslint no-unused-vars: off */
/* eslint @typescript-eslint/no-unused-vars: off */
import React from "react";
import Paper from "material-ui/Paper";
import Popover from "material-ui/Popover";
import PopoverAnimationDefault from "material-ui/Popover/PopoverAnimationDefault";

// See https://github.com/mui-org/material-ui/issues/8040

class PopoverNoFlicker extends Popover {
    renderLayer = () => {
        const {
            animated,
            animation,
            anchorEl,
            anchorOrigin,
            autoCloseWhenOffScreen,
            canAutoPosition,
            children,
            onRequestClose,
            style,
            targetOrigin,
            useLayerForClickAway,
            scrollableContainer,
            ...other
        } = this.props;

        let styleRoot = style;

        if (!animated) {
            styleRoot = {
                position: "fixed",
                zIndex: this.context.muiTheme.zIndex.popover,
                opacity: this.state.setPlacement ? 1 : 0, // EDIT
            };

            if (!this.state.open) {
                return null;
            }

            return (
                <Paper style={Object.assign(styleRoot, style)} {...other}>
                    {children}
                </Paper>
            );
        }

        const Animation = animation || PopoverAnimationDefault;

        return (
            <Animation
                targetOrigin={targetOrigin}
                style={styleRoot}
                {...other}
                open={this.state.open && !this.state.closing}
            >
                {children}
            </Animation>
        );
    };

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.open === this.props.open) {
            return;
        }

        if (nextProps.open) {
            clearTimeout(this.timeout);
            this.timeout = null;
            this.anchorEl = nextProps.anchorEl || this.props.anchorEl;
            this.setState(
                {
                    open: true,
                    closing: false,
                    setPlacement: false,
                },
                () => {
                    // EDIT
                    setTimeout(() => {
                        this.setState({
                            setPlacement: true,
                        });
                    });
                }
            );
        } else {
            if (nextProps.animated) {
                if (this.timeout !== null) return;
                this.setState({ closing: true });
                this.timeout = setTimeout(() => {
                    this.setState(
                        {
                            open: false,
                        },
                        () => {
                            this.timeout = null;
                        }
                    );
                }, 500);
            } else {
                this.setState({
                    open: false,
                });
            }
        }
    }
}

export default PopoverNoFlicker;
