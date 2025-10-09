import { getQuizStore } from './quizStore.js';
import type { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/csv' },
      body: csv,
    };
  } catch (error: any) {
    console.error('Error exporting answers:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to export answers', error: error.message }),
    };
  }
};
