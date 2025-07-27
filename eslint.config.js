// eslint.config.js
import eslint from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import vitestGlobals from 'eslint-plugin-vitest-globals';

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
        files: ['**/*.svelte', '**/*.ts', '**/*.js'],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: tsParser,
                extraFileExtensions: ['.svelte', '.ts', '.js'],
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
            svelte: sveltePlugin,
            '@typescript-eslint': tsEslint
        },
        processor: sveltePlugin.processors.svelte,
        rules: {
            ...sveltePlugin.configs.recommended.rules,
            // Disable default no-unused-vars for Svelte files as it conflicts with runes
            'no-unused-vars': 'off',
            // Use @typescript-eslint's no-unused-vars with a more Svelte-aware configuration
            '@typescript-eslint/no-unused-vars': [
                'warn', // Or 'error' if you prefer
                {
                    argsIgnorePattern: '^_', // Ignore unused arguments starting with _
                    varsIgnorePattern:
                        '^(?:\\$\\$Props|\\$\\$Events|\\$\\$Slots|\\$(?:state|props|derived))', // Allow Svelte runes and special variables
                    caughtErrorsIgnorePattern: '^_'
                }
            ]
        }
    },

    // 5. Configuration for test files
    {
        files: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.js', '**/*.spec.js'], // Ensure these patterns match your test files
        languageOptions: {
            // Include Vitest globals. This should override or merge with previous globals.
            globals: {
                ...vitestGlobals.configs.recommended.globals, // Provides 'vi', 'expect', 'test', etc.
                // Keep browser/node if your tests still rely on these environments' globals
                ...globals.browser,
                ...globals.node
            },
            parser: tsParser, // Ensure TypeScript parser is still active for TS test files
            parserOptions: {
                sourceType: 'module',
                ecmaVersion: 2020
            }
        },
        plugins: {
            // Also explicitly include @typescript-eslint plugin if your test files are TypeScript
            '@typescript-eslint': tsEslint,
            'vitest-globals': vitestGlobals // Register the plugin
        },
        rules: {
            // This is the key part for `no-undef`
            // If you are using `@typescript-eslint/no-unused-vars` (which is common)
            // and still getting `no-undef`, you might need to explicitly disable it for this scope.
            // However, the `vitest-globals` plugin's recommended config should handle this.
            // If it still fails, try this:
            'no-undef': 'off' // <--- Add this line ONLY if the problem persists
            // You can also add specific Vitest rules from the plugin here
            // e.g., 'vitest-globals/no-focused-tests': 'warn',
        }
    },

    // 6. Prettier configuration (should be last to override formatting rules)
    prettierConfig
];
