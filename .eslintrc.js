module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module',
    },
    extends: [
        'plugin:@typescript-eslint/recommended',
        'eslint:recommended',
        'prettier',
        'prettier/@typescript-eslint',
    ],
    plugins: ['prettier'],
    root: true,
    env: {
        es6: true,
        node: true,
        jest: true,
    },
    rules: {
        'prettier/prettier': 'error',
    },
}
