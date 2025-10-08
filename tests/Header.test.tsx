import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, afterEach, vi } from 'vitest';
import Header from '../components/Header';

// モック宣言 (hoisted by Vitest)
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));
import { useAuth } from '../contexts/AuthContext';
// 型エラー回避: any キャスト (テスト内限定)
const mockedUseAuth: any = useAuth;

const baseProps = () => ({
  appName: '学習クイズ',
  appIcon: '📚',
  appTheme: 'green' as const,
  onAddNew: vi.fn(),
  onGenerateAi: vi.fn(),
  onSettings: vi.fn(),
  onGoHome: vi.fn(),
  onHelp: vi.fn(),
});

describe('Header', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('未ログイン時: 管理者としてログイン ボタンのみ表示', () => {
    mockedUseAuth.mockReturnValue({ user: null, isAdmin: false, login: vi.fn(), logout: vi.fn() });
    const props = baseProps();
    render(<Header {...props} />);

    // ログインボタン表示
    expect(screen.getByRole('button', { name: '管理者としてログイン' })).toBeInTheDocument();

    // 管理者向けボタンが無い
    expect(screen.queryByRole('button', { name: '新規作成' })).toBeNull();
    expect(screen.queryByRole('button', { name: /AIで作成/ })).toBeNull();
    expect(screen.queryByRole('button', { name: '設定' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'ログアウト' })).toBeNull();
  });

  test('管理者ログイン時: 全管理ボタン表示 + クリックでハンドラ呼び出し + テーマクラス', async () => {
    mockedUseAuth.mockReturnValue({
      user: { email: 'admin@example.com', name: 'admin' },
      isAdmin: true,
      login: vi.fn(),
      logout: vi.fn()
    });
    const props = baseProps();
    render(<Header {...props} />);

    // header テーマクラス (green -> bg-emerald-800)
    const headerEl = screen.getByRole('banner');
    expect(headerEl.className).toContain('bg-emerald-800');

    // 各ボタン表示確認
    const addBtn = screen.getByRole('button', { name: '新規作成' });
    const aiBtn = screen.getByRole('button', { name: /AIで作成/ });
    const settingsBtn = screen.getByRole('button', { name: '設定' });
    const helpBtn = screen.getByRole('button', { name: 'ヘルプ' });
    const logoutBtn = screen.getByRole('button', { name: 'ログアウト' });

    const user = userEvent.setup();
    await user.click(addBtn);
    await user.click(aiBtn);
    await user.click(settingsBtn);
    await user.click(helpBtn);

    expect(props.onAddNew).toHaveBeenCalledTimes(1);
    expect(props.onGenerateAi).toHaveBeenCalledTimes(1);
    expect(props.onSettings).toHaveBeenCalledTimes(1);
    expect(props.onHelp).toHaveBeenCalledTimes(1);
    expect(logoutBtn).toBeInTheDocument();
  });

  test('一般ユーザー (isAdmin=false) ログイン時: 管理者専用ボタン非表示・ヘルプとログアウトのみ', () => {
    mockedUseAuth.mockReturnValue({
      user: { email: 'user@example.com', name: 'user' },
      isAdmin: false,
      login: vi.fn(),
      logout: vi.fn()
    });
    const props = baseProps();
    render(<Header {...props} />);

    // 管理者専用が無い
    expect(screen.queryByRole('button', { name: '新規作成' })).toBeNull();
    expect(screen.queryByRole('button', { name: /AIで作成/ })).toBeNull();
    expect(screen.queryByRole('button', { name: '設定' })).toBeNull();

    // 共通: ヘルプ / ログアウト は表示
    expect(screen.getByRole('button', { name: 'ヘルプ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument();
  });
});

