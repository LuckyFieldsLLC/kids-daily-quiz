import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import Toast from '../components/Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  test('成功トースト: 初期はinクラス、3500ms後にoutクラス→onClose まで 3800ms 経過', () => {
    const onClose = vi.fn();
    act(() => {
      render(<Toast message="保存しました" type="success" onClose={onClose} />);
    });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('animate-toast-in');
    expect(alert).toHaveClass('bg-green-600');

    // 3500ms 時点で close 開始 -> isExiting=true -> animate-toast-out
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(alert.className).toContain('animate-toast-out');
    expect(onClose).not.toHaveBeenCalled();

    // アニメーション 300ms 後に onClose
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('エラートースト: 手動閉じるで即座にoutクラスへ遷移し 300ms 後 onClose', () => {
    const onClose = vi.fn();
    act(() => {
      render(<Toast message="失敗しました" type="error" onClose={onClose} />);
    });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-red-600');

    const closeBtn = screen.getByRole('button', { name: '閉じる' });
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(alert.className).toContain('animate-toast-out');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
