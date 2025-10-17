// eslint.config.js
import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      "no-console": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
];
