import type { Quiz } from '../../types.js';
import { getQuizStore } from './quizStore.js';
import { connectBlobsFromEvent } from './quizStore.js';
import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  connectBlobsFromEvent(event as any);
  try {
    const quiz = JSON.parse(event.body || '{}') as Quiz;
    if (!quiz.id) return { statusCode: 400, body: 'Quiz must have id' };

  const store = await getQuizStore();
  await store.set(String(quiz.id), JSON.stringify(quiz));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Quiz saved', quiz }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to save quiz', error: error.message }),
    };
  }
};
