import React, { useState, useEffect } from 'react';
import type { AppSettings, StorageMode, DbConfig, DisplaySettings } from '../types';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">アプリケーション設定</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="閉じる">
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
            
            <Accordion title="APIキー設定">
                 <div className="p-4 space-y-4">
                    <div>
                        <label htmlFor="gemini" className="block text-sm font-medium text-gray-700">Gemini APIキー</label>
                        <input
                            type="password"
                            id="gemini"
                            name="gemini"
                            value={settings.apiKeys.gemini || ''}
                            onChange={handleApiKeyChange}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                        />
                         <div className="mt-2">
                            <button
                                onClick={handleTestGemini}
                                disabled={isTesting}
                                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {isTesting ? 'テスト中...' : 'キーをテスト'}
                            </button>
                        </div>
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
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;