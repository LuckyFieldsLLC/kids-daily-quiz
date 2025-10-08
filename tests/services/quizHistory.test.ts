import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fetchQuizHistory, saveQuiz, saveScore, exportCSV, importQuizzes, type QuizHistory } from '../../services/quizHistory';

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
import { saveAs } from 'file-saver';

describe('quizHistory service', () => {
  const baseQuiz: QuizHistory = {
    key: 'q1',
    question: 'Question 1',
    options: ['A','B','C','D'],
    answer: 'A',
    explanation: 'Because A',
    source: 'AI',
    score: { correct: 0, total: 0 }
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('fetchQuizHistory returns empty array when none', async () => {
    expect(await fetchQuizHistory()).toEqual([]);
  });

  it('saveQuiz appends quizzes', async () => {
    await saveQuiz(baseQuiz);
    await saveQuiz({ ...baseQuiz, key: 'q2', question: 'Question 2' });
    const history = await fetchQuizHistory();
    expect(history).toHaveLength(2);
    expect(history[1].key).toBe('q2');
  });

  it('saveScore updates correct/total counts', async () => {
    await saveQuiz(baseQuiz);
    await saveScore('q1', true);
    await saveScore('q1', false);
    const history = await fetchQuizHistory();
    expect(history[0].score).toEqual({ correct: 1, total: 2 });
  });

  it('exportCSV creates blob with all records by default', async () => {
    await saveQuiz(baseQuiz);
    await saveQuiz({ ...baseQuiz, key: 'q2', source: 'IMPORT', question: 'Imported Q' });
    await exportCSV();
    expect(saveAs).toHaveBeenCalledTimes(1);
    const blob: Blob = (saveAs as any).mock.calls[0][0];
    const text = await new Promise<string>((resolve, reject) => {
      if ((blob as any).text) {
        (blob as any).text().then(resolve, reject);
      } else {
        const fr = new FileReader();
        fr.onerror = () => reject(fr.error);
        fr.onload = () => resolve(fr.result as string);
        fr.readAsText(blob);
      }
    });
    const rows = text.split(/\n/);
    // 先頭ヘッダ + 2レコード
    expect(rows).toHaveLength(1 + 2);
  });

  it('exportCSV respects source filter', async () => {
    await saveQuiz(baseQuiz);
    await saveQuiz({ ...baseQuiz, key: 'q2', source: 'IMPORT', question: 'Imported Q' });
    await exportCSV('AI');
    const blob: Blob = (saveAs as any).mock.calls[0][0];
    const text = await new Promise<string>((resolve, reject) => {
      if ((blob as any).text) {
        (blob as any).text().then(resolve, reject);
      } else {
        const fr = new FileReader();
        fr.onerror = () => reject(fr.error);
        fr.onload = () => resolve(fr.result as string);
        fr.readAsText(blob);
      }
    });
    const rows = text.split(/\n/);
    expect(rows).toHaveLength(1 + 1);
    expect(rows[1]).toContain('Question 1');
  });

  it('importQuizzes merges with existing history', async () => {
    await saveQuiz(baseQuiz);
    await importQuizzes([
      { ...baseQuiz, key: 'q2', question: 'Q2' },
      { ...baseQuiz, key: 'q3', question: 'Q3' }
    ]);
    const history = await fetchQuizHistory();
    expect(history.map(q => q.key)).toEqual(['q1','q2','q3']);
  });
});
