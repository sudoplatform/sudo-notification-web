import { fixupPluginRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import jestEslint from 'eslint-plugin-jest'
import treeShakingEslint from 'eslint-plugin-tree-shaking'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: [
      '**/node_modules',
      '**/cjs',
      '**/lib',
      '**/document',
      '.yarn',
      '**/gen',
    ],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 5,
      sourceType: 'script',
    },
  },
  ...compat.extends(
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended',
  ),
  {
    files: ['src/**/*.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'tree-shaking': fixupPluginRules(treeShakingEslint),
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      'prefer-const': 'error',
      'no-unused-expressions': 'error',
      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
        },
      ],
      '@typescript-eslint/unbound-method': [
        'error',
        {
          ignoreStatic: true,
        },
      ],
      'tree-shaking/no-side-effects-in-initialization': [
        'error',
        {
          noSideEffectsWhenCalled: [
            {
              module: 'io-ts',
              functions: [
                'type',
                'intersection',
                'array',
                'partial',
                'record',
                // list of io-ts functions to exempt
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['test/**/*.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      jest: jestEslint,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.test.json',
      },
    },
    rules: {
      'prefer-const': 'error',
      'no-unused-expressions': 'error',
      '@typescript-eslint/no-unsafe-argument': 'off',
      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
        },
      ],
      '@typescript-eslint/unbound-method': 'off',
    },
  },
]
