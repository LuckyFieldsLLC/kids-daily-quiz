import { getQuizStore, connectBlobsFromEvent } from './quizStore.js';
import type { HandlerEvent } from '@netlify/functions';

export const handler = async (event: HandlerEvent): Promise<Response> => {
  connectBlobsFromEvent(event as any);
  if (event.httpMethod !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
  const { quizId, isCorrect } = JSON.parse(event.body || '{}');
  if (!quizId) return new Response('quizId is required', { status: 400 });


  const store = await getQuizStore();
  const key = String(quizId);
  const quizRaw = await store.get(key);
  if (!quizRaw) return new Response('Quiz not found', { status: 404 });
  const quiz = JSON.parse(quizRaw);
  quiz.score = quiz.score || { correct: 0, total: 0 };
  quiz.score.total += 1;
  if (isCorrect) quiz.score.correct += 1;
  await store.set(key, JSON.stringify(quiz));

    return new Response(JSON.stringify({ message: 'Score updated', quiz }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ message: 'Failed to save score', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
