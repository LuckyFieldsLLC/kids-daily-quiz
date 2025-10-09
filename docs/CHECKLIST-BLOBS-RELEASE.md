# 出荷チェックリスト（Netlify Blobs）

本番デプロイ前に以下を確認してください。該当しない項目は N/A で可。

## コード規約
- [ ] 関数入口で `connectBlobsFromEvent(event)` を呼んでいる
- [ ] Web Request / HandlerEvent 両対応の正規化（method/headers/body）をしている
- [ ] 返却は必ず `new Response(...)` で、`HandlerResponse` は使っていない
- [ ] Blobs 取得は `quizStore.get*Store()` 経由（list 正規化あり）
- [ ] 本番系環境でローカル擬似ストアにフォールバックしない
- [ ] list() の戻り値 shape 差異を吸収できている（`normalizeStore`）
- [ ] JSON.parse は try/catch で安全に（非JSONキー混入に備える）
- [ ] キーフィルタ（UUID v4 など）や最低限のバリデーションをしている

## 設定/インフラ
- [ ] `netlify.toml` に `[[blobs]]` が宣言されている（例: `quizzes`, `connection-test`）
- [ ] サイト設定で Blobs が有効化されている
- [ ] 関数キャッシュ/ビルドキャッシュに注意（必要なら Clear cache and deploy / `--skip-functions-cache`）

## ビルド/CI
- [ ] `npm run build` が成功（`vite build` のみでOK、`tsc` は本番で走らない）
- [ ] Lint/Typecheck はローカル or CI で実施（本番ビルドには影響させない）

## スモーク（HTTP）
- [ ] `/.netlify/functions/diagnoseBlobs` → 200、storeKind=real
- [ ] `/.netlify/functions/createQuiz` → 201、`id` を返す
- [ ] `/.netlify/functions/getQuizzes` → 200、直前の `id` を含む
- [ ] `/.netlify/functions/deleteQuiz` → 200
  - 備考: GET の直後に整合しない場合は数回リトライ（短待機）

## 運用
- [ ] 監視ポイント: Netlify Blobs 使用量（ダッシュボード）
- [ ] 旧/不要キー混入時の方針（手動削除 or フィルタ維持）
- [ ] もしもの時の切り戻し手順（前デプロイに戻す / プレビューで再確認）

---
これをリポジトリに置き、各PRでチェックすることで再発を防ぎます。
