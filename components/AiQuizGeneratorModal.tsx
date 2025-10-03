// src/components/AiQuizGeneratorModal.tsx
import React, { useState } from 'react';
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

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-lg font-bold mb-4">🧠 AIクイズ自動生成</h2>

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
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400">
            キャンセル
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? '生成中...' : '生成'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiQuizGeneratorModal;
