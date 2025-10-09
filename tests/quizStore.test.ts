import { describe, it, expect, vi, beforeEach } from 'vitest';

// NOTE: getQuizStore は動的 import で env により実装を選ぶ。
const targetPath = '../netlify/functions/quizStore.ts';

describe('quizStore factory', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.BLOBS_SITE_ID;
    delete process.env.BLOBS_TOKEN;
  });

  it('falls back to local wrapper when env vars absent', async () => {
    // ラッパーモジュールをスパイ
    const wrapperSpy = vi.fn();
    vi.doMock('../netlify/functions/netlify-blobs-wrapper.ts', () => ({
      getStore: (args: any) => { wrapperSpy(args); return { kind: 'local', ...args, list: async () => ({ keys: [] }), get: async () => null, set: async () => {}, delete: async () => {} }; }
    }));

    const { getQuizStore } = await import(targetPath);
    const store: any = await getQuizStore();
    expect(wrapperSpy).toHaveBeenCalledWith({ name: 'quizzes' });
    const listing = await store.list();
    expect(Array.isArray(listing.keys)).toBe(true);
    expect(store.kind).toBe('local');
  });

  it('uses real @netlify/blobs getStore when env present', async () => {
    process.env.BLOBS_SITE_ID = 'site';
    process.env.BLOBS_TOKEN = 'token';

    const realSpy = vi.fn();
    vi.doMock('@netlify/blobs', () => ({ getStore: (args: any) => { realSpy(args); return { kind: 'real', ...args, list: async () => ({ keys: [] }), get: async () => null, set: async () => {}, delete: async () => {} }; } }));
    // fallback wrapper も定義（使われないはず）
    vi.doMock('../netlify/functions/netlify-blobs-wrapper.ts', () => ({ getStore: (args: any) => ({ kind: 'local', ...args, list: async () => ({ keys: [] }), get: async () => null, set: async () => {}, delete: async () => {} }) }));

    const { getQuizStore } = await import(targetPath);
    const store: any = await getQuizStore();
    expect(realSpy).toHaveBeenCalledWith({ name: 'quizzes' });
    expect(store.kind).toBe('real');
  });

  it('normalizes list() when real API returns { blobs: [...] }', async () => {
    process.env.BLOBS_SITE_ID = 'site';
    process.env.BLOBS_TOKEN = 'token';

    vi.doMock('@netlify/blobs', () => ({
      getStore: () => ({
        async list() { return { blobs: [{ key: 'a' }, { key: 'b' }] }; },
        async get() { return null; },
        async set() {},
        async delete() {}
      })
    }));

    const { getQuizStore } = await import(targetPath);
    const store: any = await getQuizStore();
    const listing = await store.list();
    expect(listing).toEqual({ keys: ['a', 'b'] });
  });

  it('gracefully handles unknown list() shape by returning empty keys', async () => {
    process.env.BLOBS_SITE_ID = 'site';
    process.env.BLOBS_TOKEN = 'token';

    vi.doMock('@netlify/blobs', () => ({
      getStore: () => ({
        async list() { return { something: 'else' }; },
        async get() { return null; },
        async set() {},
        async delete() {}
      })
    }));

    const { getQuizStore } = await import(targetPath);
    const store: any = await getQuizStore();
    const listing = await store.list();
    expect(listing).toEqual({ keys: [] });
  });
});
