import type { Handler } from '@netlify/functions';
import { getGenericStore } from './quizStore.js';

interface StepResult {
  step: string;
  ok: boolean;
  detail?: any;
  error?: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }


  const steps: StepResult[] = [];
  const testKey = `diagnostic-${Date.now()}`;

  try {
    // 1. ストア取得
    let store;
    try {
      // 設定済みのストア名を優先（connection-test は netlify.toml でも宣言済み）
      store = await getGenericStore('connection-test');
      steps.push({ step: 'getStore', ok: true, detail: { kind: (store as any)?.kind } });
    } catch (e: any) {
      steps.push({ step: 'getStore', ok: false, error: e.message });
      throw e;
    }

    // 2. Write
    try {
      await store.set(testKey, JSON.stringify({ test: true, ts: Date.now() }));
      steps.push({ step: 'write', ok: true });
    } catch (e: any) {
      steps.push({ step: 'write', ok: false, error: e.message });
      throw e;
    }

    // 3. Read
    try {
      const raw = await store.get(testKey);
      steps.push({ step: 'read', ok: !!raw, detail: raw });
    } catch (e: any) {
      steps.push({ step: 'read', ok: false, error: e.message });
      throw e;
    }

    // 4. List
    try {
      const list = await store.list();
      steps.push({ step: 'list', ok: true, detail: Array.isArray(list.keys) ? list.keys.length : list });
    } catch (e: any) {
      steps.push({ step: 'list', ok: false, error: e.message });
      // 続行可能
    }

    // 5. Delete
    try {
      await store.delete(testKey);
      steps.push({ step: 'delete', ok: true });
    } catch (e: any) {
      steps.push({ step: 'delete', ok: false, error: e.message });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: steps.every(s => s.ok || s.step === 'list' || s.step === 'delete'),
        storeKind: (store as any)?.kind,
        steps,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        steps,
        error: error.message,
      }),
    };
  }
};
