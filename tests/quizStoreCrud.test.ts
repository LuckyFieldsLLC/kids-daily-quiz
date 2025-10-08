import { describe, test, expect, beforeEach } from 'vitest';
import { getStore } from '../netlify/functions/netlify-blobs-wrapper';

// getStore で名前空間作成
const store = getStore({ name: 'quizzes' });

describe('quizStore wrapper CRUD', () => {
  const key = 'crud-sample';
  const quiz = { id: 'crud-sample', title: 'Sample Quiz', questions: [{ q: '1+1?', a: '2' }] };

  beforeEach(async () => {
    await store.delete(key); // force:true なので存在しなくてもエラーにならない
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
