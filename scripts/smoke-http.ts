import http from 'node:http';
import https from 'node:https';

function request(method: string, url: string, body?: any, headers: Record<string,string> = {}): Promise<{status: number, text: string}> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined;
    const opts: http.RequestOptions = {
      method,
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + (u.search || ''),
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(data ? { 'Content-Length': Buffer.byteLength(data).toString() } : {}),
      },
    };
    const client = u.protocol === 'https:' ? https : http;
    const req = client.request(opts, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => resolve({ status: res.statusCode || 0, text: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function pickBase(): string {
  return process.env.SMOKE_BASE || 'http://localhost:8888'; // Netlify Dev 既定
}

async function main() {
  const base = pickBase();
  const log = (...a: any[]) => console.log('[smoke]', ...a);
  const asJson = (t: string) => { try { return JSON.parse(t); } catch { return t; } };

  // 1) diagnose
  log('diagnose...');
  const d = await request('GET', `${base}/.netlify/functions/diagnoseBlobs`);
  log('diagnose status', d.status, 'body', d.text);
  if (d.status !== 200) throw new Error('diagnose failed');

  // 2) create
  log('create...');
  const c = await request('POST', `${base}/.netlify/functions/createQuiz`, {
    question: '1+4=?',
    options: [{ text: '5' }, { text: '4' }],
    answer: '5',
    is_active: true,
    difficulty: 1,
    fun_level: 2,
  }, { 'x-storage-mode': 'blobs' });
  log('create status', c.status, 'body', c.text);
  if (c.status !== 201 && c.status !== 200) throw new Error('create failed');
  const created = asJson(c.text);
  const id = String(created?.id);
  if (!id) throw new Error('create returned no id');

  // 3) get
  log('get...');
  const g = await request('GET', `${base}/.netlify/functions/getQuizzes`, undefined, { 'x-storage-mode': 'blobs' });
  log('get status', g.status, 'body', g.text.slice(0, 200) + (g.text.length > 200 ? '…' : ''));
  if (g.status !== 200) throw new Error('get failed');
  const arr = asJson(g.text) as any[];
  if (!Array.isArray(arr) || !arr.some(q => String(q.id || q.key) === id)) throw new Error('created id not found in list');

  // 4) delete
  log('delete...');
  const del = await request('DELETE', `${base}/.netlify/functions/deleteQuiz`, { id }, { 'x-storage-mode': 'blobs' });
  log('delete status', del.status, 'body', del.text);
  if (del.status !== 200) throw new Error('delete failed');

  log('OK: diagnose/create/get/delete completed');
}

main().catch((e) => {
  console.error('[smoke] FAILED:', e?.message || e);
  process.exitCode = 1;
});
