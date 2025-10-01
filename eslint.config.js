import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import pluginReact from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js, prettier },
    extends: [
      'js/recommended',
      ...tseslint.configs.recommended,
      pluginReact.configs.flat.recommended,
      'plugin:prettier/recommended', // ★ 追加
    ],
    languageOptions: { globals: globals.browser },
    rules: {
      'prettier/prettier': 'error', // ★ Prettierエラーを ESLint エラーに
    },
  },
]);
