# Postmortem: Netlify Blobs 障害と復旧（2025-10）

本書は、Kids Daily Quiz における Netlify Blobs 利用時の障害〜復旧の記録です。次回以降の開発・運用で同種の問題を再発させないための学びと恒久対策をまとめます。

## 概要（Executive Summary）
- 事象: 本番環境で Blobs ストアへのアクセスがエラー（主に 502、または書き込み失敗）。
- 影響: クイズの作成/取得/削除の一部が失敗。フロントの保存先が安定せず、管理者操作が詰まる恐れ。
- 根本原因（複合）:
  1. Netlify Functions の新ランタイムで Request 形イベントを想定できておらず、戻り値が不正（Response 以外）で 502 に。
  2. Blobs の自動認証コンテキストが未接続（`connectLambda(event)` 未呼び出し）で、MissingBlobsEnvironmentError などが発生。
  3. 本番でローカル擬似ストアへフォールバックしようとして書き込み不可パス（`/var/task`）に触れて ENOENT。
  4. `list()` の戻り値 shape 差異と、非JSONキー（旧デバッグデータ）混入で JSON.parse 例外 → 500。
  5. 本番ビルド中に tsc が tests を型チェックし、無関係な型エラーで関数のデプロイが妨げられる。

## タイムライン（主要イベント）
- T0: 本番で Blobs 経由の CRUD が断続的に失敗（502 / ENOENT / 読み取り失敗）。
- T1: ローカル擬似ストアが本番で動作していたため `/var/task/.blobs` に書こうとして失敗することを特定。prod-like 環境のフォールバックを厳禁に。
- T2: Blobs 自動認証が未接続であることを `diagnoseBlobs` とログから特定。`connectLambda(event)` を呼ぶブリッジ `connectBlobsFromEvent(event)` を導入し、全関数入口で実行。
- T3: Netlify 新ランタイムで Response 以外の戻り値（HandlerResponse）を返していたため 502 “unsupported value/invalid status code 0”。全関数を `new Response` 返却に統一。
- T4: create は復旧したが get が 502。イベント形（Request/HandlerEvent）の差を正規化して解消。
- T5: get で 500（JSON.parse 例外）。Blobs に残存していた非JSONキー（例: 旧デバッグ文字列）を UUID v4 以外はスキップするフィルタと安全パースで解消。
- T6: delete が 405。新ランタイムのメソッド判定とボディ正規化を追加し解消。
- T7: Netlify ビルドが test の tsc で落ちていたため、`build` を `vite build` のみに変更。
- T8: 最終スモーク（diagnose → create → get → delete）が本番で ALL GREEN。

## 検知と影響
- 検知: スモークスクリプト（HTTP）と一時的な `echo` 関数でランタイムの実リクエスト形を確認。
- 影響: クイズの保存・一覧・削除の不安定化。管理画面の操作に支障。

## 技術的詳細（原因の分解）
1) ランタイム互換性不足
- 旧: `HandlerEvent` 前提の `event.httpMethod` などを直読みし、`HandlerResponse` を返すパスがあった。
- 新: Web API の `Request` 形（`event.method`, `event.headers.get()`）。
- 対応: 入口で method/headers/body を正規化。戻り値は常に `new Response`。

2) Blobs 自動認証の未接続
- 本番では `connectLambda(event)` 相当を呼ぶ必要がある。
- 対応: `connectBlobsFromEvent(event)` を作成し、全関数入口で実行。

3) 本番でのローカルフォールバック
- `/var/task` は書き込み不可のため擬似ストアが失敗。
- 対応: prod-like では本物の Blobs のみ許可。擬似は dev/test 限定。

4) list() shape差と非JSONキー
- `list()` の戻り値が `{ keys }` と `{ blobs: [{ key }] }` の2系統。
- 旧デバッグ用の非JSONキー（"Hello ..."）混入で JSON.parse 例外。
- 対応: `normalizeStore().list()` で shape 吸収、UUID v4 フィルタ、安全パース。

5) ビルドでの tsc 実行
- Netlify で tests を型チェックしてしまい不要な失敗が発生。
- 対応: `build` を `vite build` のみに。

## 復旧策（実施した変更）
- `quizStore.ts`: Blobs 自動認証ブリッジ／list 正規化／prod-like でのフォールバック禁止。
- 全関数: `Response` 返却統一、Request/HandlerEvent 正規化、`connectBlobsFromEvent` の適用。
- `getQuizzes`: UUID v4 フィルタ、安全パース、score 合成の安全化。
- `deleteQuiz`: メソッド制御の緩和と正規化。
- スモーク: 正しいヘッダ・ペイロード、GET の短いリトライ（整合性遅延対策）。
- `package.json`: `build` から `tsc` を除外。

## 恒久対策（再発防止）
- コーディング規約:
  - 入口で `connectBlobsFromEvent`、Request/HandlerEvent 正規化を必須化。
  - 返却は常に `new Response`。
  - Blobs 取得は `quizStore` 経由（list 正規化あり）。
  - 本番での擬似ストア禁止（環境判定関数）。
- ドキュメント/チェックリスト:
  - `NETLIFY_BLOBS_GUIDE.md` と本ポストモーテムの参照を README に掲載。
  - 出荷チェックリスト（別紙）に沿って確認。
- テスト/運用:
  - スモーク（diagnose → create → get → delete）を定期運用。
  - 変な挙動時は関数キャッシュクリア／`--skip-functions-cache` デプロイを検討。

## 学び（What went well / What went poorly）
- 良かった点:
  - 早期に `diagnoseBlobs` を用意して通信路と権限を検証できた。
  - `echo`/最小 `createQuiz2` でランタイム事実を観測し、仮説検証が早かった。
  - list 互換ラッパの抽象化で将来の API 差異にも耐性。
- 改善点:
  - 最初から Response 統一・ランタイム正規化のテンプレートを敷くべきだった。
  - 非JSONキーの混入を想定し、フィルタ/バリデーションを早めに入れるべきだった。

## 付録：スモークの現行基準
- diagnose: 200
- create: 201（id を返す）
- get: 200（作成した id を含む）
- delete: 200

以上。必要に応じて Issue/PR で更新します。
