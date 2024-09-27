module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    env: {
        browser: false,
        es6: true,
        node: true,
    },
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:jest/recommended", "prettier"],
    parserOptions: {
        sourceType: "module",
        ecmaVersion: 2020,
        project: true,
    },
    plugins: ["@typescript-eslint", "prettier", "unicorn"],
    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "unicorn/filename-case": [
            "error",
            {
                cases: {
                    camelCase: true,
                    pascalCase: true,
                },
            },
        ],
    },
};
