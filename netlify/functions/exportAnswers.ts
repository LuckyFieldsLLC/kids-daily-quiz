import { getQuizStore, connectBlobsFromEvent } from './quizStore.js';
import type { HandlerEvent } from '@netlify/functions';

export const handler = async (event: HandlerEvent): Promise<Response> => {
  connectBlobsFromEvent(event as any);
  try {
  const store = await getQuizStore();
    const { keys } = await store.list();
  const quizzes = await Promise.all(keys.map(async (key: string) => {
      const raw = await store.get(key);
      return raw ? JSON.parse(raw) : null;
    }));
    // nullを除外
    const filteredQuizzes = quizzes.filter(Boolean);

    // CSV変換
    const csv = [
      ['id', 'question', 'options', 'answer', 'explanation'].join(',') ,
      ...filteredQuizzes.map((q: any) =>
        [
          q.id,
          `"${q.question}"`,
          `"${(q.options || []).map((o:any)=>o.text).join(';')}"`,
          q.answer,
          q.explanation || '',
        ].join(','),
      ),
    ].join('\n');

    return new Response(csv, { status: 200, headers: { 'Content-Type': 'text/csv' } });
  } catch (error: any) {
    console.error('Error exporting answers:', error);
    return new Response(JSON.stringify({ message: 'Failed to export answers', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
