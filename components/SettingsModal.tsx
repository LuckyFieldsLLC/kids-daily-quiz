import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from './Button';
import type { AppSettings, StorageMode, DbConfig, DisplaySettings, ApiProvider } from '../types';
import Accordion from './Accordion';
import * as api from '../services/api';

interface SettingsModalProps {
  currentSettings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}

const storageModeOptions: { value: StorageMode; label: string; description: string }[] = [
    { value: 'local', label: 'ローカルストレージ', description: 'データはブラウザ内に保存されます。シンプルでテストに最適です。' },
    { value: 'netlify-blobs', label: 'Netlify Blobs', description: 'NetlifyのBlobストアにデータを保存します。Netlifyへのデプロイが必要です。' },
    { value: 'production', label: 'Netlify DB (本番環境)', description: 'Netlifyで設定された本番データベースを使用します。' },
    { value: 'trial', label: 'Netlify DB (共有)', description: 'Netlifyの共有トライアルデータベースを使用します。' },
    { value: 'custom', label: 'カスタムDB', description: '任意のPostgreSQL互換データベースの接続URLを指定します。' },
    { value: 'google-sheets', label: 'Google Sheets', description: 'Googleスプレッドシートをデータベースとして使用します。' },
];

const iconOptions: { value: string; label: string }[] = [
    { value: '⚛️', label: 'アトム' }, { value: '📚', label: '本' }, { value: '🧠', label: '脳' }, 
    { value: '💡', label: '電球' }, { value: '🌱', label: '植物' }, { value: '🚀', label: 'ロケット' }
];

const themeOptions: { value: AppSettings['appearance']['appTheme']; label: string }[] = [
    { value: 'blue', label: '青（デフォルト）' },
    { value: 'sakura', label: '桜' },
    { value: 'green', label: '緑' },
    { value: 'dark', label: 'ダーク' },
];


