import React, { useEffect, useRef, useCallback } from 'react';
import Button from './Button';
import Accordion from './Accordion';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    closeBtnRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur z-50 flex justify-center items-start p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="help-modal-title">
      <div ref={dialogRef} className="glass-panel elev-modal rounded-lg w-full max-w-3xl my-8 modal-surface" tabIndex={-1}>
        <div className="p-5 border-b flex justify-between items-center">
          <h2 id="help-modal-title" className="text-xl font-bold text-gray-800">ヘルプ / このアプリについて</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="閉じる (Esc)" className="p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </Button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <Accordion title="機能一覧" defaultOpen>
            <div className="p-4 space-y-3">
              <section>
                <h4 className="font-semibold text-gray-800">クイズの管理（管理者向け）</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 mt-1">
                  <li><strong>新規作成:</strong> 手動で新しいクイズを作成します。</li>
                  <li><strong>AIで作成:</strong> トピックを指定して、AIにクイズを自動生成させます。</li>
                  <li><strong>編集/削除:</strong> 既存のクイズを自由に変更・削除できます。</li>
                  <li><strong>公開/下書き:</strong> 「このクイズを公開する」のチェックで、一般ユーザーに表示するかどうかを切り替えられます。</li>
                </ul>
              </section>
              <section>
                <h4 className="font-semibold text-gray-800">設定（管理者向け）</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 mt-1">
                  <li><strong>データ保存設定:</strong> クイズデータの保存先を選べます。</li>
                  <li><strong>APIキー設定:</strong> AI機能（Gemini）を利用するためのAPIキーを設定します。</li>
                  <li><strong>外観設定:</strong> アプリケーションの名前、アイコン、テーマカラーを変更できます。</li>
                  <li><strong>表示設定:</strong> アプリ全体のフォントサイズを調整できます。</li>
                </ul>
              </section>
               <section>
                <h4 className="font-semibold text-gray-800">一般ユーザー向け</h4>
                <p className="text-gray-600 mt-1">
                  管理者によって公開されたクイズが表示されます。クイズを楽しんで、知識を深めましょう！
                </p>
              </section>
            </div>
          </Accordion>
          
          <Accordion title="データ保存先の選び方">
             <div className="p-4 space-y-4 text-gray-600">
                <p>このアプリは、様々な場所にクイズデータを保存できます。目的に合わせて最適なものを選びましょう。</p>
                <div className="space-y-3">
                    <div>
                        <h5 className="font-semibold text-gray-800">ローカルストレージ (Local Storage)</h5>
                        <p className="text-sm">データは今お使いのブラウザ内にのみ保存されます。最もシンプルで、オフラインでも動作します。ただし、他のPCやスマホとのデータ共有はできず、ブラウザのキャッシュを消すとデータも消えます。</p>
                        <p className="text-sm mt-1"><strong>推奨:</strong> アプリの機能を試す、個人だけで使う場合</p>
                    </div>
                    <div>
                        <h5 className="font-semibold text-gray-800">Netlify Blobs (推奨)</h5>
                        <p className="text-sm">Netlifyのサーバー上にデータを保存します。APIキーなどの面倒な設定が一切不要で、最も簡単に複数人でのデータ共有を実現できます。</p>
                        <p className="text-sm mt-1"><strong>推奨:</strong> チームで使う、複数のデバイスからアクセスする場合</p>
                    </div>
                    <div>
                        <h5 className="font-semibold text-gray-800">Netlify DB (共有/本番環境)</h5>
                        <p className="text-sm">Netlifyが提供する本格的なデータベース(PostgreSQL)にデータを保存します。大量のデータを扱う場合や、SQLを使った高度なデータ管理が必要な上級者向けです。</p>
                        <p className="text-sm mt-1"><strong>推奨:</strong> 大規模な運用、他のシステムとの連携を考えている場合</p>
                    </div>
                    <div>
                        <h5 className="font-semibold text-gray-800">Googleスプレッドシート</h5>
                        <p className="text-sm">普段使い慣れたGoogleスプレッドシートをデータベースとして利用します。手動でのデータ編集が簡単に行えるのがメリットです。</p>
                        <p className="text-sm mt-1"><strong>推奨:</strong> ITに詳しくない人でもデータの閲覧・編集を行いたい場合</p>
                    </div>
                </div>
            </div>
          </Accordion>
          
          <Accordion title="接続トラブルシューティング">
            <div className="p-4 space-y-4">
              <section>
                <h4 className="font-semibold text-gray-800">Netlify Blobsに接続できない</h4>
                <p className="text-sm text-gray-600">
                    接続テストに失敗する場合、最も一般的な原因はNetlifyのサイトでBlobs機能が有効になっていないか、有効化した後の再デプロイが不完全なことです。
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 mt-2">
                    <li>
                        <strong>機能の有効化:</strong> Netlifyの管理画面にログインし、<strong>[サイト設定] &gt; [Build & deploy] &gt; [Blobs]</strong> に移動して、機能を有効化してください。
                    </li>
                    <li>
                        <strong>キャッシュをクリアして再デプロイ:</strong> 機能を有効化した後、必ずサイトを再デプロイしてください。最も確実な方法は、<strong>[Deploys]</strong> タブに移動し、「Trigger deploy」のドロップダウンから <strong>「Clear cache and deploy site」</strong> を選択することです。これにより、最新の設定がビルドに反映されます。
                    </li>
                </ol>
              </section>
              <section>
                <h4 className="font-semibold text-gray-800 mt-4">Googleスプレッドシートに接続できない</h4>
                 <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li><strong>APIキーは正しいですか？:</strong> Google Cloud Platformで発行したAPIキーが正しくコピー＆ペーストされているか確認してください。</li>
                    <li><strong>スプレッドシートIDは正しいですか？:</strong> スプレッドシートのURLから、ID部分のみを正確にコピーしてきているか確認してください。</li>
                    <li><strong>共有設定は正しいですか？:</strong> スプレッドシートの共有設定が「リンクを知っている全員」に対して「閲覧者」以上の権限になっているか確認してください。</li>
                    <li><strong>Google Sheets APIは有効ですか？:</strong> Google Cloud Platformで、プロジェクトに対して「Google Sheets API」が有効になっているか確認してください。</li>
                </ul>
              </section>
               <section>
                <h4 className="font-semibold text-gray-800 mt-4">Gemini APIキーが使えない</h4>
                 <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li><strong>APIキーは正しいですか？:</strong> Google AI Studioで発行したAPIキーが正しくコピーされているか確認してください。</li>
                    <li><strong>プロジェクトの請求設定は有効ですか？:</strong> Google Cloud Platformで、APIキーが紐づくプロジェクトの請求先アカウントが有効になっているか確認してください。</li>
                </ul>
              </section>
            </div>
          </Accordion>
        </div>

        <div className="p-5 border-t flex justify-end">
          <Button onClick={onClose}>閉じる</Button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
