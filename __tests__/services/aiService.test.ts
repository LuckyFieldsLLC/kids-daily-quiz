import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateQuiz } from '../../services/aiService';
import type { QuizRequest } from '../../types';

// getSettings をモック
vi.mock('../../utils/localStorageManager', () => ({
  getSettings: vi.fn(),
}));
import { getSettings } from '../../utils/localStorageManager';

const mockFetch = vi.fn();

// グローバル fetch をモック
beforeEach(() => {
  (global as any).fetch = mockFetch;
  mockFetch.mockReset();
  (getSettings as any).mockReset();
});

afterEach(() => {
  delete (global as any).fetch;
});

const baseSettings = {
  apiProvider: 'gemini',
  apiKeys: { gemini: 'G_KEY', openai: 'O_KEY' },
  storageMode: 'local',
  dbConfig: {},
  display: {},
  appearance: {},
  models: { geminiModel: 'gemini-1.5-flash', openaiModel: 'gpt-4o-mini' },
};

const req: QuizRequest = {
  age: 10,
  category: 'general',
  theme: 'math',
  difficulty: 1,
  interestingness: 3,
  discussion_value: 2,
  emotional_impact: 1,
};

describe('aiService generateQuiz', () => {
  it('throws if no API key for active provider (gemini)', async () => {
    (getSettings as any).mockReturnValue({ ...baseSettings, apiKeys: { gemini: '', openai: 'O_KEY' }, apiProvider: 'gemini' });
    await expect(generateQuiz(req)).rejects.toThrow('Gemini のAPIキーが設定されていません');
  });

  it('sends correct headers & body for gemini provider', async () => {
    (getSettings as any).mockReturnValue(baseSettings);
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ quizzes: [] }) });
    await generateQuiz(req);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('/.netlify/functions/generateQuiz');
    expect(options.method).toBe('POST');
    expect(options.headers['x-ai-provider']).toBe('gemini');
    expect(options.headers['x-api-key']).toBe('G_KEY');
    expect(options.headers['x-ai-model']).toBe('gemini-1.5-flash');
    const body = JSON.parse(options.body);
    expect(body).toEqual({ topic: 'math', difficulty: 'easy', fun_level: 3 });
  });

  it('uses openai provider and model when configured', async () => {
    (getSettings as any).mockReturnValue({ ...baseSettings, apiProvider: 'openai' });
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ quizzes: [] }) });
    await generateQuiz(req);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['x-ai-provider']).toBe('openai');
    expect(options.headers['x-api-key']).toBe('O_KEY');
    expect(options.headers['x-ai-model']).toBe('gpt-4o-mini');
  });

  it('handles 429/rate limit error with flag', async () => {
    (getSettings as any).mockReturnValue(baseSettings);
    mockFetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({ rateLimited: true, message: 'Wait' }) });
    const err = await generateQuiz(req).catch(e => e);
    expect(err.rateLimited).toBe(true);
    expect(err.message).toContain('Wait');
  });

  it('handles generic non-OK error', async () => {
    (getSettings as any).mockReturnValue(baseSettings);
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'fail' }) });
    await expect(generateQuiz(req)).rejects.toThrow('fail');
  });
});
