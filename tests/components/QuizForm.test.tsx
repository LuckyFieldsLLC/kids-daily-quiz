import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuizForm from '../../components/QuizForm';
import type { Quiz, NewQuiz } from '../../types';

// Mocks
vi.mock('../../services/aiService', () => ({
  generateQuiz: vi.fn()
}));

vi.mock('../../utils/tts', () => ({
  toggle: vi.fn(() => ({ started: true })),
  isSupported: vi.fn(() => true),
  isSpeaking: vi.fn(() => false),
  buildQuestionNarration: vi.fn((q: string, opts: string[]) => `${q}::${opts.join('|')}`),
  cancel: vi.fn()
}));

import { generateQuiz } from '../../services/aiService';
import { toggle as toggleTTS, isSupported, buildQuestionNarration, cancel as cancelTTS } from '../../utils/tts';

const baseQuiz: NewQuiz = {
  question: '最初の問題文',
  options: [ { text: 'A' }, { text: 'B' }, { text: 'C' }, { text: 'D' } ],
  answer: 'A',
  is_active: true,
  difficulty: 2,
  fun_level: 2
};

describe('QuizForm', () => {
  const onSave = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // ensure unmount triggers cleanup
  });

  it('renders initial quiz data', () => {
    render(<QuizForm quiz={baseQuiz} onSave={onSave} onCancel={onCancel} isSaving={false} />);
    expect(screen.getByLabelText('問題文')).toHaveValue('最初の問題文');
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(1); // question + options + answer
  });

  it('validates required fields', async () => {
    const incomplete: NewQuiz = { ...baseQuiz, question: '', options: [ { text: '' }, { text: '' } ], answer: '' };
    render(<QuizForm quiz={incomplete} onSave={onSave} onCancel={onCancel} isSaving={false} />);
    const form = screen.getByText('保存').closest('form')!;
    fireEvent.submit(form);
    expect(await screen.findByText('問題文を入力してください。')).toBeInTheDocument();
    expect(screen.getByText('すべての選択肢を入力してください。')).toBeInTheDocument();
    expect(screen.getByText('正解を入力してください。')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows error when answer not among options', async () => {
    const invalid: NewQuiz = { ...baseQuiz, answer: 'Z' };
    render(<QuizForm quiz={invalid} onSave={onSave} onCancel={onCancel} isSaving={false} />);
    const form2 = screen.getByText('保存').closest('form')!;
    fireEvent.submit(form2);
    expect(await screen.findByText('正解は選択肢のいずれかと一致する必要があります。')).toBeInTheDocument();
  });

  it('submits valid form', async () => {
    render(<QuizForm quiz={baseQuiz} onSave={onSave} onCancel={onCancel} isSaving={false} />);
    const form = screen.getByText('保存').closest('form')!;
    fireEvent.submit(form);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedArg = onSave.mock.calls[0][0];
    expect(savedArg.question).toBe('最初の問題文');
  });

  it('handles option text change', () => {
    render(<QuizForm quiz={baseQuiz} onSave={onSave} onCancel={onCancel} isSaving={false} />);
    const optionInputs = screen.getAllByPlaceholderText(/選択肢/);
    fireEvent.change(optionInputs[0], { target: { value: '変更後A' } });
    // update answer to match modified option to keep validation passing
    const answerInput = screen.getByLabelText('正解');
    fireEvent.change(answerInput, { target: { value: '変更後A' } });
    const form = screen.getByText('保存').closest('form')!;
    fireEvent.submit(form);
    expect(onSave).toHaveBeenCalled();
    const saved = onSave.mock.calls[0][0];
    expect(saved.options[0].text).toBe('変更後A');
  });

  it('regenerates question and can restore original', async () => {
    (generateQuiz as any).mockResolvedValue({ question: 'AI生成された問題' });
    render(<QuizForm quiz={baseQuiz} onSave={onSave} onCancel={onCancel} isSaving={false} />);
    const regenBtn = screen.getByRole('button', { name: 'この問題を別案に差し替え' });
    fireEvent.click(regenBtn);
    expect(generateQuiz).toHaveBeenCalled();
    await waitFor(() => {
      const texts = screen.getAllByText(/AI生成された問題/);
      expect(texts.length).toBeGreaterThan(0);
    });
    // restore
    const restoreBtn = screen.getByRole('button', { name: '元に戻す' });
    fireEvent.click(restoreBtn);
    expect(screen.getByLabelText('問題文')).toHaveValue('最初の問題文');
  });

  it('regenerate failure does not crash', async () => {
    (generateQuiz as any).mockRejectedValue(new Error('failure'));
    render(<QuizForm quiz={baseQuiz} onSave={onSave} onCancel={onCancel} isSaving={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'この問題を別案に差し替え' }));
    await waitFor(() => expect(generateQuiz).toHaveBeenCalled());
    // stays original because failure
    expect(screen.getByLabelText('問題文')).toHaveValue('最初の問題文');
  });

  it('toggles TTS when supported', () => {
    render(<QuizForm quiz={baseQuiz} onSave={onSave} onCancel={onCancel} isSaving={false} />);
    const ttsBtn = screen.getByRole('button', { name: '読み上げ' });
    fireEvent.click(ttsBtn);
    expect(toggleTTS).toHaveBeenCalled();
    expect(ttsBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('changes difficulty and fun levels via LevelSelector', () => {
    render(<QuizForm quiz={baseQuiz} onSave={onSave} onCancel={onCancel} isSaving={false} />);
    // buttons have role=radio per LevelSelector
    const radios = screen.getAllByRole('radio');
    // pick some second difficulty (already selected maybe) and last fun level (index near end)
    fireEvent.click(radios[2]); // fun_level maybe change
    fireEvent.click(radios[5]); // ensure another selection
    const form = screen.getByText('保存').closest('form')!;
    fireEvent.submit(form);
    expect(onSave).toHaveBeenCalled();
    const saved = onSave.mock.calls[0][0];
    expect(saved.difficulty).toBeDefined();
    expect(saved.fun_level).toBeDefined();
  });

  it('toggles is_active checkbox', () => {
    render(<QuizForm quiz={baseQuiz} onSave={onSave} onCancel={onCancel} isSaving={false} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox); // uncheck
    const form = screen.getByText('保存').closest('form')!;
    fireEvent.submit(form);
    const saved = onSave.mock.calls[0][0];
    expect(saved.is_active).toBe(false);
  });

  it('calls cancel handler', () => {
    render(<QuizForm quiz={baseQuiz} onSave={onSave} onCancel={onCancel} isSaving={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
