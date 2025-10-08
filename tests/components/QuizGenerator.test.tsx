import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizGenerator from '../../components/QuizGenerator';
import type { Quiz } from '../../types';

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAdmin: mockIsAdmin })
}));

// Mock Tooltip to simplify DOM
vi.mock('../../components/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: any) => children
}));

let mockIsAdmin = true;

const baseQuiz = (overrides: Partial<Quiz> = {}): Quiz => ({
  id: overrides.id || '1',
  question: overrides.question || 'サンプル問題',
  options: overrides.options || [ { text: 'A' }, { text: 'B' }, { text: 'C' } ],
  answer: overrides.answer || 'A',
  is_active: overrides.is_active ?? true,
  difficulty: overrides.difficulty || 2,
  fun_level: overrides.fun_level || 2,
  created_at: '2024-01-01',
  updated_at: '2024-01-01'
});

describe('QuizGenerator (QuizList)', () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onRetry = vi.fn();

  beforeEach(() => {
    mockIsAdmin = true;
    vi.clearAllMocks();
  });

  it('shows loading spinner when loading', () => {
    render(<QuizGenerator quizzes={[]} onEdit={onEdit} onDelete={onDelete} isLoading={true} isConfigReady={true} storageMode="local" fetchError={null} onRetry={onRetry} />);
    expect(screen.getByText('クイズを読み込み中...')).toBeInTheDocument();
  });

  it('shows fetch error state', () => {
    render(<QuizGenerator quizzes={[]} onEdit={onEdit} onDelete={onDelete} isLoading={false} isConfigReady={true} storageMode="local" fetchError={'boom'} onRetry={onRetry} />);
    expect(screen.getByText('読み込みエラー')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '再試行' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows config required state', () => {
    render(<QuizGenerator quizzes={[]} onEdit={onEdit} onDelete={onDelete} isLoading={false} isConfigReady={false} storageMode="local" fetchError={null} onRetry={onRetry} />);
    expect(screen.getByText('設定が必要です')).toBeInTheDocument();
  });

  it('does not show empty state when admin has drafts (list renders)', () => {
    const quizzes = [ baseQuiz({ is_active: false }) ];
    render(<QuizGenerator quizzes={quizzes} onEdit={onEdit} onDelete={onDelete} isLoading={false} isConfigReady={true} storageMode="local" fetchError={null} onRetry={onRetry} />);
    expect(screen.getByText('サンプル問題')).toBeInTheDocument();
    expect(screen.queryByText('公開中のクイズがありません。下書き状態のクイズを公開してください。')).not.toBeInTheDocument();
  });

  it('filters inactive quizzes for non-admin', () => {
    mockIsAdmin = false;
    const quizzes = [ baseQuiz({ id: '1', is_active: false }), baseQuiz({ id: '2', is_active: true, question: '公開中' }) ];
    render(<QuizGenerator quizzes={quizzes} onEdit={onEdit} onDelete={onDelete} isLoading={false} isConfigReady={true} storageMode="local" fetchError={null} onRetry={onRetry} />);
    expect(screen.queryByText('サンプル問題')).not.toBeInTheDocument();
    expect(screen.getByText('公開中')).toBeInTheDocument();
  });

  it('shows empty list message for non-admin', () => {
    mockIsAdmin = false;
    render(<QuizGenerator quizzes={[]} onEdit={onEdit} onDelete={onDelete} isLoading={false} isConfigReady={true} storageMode="local" fetchError={null} onRetry={onRetry} />);
    expect(screen.getByText('クイズがありません。新しいクイズを作成して、リストを充実させましょう。')).toBeInTheDocument();
  });

  it('renders quizzes with admin controls', () => {
    const quizzes = [ baseQuiz({ id: '1', question: 'Q1' }), baseQuiz({ id: '2', question: 'Q2' }) ];
    render(<QuizGenerator quizzes={quizzes} onEdit={onEdit} onDelete={onDelete} isLoading={false} isConfigReady={true} storageMode="local" fetchError={null} onRetry={onRetry} />);
    expect(screen.getByText('Q1')).toBeInTheDocument();
    const editButtons = screen.getAllByLabelText('編集');
    const deleteButtons = screen.getAllByLabelText('削除');
    expect(editButtons.length).toBe(2);
    expect(deleteButtons.length).toBe(2);
  });

  it('calls edit and delete handlers', () => {
    const quizzes = [ baseQuiz({ id: '1', question: 'Q1' }) ];
    render(<QuizGenerator quizzes={quizzes} onEdit={onEdit} onDelete={onDelete} isLoading={false} isConfigReady={true} storageMode="local" fetchError={null} onRetry={onRetry} />);
    fireEvent.click(screen.getByLabelText('編集'));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
    fireEvent.click(screen.getByLabelText('削除'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('highlights correct answer option', () => {
    const quizzes = [ baseQuiz({ answer: 'B', options: [ { text: 'A' }, { text: 'B' } ] }) ];
    render(<QuizGenerator quizzes={quizzes} onEdit={onEdit} onDelete={onDelete} isLoading={false} isConfigReady={true} storageMode="local" fetchError={null} onRetry={onRetry} />);
    const correct = screen.getByText('B');
    expect(correct.parentElement?.className).toMatch(/bg-green-100/);
  });
});
