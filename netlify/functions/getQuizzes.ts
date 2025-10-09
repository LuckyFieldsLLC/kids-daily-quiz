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

  // UUID v4 の形式に一致するキーのみを対象とする
  const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  for (const key of keys) {
    if (!uuidV4.test(String(key))) {
      // 旧テスト用の "hello" などJSONではない可能性のあるキーはスキップ
      continue;
    }

    const raw = await store.get(key);
    if (!raw) continue;
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      // JSONでなければスキップ
      continue;
    }

    // スコアを合成（壊れたJSONでも安全にデフォルトへ）
    const scoreKey = `score-${userId}-${key}`;
    const scoreRaw = await store.get(scoreKey);
    let score = { correct: 0, total: 0 } as any;
    if (scoreRaw) {
      try { score = JSON.parse(scoreRaw); } catch {}
    }

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
const handler = async (event: any): Promise<Response> => {
  const isRequest = typeof event?.method === 'string' && typeof event?.headers?.get === 'function';
  const method = isRequest ? String(event.method).toUpperCase() : String(event?.httpMethod || '').toUpperCase();
  if (method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  connectBlobsFromEvent(event as any);

  const getHeader = (name: string) => isRequest ? (event.headers.get(name) || event.headers.get(name.toLowerCase())) : (event.headers?.[name] || event.headers?.[name?.toLowerCase?.()]);
  const storageMode = getHeader('x-storage-mode');
  const isBlobs = storageMode === 'netlify-blobs' || storageMode === 'blobs';
  const isDb = storageMode === 'production' || storageMode === 'trial' || storageMode === 'db' || storageMode === 'custom';

  let normalizedEvent: HandlerEvent = event as any;
  if (isRequest) {
    normalizedEvent = {
      httpMethod: 'GET',
      headers: Object.fromEntries((event.headers as Headers).entries()),
      body: undefined,
    } as unknown as HandlerEvent;
  }

  try {
    let result: Response;
    if (isBlobs) {
      result = await handleBlobsFetch(normalizedEvent);
    } else if (isDb) {
      result = await handleDbFetch(normalizedEvent);
    } else {
      result = await handleBlobsFetch(normalizedEvent); // fallback
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

export default handler;
