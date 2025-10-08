import { render, screen } from '@testing-library/react';
import React from 'react';
import QuizGenerator from '../../components/QuizGenerator';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Wrap with mocked Auth context value
const AdminWrapper: React.FC<{ admin: boolean; children: React.ReactNode }> = ({ admin, children }) => {
  return (
    <AuthProvider>
      <AuthStateInjector admin={admin}>{children}</AuthStateInjector>
    </AuthProvider>
  );
};

const AuthStateInjector: React.FC<{ admin: boolean; children: React.ReactNode }> = ({ admin, children }) => {
  const { login, logout } = useAuth();
  React.useEffect(() => {
    if (admin) {
      login('admin@example.com');
    } else {
      logout();
      login('user@example.com');
    }
  }, [admin, login, logout]);
  return <>{children}</>;
};

describe('QuizGenerator admin gating', () => {
  const baseProps = {
    quizzes: [
      { id: '1', question: 'Q1', answer: 'A', options: [{ text: 'A' }, { text: 'B' }], is_active: true, difficulty: 2, fun_level: 2 },
      { id: '2', question: 'Draft', answer: 'X', options: [{ text: 'X' }, { text: 'Y' }], is_active: false, difficulty: 3, fun_level: 1 },
    ],
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    isLoading: false,
    isConfigReady: true,
    storageMode: 'local' as const,
    fetchError: null,
    onRetry: () => {},
  };

  test('非管理者は下書き(Draft)を表示しない', () => {
    render(
      <AdminWrapper admin={false}>
        <QuizGenerator {...baseProps} />
      </AdminWrapper>
    );
    expect(screen.queryByText('Draft')).not.toBeInTheDocument();
    expect(screen.getByText('Q1')).toBeInTheDocument();
  });

  test('管理者は下書き含む全てを表示しステータスバッジあり', () => {
    render(
      <AdminWrapper admin={true}>
        <QuizGenerator {...baseProps} />
      </AdminWrapper>
    );
    expect(screen.getByText('Draft')).toBeInTheDocument();
    // 下書きバッジ
    expect(screen.getAllByText('下書き')[0]).toBeInTheDocument();
  });
});
