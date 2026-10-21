import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tsParser from "@typescript-eslint/parser";

export default [
    { ignores: ["public/**", "vendor/**", "node_modules/**"] },
    js.configs.recommended,
    {
        files: ["resources/js/**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            parser: tsParser,
            globals: { ...globals.browser, route: "readonly" },
            parserOptions: {
                ecmaFeatures: { jsx: true },
                ecmaVersion: "latest",
                sourceType: "module",
            },
        },
        plugins: { react, "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
        settings: { react: { version: "18.2" } },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            ...jsxA11y.configs.recommended.rules,
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "jsx-a11y/no-noninteractive-element-interactions": "off",
            "no-restricted-imports": [
                "error",
                {
                    paths: [{ name: "axios", message: "Gunakan instance dari @/lib/http." }],
                },
            ],
        },
    },
    {
        files: ["resources/js/lib/http.ts"],
        rules: { "no-restricted-imports": "off" },
    },
    {
        files: ["resources/js/**/*.{ts,tsx}"],
        rules: {
            "no-undef": "off",
            "no-unused-vars": "off",
        },
    },
    {
        files: ["resources/js/**/*.{js,jsx}"],
        rules: {
            "no-unused-vars": "warn",
            "jsx-a11y/click-events-have-key-events": "warn",
            "jsx-a11y/no-static-element-interactions": "warn",
            "jsx-a11y/label-has-associated-control": "warn",
            "jsx-a11y/no-autofocus": "warn",
            "react/no-unescaped-entities": "warn",
            "react-hooks/exhaustive-deps": "warn",
        },
    },
];
