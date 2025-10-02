# Kids Daily Quiz - ARCHITECTURE

## 🧱 技術構成

- フロントエンド：React + TypeScript + Tailwind CSS
- AI連携：Gemini / OpenAI API
- データ保存：
  - ローカルストレージ
  - Netlify Blobs
  - Google スプレッドシート
- サーバーレス機能：Netlify Functions
- デプロイ：Netlify
- 認証：Google Auth / Firebase Auth（予定）

## 🔁 データフロー概要

1. ユーザーが「クイズ生成」ボタンを押す
2. フロント → Netlify Functions → AI API呼び出し
3. AIがクイズJSONを返す
4. 保存先（選択式）に登録
5. クライアントが最新クイズを取得・表示

---

## 📦 クイズデータの保存・管理構成

本アプリでは、用途やユーザー層に応じて複数のデータ保存方法を選択可能です。

| 保存方式                    | 用途                       | 特徴                                       |
| --------------------------- | -------------------------- | ------------------------------------------ |
| **LocalStorage**            | 個人利用・オフライン環境   | 即時反映・軽量・認証不要                   |
| **Netlify Blobs**           | クラウド保存・小規模チーム | サーバーレス・読み書きAPI簡単・Netlify連携 |
| **Google スプレッドシート** | 共同管理・レポート用途     | 外部共有容易・表計算と連携可能             |

> データ保存先はアプリの設定画面または環境変数によって切り替え可能です。
> 例: `STORAGE_PROVIDER=local` / `netlify` / `sheets`

また、今後の拡張として **Netlify DB（PostgreSQL）** の導入も想定しており、より構造化されたデータ管理や検索性の向上を目指しています。

---
