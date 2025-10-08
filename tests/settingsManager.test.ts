import { describe, it, expect, beforeEach } from 'vitest';
import { loadSettings, DEFAULT_SETTINGS } from '../utils/settingsManager';

// Helper to seed legacy settings under the old key used by the current loader
const STORAGE_KEY = 'app_settings_config';

describe('settingsManager storageMode migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const cases: Array<{ legacy: string; expected: string }> = [
    { legacy: 'netlify-blobs', expected: 'blobs' },
    { legacy: 'production', expected: 'db' },
    { legacy: 'trial', expected: 'db' },
    { legacy: 'custom', expected: 'db' },
    { legacy: 'google-sheets', expected: 'local' },
    { legacy: 'blobs', expected: 'blobs' },
    { legacy: 'db', expected: 'db' },
    { legacy: 'local', expected: 'local' },
    { legacy: 'unknown', expected: 'local' },
  ];

  for (const c of cases) {
    it(`migrates "${c.legacy}" -> "${c.expected}"`, () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...DEFAULT_SETTINGS,
        storageMode: c.legacy,
      }));
      const result = loadSettings();
      expect(result.storageMode).toBe(c.expected);
    });
  }
});
