import type { Quiz } from '../../types.js';
import { getQuizStore } from './quizStore.js';
import { connectBlobsFromEvent } from './quizStore.js';
import type { HandlerEvent } from '@netlify/functions';

export const handler = async (event: HandlerEvent): Promise<Response> => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  connectBlobsFromEvent(event as any);
  try {
  const quiz = JSON.parse(event.body || '{}') as Quiz;
  if (!quiz.id) return new Response('Quiz must have id', { status: 400 });

  const store = await getQuizStore();
  await store.set(String(quiz.id), JSON.stringify(quiz));

    return new Response(JSON.stringify({ message: 'Quiz saved', quiz }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ message: 'Failed to save quiz', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
