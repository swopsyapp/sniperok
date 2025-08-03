// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import vitestGlobals from 'eslint-plugin-vitest-globals';

export default [
    {
        ignores: [
            '.DS_Store',
            'node_modules/',
            'build/**',
            '.pnpm-store/**',
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

    eslint.configs.recommended,

    ...tseslint.configs.recommended,

    {
        files: ['src/**/*.ts', 'src/**/*.tsx'],
        ...tseslint.configs.recommendedTypeChecked[0]
    },
    {
        files: ['**/*.ts', '**/*.js', '**/*.mjs', '**/*.cjs'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                sourceType: 'module',
                ecmaVersion: 2020
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2017
            }
        }
    },

    {
        files: ['**/*.svelte'],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: {
                    ts: tseslint.parser
                },
                project: './tsconfig.json',
                extraFileExtensions: ['.svelte'],
                sourceType: 'module',
                ecmaVersion: 2020
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                NodeJS: 'readonly',
                ...globals.es2017
            }
        },
        plugins: {
            svelte: sveltePlugin
        },
        processor: sveltePlugin.processors.svelte,
        rules: {
            ...sveltePlugin.configs.recommended.rules,
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern:
                        '^(?:\\$\\$Props|\\$\\$Events|\\$\\$Slots|\\$(?:state|props|derived))',
                    caughtErrorsIgnorePattern: '^_'
                }
            ]
        }
    },

    {
        files: ['**/*.test.{ts,js}', '**/*.spec.{ts,js}'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                sourceType: 'module',
                ecmaVersion: 2020
            },
            globals: {
                ...vitestGlobals.configs.recommended.globals,
                ...globals.browser,
                ...globals.node
            }
        },
        plugins: {
            'vitest-globals': vitestGlobals
        },
        rules: {
            'no-undef': 'off'
        }
    },

    prettierConfig
];
