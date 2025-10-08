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
    models: stored.models || { geminiModel: 'gemini-1.5-flash', openaiModel: 'gpt-4o-mini' }
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

  const settings = resolveSettings();
  const model = settings?.apiProvider === 'gemini' ? settings?.models?.geminiModel : settings?.models?.openaiModel;
  const response = await fetch('/.netlify/functions/generateQuiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ai-provider': provider,
      'x-api-key': apiKey,
      ...(model ? { 'x-ai-model': model } : {})
    },
    body: JSON.stringify({
      topic: params.theme,
      difficulty: params.difficulty,
      fun_level: params.interestingness,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 429 || errorData.rateLimited) {
      const err = new Error(errorData.message || 'レート制限中です。しばらく待って再試行してください。');
      (err as any).rateLimited = true;
      throw err;
    }
    throw new Error(errorData.error || errorData.message || 'クイズ生成に失敗しました');
  }
  return await response.json();
}
