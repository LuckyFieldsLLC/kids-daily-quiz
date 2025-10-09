import type { Quiz } from '../../types.js';
import { Handler } from '@netlify/functions';
import { getQuizStore, connectBlobsFromEvent } from './quizStore.js';

export const handler: Handler = async (event) => {
  connectBlobsFromEvent(event as any);
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const newQuizzes: Quiz[] = JSON.parse(event.body || '[]');

  const store = await getQuizStore();
  for (const quiz of newQuizzes) {
      const key = String(quiz.id);
      await store.set(key, JSON.stringify(quiz));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Quizzes imported successfully' }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to import quizzes', error: error.message }),
    };
  }
};
