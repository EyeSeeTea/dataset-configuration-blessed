import React, { Component } from "react";
import PropTypes from "prop-types";
import { Subject } from "rxjs/Subject";
import { timer } from "rxjs/observable/timer";
import { debounce } from "rxjs/operators";
import { withStyles } from "@material-ui/core/styles";

import { accessObjectToString } from "./utils";
import PermissionPicker from "./PermissionPicker";
import AutoComplete from "./AutoComplete";
import i18n from "./i18n";

const styles = {
    container: {
        fontWeight: "400",
        padding: 16,
        backgroundColor: "#F5F5F5",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
    },

    innerContainer: {
        display: "flex",
        flexDirection: "row",
        flex: 1,
    },

    title: {
        color: "#818181",
        paddingBottom: 8,
    },
};

const searchDelay = 300;

class UserSearch extends Component {
    state = {
        defaultAccess: {
            meta: { canView: true, canEdit: true },
            data: { canView: false, canEdit: false },
        },
        searchResult: [],
        searchText: "",
    };

    componentDidMount() {
        this.inputStream.pipe(debounce(() => timer(searchDelay))).subscribe(searchText => {
            this.fetchSearchResult(searchText);
        });
    }

    onItemSelected = selected => {
        // Material UI triggers an 'onUpdateInput' when a search result is clicked. Therefore, we
        // immediately pushes a new item to the search stream to prevent the stream from searching
        // for the item again.
        this.inputStream.next("");

        const selection = this.state.searchResult.find(r => r.id === selected.id);

        const type = selection.type;
        delete selection.type;

        if (type === "userAccess") {
            this.props.addUserAccess({
                ...selection,
                access: accessObjectToString(this.state.defaultAccess),
            });
        } else {
            this.props.addUserGroupAccess({
                ...selection,
                access: accessObjectToString(this.state.defaultAccess),
            });
        }
        this.clearSearchText();
    };

    inputStream = new Subject();

    hasNoCurrentAccess = userOrGroup => this.props.currentAccessIds.indexOf(userOrGroup.id) === -1;

    fetchSearchResult = searchText => {
        if (searchText === "") {
            this.handleSearchResult([]);
        } else {
            this.props.onSearch(searchText).then(({ users, userGroups }) => {
                const addType = type => result => ({ ...result, type });
                const searchResult = users
                    .map(addType("userAccess"))
                    .filter(this.hasNoCurrentAccess)
                    .concat(
                        userGroups.map(addType("userGroupAccess")).filter(this.hasNoCurrentAccess)
                    );

                this.handleSearchResult(searchResult);
            });
        }
    };

    handleSearchResult = searchResult => {
        this.setState({ searchResult });
    };

    onInputChanged = searchText => {
        this.inputStream.next(searchText);
        this.setState({ searchText });
    };

    accessOptionsChanged = accessOptions => {
        this.setState({
            defaultAccess: accessOptions,
        });
    };

    clearSearchText = () => {
        this.setState({
            searchText: "",
        });
    };

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.container}>
                <div className={classes.title}>{i18n.t("Add users and user groups")}</div>
                <div className={classes.innerContainer}>
                    <AutoComplete
                        suggestions={this.state.searchResult}
                        placeholderText={i18n.t("Enter names")}
                        onItemSelected={this.onItemSelected}
                        onInputChanged={this.onInputChanged}
                        searchText={this.state.searchText}
                        classes={{}}
                    />
                    <PermissionPicker
                        access={this.state.defaultAccess}
                        accessOptions={{
                            meta: {
                                canView: true,
                                canEdit: true,
                                noAccess: false,
                            },
                            data: this.props.dataShareable && {
                                canView: true,
                                canEdit: true,
                                noAccess: true,
                            },
                        }}
                        onChange={this.accessOptionsChanged}
                    />
                </div>
            </div>
        );
    }
}

UserSearch.propTypes = {
    onSearch: PropTypes.func.isRequired,
    addUserAccess: PropTypes.func.isRequired,
    dataShareable: PropTypes.bool.isRequired,
    addUserGroupAccess: PropTypes.func.isRequired,
    currentAccessIds: PropTypes.array.isRequired,
};

export default withStyles(styles)(UserSearch);
