import type { HandlerEvent } from '@netlify/functions';
import { getQuizStore, connectBlobsFromEvent } from './quizStore.js';
import { Pool } from '@neondatabase/serverless';

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
  throw new Error('Database connection string is not configured. Please set NETLIFY_DATABASE_URL or provide a custom URL.');
};

// --- Google Sheets support removed (deprecated) ---

// --- DB Logic ---
const handleDbDelete = async (event: HandlerEvent) => {
  const { id } = JSON.parse(event.body || '{}');
  if (!id) {
    return new Response(JSON.stringify({ message: 'Quiz ID is required for deletion.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const pool = getDbPool(event);
  const sql = `DELETE FROM quizzes WHERE id = $1`;
  const result = await pool.query(sql, [id]);

  if (result.rowCount === 0) {
    return new Response(JSON.stringify({ message: 'Quiz not found for deletion.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ message: `Quiz ${id} deleted successfully.` }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

// (Sheets removal note) 旧モード利用データは移行後 Blobs/DB 運用

// --- Netlify Blobs Logic ---
const handleBlobsDelete = async (event: HandlerEvent) => {
  const { id } = JSON.parse(event.body || '{}');
  if (!id) {
    return new Response(JSON.stringify({ message: 'ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const store = await getQuizStore();
  await store.delete(String(id));
  return new Response(JSON.stringify({ message: 'Quiz deleted successfully' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

// --- Entry Point ---
const handler = async (event: any): Promise<Response> => {
  connectBlobsFromEvent(event as any);

  const isRequest = typeof event?.method === 'string' && typeof event?.headers?.get === 'function';
  const method = isRequest ? String(event.method).toUpperCase() : String(event?.httpMethod || '').toUpperCase();
  if (method !== 'POST' && method !== 'DELETE') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const getHeader = (name: string) => isRequest
    ? (event.headers.get(name) || event.headers.get(name.toLowerCase()))
    : (event.headers?.[name] || event.headers?.[name?.toLowerCase?.()]);
  const storageMode = getHeader('x-storage-mode');
  const isBlobs = storageMode === 'netlify-blobs' || storageMode === 'blobs';
  const isDb = storageMode === 'production' || storageMode === 'trial' || storageMode === 'db' || storageMode === 'custom';

  // 正規化
  let normalizedEvent: HandlerEvent = event as any;
  if (isRequest) {
    const text = await event.text();
    normalizedEvent = {
      httpMethod: method,
      headers: Object.fromEntries((event.headers as Headers).entries()),
      body: text,
    } as unknown as HandlerEvent;
  }

  try {
    let result: Response;
    if (isBlobs) {
      result = await handleBlobsDelete(normalizedEvent);
    } else if (isDb) {
      result = await handleDbDelete(normalizedEvent);
    } else {
      result = await handleBlobsDelete(normalizedEvent); // fallback
    }
    return result;
  } catch (error: any) {
    console.error('Error deleting quiz:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to delete quiz.', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export default handler;

