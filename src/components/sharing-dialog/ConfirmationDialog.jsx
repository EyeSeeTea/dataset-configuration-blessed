import React from "react";
import PropTypes from "prop-types";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@material-ui/core";
import i18n from "./i18n";

class ConfirmationDialog extends React.Component {
    static propTypes = {
        isOpen: PropTypes.bool.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        onSave: PropTypes.func,
        onCancel: PropTypes.func,
        saveText: PropTypes.string,
        cancelText: PropTypes.string,
        disableSave: PropTypes.bool,
    };

    render() {
        const {
            title,
            description,
            onSave,
            onCancel,
            isOpen,
            children,
            cancelText,
            saveText,
            disableSave,
            ...other
        } = this.props;

        return (
            <Dialog open={isOpen} onClose={onCancel} {...other}>
                <DialogTitle>{title}</DialogTitle>

                <DialogContent>
                    {description && (
                        <React.Fragment>
                            {description.split("\n").map((text, idx) => (
                                <p key={idx}>{text}</p>
                            ))}
                        </React.Fragment>
                    )}
                    {children}
                </DialogContent>

                <DialogActions>
                    {onCancel && (
                        <Button onClick={onCancel} autoFocus>
                            {cancelText || i18n.t("Cancel")}
                        </Button>
                    )}
                    {onSave && (
                        <Button onClick={onSave} color="primary" disabled={disableSave}>
                            {saveText || i18n.t("Save")}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        );
    }
}

export default ConfirmationDialog;
