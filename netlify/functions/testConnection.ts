import type { HandlerEvent } from '@netlify/functions';
import { getGenericStore, connectBlobsFromEvent } from './quizStore.js';
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

// Google Sheets legacy connection test removed.

// --- Original Function Logic ---

// DB Logic
const handleDbTest = async (event: HandlerEvent) => {
    const pool = getDbPool(event);
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
  return new Response(JSON.stringify({ message: 'Database connection successful!' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// (Sheets removal) test route no longer supports google-sheets.

// Netlify Blobs Logic
const handleBlobsTest = async (event: HandlerEvent) => {
  const store = await getGenericStore('connection-test');
  await store.list();
  return new Response(
    JSON.stringify({
      message: 'Netlify Blobs connection successful!',
      storeKind: (store as any)?.kind,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

const handler = async (event: any) => {
  const isRequest = typeof event?.method === 'string' && typeof event?.headers?.get === 'function';
  const method = isRequest ? String(event.method).toUpperCase() : String(event?.httpMethod || '').toUpperCase();
  const getHeader = (name: string) => isRequest ? event.headers.get(name) || event.headers.get(name.toLowerCase()) : (event.headers?.[name] || event.headers?.[name?.toLowerCase?.()] || undefined);
  if (method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed', got: method }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const storageMode = getHeader('x-storage-mode');
  const isBlobs = storageMode === 'netlify-blobs' || storageMode === 'blobs';
  const isDb = storageMode === 'production' || storageMode === 'trial' || storageMode === 'db' || storageMode === 'custom';

  try {
    let result: Response;
    connectBlobsFromEvent(event as any);
    let normalizedEvent: HandlerEvent = event;
    if (isRequest) {
      const text = await event.text();
      normalizedEvent = { httpMethod: 'POST', headers: Object.fromEntries((event.headers as Headers).entries()), body: text } as unknown as HandlerEvent;
    }
    if (isBlobs) {
      result = await handleBlobsTest(normalizedEvent);
    } else if (isDb) {
      result = await handleDbTest(normalizedEvent);
    } else {
      result = await handleBlobsTest(normalizedEvent); // fallback
    }
    return result;
  } catch (error: any) {
    console.error("Connection test failed:", error);
    let message = 'Connection failed.';
    if (error.message.includes('Netlify Blobs is not available')) {
        message = 'Netlify Blobsを有効にしてください。サイト設定の「Blobs」から有効化できます。';
    }
    return new Response(JSON.stringify({ message, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export default handler;