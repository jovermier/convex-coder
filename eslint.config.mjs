import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig, // This disables ESLint formatting rules that conflict with Prettier
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      "react-compiler": reactCompiler,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: { react: { version: "detect" } },
    rules: {
      // React rules
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // React Compiler rules
      "react-compiler/react-compiler": "error",

      // Remove prettier/prettier rule - let Prettier handle formatting separately
    },
  },
  {
    files: [
      "scripts/**/*.js",
      ".claude/hooks/*",
      "generate-env.js",
      "seed-data.js",
      "setup-env.js",
      "deploy-to-self-hosted.js",
      "startup-sync-admin-key.mjs",
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "commonjs",
      },
    },
    rules: {
      // Node.js specific rules
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
      "no-prototype-builtins": "off",

      // Disable any formatting rules for Node.js files too
      "no-trailing-spaces": "off",
      "eol-last": "off",
      indent: "off",
      quotes: "off",
      semi: "off",
    },
  },
  {
    ignores: [
      "dist", 
      "node_modules", 
      "convex/_generated", 
      "echoes-of-aeria/**",
      "playwright-report/**",
      "test-results/**",
      "test-results-*/**",
      "react-compiler.config.js",
      "startup-sync-admin-key.mjs",
      "src/hooks/usePerformanceMonitoring.ts"
    ],
  }
);
