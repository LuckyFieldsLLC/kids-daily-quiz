import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Handler } from '@netlify/functions';
import OpenAI from 'openai';

// 🧠 AIプロバイダ識別用型
type AIProvider = 'gemini' | 'openai';

// メイン関数
export const handler: Handler = async (event) => {
  // ✅ OPTIONS (CORS プリフライト対応)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: '',
    };
  }

  // ✅ POSTメソッド以外は拒否
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    // ✅ ヘッダーからAIプロバイダとAPIキーを取得
    const provider = (event.headers['x-ai-provider'] as AIProvider) || 'gemini';
    const apiKey =
      event.headers['x-api-key'] || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ message: 'APIキーが設定されていません。' }),
      };
    }

    // ✅ リクエストボディの解析
    const { topic, difficulty = 2, fun_level = 2 } = JSON.parse(event.body || '{}');
    if (!topic) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ message: 'トピックが指定されていません。' }),
      };
    }

    // ✅ 難易度・面白さマッピング
    const difficultyMap: Record<number, string> = {
      1: 'とてもやさしい',
      2: 'ふつう',
      3: '少しむずかしい',
    };
    const funLevelMap: Record<number, string> = {
      1: '標準的な',
      2: '面白い',
      3: '子供がとても喜ぶような面白い',
    };

    const difficultyText = difficultyMap[difficulty];
    const funLevelText = funLevelMap[fun_level];

    // ✅ 共通プロンプト
    const prompt = `
あなたは教育的で創造的なクイズ作成の専門家です。
小学生向けの「${topic}」に関する4択クイズを1問作成してください。
難易度は「${difficultyText}」、内容は「${funLevelText}」のものにしてください。

出力形式は以下のJSONフォーマットのみとします：
{
  "question": "問題文",
  "options": ["A", "B", "C", "D"],
  "answer": "正解の選択肢"
}

注意:
- "options" は2つ以上の選択肢を含めること。
- "answer" は "options" 内の1つと完全一致すること。
- 説明文やコメント、自然文は出力しないでください。
`;

    // ✅ プロバイダ別呼び出し
    let text = '';
    if (provider === 'gemini') {
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      text = result.response.text().trim();
    } else if (provider === 'openai') {
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });
      text = response.choices[0].message?.content?.trim() ?? '';
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // ✅ JSON抽出・検証
    const quiz = extractValidJSON(text);
    if (
      !quiz.question ||
      !Array.isArray(quiz.options) ||
      quiz.options.length < 2 ||
      !quiz.answer ||
      !quiz.options.includes(quiz.answer)
    ) {
      throw new Error(`Invalid quiz structure: ${JSON.stringify(quiz)}`);
    }

    const finalQuiz = {
      ...quiz,
      difficulty,
      fun_level,
      provider,
    };

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(finalQuiz, null, 2),
    };
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: 'AIクイズの生成に失敗しました。',
        error: error.message,
      }),
    };
  }
};

// ✅ JSON抽出ヘルパー
function extractValidJSON(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  const jsonStr = text.slice(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error('AI response is not valid JSON: ' + text);
  }
}

// ✅ 共通CORSヘッダー
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-ai-provider, x-api-key',
    'Access-Control-Allow-Methods': 'OPTIONS, POST',
    'Content-Type': 'application/json',
  };
}
