import type { Quiz, AppSettings, NewQuiz } from '../types';

// Export keys so other modules can reference consistently
export const QUIZZES_KEY = 'local_quizzes';
export const SETTINGS_KEY = 'app_settings';

// --- App Settings Management ---
export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
};

export const getSettings = (): AppSettings | null => {
  try {
    const settingsString = localStorage.getItem(SETTINGS_KEY);
    return settingsString ? JSON.parse(settingsString) : null;
  } catch (error) {
    console.error("Failed to get settings from localStorage:", error);
    return null;
  }
};


// --- Local Quiz CRUD ---

export const getQuizzes = async (): Promise<Quiz[]> => {
  const quizzesJSON = localStorage.getItem(QUIZZES_KEY);
  if (!quizzesJSON) return [];
  try {
    const parsed = JSON.parse(quizzesJSON);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a: Quiz, b: Quiz) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
  } catch (e) {
    console.warn('Failed to parse quizzes JSON. Resetting storage.', e);
    localStorage.removeItem(QUIZZES_KEY);
    return [];
  }
};

const saveAllQuizzes = (quizzes: Quiz[]): void => {
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
}

export const createQuiz = async (quizData: NewQuiz): Promise<Quiz> => {
    const quizzes = await getQuizzes();
  const generateId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      try { return crypto.randomUUID(); } catch { /* fallback below */ }
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };
  const newQuiz: Quiz = {
    ...quizData,
    id: generateId(),
        is_active: quizData.is_active ?? true,
        difficulty: quizData.difficulty ?? 2,
        fun_level: quizData.fun_level ?? 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    quizzes.unshift(newQuiz);
    saveAllQuizzes(quizzes);
    return newQuiz;
};

export const updateQuiz = async (updatedQuiz: Quiz): Promise<Quiz> => {
    let quizzes = await getQuizzes();
    const quizIndex = quizzes.findIndex(q => q.id === updatedQuiz.id);
    if (quizIndex === -1) {
        throw new Error("Quiz not found");
    }
    const finalQuiz = {
        ...updatedQuiz,
        difficulty: updatedQuiz.difficulty ?? 2,
        fun_level: updatedQuiz.fun_level ?? 2,
        updated_at: new Date().toISOString(),
    };
    quizzes[quizIndex] = finalQuiz;
    saveAllQuizzes(quizzes);
    return finalQuiz;
};

export const deleteQuiz = async (id: number | string): Promise<{}> => {
    let quizzes = await getQuizzes();
    const updatedQuizzes = quizzes.filter(q => q.id !== id);
    if (quizzes.length === updatedQuizzes.length) {
        throw new Error("Quiz not found for deletion");
    }
    saveAllQuizzes(updatedQuizzes);
    return {};
};