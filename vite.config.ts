import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.{ts,tsx}'], // 明示的に当プロジェクトのテストだけ
        exclude: [
          'tests/e2e/**', // Playwright 用
          'node_modules/**', // 依存パッケージ内の *.test.* を無視
        ],
        coverage: {
          provider: 'v8',
          // 追加: json-summary (自動閾値調整用), lcov (CIサービス連携/閲覧用)
          reporter: ['text', 'html', 'json-summary', 'lcov'],
          thresholds: { // 段階的引き上げ (2025-10-09): 新規 utils / Toast テスト追加後
            lines: 61,
            functions: 72,
            branches: 70, // 次候補: lines/statements も 65 へ (十分な安定確認後)
            statements: 61,
          },
          exclude: [
            'netlify/functions/**', // functions: 生成レスポンス/統合テスト別枠
            'dist/**',
            '.netlify/**', // Netlify ローカルサーブ生成物
            'node_modules/**',
            'coverage/**',
            'playwright.config.ts',
            'vite.config.ts',
            'tailwind.config.cjs',
            'postcss.config.cjs',
            'eslint.config.js'
          ]
        }
      }
    };
});
