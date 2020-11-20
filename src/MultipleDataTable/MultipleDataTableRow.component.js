import React, { isValidElement } from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import classes from "classnames";
import isObject from "d2-utilizr/lib/isObject";
import isString from "d2-utilizr/lib/isString";
import moment from "moment";
import IconButton from "material-ui/IconButton";
import MoreVert from "material-ui/svg-icons/navigation/more-vert";
import Color from "d2-ui/lib/data-table/data-value/Color.component";
import Translate from "d2-ui/lib/i18n/Translate.mixin";

import "./MultipleDataTableRow.scss";

function valueTypeGuess(valueType, value) {
    switch (valueType) {
        case "DATE":
            return moment(new Date(value)).fromNow();
        case "TEXT":
            if (/#([a-z0-9]{6})$/i.test(value)) {
                return <Color value={value} />;
            }
            return value;
        default:
            break;
    }

    return value;
}

function getValueAfterValueTypeGuess(dataSource, columnName) {
    if (
        dataSource &&
        dataSource.modelDefinition &&
        dataSource.modelDefinition.modelValidations &&
        dataSource.modelDefinition.modelValidations[columnName]
    ) {
        return valueTypeGuess(
            dataSource.modelDefinition.modelValidations[columnName].type,
            dataSource[columnName]
        );
    }

    return dataSource[columnName];
}

const MultipleDataTableRow = createReactClass({
    propTypes: {
        columns: PropTypes.array.isRequired,
        dataSource: PropTypes.object,
        isActive: PropTypes.bool,
        isEven: PropTypes.bool,
        isOdd: PropTypes.bool,
        hideActionsIcon: PropTypes.bool,
        itemClicked: PropTypes.func.isRequired,
        primaryClick: PropTypes.func.isRequired,
        style: PropTypes.object,
    },

    mixins: [Translate],

    render() {
        const classList = classes("data-table__rows__row", {
            "data-table__rows__row--even": !this.props.isOdd,
            "data-table__rows__row--odd": this.props.isOdd,
            selected: this.props.isActive,
        });

        const dataSource = this.props.dataSource;

        const textWrapStyle = {
            width: "100%",
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
            position: "absolute",
            wordBreak: "break-all",
            wordWrap: "break-word",
            top: 0,
            bottom: 0,
            lineHeight: "50px",
            paddingRight: "1rem",
        };

        const columns = this.props.columns.map((columnName, index) => {
            const rowValue = getValueAfterValueTypeGuess(dataSource, columnName);
            let displayValue;

            // Render objects by name or otherwise by their toString method.
            // ReactElements are also objects but we want to render them out normally, so they are excluded.
            if (isObject(rowValue) && !isValidElement(rowValue)) {
                displayValue = rowValue.displayName || rowValue.name || rowValue.toString();
            } else {
                displayValue = rowValue;
            }

            // TODO: PublicAccess Hack - need to make it so that value transformers can be registered
            if (columnName === "publicAccess") {
                displayValue = this.getDataMetadaAccessText(dataSource[columnName]);
            }

            return (
                <div
                    key={index}
                    className={"data-table__rows__row__column"}
                    onContextMenu={this.handleContextClick}
                    onClick={this.handleClick}
                >
                    {isString(displayValue) ? (
                        <span title={displayValue} style={textWrapStyle}>
                            {displayValue}
                        </span>
                    ) : (
                        displayValue
                    )}
                </div>
            );
        });
        return (
            <div className={classList} style={this.props.style}>
                {columns}
                <div className={"data-table__rows__row__column"} style={{ width: "1%" }}>
                    {this.props.hideActionsIcon ? null : (
                        <IconButton
                            tooltip={this.getTranslation("actions")}
                            onClick={this.iconMenuClick}
                        >
                            <MoreVert />
                        </IconButton>
                    )}
                </div>
            </div>
        );
    },

    iconMenuClick(event) {
        event && event.preventDefault() && event.stopPropagation();
        this.props.itemClicked(event, this.props.dataSource, true);
    },

    handleContextClick(event) {
        event && event.preventDefault();
        this.props.itemClicked(event, this.props.dataSource, false);
    },

    handleClick(event) {
        this.props.primaryClick(event, this.props.dataSource);
    },

    getDataMetadaAccessText(value) {
        if (value) {
            const accessMetadata = value.slice(0, 2);
            const accessData = value.slice(2, 4);
            const get = this.getAccessText;
            return `Data: ${get(accessMetadata)}, Metadata: ${get(accessData)}`;
        } else {
            return "?";
        }
    },

    getAccessText(value) {
        if (!value) {
            return "?";
        } else if (value === "rw") {
            return this.getTranslation("public_can_edit");
        } else if (value === "r-") {
            return this.getTranslation("public_can_view");
        } else if (value === "--") {
            return this.getTranslation("public_none");
        }
    },
});

export default MultipleDataTableRow;
