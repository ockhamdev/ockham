import rootConfig from '../../eslint.config.mjs'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    ...rootConfig,

    // CodeScan: Node.js library, stricter rules
    {
        files: ['src/**/*.ts'],
        rules: {
            'no-console': 'error',
            '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
        },
    }
)
