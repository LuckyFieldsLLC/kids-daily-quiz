import type { Quiz } from '../../types.js';
import type { HandlerEvent } from '@netlify/functions';
import { getQuizStore, connectBlobsFromEvent } from './quizStore.js';

export const handler = async (event: HandlerEvent): Promise<Response> => {
  connectBlobsFromEvent(event as any);
  if (event.httpMethod !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
  const newQuizzes: Quiz[] = JSON.parse(event.body || '[]');

  const store = await getQuizStore();
  for (const quiz of newQuizzes) {
      const key = String(quiz.id);
      await store.set(key, JSON.stringify(quiz));
    }

    return new Response(JSON.stringify({ message: 'Quizzes imported successfully' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ message: 'Failed to import quizzes', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
