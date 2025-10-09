// CommonJS 版の HTTP スモーク。PowerShell からの実行を容易にします。
const http = require('node:http');
const https = require('node:https');

function request(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const data = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined;
      const opts = {
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
        const chunks = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end', () => resolve({ status: res.statusCode || 0, text: Buffer.concat(chunks).toString('utf8') }));
      });
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function main() {
  const base = process.env.SMOKE_BASE || 'http://localhost:8888';
  const withBase = (p) => `${base.replace(/\/$/, '')}${p}`;
  const quizPayload = {
    question: '1+1は？',
    options: ['1', '2', '3', '4'],
    answer: '2',
    is_active: true,
    difficulty: 1,
    fun_level: 2,
  };

  const log = (...args) => console.log('[smoke]', ...args);

  // 1) diagnose
  log('diagnose start');
  const d = await request('GET', withBase('/.netlify/functions/diagnoseBlobs'));
  log('diagnose status', d.status, d.text);
  if (d.status !== 200) throw new Error(`diagnose failed: ${d.text}`);

  // 2) create
  log('create start');
  const c = await request('POST', withBase('/.netlify/functions/createQuiz'), quizPayload, { 'x-storage-mode': 'netlify-blobs' });
  log('create status', c.status, c.text);
  if (c.status !== 200 && c.status !== 201) throw new Error(`create failed: ${c.text}`);
  let createdId = undefined;
  try { createdId = JSON.parse(c.text).id; } catch {}
  if (!createdId) throw new Error('create failed: missing id in response');

  // 3) get
  log('get start');
  const g = await request('GET', withBase(`/.netlify/functions/getQuizzes`), undefined, { 'x-storage-mode': 'netlify-blobs' });
  log('get status', g.status, g.text);
  if (g.status !== 200) throw new Error(`get failed: ${g.text}`);
  try {
    const arr = JSON.parse(g.text);
    const exists = Array.isArray(arr) && arr.some(x => x.id === createdId);
    if (!exists) throw new Error('created id not found in list');
  } catch (e) {
    throw new Error(`get verification failed: ${e?.message || e}`);
  }

  // 4) delete
  log('delete start');
  const del = await request('POST', withBase('/.netlify/functions/deleteQuiz'), { id: createdId }, { 'x-storage-mode': 'netlify-blobs' });
  log('delete status', del.status, del.text);
  if (del.status !== 200) throw new Error(`delete failed: ${del.text}`);

  log('ALL GREEN');
}

main().catch((e) => {
  console.error('[smoke] ERROR', e?.stack || e?.message || e);
  process.exit(1);
});
