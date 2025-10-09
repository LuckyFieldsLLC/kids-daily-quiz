// utils/settingsManager.ts
import type { AppSettings, StorageMode } from '../types';

// localStorageで使うキー名
const SETTINGS_KEY = 'app_settings_config';

// デフォルト設定
export const DEFAULT_SETTINGS: AppSettings = {
  storageMode: 'local',
  dbConfig: {
    dbUrl: '',
    googleApiKey: '',
    googleSheetId: '',
  },
  apiProvider: 'openai', // ← 追加：デフォルトAIプロバイダ
  apiKeys: {
    gemini: '',
    openai: '',
  },
  display: {
    fontSize: '標準',
  },
  appearance: {
    appName: '親子で学ぶ！日替わり教養クイズ',
    appIcon: '⚛️',
    appTheme: 'blue',
  },
};

// 設定保存
export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
};

// 設定読み込み
export const loadSettings = (): AppSettings => {
  try {
    const settingsString = localStorage.getItem(SETTINGS_KEY);
    if (!settingsString) return DEFAULT_SETTINGS;
    const parsed: any = JSON.parse(settingsString);

    // --- StorageMode 正規化 ---
    const legacyMode = parsed.storageMode;
    let normalized: StorageMode;
    switch (legacyMode) {
      case 'netlify-blobs':
        normalized = 'blobs';
        break;
      case 'production':
      case 'trial':
      case 'custom':
        normalized = 'db';
        break;
      case 'google-sheets':
        console.warn('[settings] google-sheets mode deprecated → local にフォールバック');
        normalized = 'local';
        break;
      case 'blobs':
      case 'db':
      case 'local':
        normalized = legacyMode;
        break;
      default:
        normalized = 'local';
    }

    const merged: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      storageMode: normalized,
      dbConfig: { ...DEFAULT_SETTINGS.dbConfig, ...(parsed.dbConfig || {}) },
      apiKeys: { ...DEFAULT_SETTINGS.apiKeys, ...(parsed.apiKeys || {}) },
      display: { ...DEFAULT_SETTINGS.display, ...(parsed.display || {}) },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...(parsed.appearance || {}) },
    };
    return merged;
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
    return DEFAULT_SETTINGS;
  }
};

// ✅ AIプロバイダとキーを個別に管理する便利関数群

// AIプロバイダの更新
export const setAIProvider = (provider: 'openai' | 'gemini'): void => {
  const settings = loadSettings();
  settings.apiProvider = provider;
  saveSettings(settings);
};

// 現在のAIプロバイダを取得
export const getAIProvider = (): 'openai' | 'gemini' => {
  const settings = loadSettings();
  return settings.apiProvider || 'openai';
};

// 指定プロバイダのAPIキーを保存
export const setAPIKey = (provider: 'openai' | 'gemini', key: string): void => {
  const settings = loadSettings();
  settings.apiKeys[provider] = key;
  saveSettings(settings);
};

// 現在選択中のAPIキーを取得
export const getActiveAPIKey = (): string => {
  const settings = loadSettings();
  const provider = settings.apiProvider || 'openai';
  return settings.apiKeys[provider] || '';
};
