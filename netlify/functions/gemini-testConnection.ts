import type { HandlerEvent } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

export default async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const apiKey = event.headers['x-gemini-api-key'];

    if (!apiKey) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Gemini API key is required.' }) };
    }

    const ai = new GoogleGenAI({ apiKey });

    // A very simple and cheap request to test authentication and basic API access.
    await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'hello'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Gemini API key is valid.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error: any) {
    console.error("Gemini connection test failed:", error);
    
    let detailedMessage = 'Gemini APIキーが無効か、サービスが利用できません。';
    const errorMessage = error.message || '';
    
    if (errorMessage.includes('API key not valid')) {
        detailedMessage = 'Gemini APIキーが無効です。キーが正しいか確認してください。';
    } else if (errorMessage.includes('permission denied')) {
        detailedMessage = 'APIキーにGemini APIを利用する権限がありません。Google CloudでAPIが有効になっているか確認してください。';
    } else if (errorMessage.includes('Billing account not found')) {
        detailedMessage = 'プロジェクトに請求先アカウントが設定されていません。Google Cloudで設定を確認してください。';
    }

    return {
      statusCode: 400, // Bad request, likely an invalid key
      body: JSON.stringify({ message: detailedMessage, error: errorMessage }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};