import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getStore } from '../netlify/functions/netlify-blobs-wrapper';
import fs from 'fs/promises';
import path from 'path';

// NOTE:
// 1. ストアを beforeAll で生成し afterAll で掃除
// 2. 各テストは key 固定 (競合回避) / 事前削除
// 3. 他テストとの I/O 競合を最小化するため quizStoreCrud はシリアルでも走らせられるよう軽量

let store: ReturnType<typeof getStore>;
const baseDir = path.resolve('.blobs', 'quizzes');

beforeAll(() => {
  store = getStore({ name: 'quizzes' });
});

afterAll(async () => {
  // 開発用キャッシュなので丸ごと削除して問題なし
  try { await fs.rm(baseDir, { recursive: true, force: true }); } catch { /* ignore */ }
});

describe('quizStore wrapper CRUD', () => {
  const key = 'crud-sample';
  const quiz = { id: key, title: 'Sample Quiz', questions: [{ q: '1+1?', a: '2' }] };

  beforeEach(async () => {
    await store.delete(key);
  });

  test('set -> get -> list -> delete シーケンス', async () => {
    await store.set(key, quiz);
    const raw = await store.get(key);
    expect(raw).not.toBeNull();
    const fetched = raw && JSON.parse(raw as string);
    expect(fetched).toEqual(quiz);

    const list = await store.list();
    expect(list.keys).toContain(key);

    await store.delete(key);
    const afterDelete = await store.get(key);
    expect(afterDelete).toBeNull();
  });
});
