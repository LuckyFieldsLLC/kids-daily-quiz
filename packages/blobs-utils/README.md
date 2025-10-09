# @luckyfields/blobs-utils (alpha)

Netlify Blobs の最低限のユーティリティ群。まずは既存実装の共通化の受け皿として導入し、徐々に機能拡張していきます。

- list() の shape 差異を `normalizeListShape` で吸収
- JSON ユーティリティ: `setJson` / `getJson` / `parseJSONSafe`
- 安全削除: `deleteSafe`
- バリデーション: `isUUIDv4`

導入は開発専用から開始し、本番導入は段階的に行ってください。
