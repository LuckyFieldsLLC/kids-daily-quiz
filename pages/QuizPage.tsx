import { useState } from 'react';
import { generateQuiz } from '../services/aiService';
import type { QuizRequest, QuizResponse } from '../types';

export default function QuizPage() {
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleGenerate() {
    const request: QuizRequest = {
      age: 10,
      category: '理科',
      theme: '動物',
      difficulty: 'かんたん',
      interestingness: 'おもしろい',
      discussion_value: '高い',
      emotional_impact: '感動的',
    };
    const newQuiz = await generateQuiz(request);
    setQuiz(newQuiz);
    setSelectedAnswer(null);
    setResult(null);
  }

  function handleAnswer(option: string) {
    if (!quiz) return;
    setSelectedAnswer(option);
    if (option === quiz.answer) {
      setResult('✅ 正解！');
    } else {
      setResult(`❌ 不正解（正解: ${quiz.answer}）`);
    }
  }

  return (
    <div className="p-4">
      <h1>AIクイズ</h1>
      <button onClick={handleGenerate} className="bg-blue-500 text-white px-3 py-1 rounded mb-4">
        クイズを生成
      </button>

      {quiz && (
        <div className="border p-3 rounded bg-yellow-50">
          <p className="font-bold">{quiz.question}</p>
          <ul className="space-y-2 mt-2">
            {quiz.options.map((opt, i) => (
              <li key={i}>
                <button
                  onClick={() => handleAnswer(opt)}
                  disabled={!!selectedAnswer}
                  className={`px-2 py-1 border rounded w-full text-left ${
                    selectedAnswer === opt
                      ? opt === quiz.answer
                        ? 'bg-green-200'
                        : 'bg-red-200'
                      : ''
                  }`}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
          {result && (
            <p className="mt-2">
              {result}
              <br />
              {quiz.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
