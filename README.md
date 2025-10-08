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
