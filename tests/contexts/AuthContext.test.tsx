import { render, screen } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Helper component to expose context for assertions
const ShowAuth: React.FC = () => {
  const { user, isAdmin, login, logout } = useAuth();
  return (
    <div>
      <p data-testid="user-email">{user?.email || 'none'}</p>
      <p data-testid="is-admin">{isAdmin ? 'admin' : 'user'}</p>
      <button onClick={() => login('tester@example.com')}>login-user</button>
      <button onClick={() => login('admin@example.com')}>login-admin</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  test('初期状態は未ログイン / isAdmin false', () => {
    render(<AuthProvider><ShowAuth /></AuthProvider>);
    expect(screen.getByTestId('user-email').textContent).toBe('none');
    expect(screen.getByTestId('is-admin').textContent).toBe('user');
  });

  test('通常ユーザーログインで isAdmin false', () => {
    render(<AuthProvider><ShowAuth /></AuthProvider>);
    screen.getByText('login-user').click();
    expect(screen.getByTestId('user-email').textContent).toBe('tester@example.com');
    expect(screen.getByTestId('is-admin').textContent).toBe('user');
  });

  test('管理者メールで isAdmin true', () => {
    render(<AuthProvider><ShowAuth /></AuthProvider>);
    screen.getByText('login-admin').click();
    expect(screen.getByTestId('user-email').textContent).toBe('admin@example.com');
    expect(screen.getByTestId('is-admin').textContent).toBe('admin');
  });

  test('ログアウトで初期状態に戻る', () => {
    render(<AuthProvider><ShowAuth /></AuthProvider>);
    screen.getByText('login-admin').click();
    screen.getByText('logout').click();
    expect(screen.getByTestId('user-email').textContent).toBe('none');
    expect(screen.getByTestId('is-admin').textContent).toBe('user');
  });

  test('Provider 外で useAuth 使用時はエラー', () => {
    const Outside: React.FC = () => {
      // 呼び出し時に例外になる想定
      try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useAuth();
      } catch (e) {
        return <p data-testid="outside-error">error</p>;
      }
      return <p>no-error</p>;
    };
    render(<Outside />);
    expect(screen.getByTestId('outside-error')).toBeInTheDocument();
  });
});
