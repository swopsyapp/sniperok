// eslint.config.js
import eslint from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
    // 1. Global Ignore patterns (move this to the top for effective ignoring)
    {
        ignores: [
            '.DS_Store',
            'node_modules/',
            'build/**',
            '.svelte-kit/**',
            '/package/',
            '.env',
            '.env.*',
            '!.env.example',
            'pnpm-lock.yaml',
            'package-lock.json',
            'yarn.lock',
            'vite.config.ts.timestamp-*.mjs'
        ]
    },

    // 2. Base ESLint Recommended Rules
    eslint.configs.recommended,

    // 3. TypeScript-specific configuration
    {
        files: ['**/*.ts', '**/*.cjs', '**/*.js', '**/*.mjs'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                sourceType: 'module',
                ecmaVersion: 2020
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2017
            }
        },
        plugins: {
            '@typescript-eslint': tsEslint
        },
        rules: {
            ...tsEslint.configs.recommended.rules
        }
    },

    // 4. Svelte-specific configuration
    {
        files: ['**/*.svelte'],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: tsParser,
                extraFileExtensions: ['.svelte'],
                sourceType: 'module',
                ecmaVersion: 2020
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2017
            }
        },
        plugins: {
            svelte: sveltePlugin
        },
        processor: sveltePlugin.processors.svelte,
        rules: {
            ...sveltePlugin.configs.recommended.rules
        }
    },

    // 5. Prettier configuration (should be last to override formatting rules)
    prettierConfig
];
