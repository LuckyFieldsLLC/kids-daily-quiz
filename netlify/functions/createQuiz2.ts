import { getQuizStore, connectBlobsFromEvent } from './quizStore.js';
import type { HandlerEvent } from '@netlify/functions';

export default async function handler(event: any): Promise<Response> {
  connectBlobsFromEvent(event as any);
  const isRequest = typeof event?.method === 'string' && typeof event?.headers?.get === 'function';
  const method = isRequest ? String(event.method).toUpperCase() : String(event?.httpMethod || '').toUpperCase();
  if (method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed', got: method }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }
  let normalized: HandlerEvent = event as any;
  if (isRequest) {
    const text = await event.text();
    normalized = { httpMethod: 'POST', headers: Object.fromEntries((event.headers as Headers).entries()), body: text } as unknown as HandlerEvent;
  }
  try {
    const store = await getQuizStore();
    const data = JSON.parse(normalized.body || '{}');
    const id = String(Date.now());
    const quiz = {
      id,
      question: data.question || 'Q?',
      options: (data.options || ['A','B']).map((t: any)=> typeof t==='object'?t:{text:String(t)}),
      answer: data.answer || 'A',
      is_active: true,
      difficulty: 1,
      fun_level: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await store.set(id, JSON.stringify(quiz));
    return new Response(JSON.stringify(quiz), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ message: 'error', error: e?.message || String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
