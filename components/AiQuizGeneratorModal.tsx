import React, { useState } from 'react';
import type { NewQuiz } from '../types';
import { generateQuizFromAI } from '../services/api';
import LevelSelector from './LevelSelector';

interface AiQuizGeneratorModalProps {
  onClose: () => void;
  onQuizGenerated: (quiz: NewQuiz) => void;
}

const difficultyLevels: { [key: number]: string } = { 1: 'やさしい', 2: 'ふつう', 3: 'むずかしい' };
const funLevels: { [key: number]: string } = { 1: 'ふつう', 2: 'おもしろい', 3: 'すごくおもしろい' };

const AiQuizGeneratorModal: React.FC<AiQuizGeneratorModalProps> = ({ onClose, onQuizGenerated }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState(2);
  const [funLevel, setFunLevel] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('トピックを入力してください。');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const generatedQuiz = await generateQuizFromAI(topic, difficulty, funLevel);
      onQuizGenerated(generatedQuiz);
    } catch (err: any) {
      setError(err.message || 'クイズの生成に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">AIでクイズを作成</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
              クイズのトピック
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例：海の生き物、江戸時代、世界の首都など"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">具体的なトピックを入力すると、より精度の高いクイズが生成されます。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <LevelSelector
                label="難易度"
                name="difficulty"
                options={difficultyLevels}
                selectedValue={difficulty}
                onChange={setDifficulty}
            />
            <LevelSelector
                label="面白さ"
                name="fun_level"
                options={funLevels}
                selectedValue={funLevel}
                onChange={setFunLevel}
            />
            </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[90px]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </>
              ) : '生成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiQuizGeneratorModal;