import { describe, it, expect, beforeEach } from 'vitest';
import { loadSettings, DEFAULT_SETTINGS } from '../utils/settingsManager';

// 異常系: localStorage に壊れた JSON / 想定外構造
const STORAGE_KEY = 'app_settings_config';

describe('settingsManager error handling', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns DEFAULT_SETTINGS on invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{ invalid-json');
    const loaded = loadSettings();
    expect(loaded).toEqual(DEFAULT_SETTINGS);
  });

  it('merges partial settings and normalizes unknown storageMode', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ storageMode: '???', apiKeys: { gemini: 'X' } }));
    const loaded = loadSettings();
    expect(loaded.storageMode).toBe('local'); // フォールバック
    expect(loaded.apiKeys.gemini).toBe('X'); // 差分マージ
    // 他はデフォルト引き継ぎ
    expect(loaded.apiKeys.openai).toBe('');
  });
});
