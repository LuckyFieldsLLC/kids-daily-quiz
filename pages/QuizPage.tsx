export default function QuizPage() {
  return (
    <div className="space-y-8">
      <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-3 tracking-tight">AIクイズ</h1>
        <p className="text-gray-600 leading-relaxed text-sm md:text-base">
          上部メニュー「AIで作成」から、年齢やテーマを指定してAIにクイズを生成させることができます。<br />
          生成後は編集フォームで微調整・保存し、公開設定を切り替えて利用者に届けましょう。
        </p>
        <ul className="mt-4 text-sm text-gray-500 list-disc list-inside space-y-1">
          <li>新規に手動作成したい場合は「新規作成」ボタン</li>
          <li>各設定（保存先 / APIキー / 外観）は「設定」アイコンから</li>
          <li>使い方の詳細は「ヘルプ」で確認できます</li>
        </ul>
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
          <h2 className="font-semibold text-gray-800 mb-2">次のステップ</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            近日: 公開クイズ一覧 / 検索 / 履歴リプレイ / スコア集計 ダッシュボードなどを拡張予定です。
          </p>
        </div>
      </section>
    </div>
  );
}
