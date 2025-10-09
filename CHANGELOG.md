# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-10-09

Baseline release (Base Completion):
- Netlify Blobs を用いた安定した CRUD（diagnose → create → get → delete まで ALL GREEN）
- Functions の Response 標準化（Web Response を統一採用）
- ランタイム差異（Request / HandlerEvent）吸収の実装
- `connectBlobsFromEvent(event)` による Blobs 自動認証の確立
- `quizStore` による list() shape 正規化と本番セーフなストレージ抽象
- スモーク HTTP スクリプトの整備（リトライ含む）
- ドキュメント追加: 実践ガイド / ポストモーテム / 出荷チェックリスト

### Known Topics / Follow-ups
- ランタイム正規化の共通ヘルパ化（任意）
- 古い非JSONキーのクリーンアップ
- 大量キー対応（インデックスの導入検討）
