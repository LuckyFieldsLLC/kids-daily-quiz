import { describe, it, expect, vi, beforeEach } from 'vitest';

const fnPath = '../netlify/functions/generateQuiz.ts';

// 共通ヘルパ
function baseEvent(overrides: Partial<any> = {}) {
  return {
    httpMethod: 'POST',
    headers: { 'x-ai-provider': 'gemini' },
    body: JSON.stringify({ topic: '恐竜', difficulty: 2, fun_level: 2 }),
    ...overrides
  } as any;
}

// JSON テンプレ
const QUIZ_JSON = {
  question: '恐竜で一番大きいと考えられるのは?',
  options: ['A', 'B', 'C', 'D'],
  answer: 'A'
};

describe('generateQuiz Netlify Function', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('returns 400 if topic missing', async () => {
    const { handler } = await import(fnPath);
    const res: any = await handler(baseEvent({ body: JSON.stringify({}) }));
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('トピックが指定されていません');
  });

  it('returns 400 if API key missing', async () => {
    // Ensure env keys are not present
    const prevOpenAI = process.env.OPENAI_API_KEY;
    const prevGemini = process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const { handler } = await import(fnPath);
      const res: any = await handler(baseEvent({ headers: { 'x-ai-provider': 'gemini' } }));
      expect(res.statusCode).toBe(400);
      expect(res.body).toContain('APIキーが設定されていません');
    } finally {
      if (prevOpenAI) process.env.OPENAI_API_KEY = prevOpenAI;
      if (prevGemini) process.env.GEMINI_API_KEY = prevGemini;
    }
  });

  it('generates quiz via Gemini (happy path)', async () => {
    // Gemini SDK モック
    vi.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: class {
        constructor(public key: string) {}
        getGenerativeModel() {
          return { generateContent: vi.fn().mockResolvedValue({ response: { text: () => JSON.stringify(QUIZ_JSON) } }) };
        }
      }
    }));
    const { handler } = await import(fnPath);
    const res: any = await handler(baseEvent({ headers: { 'x-ai-provider': 'gemini', 'x-api-key': 'GKEY' } }));
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.question).toBe(QUIZ_JSON.question);
    expect(parsed.provider).toBe('gemini');
  });

  it('generates quiz via OpenAI (happy path)', async () => {
    vi.doMock('openai', () => ({
      default: class {
        constructor(public cfg: any) {}
        chat = { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: JSON.stringify(QUIZ_JSON) } }] }) } };
      }
    }));
    const { handler } = await import(fnPath);
    const res: any = await handler(baseEvent({ headers: { 'x-ai-provider': 'openai', 'x-api-key': 'OKEY' } }));
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.provider).toBe('openai');
  });

  it('selects default gemini model when header absent', async () => {
    const getModelSpy = vi.fn().mockReturnValue({ generateContent: vi.fn().mockResolvedValue({ response: { text: () => JSON.stringify(QUIZ_JSON) } }) });
    vi.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: class {
        constructor(public key: string) {}
        getGenerativeModel(args: any) { getModelSpy(args); return getModelSpy.mock.results[0].value; }
      }
    }));
    const { handler } = await import(fnPath);
    const res: any = await handler(baseEvent({ headers: { 'x-ai-provider': 'gemini', 'x-api-key': 'GKEY' } }));
    expect(res.statusCode).toBe(200);
    expect(getModelSpy).toHaveBeenCalledWith({ model: 'gemini-1.5-flash' });
  });

  it('respects custom gemini model header', async () => {
    const getModelSpy = vi.fn().mockReturnValue({ generateContent: vi.fn().mockResolvedValue({ response: { text: () => JSON.stringify(QUIZ_JSON) } }) });
    vi.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: class {
        constructor(public key: string) {}
        getGenerativeModel(args: any) { getModelSpy(args); return getModelSpy.mock.results[0].value; }
      }
    }));
    const { handler } = await import(fnPath);
    const model = 'gemini-1.5-pro';
    const res: any = await handler(baseEvent({ headers: { 'x-ai-provider': 'gemini', 'x-api-key': 'GKEY', 'x-ai-model': model } }));
    expect(res.statusCode).toBe(200);
    expect(getModelSpy).toHaveBeenCalledWith({ model });
  });

  it('returns 429 on rate limit like error', async () => {
    vi.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: class {
        constructor(public key: string) {}
        getGenerativeModel() {
          return { generateContent: vi.fn().mockRejectedValue(new Error('Rate limit exceeded')) };
        }
      }
    }));
    const { handler } = await import(fnPath);
    const res: any = await handler(baseEvent({ headers: { 'x-ai-provider': 'gemini', 'x-api-key': 'GKEY' } }));
    expect(res.statusCode).toBe(429);
    expect(res.body).toContain('レート制限');
  });

  it('returns 500 when invalid JSON produced', async () => {
    vi.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: class {
        constructor(public key: string) {}
        getGenerativeModel() {
          return { generateContent: vi.fn().mockResolvedValue({ response: { text: () => 'NOT_JSON' } }) };
        }
      }
    }));
    const { handler } = await import(fnPath);
    const res: any = await handler(baseEvent({ headers: { 'x-ai-provider': 'gemini', 'x-api-key': 'GKEY' } }));
    expect(res.statusCode).toBe(500);
    expect(res.body).toContain('AIクイズの生成に失敗');
  });
});
