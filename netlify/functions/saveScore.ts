import { getStore } from "./netlify-blobs-wrapper.js";
import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { quizId, isCorrect } = JSON.parse(event.body || '{}');
    if (!quizId) return { statusCode: 400, body: 'quizId is required' };


  const store = getStore({ name: 'quizzes' });
  const quizRaw = await store.get(quizId);
  if (!quizRaw) return { statusCode: 404, body: 'Quiz not found' };
  const quiz = JSON.parse(quizRaw);
  quiz.score = quiz.score || { correct: 0, total: 0 };
  quiz.score.total += 1;
  if (isCorrect) quiz.score.correct += 1;
  await store.set(quizId, JSON.stringify(quiz));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Score updated', quiz }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to save score', error: error.message }),
    };
  }
};
