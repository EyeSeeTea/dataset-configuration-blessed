/** @format */

module.exports = {
    extends: ["react-app", "prettier"],
    rules: {
        "no-console": "off",
        "no-unused-vars": ["error", { argsIgnorePattern: "^_", ignoreRestSiblings: true }],
        "jsx-a11y/anchor-is-valid": "off",
    },
    settings: {
        react: {
            pragma: "React",
            version: "16.6.0",
        },
    },
};
