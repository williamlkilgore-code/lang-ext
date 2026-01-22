const security = require('eslint-plugin-security');
const noUnsanitized = require('eslint-plugin-no-unsanitized');

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        chrome: 'readonly',
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        MutationObserver: 'readonly',
        Element: 'readonly',
        HTMLElement: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        JSON: 'readonly'
      }
    },
    plugins: {
      security,
      'no-unsanitized': noUnsanitized
    },
    rules: {
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'warn',
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error'
    }
  }
];