const SettingsModal: React.FC<SettingsModalProps> = ({ currentSettings, onSave, onClose, addToast }) => {
  const [settings, setSettings] = useState<AppSettings>(currentSettings);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleStorageModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as StorageMode;
    setSettings(prev => ({ ...prev, storageMode: newMode }));
  };

  const handleDbConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, dbConfig: { ...prev.dbConfig, [name]: value } }));
  };
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, apiKeys: { ...prev.apiKeys, [name]: value } }));
  };

  const handleDisplayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, display: { ...prev.display, [name]: value as DisplaySettings['fontSize'] } }));
  };
  
  const handleAppearanceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setSettings(prev => ({
          ...prev,
          appearance: { ...prev.appearance, [name]: value }
      }));
  };

  const handleSave = () => {
    onSave(settings);
  };

  const handleTestConnection = async () => {
      setIsTesting(true);
      try {
          const response = await api.testConnection(settings.storageMode, settings.dbConfig);
          addToast(response.message, 'success');
      } catch (err: any) {
          addToast(err.message || '接続に失敗しました。', 'error');
      } finally {
          setIsTesting(false);
      }
  };

  const handleTestGemini = async () => {
    if (!settings.apiKeys.gemini) {
        addToast('Gemini APIキーを入力してください。', 'error');
        return;
    }
    setIsTesting(true);
    try {
        const response = await api.testGeminiConnection(settings.apiKeys.gemini);
        addToast(response.message, 'success');
    } catch (err: any) {
        addToast(err.message || 'Gemini APIキーのテストに失敗しました。', 'error');
    } finally {
        setIsTesting(false);
    }
  }

  const renderStorageConfig = () => {
    switch (settings.storageMode) {
      case 'custom':
        return (
          <div className="space-y-2 mt-4 p-4 bg-gray-50 rounded-md border">
            <label htmlFor="dbUrl" className="block text-sm font-medium text-gray-600">データベース接続URL</label>
            <input
              type="password"
              id="dbUrl"
              name="dbUrl"
              value={settings.dbConfig.dbUrl || ''}
              onChange={handleDbConfigChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              placeholder="postgresql://..."
            />
          </div>
        );
      case 'google-sheets':
        return (
          <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-md border">
            <div>
              <label htmlFor="googleApiKey" className="block text-sm font-medium text-gray-600">Google APIキー</label>
              <input
                type="password"
                id="googleApiKey"
                name="googleApiKey"
                value={settings.dbConfig.googleApiKey || ''}
                onChange={handleDbConfigChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="googleSheetId" className="block text-sm font-medium text-gray-600">スプレッドシートID</label>
              <input
                type="text"
                id="googleSheetId"
                name="googleSheetId"
                value={settings.dbConfig.googleSheetId || ''}
                onChange={handleDbConfigChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const showConnectionTest = !['local'].includes(settings.storageMode);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    // 初期フォーカス
    closeButtonRef.current?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = Array.from(root.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
        .filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur z-50 flex justify-center items-start p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
      <div ref={dialogRef} className="glass-panel elev-modal rounded-lg w-full max-w-2xl my-8 modal-surface" tabIndex={-1}>
        <div className="p-5 border-b flex justify-between items-center">
          <h2 id="settings-modal-title" className="text-xl font-bold text-gray-800">アプリケーション設定</h2>
          <button ref={closeButtonRef} onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="閉じる (Esc)">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            <Accordion title="データ保存設定" defaultOpen>
                <div className="p-4">
                    <label htmlFor="storageMode" className="block text-sm font-medium text-gray-700">データ保存先</label>
                    <select
                        id="storageMode"
                        name="storageMode"
                        value={settings.storageMode}
                        onChange={handleStorageModeChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    >
                        {storageModeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                     <p className="text-xs text-gray-500 mt-1">{storageModeOptions.find(o => o.value === settings.storageMode)?.description}</p>
                    {renderStorageConfig()}
                    {showConnectionTest && (
                        <div className="mt-4">
                            <button
                                onClick={handleTestConnection}
                                disabled={isTesting}
                                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {isTesting ? 'テスト中...' : '接続テスト'}
                            </button>
                        </div>
                    )}
                </div>
            </Accordion>
            
            <Accordion title="AIプロバイダ / APIキー設定">
              <div className="p-4 space-y-6">
                <div>
                  <label htmlFor="apiProvider" className="block text-sm font-medium text-gray-700">利用するAIプロバイダ</label>
                  <select
                    id="apiProvider"
                    name="apiProvider"
                    value={settings.apiProvider}
                    onChange={(e) => setSettings(prev => ({ ...prev, apiProvider: e.target.value as ApiProvider }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="gemini">Gemini (Google)</option>
                    <option value="openai">OpenAI</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">選択されたプロバイダのAPIキーを以下に入力します。</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="gemini" className="block text-sm font-medium text-gray-700">Gemini APIキー</label>
                    <input
                      type="password"
                      id="gemini"
                      name="gemini"
                      value={settings.apiKeys.gemini || ''}
                      onChange={handleApiKeyChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                      placeholder="AIza..."
                    />
                  </div>
                  <div>
                    <label htmlFor="openai" className="block text-sm font-medium text-gray-700">OpenAI APIキー</label>
                    <input
                      type="password"
                      id="openai"
                      name="openai"
                      value={settings.apiKeys.openai || ''}
                      onChange={handleApiKeyChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                      placeholder="sk-..."
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleTestGemini}
                    disabled={isTesting || !settings.apiKeys.gemini}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isTesting ? 'テスト中...' : 'Geminiキーをテスト'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!settings.apiKeys.openai) { addToast('OpenAI APIキーを入力してください。', 'error'); return; }
                      setIsTesting(true);
                      try {
                        // OpenAI用簡易接続テスト：generateQuiz Functionに provider=openai で軽量リクエスト (topic=ping)
                        const res = await fetch('/.netlify/functions/generateQuiz', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'x-ai-provider': 'openai', 'x-api-key': settings.apiKeys.openai },
                          body: JSON.stringify({ topic: '接続テスト', difficulty: 1, fun_level: 1 }),
                        });
                        if (!res.ok) throw new Error('OpenAI接続に失敗しました');
                        addToast('OpenAI接続成功', 'success');
                      } catch (e: any) {
                        addToast(e.message || 'OpenAI接続テスト失敗', 'error');
                      } finally {
                        setIsTesting(false);
                      }
                    }}
                    disabled={isTesting || !settings.apiKeys.openai}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isTesting ? 'テスト中...' : 'OpenAIキーをテスト'}
                  </button>
                </div>
              </div>
            </Accordion>
            
            <Accordion title="外観設定">
                 <div className="p-4 space-y-4">
                    <div>
                        <label htmlFor="appName" className="block text-sm font-medium text-gray-700">アプリケーション名</label>
                        <input
                            type="text"
                            id="appName"
                            name="appName"
                            value={settings.appearance.appName}
                            onChange={handleAppearanceChange}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                        />
                    </div>
                     <div>
                        <label htmlFor="appIcon" className="block text-sm font-medium text-gray-700">アイコン</label>
                        <select
                            id="appIcon"
                            name="appIcon"
                            value={settings.appearance.appIcon}
                            onChange={handleAppearanceChange}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        >
                            {iconOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.value} {opt.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="appTheme" className="block text-sm font-medium text-gray-700">テーマ</label>
                        <select
                            id="appTheme"
                            name="appTheme"
                            value={settings.appearance.appTheme}
                            onChange={handleAppearanceChange}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        >
                            {themeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                 </div>
            </Accordion>
            
            <Accordion title="表示設定">
                 <div className="p-4">
                    <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700">フォントサイズ</label>
                    <select
                        id="fontSize"
                        name="fontSize"
                        value={settings.display.fontSize}
                        onChange={handleDisplayChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    >
                        <option value="小">小</option>
                        <option value="標準">標準</option>
                        <option value="大">大</option>
                    </select>
                </div>
            </Accordion>
        </div>

        <div className="p-5 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;