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

export interface AppSettings {
  storageMode: StorageMode;
  dbConfig: DbConfig;
  apiKeys: ApiKeys;
  display: DisplaySettings;
  appearance: AppearanceSettings;
}

// --- AIクイズ生成用の型定義 ---
// 入力はすべて number に統一（1〜5段階など）
// 文字列で持ちたい場合はフォーム側でラベルを付与
export interface QuizRequest {
  age: number; // 対象年齢
  category: string; // カテゴリ（例：道徳・知識など）
  theme: string; // テーマ（例：感謝・努力など）
  difficulty: number; // 難易度（1〜5）
  interestingness: number; // 面白さ（ひらめき度）
  discussion_value: number; // 対話性（親子の会話を促す度合い）
  emotional_impact: number; // 感情インパクト（感動・気づきの強さ）
}

export interface QuizResponse {
  title: string; // クイズタイトル
  question: string; // 問題文
  options: string[]; // 選択肢
  answer: string; // 正解
  explanation: string; // 解説・親子で話し合うポイント
}
