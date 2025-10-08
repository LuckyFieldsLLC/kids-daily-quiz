// src/components/AiQuizGeneratorModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from './Button';
import { generateQuiz } from '../services/aiService';
import type { QuizRequest, QuizResponse } from '../types';

interface Props {
  onClose: () => void;
  onQuizGenerated: (quiz: QuizResponse) => void;
}

const AiQuizGeneratorModal: React.FC<Props> = ({ onClose, onQuizGenerated }) => {
  const [age, setAge] = useState<number>(7);
  const [category, setCategory] = useState<string>('道徳');
  const [theme, setTheme] = useState<string>('感謝');
  const [difficulty, setDifficulty] = useState<number>(3);
  const [interestingness, setInterestingness] = useState<number>(4);
  const [discussionValue, setDiscussionValue] = useState<number>(5);
  const [emotionalImpact, setEmotionalImpact] = useState<number>(4);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: QuizRequest = {
        age,
        category,
        theme,
        difficulty,
        interestingness,
        discussion_value: discussionValue,
        emotional_impact: emotionalImpact,
      };

      console.log('🧠 クイズ生成開始');
      console.log('📦 送信パラメータ:', params);

      const result = await generateQuiz(params);

      console.log('📩 AI応答:', result);

      if (!result) {
        throw new Error('AI応答がnullまたはパースに失敗しました');
      }

      onQuizGenerated(result);
    } catch (err) {
      console.error('❌ クイズの生成に失敗しました。', err);
      setError('クイズの生成に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    cancelBtnRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="ai-generator-title">
      <div ref={dialogRef} className="glass-panel elev-modal p-6 rounded-xl w-full max-w-md modal-surface" tabIndex={-1}>
        <h2 id="ai-generator-title" className="text-lg font-bold mb-4">🧠 AIクイズ自動生成</h2>

        <div className="space-y-2">
          <label className="block">
            対象年齢:
            <input
              type="number"
              value={age}
              min={3}
              max={18}
              onChange={(e) => setAge(Number(e.target.value))}
              className="border rounded p-1 w-full"
            />
          </label>

          <label className="block">
            カテゴリ:
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded p-1 w-full"
            />
          </label>

          <label className="block">
            テーマ:
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="border rounded p-1 w-full"
            />
          </label>

          <label className="block">
            難易度（1〜5）:
            <input
              type="number"
              value={difficulty}
              min={1}
              max={5}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="border rounded p-1 w-full"
            />
          </label>

          <label className="block">
            面白さ（ひらめき度）:
            <input
              type="number"
              value={interestingness}
              min={1}
              max={5}
              onChange={(e) => setInterestingness(Number(e.target.value))}
              className="border rounded p-1 w-full"
            />
          </label>

          <label className="block">
            対話性（Discussion Value）:
            <input
              type="number"
              value={discussionValue}
              min={1}
              max={5}
              onChange={(e) => setDiscussionValue(Number(e.target.value))}
              className="border rounded p-1 w-full"
            />
          </label>

          <label className="block">
            感情インパクト:
            <input
              type="number"
              value={emotionalImpact}
              min={1}
              max={5}
              onChange={(e) => setEmotionalImpact(Number(e.target.value))}
              className="border rounded p-1 w-full"
            />
          </label>
        </div>

        {error && <p className="text-red-500 mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-6">
          <button ref={cancelBtnRef} onClick={onClose} className="sr-only" aria-hidden tabIndex={-1}>hidden</button>
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
          <Button onClick={handleGenerate} loading={loading}>{loading ? '生成中...' : '生成'}</Button>
        </div>
      </div>
    </div>
  );
};

export default AiQuizGeneratorModal;
