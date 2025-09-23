import type { HandlerEvent } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
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

// --- Sheets Logic ---
const handleSheetsDelete = async (event: HandlerEvent) => {
  const auth = getSheetsAuth(event);
  const { id } = JSON.parse(event.body || '{}');
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ message: 'ID is required' }) };
  }

  const rows = await getSheetData(auth);
  const rowIndex = rows.findIndex(row => row[0] === id.toString());

  if (rowIndex === -1) {
    return { statusCode: 404, body: JSON.stringify({ message: 'Quiz not found' }) };
  }
  
  const sheetRowNumber = rowIndex + 1;
  const range = `Sheet1!A${sheetRowNumber}:I${sheetRowNumber}`;

  const clearUrl = `${SHEETS_API_URL}/${auth.sheetId}/values/${range}:clear?key=${auth.apiKey}`;

  const response = await fetch(clearUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Google Sheets API Error: ${await response.text()}`);
  }
  return { statusCode: 200, body: JSON.stringify({ message: 'Quiz deleted successfully' }) };
};

// --- Netlify Blobs Logic ---
const handleBlobsDelete = async (event: HandlerEvent) => {
  const { id } = JSON.parse(event.body || '{}');
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ message: 'ID is required' }) };
  }
  const store = getStore('quizzes');
  await store.delete(id.toString());
  return { statusCode: 200, body: JSON.stringify({ message: 'Quiz deleted successfully' }) };
};

// --- Entry Point ---
export default async (event: HandlerEvent) => {
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  const storageMode = event.headers['x-storage-mode'];

  try {
    let result;
    if (storageMode === 'netlify-blobs') {
      result = await handleBlobsDelete(event);
    } else if (storageMode === 'google-sheets') {
      result = await handleSheetsDelete(event);
    } else {
      result = await handleDbDelete(event);
    }
    return {
      ...result,
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error: any) {
    console.error("Error deleting quiz:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Failed to delete quiz.', error: error.message }) 
    };
  }
};
