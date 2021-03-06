export default {
    token: atob("MDMyNDJmYzZiMGM1YTQ4NTgyMmU2YjhkM2U4MzM3YjVhMGI5NWZlMg=="),
    createIssue: false,
    sendToDhis2UserGroups: ["GL_GlobalAdministrator", "GL_LocalindicatorAdmin"],
    issues: {
        repository: "EyeSeeTea/dataset-configuration-blessed",
        renderTitle: title => `[User feedback] ${title}`,
        renderBody: body =>
            ["## dhis2", "- Username: " + window.d2.currentUser.username, "", body].join("\n"),
    },
    snapshots: {
        repository: "EyeSeeTeaBotTest/snapshots",
        branch: "master",
    },
    feedbackOptions: {},
};
