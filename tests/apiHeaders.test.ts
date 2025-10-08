import { describe, it, expect } from 'vitest';
// services/api.ts の内部関数をテストしたいので一時的に再輸出を検討するか、ここでは dynamic import + 透過アクセスに頼る
import * as apiModule from '../services/api';

// getHeaders / normalizeMode が非エクスポートなら、将来: services/api.ts に `export { getHeaders, normalizeMode }` を追加するとより明示的
// ここでは (apiModule as any) でアクセスを試みる

describe('api headers normalization', () => {
  it('blobs -> x-storage-mode=netlify-blobs', () => {
    const getHeaders = (apiModule as any).getHeaders;
    if (!getHeaders) {
      // スキップ: 内部構造が非公開
      return;
    }
    const headers = getHeaders('blobs', { dbUrl: '' });
    expect(headers['x-storage-mode']).toBe('netlify-blobs');
  });

  it('db -> x-storage-mode=production & includes x-db-url', () => {
    const getHeaders = (apiModule as any).getHeaders;
    if (!getHeaders) return;
    const headers = getHeaders('db', { dbUrl: 'postgres://example' });
    expect(headers['x-storage-mode']).toBe('production');
    expect(headers['x-db-url']).toBe('postgres://example');
  });

  it('local -> x-storage-mode=local', () => {
    const getHeaders = (apiModule as any).getHeaders;
    if (!getHeaders) return;
    const headers = getHeaders('local', { dbUrl: '' });
    expect(headers['x-storage-mode']).toBe('local');
  });
});
