import { FeedbackOptions } from "@eyeseetea/feedback-component";

export const appConfig: AppConfig = {
    id: "d2-dataset-configuration",
    appearance: {
        showShareButton: true,
    },
    feedback: {
        repositories: {
            clickUp: {
                // https://app.clickup.com/${workspace}/v/b/N-${listId}-M
                // Web development -> Common resources -> app-skeleton
                listId: "42597084",
                title: "[User feedback] {title}",
                body: "## dhis2\n\nUsername: {username}\n\n{body}",
            },
        },
        layoutOptions: {
            buttonPosition: "bottom-start",
        },
    },
};

export interface AppConfig {
    id: string;
    appearance: {
        showShareButton: boolean;
    };
    feedback?: FeedbackOptions;
}
