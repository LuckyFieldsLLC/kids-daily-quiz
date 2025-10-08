<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1SLJVEBdPaVFjX90wjzn9CQfeLiVXVEPj

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. (Optional / Legacy) Set the `VITE_GEMINI_API_KEY` in [.env.local](.env.local) if you want a build-time default. ただし最新UIではユーザー個別の API キーをアプリ内で設定できます。
3. Run the app locally with Netlify Functions enabled:
   `npx netlify dev`
4. ブラウザで http://localhost:8888 を開く
5. 右上「管理者としてログイン」をクリック（ダミー管理者ログイン）
6. 歯車アイコン（設定）→ 「APIキー設定」→ Gemini APIキーを入力 → 「キーをテスト」 → 「保存」
7. 「AIで作成」ボタンで AI クイズ生成モーダルを開き、パラメータを入力して生成
8. 生成された案は自動的に「新規クイズ作成」フォームに流し込まれるので内容を確認して保存

### 新しい UI フロー概要

| 操作 | モーダル | 説明 |
|------|----------|------|
| 新規作成 | QuizForm | 手動でクイズを入力・保存 (ローカル保存デフォルト) |
| AIで作成 | AiQuizGeneratorModal | パラメータ指定 → AI生成 → QuizForm へ受け渡し |
| 設定 | SettingsModal | 保存先・APIキー・外観・表示を編集し localStorage に保存 |
| ヘルプ | HelpModal | 機能説明とトラブルシュート |

### UIポリッシュ / デザインシステム概要

最近の更新で以下の点を統一・改善しました。

1. 共通 `Button` コンポーネント導入（スタイルと状態管理を集中化）
2. モーダル（Settings / AI生成 / Help / 新規クイズ）を単一のクラス設計で統一
3. 軽量なアニメーション・エレベーション（影）トークン追加
4. QuizPage から重複していた「AIで作成」ボタンを削除（ヘッダーに一本化）

#### Button コンポーネント概要

| Prop | 型 | 説明 |
|------|----|------|
| variant | `"primary" | "secondary" | "outline" | "danger" | "ghost" | "subtle"` | 視覚的スタイル |
| size | `"sm" | "md" | "lg"` | 余白とフォントサイズ |
| loading | `boolean` | true の間はスピナー表示 & 自動で disabled |
| leftIcon / rightIcon | `ReactNode` | アイコンスロット |
| as | 任意 | 他要素へポリモーフィックに差し替え (必要なら) |

最小使用例:

```tsx
import { Button } from "./components/Button";

<Button variant="primary" onClick={handleSave}>保存</Button>
<Button variant="outline" size="sm" loading={isLoading}>読み込み中</Button>
```

シンプルな実装のため、Tailwind + 自前ユーティリティクラスを組み合わせています。新しいバリアントを追加したい場合は `Button.tsx` 内の `variantClasses` マップに追記するだけです。

#### モーダル設計

共通で以下のクラス/レイヤを使用します:

| クラス | 役割 |
|--------|------|
| `modal-overlay` | 画面全体の半透明 + ぼかし背景 (実装上は `fixed inset-0 flex ... backdrop-blur`) |
| `modal-surface` | 実際の白/ガラス風パネル（角丸・影・アニメーション開始点） |
| `glass-panel` | ガラス感 (透過 + border + backdrop-filter) を付与するヘルパー |
| `elev-modal` | モーダル用の影（CSS 変数で一元化） |
| `animate-modal-in` | 開く際の scale + fade アニメーション |

閉じるアニメーションを拡張したい場合は、`animate-modal-out` クラスを閉じる直前に付与 → アニメーション終了イベントでアンマウントする簡易パターンを追加できます（現在は即時アンマウント）。

#### デザイントークン (CSS変数)

index.html の `<style>` 内で定義。必要に応じてテーマ切り替え (今後) にも流用可能です。

| 変数 | 用途 |
|------|------|
| `--elev-card` | 通常カード/パネルの影 |
| `--elev-modal` | モーダルの強調影 |
| `--transition-base` | 基本的な短めトランジション |

#### アニメーション

| 名前 | 効果 |
|------|------|
| `fade-in` | 徐々に不透明に |
| `modal-in` | scale + fade (モーダル出現) |
| `toast-in` / `toast-out` | トースト表示/退場 |

#### 利用ガイドライン

