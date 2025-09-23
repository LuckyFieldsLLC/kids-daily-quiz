import type { Quiz, NewQuiz, StorageMode, DbConfig } from '../types';
import { loadSettings } from '../utils/settingsManager';

const API_PREFIX = '/.netlify/functions/';

const getHeaders = (storageMode: StorageMode, dbConfig: DbConfig): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-storage-mode': storageMode,
    };
    // For DB modes
    if (storageMode === 'custom' && dbConfig.dbUrl) {
        headers['x-db-url'] = dbConfig.dbUrl;
    }
    // For Sheets mode
    if (storageMode === 'google-sheets') {
        if (dbConfig.googleApiKey) headers['x-google-api-key'] = dbConfig.googleApiKey;
        if (dbConfig.googleSheetId) headers['x-google-sheet-id'] = dbConfig.googleSheetId;
    }
    return headers;
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        let errorMessage;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || `APIエラーが発生しました。`;
        } catch (e) {
            errorMessage = `サーバーとの通信に失敗しました (HTTP ${response.status}: ${response.statusText})。設定が正しいか、サーバーが稼働しているか確認してください。`;
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

// --- Quiz CRUD ---

export const getQuizzes = async (storageMode: StorageMode, dbConfig: DbConfig): Promise<Quiz[]> => {
    const headers = getHeaders(storageMode, dbConfig);
    const response = await fetch(`${API_PREFIX}getQuizzes`, { 
        method: 'GET',
        headers 
    });
    return handleResponse(response);
};

export const createQuiz = async (quizData: NewQuiz, storageMode: StorageMode, dbConfig: DbConfig): Promise<Quiz> => {
    const headers = getHeaders(storageMode, dbConfig);
    const response = await fetch(`${API_PREFIX}createQuiz`, {
        method: 'POST',
        headers,
        body: JSON.stringify(quizData),
    });
    return handleResponse(response);
};

export const updateQuiz = async (quizData: Quiz, storageMode: StorageMode, dbConfig: DbConfig): Promise<Quiz> => {
    const headers = getHeaders(storageMode, dbConfig);
    const response = await fetch(`${API_PREFIX}updateQuiz`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(quizData),
    });
    return handleResponse(response);
};

export const deleteQuiz = async (id: string | number, storageMode: StorageMode, dbConfig: DbConfig): Promise<{}> => {
    const headers = getHeaders(storageMode, dbConfig);
    const response = await fetch(`${API_PREFIX}deleteQuiz`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id }),
    });
    return handleResponse(response);
};

// --- AI Generation ---

export const generateQuizFromAI = async (topic: string, difficulty: number, fun_level: number): Promise<NewQuiz> => {
    const settings = loadSettings();
    const geminiApiKey = settings.apiKeys.gemini;
    
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (geminiApiKey) {
        headers['x-gemini-api-key'] = geminiApiKey;
    }
    
    const response = await fetch(`${API_PREFIX}generateQuiz`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ topic, difficulty, fun_level }),
    });
    return handleResponse(response);
};

// --- Connection Tests ---

export const testConnection = async (storageMode: StorageMode, dbConfig: DbConfig): Promise<{ message: string }> => {
    const headers = getHeaders(storageMode, dbConfig);
    const response = await fetch(`${API_PREFIX}testConnection`, { method: 'POST', headers });
    return handleResponse(response);
};

export const testDbConnection = async (dbUrl: string): Promise<{ message: string }> => {
    const headers = { 'Content-Type': 'application/json', 'x-db-url': dbUrl, 'x-storage-mode': 'custom' };
    const response = await fetch(`${API_PREFIX}testConnection`, { method: 'POST', headers });
    return handleResponse(response);
};

export const testGoogleSheetsConnection = async (apiKey: string, sheetId: string): Promise<{ message: string }> => {
    const headers = {
        'Content-Type': 'application/json',
        'x-google-api-key': apiKey,
        'x-google-sheet-id': sheetId,
        'x-storage-mode': 'google-sheets',
    };
    const response = await fetch(`${API_PREFIX}testConnection`, { method: 'POST', headers });
    return handleResponse(response);
};

export const testNetlifyBlobsConnection = async (): Promise<{ message: string }> => {
    const settings = loadSettings();
    const headers = getHeaders(settings.storageMode, settings.dbConfig);
    const response = await fetch(`${API_PREFIX}testConnection`, { method: 'POST', headers });
    return handleResponse(response);
};

export const testGeminiConnection = async (apiKey: string): Promise<{ message: string }> => {
    const headers = {
        'Content-Type': 'application/json',
        'x-gemini-api-key': apiKey,
    };
    // ✅ 修正: 存在しない gemini-testConnection は使わず testConnection に統一
    const response = await fetch(`${API_PREFIX}testConnection`, { method: 'POST', headers });
    return handleResponse(response);
};
