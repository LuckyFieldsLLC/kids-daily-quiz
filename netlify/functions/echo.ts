export default async function handler(event: any): Promise<Response> {
  const isRequest = typeof event?.method === 'string' && typeof event?.headers?.get === 'function';
  const method = isRequest ? String(event.method).toUpperCase() : String(event?.httpMethod || '').toUpperCase();
  const headersObj = isRequest ? Object.fromEntries((event.headers as Headers).entries()) : (event.headers || {});
  const bodyText = isRequest ? await event.text() : (event.body || '');
  return new Response(
    JSON.stringify({ ok: true, method, headers: headersObj, body: bodyText?.slice(0, 2000) }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