- アクションの 1 次操作には `primary`、補助/キャンセルには `secondary` or `outline`
- 破壊的操作は `danger`
- アイコンのみのボタンは `ghost` もしくは `subtle`（背景控えめ）
- 連打防止が必要な非同期操作は `loading` を併用
- 新規モーダル追加時は overlay + surface + animation クラスを流用し実装を最小化

#### 既存コードでの重複削減効果

| 項目 | Before | After |
|------|--------|-------|
| ボタンスタイル定義 | 複数ファイルで重複 | `Button.tsx` へ集中 |
| AI生成ボタン設置 | Header + QuizPage | Header のみ |
| モーダル構造 | 各ファイルバラバラ | 統一クラス + 1 パターン |
| 影/アニメーション | インライン/未定義 | CSS変数 + keyframes |

---

### アクセシビリティ (A11y) 改善

モーダル関連を以下の点で改善しました。

| 項目 | 対応内容 | 対象 |
|------|----------|------|
| Esc 閉じる | Esc キーで閉じる | Settings / AI生成 / Help / QuizForm |
| ロール/モーダル属性 | `role="dialog"` + `aria-modal="true"` | 同上 |
| タイトル関連付け | `aria-labelledby` で見出しID参照 | 同上 |
| 初期フォーカス | オープン直後に Close/Cancel ボタン | 同上 |
| フォーカスリング | focus-visible リングを統一 | 全ボタン |
| アイコンボタン代替 | `aria-label` を付与 | 閉じる/ヘッダーアイコン |

今後の追加候補:

- フォーカストラップ（Tab巡回をモーダル内で循環）
- 閉じる逆アニメーション (modal-out)
- `prefers-reduced-motion` によるモーション軽減

---

### APIキーの優先順位
1. ユーザーが Settings モーダルで保存した `localStorage` 上のキー (推奨)
2. 無い場合、`.env.local` の `VITE_GEMINI_API_KEY`

### 典型的なエラー / 対応
| 症状 | 原因 | 対処 |
|------|------|------|
| 「まず設定でGemini APIキーを入力してください。」 | キー未設定で AI 生成ボタン押下 | 設定モーダルでキー保存 |
| Netlify dev 起動時にポート 8888 使用中 | 前回プロセスが残存 | タスクマネージャで Node を終了 or 別ポート指定 `netlify dev -p 9999` |
| AI生成失敗(パースエラー) | 予期しない応答 | 再試行 / プロンプト調整予定 (今後改善) |

### Fallback: 直接スクリプトで Gemini をテスト
`scripts/test-gemini.mjs` を利用できます。

```
node scripts/test-gemini.mjs
```

成功すると利用可能モデル一覧と簡易生成結果が表示されます。

---

## 📚 開発ドキュメント

このプロジェクトの目的や全体構想については以下を参照してください。

- [VISION（開発ビジョン・教育理念）](./docs/VISION.md)
- [ARCHITECTURE（技術構成）](./docs/ARCHITECTURE.md)
- [ROADMAP（開発計画）](./docs/ROADMAP.md)

---

## 💡 プロジェクト概要

**Kids Daily Quiz** は、AI（Gemini / OpenAI）を活用して「親子の対話」を促進する教育支援アプリです。
毎日AIがクイズを自動生成・配信し、親が子どもと共に考えるきっかけを提供します。

- 🎯 目的：知識・道徳・感情理解を育てる
- 🧠 機能：AIクイズ生成、オリジナル投稿＋AI添削、毎日配信・記録
- 🌐 技術：React + TypeScript + Netlify Functions + Gemini API

---

## 🆕 最近の主な更新 (Digest)

| 日付 | 更新 | 概要 |
|------|------|------|
| 2025-10 | Radix Dialog へ全面移行 | 旧カスタムモーダル/遅延アンマウントを撤去し A11y 向上 |
| 2025-10 | 単一問題の AI 再生成 | 1問だけ差し替えられる軽量再生成フロー |
| 2025-10 | レート制限 UI | 429 を検出してユーザーにクールダウン明示 |
| 2025-10 | TTS (Web Speech API) | 問題 + 選択肢を読み上げ可能に |
| 2025-10 | Q&A (Help) ベータ | アプリ内ヘルプで簡易質問応答 |
| 2025-10 | Heroicons 導入 | インラインSVGを @heroicons/react に統一 |
| 2025-10 | Tailwind 本番構成 | CDN 依存排除・PostCSS ビルド |

---

## 🎛 モーダル & アクセシビリティ (Radix 化後)

