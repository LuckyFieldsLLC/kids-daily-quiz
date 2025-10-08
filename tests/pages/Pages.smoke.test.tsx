import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import HistoryPage from '../../pages/HistoryPage';
import ImportPage from '../../pages/ImportPage';
import QuizPage from '../../pages/QuizPage';

// quizHistory service functions mock
vi.mock('../../services/quizHistory', () => ({
  fetchQuizHistory: () => Promise.resolve([
    {
      key: 'k1',
      question: 'サンプル質問1?',
      options: ['A','B','C','D'],
      answer: 'A',
      explanation: '説明1',
      source: 'AI',
      difficulty: 2,
      fun_level: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      score: { correct: 1, total: 2 }
    },
    {
      key: 'k2',
      question: 'サンプル質問2?',
      options: ['1','2','3','4'],
      answer: '2',
      explanation: '説明2',
      source: 'IMPORT',
      difficulty: 4,
      fun_level: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      score: { correct: 0, total: 0 }
    }
  ]),
  exportCSV: vi.fn(),
  saveScore: vi.fn(),
  importQuizzes: vi.fn(),
}));

// Suppress alert in ImportPage
beforeAll(() => {
  // @ts-ignore
  global.alert = vi.fn();
});

describe('Pages smoke', () => {
  test('HistoryPage lists quizzes and allows re-challenge & answering', async () => {
    render(<HistoryPage />);
    // 並ぶクイズ
    const item = await screen.findByText('サンプル質問1?');
    expect(item).toBeInTheDocument();

  // 再挑戦ボタン → 詳細表示に切替（説明はまだ表示されない）
  fireEvent.click(screen.getAllByRole('button', { name: '再挑戦' })[0]);
  // 選択肢ボタンが表示されていることを確認
  const answerBtn = screen.getByRole('button', { name: 'A' });
  expect(answerBtn).toBeInTheDocument();
  expect(screen.queryByText('説明1')).not.toBeInTheDocument();

  // 回答ボタン押下で結果 + 説明表示
  fireEvent.click(answerBtn);
  expect(await screen.findByText(/正解！/)).toBeInTheDocument();
  expect(screen.getByText(/説明1/)).toBeInTheDocument();
  });

  test('ImportPage imports quizzes (alert mocked)', () => {
    render(<ImportPage />);
    expect(screen.getByRole('heading', { name: 'クイズインポート' })).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText('JSON形式のクイズデータを貼り付けてください');
    fireEvent.change(textarea, { target: { value: JSON.stringify([]) } });
    fireEvent.click(screen.getByRole('button', { name: 'インポート' }));
    expect(global.alert).toHaveBeenCalled();
  });

  test('QuizPage static content renders', () => {
    render(<QuizPage />);
    expect(screen.getByRole('heading', { name: 'AIクイズ' })).toBeInTheDocument();
    expect(screen.getByText(/上部メニュー「AIで作成」/)).toBeInTheDocument();
  });
});
