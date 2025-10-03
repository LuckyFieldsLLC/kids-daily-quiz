import { useState } from 'react';
import { importQuizzes, QuizHistory } from '../services/quizHistory';

export default function ImportPage() {
  const [importText, setImportText] = useState('');

  function handleImport() {
    try {
      const data: QuizHistory[] = JSON.parse(importText);
      importQuizzes(data);
      alert('クイズをインポートしました！');
      setImportText('');
    } catch (e) {
      alert('インポート失敗: JSONの形式を確認してください');
    }
  }

  return (
    <div className="p-4">
      <h1>クイズインポート</h1>
      <textarea
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        className="w-full border p-2 h-40"
        placeholder="JSON形式のクイズデータを貼り付けてください"
      />
      <button onClick={handleImport} className="mt-2 bg-blue-500 text-white px-3 py-1 rounded">
        インポート
      </button>
    </div>
  );
}
