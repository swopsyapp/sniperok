// eslint.config.js
import eslint from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser'; // Note: svelte-eslint-parser is needed for .svelte files
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
    // 1. Base ESLint Recommended Rules
    eslint.configs.recommended,

    // 2. TypeScript-specific configuration
    {
        files: ['**/*.ts', '**/*.cjs', '**/*.js', '**/*.mjs'], // Apply to JS/TS files
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                sourceType: 'module',
                ecmaVersion: 2020
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2017 // From your env in .eslintrc.cjs [cite: 2]
            }
        },
        plugins: {
            '@typescript-eslint': tsEslint
        },
        rules: {
            ...tsEslint.configs.recommended.rules // @typescript-eslint/recommended
            // Add any custom TypeScript rules here if you had them
        }
    },

    // 3. Svelte-specific configuration
    {
        files: ['**/*.svelte'],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: tsParser, // The TypeScript parser used for <script lang="ts"> in Svelte files [cite: 3]
                extraFileExtensions: ['.svelte'], // Not strictly needed here but was in your old config [cite: 1]
                sourceType: 'module',
                ecmaVersion: 2020
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2017 // From your env in .eslintrc.cjs [cite: 2]
            }
        },
        plugins: {
            svelte: sveltePlugin
        },
        processor: sveltePlugin.processors.svelte,
        rules: {
            ...sveltePlugin.configs.recommended.rules // plugin:svelte/recommended
            // Add any custom Svelte rules here
        }
    },

    // 4. Prettier configuration (should be last to override formatting rules)
    prettierConfig,

    // 5. Ignore patterns (from your .eslintignore file)
    {
        ignores: [
            '.DS_Store',
            'node_modules/',
            '/build/',
            '/.svelte-kit/',
            '/package/',
            '.env',
            '.env.*',
            '!.env.example',
            'pnpm-lock.yaml',
            'package-lock.json',
            'yarn.lock'
        ]
    }
];
