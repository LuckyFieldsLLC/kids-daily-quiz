import type { HandlerEvent } from '@netlify/functions';
import { getQuizStore, connectBlobsFromEvent } from './quizStore.js';
import { randomUUID } from 'crypto';
import { Pool } from '@neondatabase/serverless';
import type { NewQuiz, Quiz } from '../../types.js';

// --- Inlined from _db.ts ---
const getDbPool = (event: HandlerEvent): Pool => {
  const customDbUrl = event.headers['x-db-url'];
  if (customDbUrl) {
    return new Pool({ connectionString: customDbUrl });
  }
  const netlifyDbUrl = process.env.NETLIFY_DATABASE_URL;
  if (netlifyDbUrl) {
    return new Pool({ connectionString: netlifyDbUrl });
  }
  throw new Error(
    'Database connection string is not configured. Please set NETLIFY_DATABASE_URL or provide a custom URL.'
  );
};

// --- Google Sheets legacy support removed (deprecated) ---
// 以前の google-sheets モードは vNEXT で削除。履歴: commit simplifying storage modes to 3.

// --- DB Logic ---
const handleDbCreate = async (event: HandlerEvent) => {
  const { question, options, answer, is_active, difficulty, fun_level } = JSON.parse(
    event.body || '{}'
  );

  if (!question || !Array.isArray(options) || options.length === 0 || !answer) {
    return new Response(JSON.stringify({ message: 'Invalid quiz data provided.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const pool = getDbPool(event);
  const sql = `
        INSERT INTO quizzes (question, options, answer, is_active, difficulty, fun_level) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`;

  const values = [
    question,
    JSON.stringify(options),
    answer,
    is_active ?? true,
    difficulty ?? 2,
    fun_level ?? 2,
  ];

  const { rows } = await pool.query(sql, values);
  return new Response(JSON.stringify(rows[0]), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

// (Sheets removal note) 旧データは既に local へ自動フォールバックされます。

// --- Netlify Blobs Logic ---
const handleBlobsCreate = async (event: HandlerEvent) => {
  const quizData = JSON.parse(event.body || '{}') as Partial<Quiz>;
  const store = await getQuizStore();

  // 厳密なQuiz型に正規化
  const newQuiz: Quiz = {
    id: String(randomUUID()),
    question: String(quizData.question ?? ''),
    options: Array.isArray(quizData.options)
      ? quizData.options.map((o: any) =>
          typeof o === 'object' && o !== null && 'text' in o
            ? { text: String(o.text) }
            : { text: String(o) }
        )
      : [],
    answer: String(quizData.answer ?? ''),
    is_active: quizData.is_active ?? true,
    difficulty: typeof quizData.difficulty === 'number' ? quizData.difficulty : 2,
    fun_level: typeof quizData.fun_level === 'number' ? quizData.fun_level : 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await store.set(String(newQuiz.id), JSON.stringify(newQuiz));
  return new Response(JSON.stringify(newQuiz), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

// --- Entry Point ---
const handler = async (event: any): Promise<Response> => {
  // Blobs 自動認証コンテキスト接続
  connectBlobsFromEvent(event as any);

  const isRequest = typeof event?.method === 'string' && typeof event?.headers?.get === 'function';
  const method = isRequest ? String(event.method).toUpperCase() : String(event?.httpMethod || '').toUpperCase();

  if (method !== 'POST' && method !== 'GET') {
    return new Response(
      JSON.stringify({ message: 'Method Not Allowed', got: method }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const getHeader = (name: string) => {
    if (isRequest) return event.headers.get(name) || event.headers.get(name.toLowerCase());
    const h = (event?.headers) || {};
    return h[name] || h[name?.toLowerCase?.()] || undefined;
  };

  const storageMode = getHeader('x-storage-mode');
  const isBlobs = storageMode === 'netlify-blobs' || storageMode === 'blobs';
  const isDb = storageMode === 'production' || storageMode === 'trial' || storageMode === 'db' || storageMode === 'custom';

  try {
    if (method === 'GET') {
      return new Response(JSON.stringify({ ok: true, message: 'createQuiz alive' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    // Normalize body for both runtimes
    let normalizedEvent: HandlerEvent = event;
    if (isRequest) {
      const text = await event.text();
      normalizedEvent = {
        httpMethod: 'POST',
        headers: Object.fromEntries((event.headers as Headers).entries()),
        body: text,
      } as unknown as HandlerEvent;
    }

    let result: Response;
    if (isBlobs) {
      result = await handleBlobsCreate(normalizedEvent);
    } else if (isDb) {
      result = await handleDbCreate(normalizedEvent);
    } else {
      // fallback local <-> currently local means no server persistent store, reuse blobs fallback
      result = await handleBlobsCreate(normalizedEvent);
    }
    return result;
  } catch (error: any) {
    console.error('Error creating quiz:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to create quiz.', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export default handler;

