import type { QuizRequest, QuizResponse, AppSettings, ApiProvider } from '../types';
import { getSettings } from '../utils/localStorageManager';

// 利用する設定を取得し不足項目をデフォルト補完
function resolveSettings(): AppSettings | null {
  const stored = getSettings();
  if (!stored) return null;
  return {
    apiProvider: stored.apiProvider || 'gemini',
    apiKeys: { gemini: stored.apiKeys?.gemini || '', openai: stored.apiKeys?.openai || '' },
    storageMode: stored.storageMode,
    dbConfig: stored.dbConfig || {},
    display: stored.display,
    appearance: stored.appearance,
  } as AppSettings;
}

function getActiveProviderAndKey(): { provider: ApiProvider; apiKey: string } {
  const settings = resolveSettings();
  const provider: ApiProvider = settings?.apiProvider || 'gemini';
  const apiKey = settings?.apiKeys[provider] || '';
  return { provider, apiKey };
}

export async function generateQuiz(params: QuizRequest): Promise<QuizResponse> {
  const { provider, apiKey } = getActiveProviderAndKey();
  if (!apiKey) {
    throw new Error(`${provider === 'gemini' ? 'Gemini' : 'OpenAI'} のAPIキーが設定されていません。設定画面で入力してください。`);
  }

  const response = await fetch('/.netlify/functions/generateQuiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ai-provider': provider,
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      topic: params.theme,
      difficulty: params.difficulty,
      fun_level: params.interestingness,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'クイズ生成に失敗しました');
  }
  return await response.json();
}
