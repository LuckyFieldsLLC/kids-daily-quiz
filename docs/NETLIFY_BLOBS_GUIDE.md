# Netlify Blobs 実践ガイド（Kids Daily Quiz プロジェクト準拠）

このドキュメントは、当プロジェクトで実運用している Netlify Blobs の使い方と設計パターン、落とし穴と対策をまとめたものです。関数やユーティリティの実装と一緒に読むことで、追加機能の開発や保守がスムーズになります。

## 1. Netlify Blobs とは
- サーバレスなキー/バリュー型ストア（テキスト/JSON/バイナリ格納可能）
- サイトに紐づく複数のストア（store）を定義して用途分離
- 関数内から `@netlify/blobs` 経由で利用（本番は自動認証）

代表API:
- `getStore({ name })` ストア取得
- `store.set(key, value[, opts])`
- `store.get(key[, opts])`
- `store.list([opts])` 戻り値の形がバージョンで揺れる点に注意
- `store.delete(key)`

当プロジェクトでは `quizzes` ストアにクイズ本体、同ストアの別キー（`score-<userId>-<quizId>`）にスコアを保存します。

## 2. 認証とランタイム互換
- 本番（Netlify Functions）では認証は自動。Lambda 実行コンテキストを Blobs へ橋渡しするだけ。
  - 入口で `connectBlobsFromEvent(event)` を呼ぶ（内部で `connectLambda(event)` を試行）
- ローカル開発（`netlify dev`）でも基本は自動。
  - うまくいかない時のため、当プロジェクトは簡易ローカルラッパを用意（本番では無効）
- 新旧ランタイム互換
  - 受信: Web API の `Request` 形 or 旧 `HandlerEvent` 形のいずれか
  - 出力: 常に `new Response(...)` で返す（旧 `HandlerResponse` は使わない）
  - 入口で method/headers/body を正規化するのが安全

コード断片（要旨）:
```ts
const isRequest = typeof event?.method === 'string' && typeof event?.headers?.get === 'function';
const method = isRequest ? event.method.toUpperCase() : (event.httpMethod || '').toUpperCase();
connectBlobsFromEvent(event);
// 正規化
let normalized: HandlerEvent = event as any;
if (isRequest) {
  const text = await event.text();
  normalized = {
    httpMethod: method,
    headers: Object.fromEntries((event.headers as Headers).entries()),
    body: text,
  } as unknown as HandlerEvent;
}
return await someHandler(normalized);
```

## 3. ストア/キー設計
- ストアは `netlify.toml` の `[[blobs]]` に宣言（例: `quizzes`, `connection-test`）
- キーは UUID v4 推奨（重複回避・フィルタしやすい）
  - 例: `id: 8-4-4-4-12` の標準形式
- ユーザー別データは接頭/接尾辞で紐付け
  - 例: `score-<userId>-<quizId>`

## 4. 読み書きのベストプラクティス
- 値は文字列（JSON.stringify）で保存
- 取得時は try/catch で安全に JSON.parse（壊れた値をスキップ）
- list() の shape 差異に備えたラッパを用意（当プロジェクトは `normalizeStore().list()`）
- 書いた直後に list() へ反映されない場合がある → 小さなリトライで吸収

## 5. 実装の要（quizStore.ts）
- `getQuizStore`/`getGenericStore`: 本番では本物の Blobs 固定、dev/test はローカルラッパにフォールバック可
- `normalizeStore`: list() の shape 差異を `{ keys: string[] }` に正規化
- `connectBlobsFromEvent`: Lambda 実行コンテキストのブリッジ

## 6. CRUD 関数の要点
- すべて Response を返す
- 入口でランタイム正規化 + `connectBlobsFromEvent`
- `x-storage-mode` の同義語に対応（`blobs`/`netlify-blobs` 等）
- getQuizzes は UUID v4 以外のキーを除外し、安全パース

参照:
- `netlify/functions/createQuiz.ts`
- `netlify/functions/getQuizzes.ts`
- `netlify/functions/deleteQuiz.ts`

## 7. よくある落とし穴と対策
- MissingBlobsEnvironmentError: 入口で `connectBlobsFromEvent` を忘れている
- 502 “unsupported value/invalid status code 0”: `Response` 以外を返している
- list() で JSON.parse 例外: 非JSONキーが混ざっている → フィルタ + 安全パース
- 本番でローカルフォールバック: `/var/task` は書けない → prod-like 環境では Blobs 強制

## 8. 運用と監視
- Netlify ダッシュボードで Blobs 使用量を監視
- バックアップ/移行: import/export 関数を入口に
- パフォーマンス: 大量キーなら簡易インデックス（例: `quizzes-index.json`）の導入を検討

## 9. トラブルシュートクイックリファレンス
| 症状 | 原因 | 対策 |
|------|------|------|
| list() で配列形が違う | バージョン差 | normalizeStore で吸収 |
| いつもローカルに書かれる | 機能未有効/デプロイ反映漏れ | Blobsを有効化し再デプロイ（Clear cache 推奨） |
| 値が null/壊れている | 保存時の stringify 漏れ他 | 壊れキー削除→再保存、保存側のログ確認 |
| 作成後すぐにリストに無い | 整合性遅延 | 数回の短いリトライ |

## 10. 付録：最小コード例
```ts
import { getQuizStore, connectBlobsFromEvent } from './quizStore.js'
export default async function handler(event: any): Promise<Response> {
  connectBlobsFromEvent(event)
  const isRequest = typeof event?.method === 'string' && typeof event?.headers?.get === 'function'
  let normalized = event as any
  if (isRequest) {
    const text = await event.text()
    normalized = { httpMethod: 'POST', headers: Object.fromEntries(event.headers.entries()), body: text } as any
  }
  const store = await getQuizStore()
  const data = JSON.parse(normalized.body || '{}')
  const id = crypto.randomUUID()
  await store.set(id, JSON.stringify({ id, ...data }))
  return new Response(JSON.stringify({ id }), { status: 201, headers: { 'Content-Type': 'application/json' } })
}
```

---
このガイドは実装に追従して更新します。改善提案や追加質問があればIssue/PR歓迎です。
