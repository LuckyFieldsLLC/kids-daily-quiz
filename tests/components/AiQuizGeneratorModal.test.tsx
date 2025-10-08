import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import AiQuizGeneratorModal from '../../components/AiQuizGeneratorModal';
import * as aiService from '../../services/aiService';

const mockQuiz = {
  question: 'テスト質問',
  options: ['A','B','C','D'],
  answer: 'A',
  explanation: '説明',
  difficulty: 3,
  fun_level: 4,
  id: 'id1',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  published: true,
};

describe('AiQuizGeneratorModal', () => {
  test('生成成功で onQuizGenerated 呼び出し & 閉じない', async () => {
    const generateSpy = vi.spyOn(aiService, 'generateQuiz').mockResolvedValue(mockQuiz as any);
    const onClose = vi.fn();
    const onQuizGenerated = vi.fn();

    render(<AiQuizGeneratorModal onClose={onClose} onQuizGenerated={onQuizGenerated} />);

    fireEvent.click(screen.getByRole('button', { name: '生成' }));
    expect(generateSpy).toHaveBeenCalled();

    await waitFor(() => expect(onQuizGenerated).toHaveBeenCalledWith(mockQuiz));
    expect(onClose).not.toHaveBeenCalled();
  });

  test('エラー時にメッセージ表示', async () => {
    vi.spyOn(aiService, 'generateQuiz').mockRejectedValue(new Error('失敗')); 
    const onClose = vi.fn();

    render(<AiQuizGeneratorModal onClose={onClose} onQuizGenerated={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: '生成' }));

    await screen.findByText('クイズの生成に失敗しました。');
  });

  test('キャンセルで onClose', () => {
    const onClose = vi.fn();
    render(<AiQuizGeneratorModal onClose={onClose} onQuizGenerated={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(onClose).toHaveBeenCalled();
  });

  test('入力値変更が state に反映 (難易度など)', () => {
    render(<AiQuizGeneratorModal onClose={() => {}} onQuizGenerated={() => {}} />);
    const ageInput = screen.getByLabelText('対象年齢:', { selector: 'input' });
    fireEvent.change(ageInput, { target: { value: '10' } });
    expect(ageInput).toHaveValue(10);

    const diffInput = screen.getByLabelText('難易度（1〜5）:', { selector: 'input' });
    fireEvent.change(diffInput, { target: { value: '5' } });
    expect(diffInput).toHaveValue(5);
  });
});
