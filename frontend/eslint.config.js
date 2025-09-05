module.exports = [
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      '**/*.js',
      '**/*.d.ts'
    ]
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      '@angular-eslint': require('@angular-eslint/eslint-plugin')
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
    }
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow 'any' in test files
    }
  },
  {
    files: ['src/**/*.html'],
    languageOptions: {
      parser: require('@angular-eslint/template-parser')
    },
    plugins: {
      '@angular-eslint/template': require('@angular-eslint/eslint-plugin-template')
    },
    rules: {
      '@angular-eslint/template/interactive-supports-focus': 'warn',
      '@angular-eslint/template/click-events-have-key-events': 'warn',
    }
  }
];