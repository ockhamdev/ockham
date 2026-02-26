import rootConfig from '../../eslint.config.mjs'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactRefreshPlugin from 'eslint-plugin-react-refresh'
import globals from 'globals'

export default tseslint.config(
    ...rootConfig,

    // ── Main process (Node.js) ─────────────────────────────────────
    {
        files: ['src/main/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            // Console is OK in main process for logging
            'no-console': 'off',
        },
    },

    // ── Preload (Node.js + limited DOM) ────────────────────────────
    {
        files: ['src/preload/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
            },
        },
        rules: {
            'no-console': 'off',
        },
    },

    // ── Renderer (Browser + React) ─────────────────────────────────
    {
        files: ['src/renderer/**/*.{ts,tsx}'],
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            'react-refresh': reactRefreshPlugin,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
            },
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            // React rules
            ...reactPlugin.configs.flat.recommended.rules,
            ...reactPlugin.configs.flat['jsx-runtime'].rules,

            // React Hooks rules
            ...reactHooksPlugin.configs['recommended-latest'].rules,

            // React Refresh (HMR)
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],

            // React-specific overrides
            'react/prop-types': 'off', // Using TypeScript
            'react/no-unescaped-entities': 'warn',

            // Console is OK in dev but warn
            'no-console': 'warn',
        },
    }
)
