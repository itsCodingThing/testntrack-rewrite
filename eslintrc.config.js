export default {
  root: true,
  parser: "@typescript-eslint/parser",
  env: {
    browser: false,
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2024,
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
