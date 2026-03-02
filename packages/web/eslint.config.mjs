import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
    // Ignores
    {
        ignores: ['.next/**', 'node_modules/**', 'drizzle/**'],
    },

    // Base
    js.configs.recommended,
    ...tseslint.configs.recommended,

    // TypeScript + React
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                React: 'readonly',
            },
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/consistent-type-imports': [
                'warn',
                { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
            ],
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-require-imports': 'error',
            'prefer-const': 'error',
            'no-console': 'warn',
        },
    }
)
