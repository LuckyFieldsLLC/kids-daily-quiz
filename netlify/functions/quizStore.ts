// quizStore.ts
// 環境に応じて Netlify Blobs (本番) かローカル簡易ラッパを返すファクトリ
// 本番: 自動認証で @netlify/blobs を利用
// ローカル(dev) or テスト: 既存の netlify-blobs-wrapper を使用

import * as netlifyBlobs from '@netlify/blobs';

function resolveNetlifyGetStore(): ((opts: { name: string }) => any) {
  const candidate: any = (netlifyBlobs as any).getStore
    || (netlifyBlobs as any).default?.getStore
    || (netlifyBlobs as any).default;
  if (typeof candidate !== 'function') {
    throw new Error('@netlify/blobs does not export getStore');
  }
  return candidate as (opts: { name: string }) => any;
}

function isNetlifyProdLike() {
  // Netlify ビルド/関数実行でセットされうる環境指標を広く考慮
  const isNetlifyFlag = process.env.NETLIFY === 'true';
  const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.LAMBDA_TASK_ROOT;
  const hasDeployUrl = !!process.env.DEPLOY_URL || !!process.env.URL;
  const isDev = process.env.NETLIFY_DEV === 'true';
  return !isDev && (isNetlifyFlag || isLambda || hasDeployUrl);
}

export async function getQuizStore() {
  if (process.env.FORCE_LOCAL_BLOBS === '1' && !isNetlifyProdLike()) {
    const { getStore } = await import('./netlify-blobs-wrapper.js');
    return normalizeStore(getStore({ name: 'quizzes' }), 'local');
  }
  try {
    // 自動認証（Netlify Functions 実行時）を優先。未構成なら例外
    const g = resolveNetlifyGetStore();
    return normalizeStore(g({ name: 'quizzes' }), 'real');
  } catch (e: any) {
    if (isNetlifyProdLike()) {
      // 本番系ではローカルフォールバックを禁止
      throw new Error(`[quizStore] Netlify Blobs is unavailable in this environment: ${e?.message || e}`);
    }
    console.warn('[quizStore] Using local wrapper (dev/test fallback):', e?.message || e);
    const { getStore } = await import('./netlify-blobs-wrapper.js');
    return normalizeStore(getStore({ name: 'quizzes' }), 'local');
  }
}

// list() 返却 shape の差異を吸収するラッパ
function normalizeStore(store: any, kind?: 'real' | 'local') {
  if (!store) return store;
  if (store.__normalized) return store;
  const wrapped = {
    __normalized: true,
    kind,
    async get(key: string) { return store.get(key); },
    async set(key: string, val: any) { return store.set(key, val); },
    async delete(key: string) { return store.delete(key); },
    async list() {
      const res = await store.list();
      if (!res) return { keys: [] };
      if (Array.isArray((res as any).keys)) return { keys: (res as any).keys };
      if (Array.isArray((res as any).blobs)) return { keys: (res as any).blobs.map((b: any) => b.key) };
      // 予期しない形: 最も無難に空
      console.warn('[quizStore] Unknown list() shape, returning empty keys');
      return { keys: [] };
    }
  };
  return wrapped;
}

export async function getGenericStore(name: string) {
  if (process.env.FORCE_LOCAL_BLOBS === '1' && !isNetlifyProdLike()) {
    const { getStore } = await import('./netlify-blobs-wrapper.js');
    return normalizeStore(getStore({ name }), 'local');
  }
  try {
    const g = resolveNetlifyGetStore();
    return normalizeStore(g({ name }), 'real');
  } catch (e: any) {
    if (isNetlifyProdLike()) {
      throw new Error(`[quizStore] Netlify Blobs is unavailable in this environment: ${e?.message || e}`);
    }
    console.warn('[quizStore] Using local wrapper (dev/test fallback):', e?.message || e);
    const { getStore } = await import('./netlify-blobs-wrapper.js');
    return normalizeStore(getStore({ name }), 'local');
  }
}
