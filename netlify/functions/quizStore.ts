// quizStore.ts
// 環境に応じて Netlify Blobs (本番) かローカル簡易ラッパを返すファクトリ
// 本番: BLOBS_SITE_ID / BLOBS_TOKEN が存在し、@netlify/blobs が利用可能
// ローカル(dev) or 無効: 既存の netlify-blobs-wrapper を使用

let realGetStore: any | null = null;
let triedImport = false;

async function loadRealGetStore() {
  if (realGetStore || triedImport) return realGetStore;
  triedImport = true;
  try {
    const mod: any = await import('@netlify/blobs');
    const candidate = mod.getStore || mod.default?.getStore || mod.default;
    if (typeof candidate === 'function') {
      realGetStore = candidate;
    } else {
      console.warn('[quizStore] @netlify/blobs loaded but getStore function not found.');
    }
  } catch (e) {
    // 本番で失敗した場合はログのみ。ローカルでは想定どおり fallback
    console.warn('[quizStore] Falling back to local wrapper getStore:', (e as Error).message);
  }
  return realGetStore;
}

export async function getQuizStore() {
  if (process.env.FORCE_LOCAL_BLOBS === '1') {
    const { getStore } = await import('./netlify-blobs-wrapper.js');
    return normalizeStore(getStore({ name: 'quizzes' }), 'local');
  }
  const g = await loadRealGetStore();
  if (g) {
    try {
      // 自動認証（Netlify Functions 実行時）を優先。未構成ならここで例外→ローカルへフォールバック。
      return normalizeStore(g({ name: 'quizzes' }), 'real');
    } catch (e: any) {
      console.warn('[quizStore] Real getStore not available, falling back:', e?.message || e);
    }
  }
  const { getStore } = await import('./netlify-blobs-wrapper.js');
  return normalizeStore(getStore({ name: 'quizzes' }), 'local');
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
  if (process.env.FORCE_LOCAL_BLOBS === '1') {
    const { getStore } = await import('./netlify-blobs-wrapper.js');
    return normalizeStore(getStore({ name }), 'local');
  }
  const g = await loadRealGetStore();
  if (g) {
    try {
      return normalizeStore(g({ name }), 'real');
    } catch (e: any) {
      console.warn('[quizStore] Real getStore not available, falling back:', e?.message || e);
    }
  }
  const { getStore } = await import('./netlify-blobs-wrapper.js');
  return normalizeStore(getStore({ name }), 'local');
}