以前: 手書き Portal / focus trap / 遅延アンマウント。

現在: `@radix-ui/react-dialog` をラップした `Modal` コンポーネント。

特長:
- フォーカスマネジメント / aria 属性を Radix に委譲
- `title` / `description` props → 自動で `Dialog.Title` / `Dialog.Description`
- アニメーション: Tailwind + data-state (`data-[state=open]`) で入退場
- 閉じるボタンは X (Heroicons) を `Dialog.Close asChild` で包む

追加モーダル手順（最短）:
```tsx
<Modal open={open} onOpenChange={setOpen} title="タイトル" description="補足説明">
   {/* コンテンツ */}
</Modal>
```

アクセシビリティ配慮:
- `aria-modal`, `role=dialog` は Radix が付与
- 読み上げ順序: タイトル → 説明 → 本文
- Esc で閉じる / オーバーレイクリックで閉じる (要件に応じて後でロック可)

---

## 🔁 単一問題の再生成 (Regenerate One Question)

目的: 全体再生成コスト/時間を抑え、気になる 1 問だけ差し替える。

ワークフロー:
1. クイズ一覧で再生成対象の問題を選択
2. 「1問だけ再生成」ボタン（UI 内）→ Netlify Function を軽量プロンプトで呼び出し
3. 返却された新しい `question` + `options` をそのスロットに差し替え
4. 変更を保存（ローカル or Blobs）

考慮点:
- 履歴保持: 旧問題は内部ヒストリ配列へ（ロールバック容易性）
- 生成プロンプトは「他の問題との重複を避ける」指示を付与
- レート制限考慮で指数バックオフ (簡易) 実装可（現状は UI リトライ）

---

## ⏱ レート制限ハンドリング

症状: API 429 / quota exceed。

対策実装:
- Function から 429 / custom フラグ → フロントで "しばらく待って再試行" メッセージ
- リトライ制御: 連打抑止でボタン一時 disabled
- 将来拡張: X秒カウントダウン / バックオフ指数表示 / メトリクス表示

---

## 🔊 読み上げ (TTS)

ライブラリ不要。ブラウザ組込み `speechSynthesis` を使用。

利用方法:
1. クイズ作成/閲覧画面で「読み上げ」トグルを押す
2. 質問 + 選択肢を連結 → `SpeechSynthesisUtterance` に渡す
3. 再押下 or 画面遷移時に停止

実装ポイント (`utils/tts.ts`):
- `isSupported()` で UA 判定
- `toggle()` に再生/停止ロジック集約
- 選択肢は番号付きで読み上げ (例: "1. 〜 2. 〜")

既知制約:
- 一部モバイル (iOS Safari) はユーザー操作イベント内でのみ許可
- 多言語音声切替は今後 (設定に voice 選択を追加予定)

---

## ❓ ヘルプ Q&A (ベータ)

エンドポイント: `/.netlify/functions/askHelp`

リクエスト:
```jsonc
POST {
   "question": "TTS が動かない原因は?"
}
```
ヘッダ（任意）: `x-ai-provider`, `x-api-key`, `x-ai-model`

レスポンス:
```json
{ "answer": "ブラウザが Web Speech API をサポートしていない可能性があります。" }
```

制限:
- 回答は 180 文字程度にトリミング
- 履歴はクライアント側 max 10 件保持

---

## 🗂 ストレージ & Netlify Blobs

現在既定: `localStorage` (キー: `local_quizzes`, `app_settings` など)。

Blobs 移行方針 (段階的):
1. Quiz 保存時に JSON を Blob key: `quiz/<id>.json` で PUT
2. 一覧取得は `list()` → メタデータ + 必要時 lazy fetch
3. 認証/APIキー分離: Serverless Function 内のみ書き込み許可

運用上の注意:
- 大量クイズ時は list コスト対策で index キャッシュを別 Blob に維持
- バージョン管理が必要になれば diff を別キーに保存

---

## 🧪 E2E テスト (Playwright)

インストール済み。基本コマンド:
```
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:update
```

テスト戦略案:
- 設定保存フロー
- Gemini 生成 (モック or 実 API スキップ用 flag)
- 単一再生成ボタンの有効化/挙動
- TTS トグル (サポートブラウザのみ skip 条件付き)
- Q&A 入力 → ローディング → 回答表示

---

## 🖼 アイコン方針

`@heroicons/react` (outline) 採用。理由:
- 一貫したアクセシビリティ (title/aria-hidden 制御容易)
- SVG インライン管理より差分が明確
- Tree-shaking で未使用除外可能

