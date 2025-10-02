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
