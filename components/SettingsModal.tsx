import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import type { AppSettings, StorageMode, DbConfig, DisplaySettings, ApiProvider, ModelSettings } from '../types';
import Accordion from './Accordion';
import * as api from '../services/api';

interface SettingsModalProps {
  currentSettings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}

const storageModeOptions: { value: StorageMode; label: string; description: string }[] = [
  { value: 'local', label: 'ローカル', description: 'ブラウザのみ。最もシンプル。端末間共有なし。' },
  { value: 'blobs', label: 'Netlify Blobs', description: 'ファイルライクなKey-Value永続化。SiteでBlobsを有効化すると自動認証で使えます。' },
  { value: 'db', label: 'Database', description: 'PostgreSQL (Neon 等)。構造化・集計や将来拡張に。' }
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
  const [settings, setSettings] = useState<AppSettings>({
    ...currentSettings,
    models: {
      geminiModel: currentSettings.models?.geminiModel || 'gemini-1.5-flash',
      openaiModel: currentSettings.models?.openaiModel || 'gpt-4o-mini'
    }
  });
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
    if (settings.storageMode === 'db') {
      return (
        <div className="space-y-2 mt-4 p-4 bg-gray-50 rounded-md border">
          <label htmlFor="dbUrl" className="block text-sm font-medium text-gray-600">Postgres 接続URL</label>
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
    }
    return null;
  };

  const showConnectionTest = settings.storageMode !== 'local';

  return (
    <Modal open onOpenChange={(o) => { if(!o) onClose(); }} title="アプリケーション設定" widthClass="max-w-2xl"
      description="データ保存先やAIプロバイダ、外観などアプリ全体の挙動を設定できます。保存後は一部設定が即時反映されます。"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      }
    >
        <div className="space-y-6">
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
                    {settings.storageMode === 'blobs' && (
                      <div className="mt-4 text-xs bg-blue-50 border border-blue-200 rounded p-3 space-y-1 text-blue-800">
                        <p className="font-semibold">Netlify Blobs の使い方</p>
                        <ol className="list-decimal list-inside space-y-0.5">
                          <li>Netlify ダッシュボード → 対象 Site → Site settings</li>
                          <li>左メニュー「Build & Deploy」→「Blobs」で機能を有効化</li>
                          <li>デプロイ後、Functions 実行環境では自動認証で利用できます</li>
                        </ol>
                        <p className="mt-1">ローカル開発中は擬似ストア(ファイル)が使われ、<code>.blobs/</code> に保存されます。</p>
                      </div>
                    )}
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="geminiModel" className="block text-sm font-medium text-gray-700">Gemini モデル</label>
                    <select
                      id="geminiModel"
                      value={settings.models?.geminiModel || 'gemini-1.5-flash'}
                      onChange={(e) => setSettings(prev => ({ ...prev, models: { ...(prev.models||{}), geminiModel: e.target.value as ModelSettings['geminiModel'], openaiModel: prev.models?.openaiModel || 'gpt-4o-mini' } }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="gemini-1.5-flash">gemini-1.5-flash (速い/安価)</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro (高精度)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="openaiModel" className="block text-sm font-medium text-gray-700">OpenAI モデル</label>
                    <select
                      id="openaiModel"
                      value={settings.models?.openaiModel || 'gpt-4o-mini'}
                      onChange={(e) => setSettings(prev => ({ ...prev, models: { ...(prev.models||{}), openaiModel: e.target.value as ModelSettings['openaiModel'], geminiModel: prev.models?.geminiModel || 'gemini-1.5-flash' } }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="gpt-4o-mini">gpt-4o-mini (コスト効率)</option>
                      <option value="gpt-4o">gpt-4o (高精度)</option>
                    </select>
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
    </Modal>
  );
};

export default SettingsModal;