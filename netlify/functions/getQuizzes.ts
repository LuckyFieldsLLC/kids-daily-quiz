import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { Pool } from '@neondatabase/serverless';
import type { Quiz, QuizOption } from '../../types';

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

const rowToQuiz = (row: string[]): Quiz | null => {
  if (!row || row.length < 4) return null;
  try {
    const options: QuizOption[] = JSON.parse(row[2] || '[]');
    return {
      id: row[0],
      question: row[1],
      options,
      answer: row[3],
      created_at: row[4],
      updated_at: row[5],
      is_active: row[6] === 'TRUE',
      difficulty: parseInt(row[7], 10) || 2,
      fun_level: parseInt(row[8], 10) || 2,
    };
  } catch (e) {
    console.error("Failed to parse row:", row, e);
    return null;
  }
};

// --- DB Logic ---
const handleDbFetch = async (event: HandlerEvent) => {
  const pool = getDbPool(event);
  const { rows } = await pool.query('SELECT * FROM quizzes ORDER BY created_at DESC');
  return {
    statusCode: 200,
    body: JSON.stringify(rows),
  };
};

// --- Sheets Logic ---
const handleSheetsFetch = async (event: HandlerEvent) => {
  const auth = getSheetsAuth(event);
  const rows = await getSheetData(auth);
  const quizzes = rows.slice(1).map(rowToQuiz).filter(q => q !== null && q.id);
  quizzes.sort((a, b) => new Date(b!.created_at!).getTime() - new Date(a!.created_at!).getTime());
  return {
    statusCode: 200,
    body: JSON.stringify(quizzes),
  };
};

// --- Netlify Blobs Logic ---
const handleBlobsFetch = async () => {
  const store = getStore({ name: 'quizzes' }); // ✅ 修正ポイント
  const { blobs } = await store.list();
  const quizzes = await Promise.all(
    blobs.map(async (blob) => {
      return await store.get(blob.key, { type: 'json' });
    })
  );
  quizzes.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return {
    statusCode: 200,
    body: JSON.stringify(quizzes),
  };
};

// --- Entry Point ---
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const storageMode = event.headers['x-storage-mode'];

  try {
    let result;
    if (storageMode === 'netlify-blobs') {
      result = await handleBlobsFetch();
    } else if (storageMode === 'google-sheets') {
      result = await handleSheetsFetch(event);
    } else {
      result = await handleDbFetch(event);
    }
    return {
      ...result,
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error: any) {
    console.error("Error fetching quizzes:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch quizzes.', error: error.message }),
    };
  }
};
