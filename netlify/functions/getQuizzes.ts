// netlify/functions/getQuizzes.ts
import { Pool } from '@neondatabase/serverless';
import { getGenericStore, connectBlobsFromEvent } from './quizStore.js';
import type { HandlerEvent } from '@netlify/functions';

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
const handleBlobsFetch = async (event: HandlerEvent): Promise<Response> => {
  const userId = event.headers['x-user-id'] || 'guest';
  const store = await getGenericStore('quizzes');
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
  const ts = (q: any) => {
    const v = q.created_at ?? q.createdAt;
    const t = v ? Date.parse(v) : NaN;
    return Number.isFinite(t) ? t : 0;
  };
  quizzes.sort((a, b) => ts(b) - ts(a));
  return new Response(JSON.stringify(quizzes), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

// --- Neon DB ---
const handleDbFetch = async (event: HandlerEvent): Promise<Response> => {
  const pool = getDbPool(event);
  const { rows } = await pool.query('SELECT * FROM quizzes ORDER BY created_at DESC');
  return new Response(JSON.stringify(rows), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

// Google Sheets support removed (deprecated)

// --- Entry Point ---
export const handler = async (event: HandlerEvent): Promise<Response> => {
  if (event.httpMethod !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  connectBlobsFromEvent(event as any);
    const storageMode = event.headers['x-storage-mode'];
    const isBlobs = storageMode === 'netlify-blobs' || storageMode === 'blobs';
    const isDb = storageMode === 'production' || storageMode === 'trial' || storageMode === 'db' || storageMode === 'custom';

  try {
    let result: Response;
    if (isBlobs) {
      result = await handleBlobsFetch(event);
    } else if (isDb) {
      result = await handleDbFetch(event);
    } else {
      result = await handleBlobsFetch(event); // fallback
    }

    return result;
  } catch (error: any) {
    console.error('Error fetching quizzes:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch quizzes.', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
