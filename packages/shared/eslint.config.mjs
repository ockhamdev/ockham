import rootConfig from '../../eslint.config.mjs'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    ...rootConfig,

    // Shared package: pure TypeScript, stricter rules
    {
        files: ['src/**/*.ts'],
        rules: {
            // No console at all in shared lib
            'no-console': 'error',
            // Strict type exports
            '@typescript-eslint/consistent-type-exports': 'off',
            // Ensure interfaces are used over type aliases for object shapes
            '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
        },
    }
)
