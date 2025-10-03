import type { NewQuiz, Quiz } from '../../types.js';
import type { HandlerEvent } from '@netlify/functions';
import { getStore } from "./netlify-blobs-wrapper.js";
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

// --- Inlined from _sheets-client.ts ---
const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const SHEETS_DEFAULT_RANGE = 'Sheet1!A:I';

interface SheetsAuth { apiKey: string; sheetId: string; }

const getSheetsAuth = (event: HandlerEvent): SheetsAuth => {
  const apiKey = event.headers['x-google-api-key'];
  const sheetId = event.headers['x-google-sheet-id'];
  if (!apiKey || !sheetId) throw new Error('Google Sheets API Key and Sheet ID are required.');
  return { apiKey, sheetId };
};

const getSheetData = async (auth: SheetsAuth) => {
  const url = `${SHEETS_API_URL}/${auth.sheetId}/values/${SHEETS_DEFAULT_RANGE}?key=${auth.apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API Error: ${errorText}`);
  }
  const data = await response.json();
  return (data.values || []) as string[][];
};

const quizToRow = (quiz: Partial<Quiz>): string[] => {
  const now = new Date().toISOString();
  return [
    quiz.id?.toString() || '',
    quiz.question || '',
    JSON.stringify(quiz.options || []),
    quiz.answer || '',
    quiz.created_at || now,
    now,
    (quiz.is_active ?? true).toString().toUpperCase(),
    (quiz.difficulty ?? 2).toString(),
    (quiz.fun_level ?? 2).toString(),
  ];
};

// --- DB Logic ---
const handleDbUpdate = async (event: HandlerEvent) => {
  const { id, question, options, answer, is_active, difficulty, fun_level } = JSON.parse(event.body || '{}');

  if (!id || !question || !Array.isArray(options) || !answer) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid quiz data for update.' }) };
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
    return { statusCode: 404, body: JSON.stringify({ message: 'Quiz not found.' }) };
  }
  return { statusCode: 200, body: JSON.stringify(rows[0]) };
};

// --- Sheets Logic ---
const handleSheetsUpdate = async (event: HandlerEvent) => {
  const auth = getSheetsAuth(event);
  const quizToUpdate = JSON.parse(event.body || '{}') as Quiz;

  const rows = await getSheetData(auth);
  const rowIndex = rows.findIndex(row => row[0] === quizToUpdate.id.toString());
  
  if (rowIndex === -1) {
    return { statusCode: 404, body: JSON.stringify({ message: 'Quiz not found' }) };
  }
  
  const updatedRow = quizToRow(quizToUpdate);
  const range = `Sheet1!A${rowIndex + 1}`;
  const updateUrl = `${SHEETS_API_URL}/${auth.sheetId}/values/${range}?valueInputOption=USER_ENTERED&key=${auth.apiKey}`;

  const response = await fetch(updateUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [updatedRow] }),
  });

  if (!response.ok) {
    throw new Error(`Google Sheets API Error: ${await response.text()}`);
  }
  
  const finalQuiz = { ...quizToUpdate, updated_at: updatedRow[5] };
  return { statusCode: 200, body: JSON.stringify(finalQuiz) };
};

// --- Netlify Blobs Logic ---
const handleBlobsUpdate = async (event: HandlerEvent) => {
  const quizToUpdate = JSON.parse(event.body || '{}') as Quiz;
  const store = getStore({ name: 'quizzes' });

  const existingRaw = await store.get(String(quizToUpdate.id));
  if (!existingRaw) {
    return { statusCode: 404, body: JSON.stringify({ message: 'Quiz not found.' }) };
  }
  const existingQuiz = JSON.parse(existingRaw) as Quiz;
  const updatedQuiz: Quiz = {
    ...existingQuiz,
    ...quizToUpdate,
    updated_at: new Date().toISOString(),
  };
  await store.set(String(updatedQuiz.id), JSON.stringify(updatedQuiz));
  return { statusCode: 200, body: JSON.stringify(updatedQuiz) };
};

// --- Entry Point ---
export default async (event: HandlerEvent) => {
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  const storageMode = event.headers['x-storage-mode'];
  
  try {
    let result;
    if (storageMode === 'netlify-blobs') {
      result = await handleBlobsUpdate(event);
    } else if (storageMode === 'google-sheets') {
      result = await handleSheetsUpdate(event);
    } else {
      result = await handleDbUpdate(event);
    }
    return { 
      ...result, 
      headers: { 'Content-Type': 'application/json' } 
    };
  } catch (error: any) {
    console.error("Error updating quiz:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Failed to update quiz.', error: error.message }) 
    };
  }
};
