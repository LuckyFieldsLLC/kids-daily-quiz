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
    return { statusCode: 400, body: JSON.stringify({ message: 'Quiz ID is required for deletion.' }) };
  }

  const pool = getDbPool(event);
  const sql = `DELETE FROM quizzes WHERE id = $1`;
  const result = await pool.query(sql, [id]);

  if (result.rowCount === 0) {
    return { statusCode: 404, body: JSON.stringify({ message: 'Quiz not found for deletion.' }) };
  }
  return { statusCode: 200, body: JSON.stringify({ message: `Quiz ${id} deleted successfully.` }) };
};

// (Sheets removal note) 旧モード利用データは移行後 Blobs/DB 運用

// --- Netlify Blobs Logic ---
const handleBlobsDelete = async (event: HandlerEvent) => {
  const { id } = JSON.parse(event.body || '{}');
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ message: 'ID is required' }) };
  }
  const store = await getQuizStore();
  await store.delete(String(id));
  return { statusCode: 200, body: JSON.stringify({ message: 'Quiz deleted successfully' }) };
};

// --- Entry Point ---
const handler = async (event: HandlerEvent) => {
  connectBlobsFromEvent(event as any);
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const storageMode = event.headers['x-storage-mode'];
  const isBlobs = storageMode === 'netlify-blobs' || storageMode === 'blobs';
  const isDb = storageMode === 'production' || storageMode === 'trial' || storageMode === 'db' || storageMode === 'custom';

  try {
    let result;
    if (isBlobs) {
      result = await handleBlobsDelete(event);
    } else if (isDb) {
      result = await handleDbDelete(event);
    } else {
      result = await handleBlobsDelete(event); // fallback
    }
    return {
      ...result,
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error: any) {
    console.error("Error deleting quiz:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to delete quiz.', error: error.message }),
    };
  }
};

export default handler;

