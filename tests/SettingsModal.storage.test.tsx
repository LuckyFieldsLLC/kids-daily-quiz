import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, afterEach } from 'vitest';
import * as api from '../services/api';
import SettingsModal from '../components/SettingsModal';
import type { AppSettings } from '../types';

vi.mock('../services/api');

const mockTestConnection: any = api.testConnection as any;
mockTestConnection.mockResolvedValue({ message: 'OK' });

const baseSettings = (): AppSettings => ({
  storageMode: 'local',
  dbConfig: {},
  apiKeys: { gemini: '', openai: '' },
  apiProvider: 'gemini',
  models: { geminiModel: 'gemini-1.5-flash', openaiModel: 'gpt-4o-mini' },
  display: { fontSize: '標準' },
  appearance: { appName: 'QuizApp', appIcon: '📚', appTheme: 'blue' }
});

describe('SettingsModal - storage & connection', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (override?: Partial<AppSettings>) => {
    const addToast = vi.fn();
    const onSave = vi.fn();
    const onClose = vi.fn();
    const currentSettings = { ...baseSettings(), ...override } as AppSettings;
    render(<SettingsModal currentSettings={currentSettings} onSave={onSave} onClose={onClose} addToast={addToast} />);
    return { addToast, onSave, onClose };
  };

  test('local 初期: 接続テストボタン非表示 / mode切替でUI変化', async () => {
    renderModal();
    const user = userEvent.setup();

    // local では接続テストボタンなし
    expect(screen.queryByRole('button', { name: '接続テスト' })).toBeNull();

    const select = screen.getByLabelText('データ保存先');
    await user.selectOptions(select, 'db');
    // Postgres 接続URL入力出現
    expect(screen.getByLabelText('Postgres 接続URL')).toBeInTheDocument();

  // blobs に変更で説明パネル表示
    await user.selectOptions(select, 'blobs');
  expect(screen.getByText(/Netlify Blobs の使い方/)).toBeInTheDocument();

    // 接続テストボタン表示される
    expect(screen.getByRole('button', { name: '接続テスト' })).toBeInTheDocument();
  });

  test('接続テスト成功: api.testConnection 呼び出しとトースト success', async () => {
    const { addToast } = renderModal({ storageMode: 'blobs' });
    const user = userEvent.setup();
    const btn = screen.getByRole('button', { name: '接続テスト' });
    await user.click(btn);
    expect(mockTestConnection).toHaveBeenCalledWith('blobs', {});
    expect(addToast).toHaveBeenCalledWith('OK', 'success');
  });

  test('接続テスト失敗: error トースト', async () => {
    mockTestConnection.mockRejectedValueOnce(new Error('失敗'));
    const { addToast } = renderModal({ storageMode: 'db', dbConfig: { dbUrl: 'postgresql://abc' } });
    const user = userEvent.setup();
    const btn = screen.getByRole('button', { name: '接続テスト' });
    await user.click(btn);
    expect(mockTestConnection).toHaveBeenCalledWith('db', { dbUrl: 'postgresql://abc' });
    expect(addToast).toHaveBeenCalledWith('失敗', 'error');
  });
});
