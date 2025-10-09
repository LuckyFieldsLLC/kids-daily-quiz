# LuckyFields Platform 概要（初版）

目的:
- Netlify Blobs / Functions / API通信 / UIコンポーネントなどを共通化し、複数アプリで再利用
- 各アプリの構造を壊さず段階的に導入
- VSCode + Copilot を前提とした開発体験を統一

導入段階:
1. 外付け導入（まずは参照だけ）
2. 部分置換（安全な範囲から差し替え）
3. テンプレート化（新規アプリは標準搭載）

パッケージ構成（予定）:
- @luckyfields/blobs-utils
- @luckyfields/functions-utils
- @luckyfields/api-utils
- @luckyfields/ui-components
- @luckyfields/hooks
- @luckyfields/diagnostics
- @luckyfields/config-utils

共通ルール:
- 命名: camelCase / パス: kebab-case
- 各モジュール: packages/{name}/index.ts をエントリ
- docs/{name}.md にガイド整備
- すべて TypeScript で型安全

参考: docs/CHECKLIST-BLOBS-RELEASE.md
