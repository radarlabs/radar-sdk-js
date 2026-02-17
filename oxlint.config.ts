import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'import', 'jsdoc'],
  rules: {
    'prefer-const': 'error',
    'typescript/consistent-type-imports': 'error',
  },
  overrides: [
    {
      files: ['test/**/*.ts'],
      rules: {
        'typescript/unbound-method': 'off',
      },
    },
  ],
});
