import type { HandlerEvent } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { randomUUID } from 'crypto';
import { Pool } from '@neondatabase/serverless';
import type { NewQuiz, Quiz } from '../../types';

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

// --- Inlined from _sheets-client.ts ---
const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const SHEETS_DEFAULT_RANGE = 'Sheet1';

interface SheetsAuth {
  apiKey: string;
  sheetId: string;
}

const getSheetsAuth = (event: HandlerEvent): SheetsAuth => {
  const apiKey = event.headers['x-google-api-key'];
  const sheetId = event.headers['x-google-sheet-id'];
  if (!apiKey || !sheetId) throw new Error('Google Sheets API Key and Sheet ID are required.');
  return { apiKey, sheetId };
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
const handleDbCreate = async (event: HandlerEvent) => {
  const { question, options, answer, is_active, difficulty, fun_level } = JSON.parse(
    event.body || '{}'
  );

  if (!question || !Array.isArray(options) || options.length === 0 || !answer) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid quiz data provided.' }) };
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
  return { statusCode: 201, body: JSON.stringify(rows[0]) };
};

// --- Sheets Logic ---
const handleSheetsCreate = async (event: HandlerEvent) => {
  const auth = getSheetsAuth(event);
  const quizData = JSON.parse(event.body || '{}') as NewQuiz;

  const newQuiz: Partial<Quiz> = {
    ...quizData,
    id: new Date().getTime().toString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const newRow = quizToRow(newQuiz);
  const appendUrl = `${SHEETS_API_URL}/${auth.sheetId}/values/${SHEETS_DEFAULT_RANGE}:append?valueInputOption=USER_ENTERED&key=${auth.apiKey}`;

  const response = await fetch(appendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [newRow] }),
  });

  if (!response.ok) {
    throw new Error(`Google Sheets API Error: ${await response.text()}`);
  }

  return { statusCode: 201, body: JSON.stringify(newQuiz) };
};

// --- Netlify Blobs Logic ---
const handleBlobsCreate = async (event: HandlerEvent) => {
  const quizData = JSON.parse(event.body || '{}') as NewQuiz;
  const store = getStore({
    name: 'quizzes',
    siteID: process.env.BLOBS_SITE_ID, // ✅ 環境変数で指定
    token: process.env.BLOBS_TOKEN,   // ✅ 環境変数で指定
  });

  const newQuiz: Quiz = {
    ...quizData,
    id: randomUUID(),
    is_active: quizData.is_active ?? true,
    difficulty: quizData.difficulty ?? 2,
    fun_level: quizData.fun_level ?? 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await store.setJSON(newQuiz.id.toString(), newQuiz);
  return { statusCode: 201, body: JSON.stringify(newQuiz) };
};

// --- Entry Point ---
export default async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const storageMode = event.headers['x-storage-mode'];

  try {
    let result;
    if (storageMode === 'netlify-blobs') {
      result = await handleBlobsCreate(event);
    } else if (storageMode === 'google-sheets') {
      result = await handleSheetsCreate(event);
    } else {
      result = await handleDbCreate(event);
    }
    return {
      ...result,
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error: any) {
    console.error('Error creating quiz:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create quiz.', error: error.message }),
    };
  }
};
