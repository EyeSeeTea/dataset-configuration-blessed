import React from "react";
//import { ConfirmationDialog } from "d2-ui-components";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";

import Sharing from "./Sharing";

const i18n = { t: s => s };

const SharingDialog = ({
    isOpen,
    isDataShareable,
    sharedObject,
    onCancel,
    onSharingChanged,
    onSearchRequest,
}) => {
    return (
        <React.Fragment>
            <Dialog
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
                            sharedObject={sharedObject}
                            dataShareable={isDataShareable}
                            onChange={onSharingChanged}
                            onSearch={onSearchRequest}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </React.Fragment>
    );
};

export default SharingDialog;
