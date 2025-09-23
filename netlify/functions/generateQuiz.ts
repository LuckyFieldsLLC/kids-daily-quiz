import type { HandlerEvent } from '@netlify/functions';
import { GoogleGenAI, Type } from '@google/genai';

const quizSchema = {
    type: Type.OBJECT,
    properties: {
        question: { type: Type.STRING, description: 'The quiz question.' },
        options: {
            type: Type.ARRAY,
            description: 'An array of 4 multiple choice options.',
            items: {
                type: Type.OBJECT,
                properties: { text: { type: Type.STRING, description: 'The text of the option.' }},
                required: ['text']
            }
        },
        answer: { type: Type.STRING, description: 'The correct answer, which must exactly match the text of one of the options.'},
        // The AI will not generate these, we add them manually later.
        // difficulty: { type: Type.INTEGER, description: 'The difficulty level (1-3).' },
        // fun_level: { type: Type.INTEGER, description: 'The fun level (1-3).' }
    },
    required: ['question', 'options', 'answer']
};


export default async (event: HandlerEvent) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const apiKey = event.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Gemini API key is not configured.' }) };
        }
        const ai = new GoogleGenAI({ apiKey });

        const { topic, difficulty, fun_level } = JSON.parse(event.body || '{}');
        if (!topic) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Topic is required.' }) };
        }

        const difficultyMap: { [key: number]: string } = { 1: 'とてもやさしい', 2: 'ふつう', 3: '少しむずかしい' };
        const funLevelMap: { [key: number]: string } = { 1: '標準的な', 2: '面白い', 3: '子供がとても喜ぶような面白い' };

        const difficultyText = difficultyMap[difficulty] || 'ふつう';
        const funLevelText = funLevelMap[fun_level] || '面白い';

        const prompt = `小学生向けの${topic}に関する4択クイズを1つ作成してください。難易度は「${difficultyText}」レベルで、内容は「${funLevelText}」ものにしてください。問題文、4つの選択肢、そして答えをJSON形式で返してください。正解は選択肢のいずれかと完全に一致させてください。`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
                thinkingConfig: { thinkingBudget: 0 }, // thinkingを無効化して応答速度を向上
            },
        });

        const generatedText = response.text;
        const quiz = JSON.parse(generatedText);

        if (!quiz.question || !Array.isArray(quiz.options) || quiz.options.length < 2 || !quiz.answer || !quiz.options.some((opt: {text: string}) => opt.text === quiz.answer)) {
             throw new Error("AI returned an invalid quiz structure.");
        }
        
        // Add the requested levels to the response object
        const finalQuiz = {
            ...quiz,
            difficulty: difficulty || 2,
            fun_level: fun_level || 2,
        };

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalQuiz),
        };
    } catch (error: any) {
        console.error('Error generating quiz:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'AIクイズの生成に失敗しました。', error: error.message }),
        };
    }
};