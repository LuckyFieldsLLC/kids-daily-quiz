// Netlify Function: askHelp
// Receives { question } and returns { answer }
// Uses same provider header strategy as generateQuiz.
import type { Handler } from '@netlify/functions';

interface AskPayload { question?: string }

const SYSTEM_HINT = `あなたは教育用クイズアプリのヘルプアシスタントです。答えは簡潔に150文字以内で日本語。\n` +
  `ユーザーはアプリの使い方/設定/AI生成/保存/トラブルについて質問します。推測で危険な操作は案内しない。`;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const body: AskPayload = JSON.parse(event.body || '{}');
    const q = (body.question || '').trim();
    if (!q) {
      return { statusCode: 400, body: JSON.stringify({ error: 'question is required' }) };
    }

    const provider = event.headers['x-ai-provider'] || 'gemini';
    const apiKey = event.headers['x-api-key'];
    const model = event.headers['x-ai-model'];
    if (!apiKey) {
      return { statusCode: 400, body: JSON.stringify({ error: 'API key missing' }) };
    }

    let answer = '';

    if (provider === 'gemini') {
      // Gemini
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey as string);
      const modelName = model || 'gemini-1.5-flash';
      const m = genAI.getGenerativeModel({ model: modelName });
      const resp = await m.generateContent([{ text: SYSTEM_HINT + '\nQ: ' + q + '\nA:' }]);
      answer = resp.response.text().trim();
    } else {
      // OpenAI
      const { OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: apiKey as string });
      const resp = await client.responses.create({
        model: (model as string) || 'gpt-4o-mini',
        input: `${SYSTEM_HINT}\nQ: ${q}\nA:`
      });
      // @ts-ignore - newer SDK shape
      answer = (resp.output_text || '').trim();
    }

    if (!answer) answer = 'すみません、適切な回答を生成できませんでした。少し言い換えて試してください。';
    // Safety: truncate
    if (answer.length > 180) answer = answer.slice(0, 180) + '…';

    return { statusCode: 200, body: JSON.stringify({ answer }) };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'internal error' }) };
  }
};
