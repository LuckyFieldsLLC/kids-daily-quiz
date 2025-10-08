import type { QuizRequest, QuizResponse } from '../types';

// 設定からAPIキーを取得する関数（localStorageから読み込む）
function getUserApiKey(): string | null {
  try {
    const settingsString = localStorage.getItem('app_settings_config');
    if (!settingsString) return null;
    const settings = JSON.parse(settingsString);
    return settings.apiKeys?.gemini || null;
  } catch {
    return null;
  }
}

export async function generateQuiz(params: QuizRequest): Promise<QuizResponse> {
  const apiKey = getUserApiKey();

  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。設定画面で入力してください。');
  }

  const response = await fetch('/.netlify/functions/generateQuiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gemini-api-key': apiKey, // ← ユーザー設定キーを送信
    },
    body: JSON.stringify({
      topic: params.theme,
      difficulty: params.difficulty,
      fun_level: params.interestingness,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'クイズ生成に失敗しました');
  }

  return await response.json();
}
