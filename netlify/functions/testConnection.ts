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
        console.error("Failed to fetch from Google Sheets:", errorText);
        try {
            const errorJson = JSON.parse(errorText);
            const googleMessage = errorJson?.error?.message || 'Unknown Google API error.';
             if (googleMessage.includes('API key not valid')) throw new Error('Google APIキーが無効です。キーが正しいか確認してください。');
            if (googleMessage.includes('caller does not have permission')) throw new Error('スプレッドシートへのアクセス権限がありません。「リンクを知っている全員」の共有設定が「閲覧者」になっているか確認してください。');
            if (googleMessage.includes('Unable to parse range')) throw new Error('スプレッドシートのシート名または範囲指定が無効です。シート名が「Sheet1」であることを確認してください。');
            if (googleMessage.includes('Requested entity was not found')) throw new Error('スプレッドシートIDが見つかりません。IDが正しいか確認してください。');
            throw new Error(`Google APIエラー: ${googleMessage}`);
        } catch(e: any) {
            if (e.message.startsWith('Google') || e.message.startsWith('スプレッドシート')) throw e;
            throw new Error('Googleスプレッドシートからのデータ取得に失敗しました。設定内容を確認してください。');
        }
    }
    const data = await response.json();
    return (data.values || []) as string[][];
};

// --- Original Function Logic ---

// DB Logic
const handleDbTest = async (event: HandlerEvent) => {
    const pool = getDbPool(event);
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Database connection successful!' })
    };
};

// Sheets Logic
const handleSheetsTest = async (event: HandlerEvent) => {
    const auth = getSheetsAuth(event);
    await getSheetData(auth);
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Google Sheets connection successful!' })
    };
};

// Netlify Blobs Logic
const handleBlobsTest = async (event: HandlerEvent) => {
  const store = getStore({ name: 'connection-test' });
  await store.list();
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Netlify Blobs connection successful!' })
    };
};

export default async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const storageMode = event.headers['x-storage-mode'];

  try {
    let result;
    if (storageMode === 'netlify-blobs') {
        result = await handleBlobsTest(event);
    } else if (storageMode === 'google-sheets') {
        result = await handleSheetsTest(event);
    } else {
        result = await handleDbTest(event);
    }
    return {
        ...result,
        headers: { 'Content-Type': 'application/json' }
    };
  } catch (error: any) {
    console.error("Connection test failed:", error);
    let message = 'Connection failed.';
    if (error.message.includes('Netlify Blobs is not available')) {
        message = 'Netlify Blobsを有効にしてください。サイト設定の「Blobs」から有効化できます。';
    }
    return {
      statusCode: 400,
      body: JSON.stringify({ message, error: error.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};