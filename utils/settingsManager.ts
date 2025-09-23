import type { AppSettings } from '../types';

const SETTINGS_KEY = 'app_settings_config';

export const DEFAULT_SETTINGS: AppSettings = {
    storageMode: 'local',
    dbConfig: {
        dbUrl: '',
        googleApiKey: '',
        googleSheetId: '',
    },
    apiKeys: {
        gemini: '',
        openai: '',
    },
    display: {
        fontSize: '標準'
    },
    appearance: {
        appName: '親子で学ぶ！日替わり教養クイズ',
        appIcon: '⚛️',
        appTheme: 'blue',
    }
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
};

export const loadSettings = (): AppSettings => {
  try {
    const settingsString = localStorage.getItem(SETTINGS_KEY);
    if (!settingsString) return DEFAULT_SETTINGS;
    
    const parsed = JSON.parse(settingsString);
    
    if (parsed && typeof parsed.storageMode === 'string') {
        return {
            ...DEFAULT_SETTINGS,
            ...parsed,
            dbConfig: { ...DEFAULT_SETTINGS.dbConfig, ...(parsed.dbConfig || {}) },
            apiKeys: { ...DEFAULT_SETTINGS.apiKeys, ...(parsed.apiKeys || {}) },
            display: { ...DEFAULT_SETTINGS.display, ...(parsed.display || {}) },
            appearance: { ...DEFAULT_SETTINGS.appearance, ...(parsed.appearance || {}) },
        };
    }
    return DEFAULT_SETTINGS;

  } catch (error) {
    console.error("Failed to load settings from localStorage:", error);
    return DEFAULT_SETTINGS;
  }
};