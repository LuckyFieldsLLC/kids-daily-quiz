import { describe, test, expect } from 'vitest';
import * as diagnoseModule from '../netlify/functions/diagnoseBlobs';
import createHandler from '../netlify/functions/createQuiz';
import * as getQuizzesModule from '../netlify/functions/getQuizzes';
import deleteHandler from '../netlify/functions/deleteQuiz';

const json = (v: any) => JSON.stringify(v);

describe('API smoke: Blobs CRUD via function handlers', () => {
  test('diagnose -> create -> get -> delete', async () => {
    const diagnoseHandler = (diagnoseModule as any).handler || (diagnoseModule as any).default || diagnoseModule;
    const getQuizzesHandler = (getQuizzesModule as any).handler || (getQuizzesModule as any).default || getQuizzesModule;
    // 1) Diagnose
    const diagRes = await diagnoseHandler({
      httpMethod: 'GET',
      headers: {},
    } as any);
    expect(diagRes.statusCode).toBe(200);
    const diagBody = JSON.parse(diagRes.body as string);
    expect(diagBody.ok).toBe(true);

    // 2) Create
    const createRes = await createHandler({
      httpMethod: 'POST',
      headers: { 'x-storage-mode': 'blobs' },
      body: json({
        question: '2+3=?',
        options: [{ text: '4' }, { text: '5' }],
        answer: '5',
        is_active: true,
        difficulty: 1,
        fun_level: 2,
      }),
    } as any);
    expect([200,201]).toContain(createRes.statusCode);
    const created = JSON.parse(createRes.body as string);
    expect(created?.id).toBeTruthy();
    const createdId = String(created.id);

    // 3) Get
    const getRes = await getQuizzesHandler({
      httpMethod: 'GET',
      headers: { 'x-storage-mode': 'blobs' },
    } as any);
    expect(getRes.statusCode).toBe(200);
    const quizzes = JSON.parse(getRes.body as string) as any[];
    const exists = quizzes.some(q => String(q.id || q.key) === createdId);
    expect(exists).toBe(true);

    // 4) Delete
    const delRes = await deleteHandler({
      httpMethod: 'DELETE',
      headers: { 'x-storage-mode': 'blobs' },
      body: json({ id: createdId }),
    } as any);
    expect(delRes.statusCode).toBe(200);
  });
});
