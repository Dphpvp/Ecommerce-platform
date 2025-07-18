import eslintJs from "@eslint/js";
import eslintPluginReact from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

const trimmedGlobals = Object.keys(globals.browser).reduce((acc, key) => {
    acc[key.trim()] = globals.browser[key];
    return acc;
}, {});


export default [
  eslintJs.configs.recommended,
  {
    plugins: {
      react: eslintPluginReact,
      "jsx-a11y": jsxA11y
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...trimmedGlobals,
        ...globals.node,
        React: "writable"
      }
    },
    rules: {
      ...eslintPluginReact.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }
];
