import { useEffect, useState } from 'react';
import { exportCSV, fetchQuizHistory, QuizHistory, saveScore } from '../services/quizHistory';

export default function HistoryPage() {
  const [quizzes, setQuizzes] = useState<QuizHistory[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizHistory | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchQuizHistory().then(setQuizzes);
  }, []);

  function handleAnswer(option: string) {
    if (!selectedQuiz) return;
    setSelectedAnswer(option);
    const result = option === selectedQuiz.answer;
    setIsCorrect(result);
    saveScore(selectedQuiz.key, result);
  }

  const filtered = quizzes.filter((q) => (filter === 'ALL' ? true : q.source === filter));

  return (
    <div className="p-4">
      <h1>クイズ履歴</h1>

      {/* フィルタ */}
      <div className="flex gap-2 mb-4">
        {['ALL', 'AI', 'IMPORT'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded ${
              filter === f ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={() => exportCSV(filter)}
          className="ml-auto bg-green-500 text-white px-3 py-1 rounded"
        >
          CSVエクスポート
        </button>
      </div>

      {/* クイズ表示 */}
      {selectedQuiz ? (
        <div className="border p-3 rounded bg-yellow-50">
          <p className="font-bold">{selectedQuiz.question}</p>
          <ul>
            {selectedQuiz.options.map((opt, i) => (
              <li key={i}>
                <button
                  onClick={() => handleAnswer(opt)}
                  disabled={!!selectedAnswer}
                  className={`px-2 py-1 border rounded w-full text-left ${
                    selectedAnswer === opt ? (isCorrect ? 'bg-green-200' : 'bg-red-200') : ''
                  }`}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
          {selectedAnswer && (
            <p className="mt-2">
              {isCorrect ? '✅ 正解！' : `❌ 不正解（正解: ${selectedQuiz.answer}）`}
              <br />
              {selectedQuiz.explanation}
            </p>
          )}
          <button
            onClick={() => setSelectedQuiz(null)}
            className="mt-3 bg-gray-300 px-3 py-1 rounded"
          >
            履歴に戻る
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((q) => (
            <li key={q.key} className="border p-3 rounded">
              <p className="font-semibold">{q.question}</p>
              <p className="text-sm text-gray-600">
                タグ: {q.source} ｜ 成績: {q.score.correct}/{q.score.total}
              </p>
              <button
                onClick={() => {
                  setSelectedQuiz(q);
                  setSelectedAnswer(null);
                  setIsCorrect(null);
                }}
                className="mt-1 bg-blue-500 text-white px-3 py-1 rounded"
              >
                再挑戦
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
