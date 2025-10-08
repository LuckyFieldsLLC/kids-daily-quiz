import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getQuizzes, createQuiz, updateQuiz, deleteQuiz, generateQuizFromAI, testConnection } from '../services/api';

const dbConfig = { dbUrl: 'postgres://demo' } as any;

function mockFetchOnce(status: number, body: any, ok = false) {
  (global as any).fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: 'ERR',
    json: async () => body
  });
}

describe('services/api handleResponse error paths', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('propagates error.message from error JSON', async () => {
    mockFetchOnce(500, { message: 'X failed' });
    await expect(getQuizzes('local' as any, { dbUrl: '' } as any)).rejects.toThrow('X failed');
  });

  it('propagates error.error field', async () => {
    mockFetchOnce(400, { error: 'Bad data' });
    await expect(createQuiz({ question: 'q', options: ['a'], answer: 'a' } as any, 'local' as any, { dbUrl: '' } as any)).rejects.toThrow('Bad data');
  });

  it('falls back to generic message when JSON missing fields', async () => {
    mockFetchOnce(404, { something: 'else' });
    await expect(updateQuiz({ id: '1', question: 'q', options: ['a'], answer: 'a' } as any, 'local' as any, { dbUrl: '' } as any)).rejects.toThrow('APIエラーが発生しました');
  });

  it('handles network-like JSON parse failure', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({ ok: false, status: 502, statusText: 'Bad Gateway', json: async () => { throw new Error('broken'); } });
    await expect(deleteQuiz('1', 'local' as any, { dbUrl: '' } as any)).rejects.toThrow(/HTTP 502/);
  });

  it('generateQuizFromAI forwards message', async () => {
    mockFetchOnce(401, { message: 'Auth needed' });
    await expect(generateQuizFromAI('math', 2, 2)).rejects.toThrow('Auth needed');
  });

  it('testConnection error path', async () => {
    mockFetchOnce(500, { error: 'Conn fail' });
    await expect(testConnection('local' as any, dbConfig)).rejects.toThrow('Conn fail');
  });
});
