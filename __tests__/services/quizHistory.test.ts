import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fetchQuizHistory, saveQuiz, saveScore, exportCSV, importQuizzes, type QuizHistory } from '../../services/quizHistory';

// file-saver をモック
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
    await saveScore('q1', true); // correct
    await saveScore('q1', false); // incorrect
    const history = await fetchQuizHistory();
    expect(history[0].score).toEqual({ correct: 1, total: 2 });
  });

  it('exportCSV creates blob with all records by default', async () => {
    await saveQuiz(baseQuiz);
    await saveQuiz({ ...baseQuiz, key: 'q2', source: 'IMPORT', question: 'Imported Q' });
    await exportCSV();
    expect(saveAs).toHaveBeenCalledTimes(1);
    const callArg = (saveAs as any).mock.calls[0][0];
    expect(callArg).toBeInstanceOf(Blob);
    const text = await callArg.text();
    expect(text.split('\n')).toHaveLength(1 + 2); // header + 2 rows
  });

  it('exportCSV respects source filter', async () => {
    await saveQuiz(baseQuiz); // AI
    await saveQuiz({ ...baseQuiz, key: 'q2', source: 'IMPORT', question: 'Imported Q' });
    await exportCSV('AI');
    const callArg = (saveAs as any).mock.calls[0][0];
    const text = await callArg.text();
    const rows = text.split('\n');
    expect(rows).toHaveLength(1 + 1); // header + 1 filtered row
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
