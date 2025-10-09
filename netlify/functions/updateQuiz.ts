import type { NewQuiz, Quiz } from '../../types.js';
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
const handleDbUpdate = async (event: HandlerEvent) => {
  const { id, question, options, answer, is_active, difficulty, fun_level } = JSON.parse(event.body || '{}');

  if (!id || !question || !Array.isArray(options) || !answer) {
    return new Response(JSON.stringify({ message: 'Invalid quiz data for update.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const pool = getDbPool(event);
  const sql = `
        UPDATE quizzes 
        SET question = $1, options = $2, answer = $3, updated_at = NOW(), is_active = $4, difficulty = $5, fun_level = $6
        WHERE id = $7
        RETURNING *`;
        
  const values = [question, JSON.stringify(options), answer, is_active, difficulty, fun_level, id];
  
  const { rows } = await pool.query(sql, values);

  if (rows.length === 0) {
    return new Response(JSON.stringify({ message: 'Quiz not found.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify(rows[0]), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

// (Sheets removal) 旧データはマイグレーション後 local/blobs 側で保存されます。

// --- Netlify Blobs Logic ---
const handleBlobsUpdate = async (event: HandlerEvent) => {
  const quizToUpdate = JSON.parse(event.body || '{}') as Quiz;
  const store = await getQuizStore();

  const existingRaw = await store.get(String(quizToUpdate.id));
  if (!existingRaw) {
    return new Response(JSON.stringify({ message: 'Quiz not found.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  const existingQuiz = JSON.parse(existingRaw) as Quiz;
  const updatedQuiz: Quiz = {
    ...existingQuiz,
    ...quizToUpdate,
    updated_at: new Date().toISOString(),
  };
  await store.set(String(updatedQuiz.id), JSON.stringify(updatedQuiz));
  return new Response(JSON.stringify(updatedQuiz), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

// --- Entry Point ---
const handler = async (event: HandlerEvent): Promise<Response> => {
  connectBlobsFromEvent(event as any);
  if (event.httpMethod !== 'PUT') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  const storageMode = event.headers['x-storage-mode'];
  const isBlobs = storageMode === 'netlify-blobs' || storageMode === 'blobs';
  const isDb = storageMode === 'production' || storageMode === 'trial' || storageMode === 'db' || storageMode === 'custom';
  
  try {
    let result: Response;
    if (isBlobs) {
      result = await handleBlobsUpdate(event);
    } else if (isDb) {
      result = await handleDbUpdate(event);
    } else {
      result = await handleBlobsUpdate(event); // fallback
    }
    return result;
  } catch (error: any) {
    console.error("Error updating quiz:", error);
    return new Response(
      JSON.stringify({ message: 'Failed to update quiz.', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export default handler;
