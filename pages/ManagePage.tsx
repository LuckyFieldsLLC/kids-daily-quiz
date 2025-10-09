import React, { useEffect, useMemo, useState } from 'react';
import { getQuizzes as apiGetQuizzes, deleteQuiz as apiDeleteQuiz } from '../services/api';
import type { Quiz } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';

// 簡易管理ページ（フェーズ2素地）。今はローカル/Blobs想定の一覧・選択・削除・エクスポート(JSON/CSV/MD)。
export default function ManagePage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Quiz[]>([]);
  const [selected, setSelected] = useState<Record<string | number, boolean>>({});
  const [preview, setPreview] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      // NOTE: settingsManager から設定取得して api.getQuizzes に渡すのが理想だが、ひとまず Blobs 前提でヘッダはサービス側が既定化
      const data = await apiGetQuizzes('blobs' as any, {} as any);
      setItems(data);
    } catch (e: any) {
      setError(e.message || '読み込みに失敗しました');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const allChecked = useMemo(() => items.length > 0 && items.every(q => selected[q.id || (q as any).key]), [items, selected]);
  const toggleAll = () => {
    if (allChecked) {
      setSelected({});
    } else {
      const next: Record<string | number, boolean> = {};
      items.forEach(q => { next[q.id || (q as any).key] = true; });
      setSelected(next);
    }
  };

  const checkedIds = useMemo(() => items.filter(q => selected[q.id || (q as any).key]).map(q => q.id || (q as any).key), [items, selected]);

  const removeSelected = async () => {
    if (checkedIds.length === 0) return;
    if (!confirm(`${checkedIds.length}件を削除します。よろしいですか？`)) return;
    setLoading(true);
    try {
      for (const id of checkedIds) {
        await apiDeleteQuiz(id as any, 'blobs' as any, {} as any);
      }
      await load();
      setSelected({});
    } catch (e: any) {
      setError(e.message || '削除に失敗しました');
    } finally { setLoading(false); }
  };

  const toJSON = (qs: Quiz[]) => new Blob([JSON.stringify(qs, null, 2)], { type: 'application/json' });
  const toCSV = (qs: Quiz[]) => {
    const head = ['id','question','answer','options','difficulty','fun_level','is_active','created_at'];
    const rows = qs.map(q => [q.id, quote(q.question), quote(q.answer), quote(q.options?.map(o=>o.text).join('|')||''), q.difficulty, q.fun_level, q.is_active, q.created_at||''].join(','));
    return new Blob([head.join(',')+'\n'+rows.join('\n')], { type: 'text/csv' });
  };
  const toMD = (qs: Quiz[]) => {
    const parts = qs.map(q => `### ${escapeMd(q.question)}\n- 答え: ${escapeMd(q.answer)}\n- 選択肢: ${(q.options||[]).map(o=>escapeMd(o.text)).join(', ')}\n`);
    return new Blob([`# クイズエクスポート\n\n${parts.join('\n')}`], { type: 'text/markdown' });
  };
  const quote = (s: any) => '"' + String(s??'').replace(/"/g,'""') + '"';
  const escapeMd = (s: any) => String(s??'').replace(/[\*#_`~|>]/g, '\\$&');

  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportSelected = (fmt: 'json' | 'csv' | 'md') => {
    const targets = items.filter(q => selected[q.id || (q as any).key]);
    if (targets.length === 0) return;
    if (fmt === 'json') download(toJSON(targets), 'quizzes.json');
    if (fmt === 'csv') download(toCSV(targets), 'quizzes.csv');
    if (fmt === 'md') download(toMD(targets), 'quizzes.md');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">クイズ管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>再読み込み</Button>
          <Button variant="danger" onClick={removeSelected} disabled={loading || checkedIds.length===0}>選択を削除</Button>
          <Button variant="secondary" onClick={()=>exportSelected('json')} disabled={checkedIds.length===0}>JSON</Button>
          <Button variant="secondary" onClick={()=>exportSelected('csv')} disabled={checkedIds.length===0}>CSV</Button>
          <Button variant="secondary" onClick={()=>exportSelected('md')} disabled={checkedIds.length===0}>Markdown</Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="overflow-auto border rounded-lg bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border-b"><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
              <th className="p-2 border-b text-left">質問</th>
              <th className="p-2 border-b">難易度</th>
              <th className="p-2 border-b">楽しい度</th>
              <th className="p-2 border-b">公開</th>
              <th className="p-2 border-b">作成日</th>
              <th className="p-2 border-b">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map(q => {
              const id = q.id || (q as any).key;
              return (
                <tr key={String(id)} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border-b align-top"><input type="checkbox" checked={!!selected[id]} onChange={(e)=> setSelected(prev=>({...prev,[id]: e.target.checked}))} /></td>
                  <td className="p-2 border-b align-top max-w-xl truncate"><button className="text-left hover:underline" onClick={()=>setPreview(q)}>{q.question}</button></td>
                  <td className="p-2 border-b align-top text-center">{q.difficulty}</td>
                  <td className="p-2 border-b align-top text-center">{q.fun_level}</td>
                  <td className="p-2 border-b align-top text-center">{q.is_active ? '公開' : '非公開'}</td>
                  <td className="p-2 border-b align-top text-center">{q.created_at ? new Date(q.created_at).toLocaleString() : '-'}</td>
                  <td className="p-2 border-b align-top text-center">
                    <Button variant="outline" size="sm" onClick={()=>setPreview(q)}>プレビュー</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {preview && (
        <Modal open={true} onOpenChange={(v)=>{ if(!v) setPreview(null); }} title="クイズプレビュー" description="公開前確認用のプレビューです" widthClass="max-w-xl">
          <div className="space-y-3">
            <div className="text-lg font-semibold">{preview.question}</div>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {(preview.options||[]).map((o,i)=>(<li key={i}>{o.text}</li>))}
            </ul>
            <div className="text-sm text-gray-500">答え: {preview.answer}</div>
            <div className="text-xs text-gray-400">作成: {preview.created_at ? new Date(preview.created_at).toLocaleString() : '-'}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}
