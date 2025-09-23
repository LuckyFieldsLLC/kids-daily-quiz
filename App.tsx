import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import QuizList from './components/QuizGenerator';
import QuizForm from './components/QuizForm';
import SettingsModal from './components/SettingsModal';
import AiQuizGeneratorModal from './components/AiQuizGeneratorModal';
import Toast from './components/Toast';
import HelpModal from './components/HelpModal';
import { AuthProvider } from './contexts/AuthContext';
import * as localApi from './utils/localStorageManager';
import * as api from './services/api';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './utils/settingsManager';
import type { Quiz, NewQuiz, StorageMode, DbConfig, AppSettings } from './types';

type View = 'list' | 'form';
type ToastMessage = { id: number; message: string; type: 'success' | 'error' };

const isConfigComplete = (mode: StorageMode, config: DbConfig): boolean => {
    switch (mode) {
        case 'local':
        case 'netlify-blobs':
        case 'trial':
        case 'production':
            return true;
        case 'custom':
            return !!config.dbUrl;
        case 'google-sheets':
            return !!config.googleApiKey && !!config.googleSheetId;
        default:
            return false;
    }
};

const themeClasses: { [key: string]: { header: string; body: string } } = {
    blue: { header: 'bg-blue-800', body: 'bg-gray-100' },
    sakura: { header: 'bg-pink-800', body: 'bg-pink-50' },
    green: { header: 'bg-emerald-800', body: 'bg-emerald-50' },
    dark: { header: 'bg-gray-900', body: 'bg-gray-800 text-gray-200' },
};

const AppContent: React.FC = () => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<View>('list');
    const [editingQuiz, setEditingQuiz] = useState<Quiz | NewQuiz | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isConfigReady, setIsConfigReady] = useState(false);

    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const addToast = (message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };
    
    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const handleSaveSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
        saveSettings(newSettings);
        setIsConfigReady(isConfigComplete(newSettings.storageMode, newSettings.dbConfig));
        setShowSettingsModal(false);
        addToast('設定を保存しました。');
        // A full reload might be easier to apply all visual changes consistently
        // window.location.reload();
    };

    const loadQuizzes = useCallback(async () => {
        if (!isConfigReady) {
            setQuizzes([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setFetchError(null);
        try {
            const data = await (settings.storageMode === 'local'
                ? localApi.getQuizzes()
                : api.getQuizzes(settings.storageMode, settings.dbConfig));
            setQuizzes(data);
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.message || 'クイズの読み込みに失敗しました。';
            addToast(errorMessage, 'error');
            setFetchError(errorMessage);
            setQuizzes([]);
        } finally {
            setIsLoading(false);
        }
    }, [settings.storageMode, settings.dbConfig, isConfigReady]);

    useEffect(() => {
        const savedSettings = loadSettings();
        setSettings(savedSettings);
        setIsConfigReady(isConfigComplete(savedSettings.storageMode, savedSettings.dbConfig));
    }, []);

    useEffect(() => {
        loadQuizzes();
    }, [loadQuizzes]);


    const handleAddNewQuiz = () => {
        setEditingQuiz(null);
        setView('form');
    };
    
    const handleGenerateAiQuiz = () => {
        setShowAiModal(true);
    };
    
    const handleQuizGenerated = (quiz: NewQuiz) => {
        setEditingQuiz(quiz);
        setView('form');
        setShowAiModal(false);
    }
    
    const handleEditQuiz = (quiz: Quiz) => {
        setEditingQuiz(quiz);
        setView('form');
    };
    
    const handleDeleteQuiz = async (id: string | number) => {
        if (window.confirm('このクイズを本当に削除しますか？')) {
            try {
                settings.storageMode === 'local'
                    ? await localApi.deleteQuiz(id)
                    : await api.deleteQuiz(id, settings.storageMode, settings.dbConfig);
                addToast('クイズを削除しました。');
                loadQuizzes();
            } catch (error: any) {
                addToast(error.message || 'クイズの削除に失敗しました。', 'error');
            }
        }
    };
    
    const handleSaveQuiz = async (quizData: NewQuiz | Quiz) => {
        setIsSaving(true);
        try {
            const isUpdate = 'id' in quizData && quizData.id;
            if (settings.storageMode === 'local') {
                isUpdate ? await localApi.updateQuiz(quizData as Quiz) : await localApi.createQuiz(quizData as NewQuiz);
            } else {
                isUpdate ? await api.updateQuiz(quizData as Quiz, settings.storageMode, settings.dbConfig) : await api.createQuiz(quizData as NewQuiz, settings.storageMode, settings.dbConfig);
            }
            addToast(isUpdate ? 'クイズを更新しました。' : 'クイズを作成しました。');
            setView('list');
            setEditingQuiz(null);
            loadQuizzes();
        } catch (error: any) {
            addToast(error.message || 'クイズの保存に失敗しました。', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCancelForm = () => {
        setView('list');
        setEditingQuiz(null);
    };

    const handleGoHome = () => {
        setView('list');
        setEditingQuiz(null);
    };

    const appClasses = useMemo(() => {
        const currentTheme = themeClasses[settings.appearance.appTheme] || themeClasses.blue;
        const fontSizeClass = { '小': 'text-sm', '大': 'text-lg', '標準': 'text-base' }[settings.display.fontSize] || 'text-base';
        return `flex flex-col min-h-screen font-sans ${fontSizeClass} ${currentTheme.body}`;
    }, [settings.appearance.appTheme, settings.display.fontSize]);

    return (
        <div className={appClasses}>
            <Header
                appName={settings.appearance.appName}
                appIcon={settings.appearance.appIcon}
                appTheme={settings.appearance.appTheme}
                onAddNew={handleAddNewQuiz}
                onGenerateAi={handleGenerateAiQuiz}
                onSettings={() => setShowSettingsModal(true)}
                onGoHome={handleGoHome}
                onHelp={() => setShowHelpModal(true)}
            />
            <main className="container mx-auto px-4 py-8 flex-grow">
                {view === 'list' && (
                    <QuizList
                        quizzes={quizzes}
                        onEdit={handleEditQuiz}
                        onDelete={handleDeleteQuiz}
                        isLoading={isLoading}
                        isConfigReady={isConfigReady}
                        storageMode={settings.storageMode}
                        fetchError={fetchError}
                        onRetry={loadQuizzes}
                    />
                )}
                {view === 'form' && (
                    <QuizForm
                        quiz={editingQuiz}
                        onSave={handleSaveQuiz}
                        onCancel={handleCancelForm}
                        isSaving={isSaving}
                    />
                )}
            </main>
            <Footer appTheme={settings.appearance.appTheme} appName={settings.appearance.appName} />
            
            {showSettingsModal && (
                <SettingsModal
                    currentSettings={settings}
                    onSave={handleSaveSettings}
                    onClose={() => setShowSettingsModal(false)}
                    addToast={addToast}
                />
            )}
            
            {showAiModal && (
                <AiQuizGeneratorModal
                    onClose={() => setShowAiModal(false)}
                    onQuizGenerated={handleQuizGenerated}
                />
            )}

            {showHelpModal && (
                <HelpModal onClose={() => setShowHelpModal(false)} />
            )}

            <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </div>
    );
};


const App: React.FC = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

export default App;