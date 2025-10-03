import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizRequest, QuizResponse } from '../types';

// 環境変数からAPIキーを取得
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// プロンプト生成
function buildPrompt(params: QuizRequest): string {
  return `
あなたは教育的で感動的な親子向けクイズを作る専門家です。
次の条件で日本語のクイズを1問作ってください：

- ターゲット年齢: ${params.age}
- カテゴリ: ${params.category}
- テーマ: ${params.theme}
- 難易度: ${params.difficulty}（1=やさしい〜5=難しい）
- 面白さ（ひらめき度）: ${params.interestingness}
- 対話性（Discussion Value）: ${params.discussion_value}
- 感情インパクト: ${params.emotional_impact}

必ず以下のJSON形式で出力してください：

{
  "title": "クイズのタイトル",
  "question": "問題文",
  "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "answer": "正解の選択肢",
  "explanation": "解説や親子で話し合うポイント"
}
`;
}

// クイズ生成関数
export async function generateQuiz(params: QuizRequest): Promise<QuizResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = buildPrompt(params);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSON部分を抽出してパース
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('AIの返答にJSONが見つかりませんでした');
    }

    const jsonString = text.slice(jsonStart, jsonEnd + 1);
    const quiz: QuizResponse = JSON.parse(jsonString);

    return quiz;
  } catch (error: any) {
    console.error('クイズ生成エラー:', error);
    throw new Error(error.message || 'クイズ生成に失敗しました');
  }
}
