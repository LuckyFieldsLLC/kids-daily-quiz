import { describe, it, expect, vi, beforeEach } from 'vitest';

// 動的 import 用にパスを指定
const fnPath = '../netlify/functions/saveQuiz.ts';

describe('saveQuiz Netlify Function', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns 400 when id is missing', async () => {
    // getQuizStore モック
    vi.doMock('../netlify/functions/quizStore.ts', () => ({
      getQuizStore: vi.fn().mockResolvedValue({ set: vi.fn() })
    }));
    const { handler } = await import(fnPath);
    const res: any = await handler({ httpMethod: 'POST', body: JSON.stringify({ title: 'No ID' }) } as any, {} as any);
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('Quiz must have id');
  });

  it('saves quiz successfully (POST)', async () => {
    const setSpy = vi.fn();
    vi.doMock('../netlify/functions/quizStore.ts', () => ({
      getQuizStore: vi.fn().mockResolvedValue({ set: setSpy })
    }));
    const { handler } = await import(fnPath);
    const quiz = { id: 'q1', question: 'Q?', options: ['A','B'], answer: 'A' };
    const res: any = await handler({ httpMethod: 'POST', body: JSON.stringify(quiz) } as any, {} as any);
    expect(res.statusCode).toBe(200);
    expect(setSpy).toHaveBeenCalledWith('q1', JSON.stringify(quiz));
    const parsed = JSON.parse(res.body);
    expect(parsed.quiz.id).toBe('q1');
  });

  it('handles internal error', async () => {
    vi.doMock('../netlify/functions/quizStore.ts', () => ({
      getQuizStore: vi.fn().mockResolvedValue({ set: vi.fn().mockRejectedValue(new Error('disk full')) })
    }));
    const { handler } = await import(fnPath);
    const quiz = { id: 'q2', question: 'Q?', options: ['A','B'], answer: 'A' };
    const res: any = await handler({ httpMethod: 'POST', body: JSON.stringify(quiz) } as any, {} as any);
    expect(res.statusCode).toBe(500);
    expect(res.body).toContain('Failed to save quiz');
    expect(res.body).toContain('disk full');
  });
});
