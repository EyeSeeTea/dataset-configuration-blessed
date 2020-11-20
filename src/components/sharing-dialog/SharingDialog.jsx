import React from "react";
import DialogContent from "@material-ui/core/DialogContent";
import ConfirmationDialog from "./ConfirmationDialog";
import Sharing from "./Sharing";
import i18n from "./i18n";

const SharingDialog = ({
    isOpen,
    isDataShareable,
    sharedObject,
    onCancel,
    onSharingChanged,
    onSearchRequest,
    controls,
}) => {
    return (
        <ConfirmationDialog
            isOpen={isOpen}
            title={i18n.t("Sharing settings")}
            onCancel={onCancel}
            cancelText={i18n.t("Close")}
            maxWidth={"lg"}
            fullWidth={true}
            disableEnforceFocus
        >
            <DialogContent>
                {sharedObject && (
                    <Sharing
                        controls={controls}
                        sharedObject={sharedObject}
                        dataShareable={isDataShareable}
                        onChange={onSharingChanged}
                        onSearch={onSearchRequest}
                    />
                )}
            </DialogContent>
        </ConfirmationDialog>
    );
};

export default SharingDialog;
