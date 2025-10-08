import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, afterEach, beforeEach } from 'vitest';
import * as api from '../services/api';
import SettingsModal from '../components/SettingsModal';
import type { AppSettings } from '../types';

vi.mock('../services/api');
const mockTestGemini: any = api.testGeminiConnection as any;
mockTestGemini.mockResolvedValue({ message: 'Gemini OK' });

const baseSettings = (partial?: Partial<AppSettings>): AppSettings => ({
  storageMode: 'local',
  dbConfig: {},
  apiKeys: { gemini: 'GEM_KEY', openai: 'OPEN_KEY' },
  apiProvider: 'gemini',
  models: { geminiModel: 'gemini-1.5-flash', openaiModel: 'gpt-4o-mini' },
  display: { fontSize: '標準' },
  appearance: { appName: 'QuizApp', appIcon: '📚', appTheme: 'blue' },
  ...partial,
});

describe('SettingsModal - API keys & models', () => {
  const addToast = vi.fn();
  const onSave = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const renderModal = (override?: Partial<AppSettings>) => {
    render(<SettingsModal currentSettings={baseSettings(override)} onSave={onSave} onClose={onClose} addToast={addToast} />);
  };

  test('Geminiキーあり: テストボタンで testGeminiConnection → success toast', async () => {
    renderModal();
    const user = userEvent.setup();
    const btn = screen.getByRole('button', { name: 'Geminiキーをテスト' });
    expect(btn).not.toBeDisabled();
    await user.click(btn);
    expect(mockTestGemini).toHaveBeenCalledWith('GEM_KEY');
    expect(addToast).toHaveBeenCalledWith('Gemini OK', 'success');
  });

  test('OpenAIキーあり: 接続テストボタンで fetch 呼び出し成功トースト', async () => {
    renderModal();
    const user = userEvent.setup();
    const btn = screen.getByRole('button', { name: 'OpenAIキーをテスト' });
    expect(btn).not.toBeDisabled();
    await user.click(btn);
    expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/generateQuiz', expect.objectContaining({
      method: 'POST',
    }));
    // 成功トースト
    expect(addToast).toHaveBeenCalledWith('OpenAI接続成功', 'success');
  });

  test('モデル選択変更して保存で onSave に更新後モデル渡される', async () => {
    renderModal();
    const user = userEvent.setup();
    const geminiSelect = screen.getByLabelText('Gemini モデル');
    const openaiSelect = screen.getByLabelText('OpenAI モデル');

    await user.selectOptions(geminiSelect, 'gemini-1.5-pro');
    await user.selectOptions(openaiSelect, 'gpt-4o');

    const saveBtn = screen.getByRole('button', { name: '保存' });
    await user.click(saveBtn);

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0] as AppSettings;
    expect(saved.models?.geminiModel).toBe('gemini-1.5-pro');
    expect(saved.models?.openaiModel).toBe('gpt-4o');
  });

  test('Gemini モデル変更後も OpenAI 既定値保持 (双方向初期化ロジック確認)', async () => {
    renderModal({ models: { geminiModel: 'gemini-1.5-flash', openaiModel: 'gpt-4o-mini' } });
    const user = userEvent.setup();
    const geminiSelect = screen.getByLabelText('Gemini モデル');
    await user.selectOptions(geminiSelect, 'gemini-1.5-pro');
    const saveBtn = screen.getByRole('button', { name: '保存' });
    await user.click(saveBtn);
  const lastIdx = onSave.mock.calls.length - 1;
  const saved = onSave.mock.calls[lastIdx][0] as AppSettings;
    expect(saved.models?.openaiModel).toBe('gpt-4o-mini');
  });
});