追加アイコン: `import { XMarkIcon } from '@heroicons/react/24/outline'`

---

## ⚙️ 環境変数一覧 (現状最小)

| 変数 | 用途 | 備考 |
|------|------|------|
| `VITE_GEMINI_API_KEY` | 初期表示用 Gemini キー (任意) | UI 側保存が優先 |
| `VITE_OPENAI_API_KEY` | 初期表示用 OpenAI キー (任意) | 同上 |

将来 (案):
- `VITE_DEFAULT_PROVIDER` (gemini/openai)
- `VITE_STORAGE_MODE` (local/blobs)

---

## 🚀 デプロイ (Netlify)

最小手順:
1. GitHub リポジトリを Netlify に接続
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Functions directory: `netlify/functions`
5. 必要な環境変数 (任意) を Netlify UI に設定

ローカル検証: `npx netlify dev` (Functions + Vite プロキシ)

---

## 🗺 今後の拡張 (Roadmap 抜粋)

- モデル選択 UI (Gemini の flash / pro, OpenAI gpt-4.1-mini 等)
- Claude / DeepSeek 対応
- クイズカテゴリ & タグフィルタ
- 分析ダッシュボード (正答率/所要時間)
- 親子モード (端末2画面同期)
- 多言語出題 + 自動翻訳
- TTS 音声選択 / スピード調整
- アクセス制御 (共有リンク + 期限)

---

## 🔀 マルチAIプロバイダ対応 (Gemini / OpenAI)

現在、クイズ生成は 2 種類のプロバイダを切り替えて利用できます。

| 項目 | Gemini | OpenAI |
|------|--------|--------|
| 既定モデル | gemini-1.5-flash | gpt-4o-mini |
| 主眼 | 高速/コスト効率 | 高品質/汎用性 |
| キー設定 | Settings > Gemini APIキー | Settings > OpenAI APIキー |

### 使い方
1. 右上 設定 を開く
2. 「AIプロバイダ / APIキー設定」でプロバイダ (Gemini / OpenAI) を選択
3. 各プロバイダの API キーを入力（必要に応じ両方保存可）
4. 「Geminiキーをテスト」または「OpenAIキーをテスト」で疎通確認
5. 「AIで作成」ボタン → 選択中プロバイダで生成

### ヘッダ送信仕様
Netlify Function `generateQuiz` へ以下ヘッダを付与:

```
x-ai-provider: gemini | openai
x-api-key: <ユーザー保存APIキー>
```

### エラーメッセージ例
| メッセージ | 対応 |
|------------|------|
| Gemini のAPIキーが設定されていません… | Settings で Gemini キー入力 |
| OpenAI のAPIキーが設定されていません… | Settings で OpenAI キー入力 |
| クイズ生成に失敗しました | 一時的失敗。再試行 / 切替 / キー有効性確認 |

### 今後の拡張候補
- OpenAI / Gemini のモデル選択ドロップダウン
- Claude / DeepSeek など追加プロバイダ
- 生成結果の差分レビューモード

---

## 🧪 ローカル検証チェックリスト (Quick)

| ステップ | コマンド / 操作 | 期待結果 |
|----------|------------------|-----------|
| 依存取得 | `npm install` | エラー無 |
| Dev起動 | `npx netlify dev` | http://localhost:8888 起動 |
| 設定保存 | 設定モーダルでAPIキー保存 | トースト成功 & 再読込保持 |
| Gemini生成 | 「AIで作成」→生成 | QuizForm に転送 |
| OpenAI生成 | プロバイダ切替→生成 | 同上 |
| 手動作成 | 「新規作成」→保存 | localStorage `local_quizzes` に追加 |
| 永続確認 | ブラウザ再起動 | 作成クイズが残る |
| Function疎通 | DevTools `fetch('/.netlify/functions/testConnection',{method:'POST'})` | 200 応答 |

詳細な検証手順はリポジトリ内ドキュメント会話ログを参照（必要なら別節化可）。

---

## ⚠ 設定ストレージについて

歴史的経緯で `app_settings` / `app_settings_config` 2 種の localStorage キーが存在します。現在 UI 保存は `app_settings` を利用し、AI キー読み出しもこちらへ統一予定です。移行予定:

1. 起動時に旧キーがあれば新キーにマージ
2. 旧キー削除 (マイグレーションフラグ設定)

---

