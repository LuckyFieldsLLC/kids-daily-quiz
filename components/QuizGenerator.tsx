import React from 'react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Quiz, StorageMode } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Tooltip from './Tooltip';

interface QuizListProps {
  quizzes: Quiz[];
  onEdit: (quiz: Quiz) => void;
  onDelete: (id: string | number) => void;
  isLoading: boolean;
  isConfigReady: boolean;
  storageMode: StorageMode;
  fetchError: string | null;
  onRetry: () => void;
}

const difficultyMap: { [key: number]: { label: string; className: string } } = {
  1: { label: 'やさしい', className: 'bg-blue-100 text-blue-800' },
  2: { label: 'ふつう', className: 'bg-indigo-100 text-indigo-800' },
  3: { label: 'むずかしい', className: 'bg-purple-100 text-purple-800' },
};

const funLevelMap: { [key: number]: { label: string; className: string } } = {
  1: { label: 'ふつう', className: 'bg-gray-100 text-gray-800' },
  2: { label: 'おもしろい', className: 'bg-pink-100 text-pink-800' },
  3: { label: 'すごくおもしろい', className: 'bg-red-100 text-red-800' },
};


const QuizList: React.FC<QuizListProps> = ({ quizzes, onEdit, onDelete, isLoading, isConfigReady, storageMode, fetchError, onRetry }) => {
  const { isAdmin } = useAuth();

  const displayedQuizzes = isAdmin ? quizzes : quizzes.filter(q => q.is_active);

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">クイズを読み込み中...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
        <div className="text-center p-8 bg-white rounded-lg shadow-md border border-red-200">
            <div className="mx-auto w-12 h-12 flex items-center justify-center bg-red-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-700">読み込みエラー</h2>
            <p className="text-gray-500 mt-2">
                クイズの読み込みに失敗しました。
            </p>
            <p className="text-sm text-red-500 mt-1">{fetchError}</p>
            <button 
                onClick={onRetry}
                className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                再試行
            </button>
        </div>
    );
  }

  if (!isConfigReady) {
    return (
        <div className="text-center p-8 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700">設定が必要です</h2>
            <p className="text-gray-500 mt-2">
                右上の歯車アイコンから、データの保存先を設定してください。
            </p>
            <p className="text-sm text-gray-400 mt-1">
                (現在のモード: {storageMode})
            </p>
        </div>
    );
  }

  if (displayedQuizzes.length === 0) {
    const message = isAdmin && quizzes.length > 0
        ? "公開中のクイズがありません。下書き状態のクイズを公開してください。"
        : "クイズがありません。新しいクイズを作成して、リストを充実させましょう。";

    return (
        <div className="text-center p-8 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700">クイズがありません</h2>
            <p className="text-gray-500 mt-2">{message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedQuizzes.map((quiz, index) => (
        <div key={quiz.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 transition-shadow hover:shadow-lg animate-fade-in">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm text-blue-600 font-semibold">問題 {displayedQuizzes.length - index}</p>
                {isAdmin && (
                    <>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${quiz.is_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {quiz.is_active ? '公開中' : '下書き'}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${difficultyMap[quiz.difficulty]?.className || difficultyMap[2].className}`}>
                           難易度: {difficultyMap[quiz.difficulty]?.label || 'ふつう'}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${funLevelMap[quiz.fun_level]?.className || funLevelMap[2].className}`}>
                           面白さ: {funLevelMap[quiz.fun_level]?.label || 'おもしろい'}
                        </span>
                    </>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mt-1">{quiz.question}</h3>
            </div>
            {isAdmin && (
              <div className="flex-shrink-0 flex gap-2 ml-4">
                <Tooltip text="クイズを編集">
                  <button onClick={() => onEdit(quiz)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100" aria-label="編集">
                    <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </Tooltip>
                <Tooltip text="クイズを削除">
                  <button onClick={() => onDelete(quiz.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100" aria-label="削除">
                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {Array.isArray(quiz.options) && quiz.options.map((option, idx) => (
              <div key={idx} className={`p-3 rounded-md border ${option.text === quiz.answer ? 'bg-green-100 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                <span className={`font-medium ${option.text === quiz.answer ? 'text-green-800' : 'text-gray-700'}`}>{option.text}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuizList;