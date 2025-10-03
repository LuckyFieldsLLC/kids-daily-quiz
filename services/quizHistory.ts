// services/quizHistory.ts
import { saveAs } from 'file-saver';

const STORAGE_KEY = 'quiz_history';

// 履歴の型
export interface QuizHistory {
  key: string;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  source: 'AI' | 'IMPORT';
  score: { correct: number; total: number };
}

// 履歴を取得
export async function fetchQuizHistory(): Promise<QuizHistory[]> {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

// 履歴に新しいクイズを追加
export async function saveQuiz(quiz: QuizHistory) {
  const history = await fetchQuizHistory();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...history, quiz]));
}

// スコアを保存（正解数・挑戦数を更新）
export async function saveScore(key: string, isCorrect: boolean) {
  const history = await fetchQuizHistory();
  const updated = history.map((q) =>
    q.key === key
      ? {
          ...q,
          score: {
            correct: q.score.correct + (isCorrect ? 1 : 0),
            total: q.score.total + 1,
          },
        }
      : q,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

// CSVエクスポート
export async function exportCSV(filter: string = 'ALL') {
  const history = await fetchQuizHistory();
  const filtered = filter === 'ALL' ? history : history.filter((q) => q.source === filter);

  const csv = [
    ['id', 'question', 'options', 'answer', 'explanation', 'source', 'correct', 'total'].join(','),
    ...filtered.map((q) =>
      [
        q.key,
        `"${q.question}"`,
        `"${q.options.join(';')}"`,
        q.answer,
        q.explanation || '',
        q.source,
        q.score.correct,
        q.score.total,
      ].join(','),
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'quiz-history.csv');
}

// インポート
export async function importQuizzes(quizzes: QuizHistory[]) {
  const history = await fetchQuizHistory();
  const merged = [...history, ...quizzes];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}
