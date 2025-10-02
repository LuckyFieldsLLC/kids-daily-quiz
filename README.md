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
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

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
