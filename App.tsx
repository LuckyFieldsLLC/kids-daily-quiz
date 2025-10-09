import React, { useEffect, useState } from 'react';
import { Link, Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';

import Footer from './components/Footer';
import Header from './components/Header';
import { AuthProvider } from './contexts/AuthContext';

import HistoryPage from './pages/HistoryPage'; // 履歴・再挑戦
import ImportPage from './pages/ImportPage'; // CSVインポート
import QuizPage from './pages/QuizPage'; // AI生成＋フォーム
import ManagePage from './pages/ManagePage'; // クイズ管理
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import AiQuizGeneratorModal from './components/AiQuizGeneratorModal';
import Modal from './components/Modal';
import { DelayedUnmount } from './hooks/useDelayedUnmount'; // TODO: Radix導入済みモーダル分は除去候補
import QuizForm from './components/QuizForm';
import Toast from './components/Toast';

import type { AppSettings, NewQuiz, Quiz, QuizResponse } from './types';
import { getSettings, saveSettings, createQuiz } from './utils/localStorageManager';

// デフォルト設定（localStorage未設定時）
const defaultSettings: AppSettings = {
  storageMode: 'local',
  dbConfig: {},
  apiKeys: { gemini: '', openai: '' },
  display: { fontSize: '標準' },
  appearance: { appName: 'Kids Daily Quiz', appIcon: '🧩', appTheme: 'blue' },
  apiProvider: 'gemini',
  models: { geminiModel: 'gemini-1.5-flash', openaiModel: 'gpt-4o-mini' }
};

// 共通レイアウト + モーダル制御を内包させるため、Layoutを stateful にする
const Layout: React.FC<{ children: React.ReactNode; settings: AppSettings; setSettings: (s: AppSettings) => void; addToast: (m: string, t?: 'success' | 'error') => void; }> = ({ children, settings, setSettings, addToast }) => {
  const navigate = useNavigate();

  // モーダル状態
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | NewQuiz | null>(null);

  // AI生成結果を一時的に保持してフォームに渡す
  const handleQuizGenerated = (qr: QuizResponse) => {
    const newQuiz: NewQuiz = {
      question: qr.question,
      options: qr.options.map(o => ({ text: o })),
      answer: qr.answer,
      is_active: true,
      difficulty: 2,
      fun_level: 2
    };
    setEditingQuiz(newQuiz);
    setShowAiGenerator(false);
    setShowQuizForm(true);
    addToast('AIでクイズ案を生成しました。編集して保存できます。', 'success');
  };

  const handleSaveSettings = (s: AppSettings) => {
    setSettings(s);
    saveSettings(s);
    setShowSettings(false);
    addToast('設定を保存しました。', 'success');
  };

  const handleCreateOrUpdateQuiz = async (data: NewQuiz | Quiz) => {
    try {
      // ひとまずローカル保存のみ（storageMode拡張は後続）
      const saved = await createQuiz(data as NewQuiz);
      addToast('クイズを保存しました。', 'success');
      setShowQuizForm(false);
      setEditingQuiz(null);
      // 一覧的な表示ページがあれば遷移検討。現状はトップに留まる。
    } catch (e: any) {
      addToast(e.message || 'クイズ保存に失敗しました。', 'error');
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50">
      <Header
        appName={settings.appearance.appName}
        appIcon={settings.appearance.appIcon}
        appTheme={settings.appearance.appTheme}
        onAddNew={() => { setEditingQuiz(null); setShowQuizForm(true); }}
        onGenerateAi={() => {
          // 選択中プロバイダに応じたキー存在チェック
          const provider = settings.apiProvider || 'gemini';
            const key = provider === 'gemini' ? settings.apiKeys.gemini : settings.apiKeys.openai;
            if (!key) {
              addToast(`${provider === 'gemini' ? 'Gemini' : 'OpenAI'} のAPIキーを設定してください。`, 'error');
              setShowSettings(true);
              return;
            }
            setShowAiGenerator(true);
        }}
        onSettings={() => setShowSettings(true)}
        onGoHome={() => navigate('/')}
        onHelp={() => setShowHelp(true)}
      />
      <nav className="p-4 bg-gray-200 flex gap-4">
        <Link to="/" className="hover:underline">AIクイズ</Link>
        <Link to="/import" className="hover:underline">CSVインポート</Link>
        <Link to="/history" className="hover:underline">履歴</Link>
        <Link to="/manage" className="hover:underline">管理</Link>
      </nav>
      <main className="container mx-auto px-4 py-8 flex-grow">{children}</main>
      <Footer appTheme={settings.appearance.appTheme} appName={settings.appearance.appName} />

      {showSettings && (
        <SettingsModal
          currentSettings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          addToast={addToast}
        />
      )}
      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}
      {showAiGenerator && (
        <AiQuizGeneratorModal
          onClose={() => setShowAiGenerator(false)}
          onQuizGenerated={handleQuizGenerated}
        />
      )}
      {showQuizForm && (
        <QuizFormModal
          editingQuiz={editingQuiz}
          onClose={() => { setShowQuizForm(false); setEditingQuiz(null); }}
          onSave={handleCreateOrUpdateQuiz}
        />
      )}
    </div>
  );
};

// アクセシビリティ対応済みクイズフォームモーダルを分離
const QuizFormModal: React.FC<{ editingQuiz: Quiz | NewQuiz | null; onClose: () => void; onSave: (q: NewQuiz | Quiz) => void; }> = ({ editingQuiz, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const handleSaveInternal = async (data: NewQuiz | Quiz) => {
    setIsSaving(true);
    try { await onSave(data); } finally { setIsSaving(false); }
  };
  return (
    <Modal
      open={true}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={editingQuiz ? 'クイズ編集 / AI案' : '新規クイズ作成'}
      description="クイズ内容を入力・編集して保存できます"
      widthClass="max-w-2xl"
      footer={(
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded border text-sm">キャンセル</button>
          <button disabled={isSaving} onClick={() => { /* QuizForm 内の保存がトリガー */ }} className="hidden" aria-hidden />
        </div>
      )}
    >
      <QuizForm
        quiz={editingQuiz}
        onSave={handleSaveInternal}
        onCancel={onClose}
        isSaving={isSaving}
      />
    </Modal>
  );
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);

  useEffect(() => {
    // --- 設定マイグレーション: app_settings_config -> app_settings ---
    try {
      const legacyRaw = localStorage.getItem('app_settings_config');
      const primaryRaw = localStorage.getItem('app_settings');
      if (legacyRaw && !primaryRaw) {
        // 旧フォーマットを新フォーマットへ写し替え
        const legacy = JSON.parse(legacyRaw);
        const merged = { ...defaultSettings, ...legacy, appearance: { ...defaultSettings.appearance, ...legacy.appearance }, apiKeys: { ...defaultSettings.apiKeys, ...legacy.apiKeys } };
        localStorage.setItem('app_settings', JSON.stringify(merged));
        // フラグ: 一度マイグレーションしたら旧キーを削除（安全のため try/catch）
        try { localStorage.removeItem('app_settings_config'); } catch { /* ignore */ }
      }
    } catch (e) {
      console.warn('settings migration failed', e);
    }
    const stored = getSettings();
    if (stored) {
      const beforeMode = (stored as any).storageModeOriginal || stored.storageMode; // fallback
      // loadSettings で既にマイグレーションしている場合との比較: 旧値痕跡を localStorage 内 raw から抽出
      try {
        const raw = localStorage.getItem('app_settings');
        if (raw) {
          const rawParsed = JSON.parse(raw);
          const rawMode = rawParsed.storageMode;
          if (rawMode && ['netlify-blobs','production','trial','custom','google-sheets'].includes(rawMode)) {
            addToast(`旧ストレージモード "${rawMode}" は新モードへ自動移行されました。`, 'success');
            // raw を新しい正規化済みに書き戻す
            localStorage.setItem('app_settings', JSON.stringify({ ...rawParsed, storageMode: stored.storageMode }));
          }
        }
      } catch { /* ignore */ }
      setSettings({ ...defaultSettings, ...stored, appearance: { ...defaultSettings.appearance, ...stored.appearance }, apiKeys: { ...defaultSettings.apiKeys, ...stored.apiKeys } });
    }
  }, []);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  return (
    <AuthProvider>
      <Router>
        <Layout settings={settings} setSettings={setSettings} addToast={addToast}>
          <Routes>
            <Route path="/" element={<QuizPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/manage" element={<ManagePage />} />
          </Routes>
        </Layout>
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 space-y-2 z-50 w-full max-w-md px-4">
          {toasts.map(t => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              onClose={() => setToasts(prev => prev.filter(pt => pt.id === t.id ? false : true))}
            />
          ))}
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
