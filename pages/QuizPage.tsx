import { Link } from 'react-router-dom';

export default function QuizPage() {
  return (
    <div className="space-y-8">
      {/* 中央CTA */}
      <section className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">AIクイズを作成しよう</h1>
        <p className="text-gray-600 leading-relaxed text-sm md:text-base mb-6">
          年齢やテーマを指定して、AIにクイズを自動生成してもらえます。生成後は編集して保存、公開設定で配信できます。
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="#" onClick={(e)=>{e.preventDefault(); const btn=document.querySelector('[data-action-open-ai-generator]') as HTMLButtonElement|null; btn?.click();}} className="inline-flex items-center justify-center px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-base font-medium shadow">
            AIでクイズ作成
          </a>
          <div className="flex gap-2 text-sm text-blue-700">
            <Link to="/history" className="underline">履歴を見る</Link>
            <span>・</span>
            <Link to="/import" className="underline">CSVをインポート</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-2">クイズ生成フロー</h2>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
            <li>ヘッダー「AIで作成」を押す</li>
            <li>条件（年齢/テーマなど）を入力し生成</li>
            <li>案を確認し必要なら編集</li>
            <li>保存して公開設定する</li>
          </ol>
        </div>
        <div className="rounded-lg border border-gray-200 p-5 shadow-sm bg-white">
          <details>
            <summary className="font-semibold text-gray-800 cursor-pointer">次のステップ</summary>
            <div className="mt-2 text-sm text-gray-600 leading-relaxed">
              公開クイズ一覧 / 検索 / 履歴リプレイ / スコア集計 ダッシュボードなどを拡張予定です。
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
