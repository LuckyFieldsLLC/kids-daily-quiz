// Fix: Define and export all necessary types for the application.

export interface QuizOption {
  text: string;
}

export interface Quiz {
  id: string | number;
  question: string;
  options: QuizOption[];
  answer: string;
  is_active: boolean;
  difficulty: number;
  fun_level: number;
  created_at?: string;
  updated_at?: string;
}

export type NewQuiz = Omit<Quiz, 'id' | 'created_at' | 'updated_at'> & {
  is_active?: boolean;
  difficulty?: number;
  fun_level?: number;
};

export type StorageMode =
  | 'local'
  | 'netlify-blobs'
  | 'production'
  | 'trial'
  | 'custom'
  | 'google-sheets';

export interface DbConfig {
  dbUrl?: string;
  googleApiKey?: string;
  googleSheetId?: string;
}

export interface DisplaySettings {
  fontSize: '小' | '標準' | '大';
}

export interface AppearanceSettings {
  appName: string;
  appIcon: string;
  appTheme: 'blue' | 'sakura' | 'green' | 'dark';
}

export interface ApiKeys {
    gemini: string;
    openai: string;
}

export interface AppSettings {
  storageMode: StorageMode;
  dbConfig: DbConfig;
  apiKeys: ApiKeys;
  display: DisplaySettings;
  appearance: AppearanceSettings;
}
