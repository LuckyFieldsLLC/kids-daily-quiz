// LuckyFields Platform - blobs-utils (skeleton)
// Public API: setJson, getJson, listKeys, deleteSafe and helpers

export type JsonValue = any; // TODO: tighten later

export interface NormalizedStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string | Uint8Array): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<{ keys: string[] }>;
}

export function isUUIDv4(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function parseJSONSafe<T = unknown>(text: string | null): T | null {
  if (!text) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}

export function normalizeListShape(listResult: any): { keys: string[] } {
  if (Array.isArray(listResult)) {
    // Older shape like: ["a","b"]
    return { keys: listResult as string[] };
  }
  if (listResult && Array.isArray(listResult.keys)) {
    return { keys: listResult.keys as string[] };
  }
  if (listResult && Array.isArray(listResult.blobs)) {
    return { keys: (listResult.blobs as any[]).map(b => b?.key).filter(Boolean) };
  }
  return { keys: [] };
}

export async function setJson(store: NormalizedStore, key: string, data: JsonValue): Promise<void> {
  await store.set(key, JSON.stringify(data));
}

export async function getJson<T = unknown>(store: NormalizedStore, key: string): Promise<T | null> {
  const txt = await store.get(key);
  return parseJSONSafe<T>(txt);
}

export async function listKeys(store: NormalizedStore): Promise<string[]> {
  const { keys } = await store.list();
  return keys ?? [];
}

export async function deleteSafe(store: NormalizedStore, key: string): Promise<boolean> {
  try {
    await store.delete(key);
    return true;
  } catch {
    return false;
  }
}
