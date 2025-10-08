// --- 共通クイズ管理の型 ---
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

export type ApiProvider = 'gemini' | 'openai';

// プロバイダ別利用可能モデル
export type GeminiModel = 'gemini-1.5-flash' | 'gemini-1.5-pro';
export type OpenAIModel = 'gpt-4o-mini' | 'gpt-4o';
export interface ModelSettings {
  geminiModel: GeminiModel;
  openaiModel: OpenAIModel;
}

// --- ✅ AppSettings：全体設定 ---
export interface AppSettings {
  storageMode: StorageMode;
  dbConfig: DbConfig;
  apiKeys: ApiKeys;
  display: DisplaySettings;
  appearance: AppearanceSettings;
  apiProvider: ApiProvider; // ✅ 新規追加
  models?: ModelSettings; // 任意: 既存ユーザは未設定の場合デフォルト補完
}

// --- AIクイズ生成用の型定義 ---
export interface QuizRequest {
  age: number;
  category: string;
  theme: string;
  difficulty: number;
  interestingness: number;
  discussion_value: number;
  emotional_impact: number;
}

export interface QuizResponse {
  title: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}
