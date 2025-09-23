import type { HandlerEvent } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async (event: HandlerEvent) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const apiKey = event.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Gemini API key is not configured.' }) };
        }

        const ai = new GoogleGenerativeAI(apiKey);
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent("これは接続テストです。答えはJSONで {\"ok\": true} のみ返してください。");
        const text = result.response.text();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Gemini接続成功", raw: text }),
        };
    } catch (error: any) {
        console.error('Error testing Gemini connection:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Gemini接続テストに失敗しました。', error: error.message }),
        };
    }
};
