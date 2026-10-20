module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '**/node_modules/**', '.artifacts/**', '.vs/**'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  rules: {
    'no-console': 'error',
    'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }],
    'no-empty': ['error', { allowEmptyCatch: true }],
    'react/prop-types': 'off',
  },
  overrides: [
    {
      files: ['functions/**/*.js', 'scripts/**/*.{js,cjs,mjs}', '*.config.js'],
      env: { node: true },
    },
    { files: ['public/*.js'], env: { serviceworker: true } },
  ],
};
