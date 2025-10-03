// netlify/functions/getQuizzes.ts
import { Pool } from '@neondatabase/serverless';
import { getStore } from "./netlify-blobs-wrapper.js";
import type { Handler, HandlerEvent } from '@netlify/functions';

// --- DB接続 ---
const getDbPool = (event: HandlerEvent): Pool => {
  const customDbUrl = event.headers['x-db-url'];
  if (customDbUrl) return new Pool({ connectionString: customDbUrl });
  if (process.env.NETLIFY_DATABASE_URL) {
    return new Pool({ connectionString: process.env.NETLIFY_DATABASE_URL });
  }
  throw new Error('Database connection string is not configured.');
};

// --- Blobs Fetch ---
const handleBlobsFetch = async (event: HandlerEvent) => {
  const userId = event.headers['x-user-id'] || 'guest';
  const store = getStore({ name: 'quizzes' });
  const { keys } = await store.list();
  const quizzes: any[] = [];
  for (const key of keys) {
    // クイズIDのprefix判定は不要 or 必要ならここで
    const raw = await store.get(key);
    if (!raw) continue;
    const data = JSON.parse(raw);
    // スコアを合成
    const scoreKey = `score-${userId}-${key}`;
    const scoreRaw = await store.get(scoreKey);
    const score = scoreRaw ? JSON.parse(scoreRaw) : { correct: 0, total: 0 };
    quizzes.push({ key, ...data, score });
  }
  quizzes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { statusCode: 200, body: JSON.stringify(quizzes) };
};

// --- Neon DB ---
const handleDbFetch = async (event: HandlerEvent) => {
  const pool = getDbPool(event);
  const { rows } = await pool.query('SELECT * FROM quizzes ORDER BY created_at DESC');
  return { statusCode: 200, body: JSON.stringify(rows) };
};

// --- Sheets（必要なら残す） ---
// …省略（今のコードを流用）

// --- Entry Point ---
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const storageMode = event.headers['x-storage-mode'];

  try {
    let result;
    if (storageMode === 'netlify-blobs') {
      result = await handleBlobsFetch(event);
    } else if (storageMode === 'google-sheets') {
      // Sheets fetchを残す場合
      // result = await handleSheetsFetch(event);
      throw new Error('Sheets mode not implemented in this version');
    } else {
      result = await handleDbFetch(event);
    }

    return { ...result, headers: { 'Content-Type': 'application/json' } };
  } catch (error: any) {
    console.error('Error fetching quizzes:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to fetch quizzes.',
        error: error.message,
      }),
    };
  }
};
