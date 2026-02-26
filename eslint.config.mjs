import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
    // Global ignores
    {
        ignores: ['**/dist/**', '**/out/**', '**/node_modules/**', '**/release/**'],
    },

    // Base JS recommended rules
    js.configs.recommended,

    // TypeScript recommended rules (type-aware)
    ...tseslint.configs.recommended,

    // Global settings for all TS files
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.es2020,
            },
        },
        rules: {
            // Enforce consistent type imports
            '@typescript-eslint/consistent-type-imports': [
                'warn',
                { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
            ],
            // Allow unused vars with _ prefix
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            // Disallow explicit any (warn first)
            '@typescript-eslint/no-explicit-any': 'warn',
            // Require return types on exported functions
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            // Prefer const assertions
            'prefer-const': 'error',
            // No console in production code (warn)
            'no-console': 'warn',
        },
    }
)
