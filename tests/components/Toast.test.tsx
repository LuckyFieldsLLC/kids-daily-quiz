import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Toast from '../../components/Toast';

// Important: use fake timers to control setTimeout and avoid act warnings

describe('Toast', () => {
  test('自動クローズとアニメーション遷移', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast message="保存しました" type="success" onClose={onClose} />);
    const alert = screen.getByRole('alert');
    expect(onClose).not.toHaveBeenCalled();
    // 3.5s 経過で exit アニメーション開始
    vi.advanceTimersByTime(3500);
    // 直後は still not closed (exit animation running)
    expect(onClose).not.toHaveBeenCalled();
    // さらに 300ms (アニメーション完了)
    vi.advanceTimersByTime(300);
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  test('手動閉じるボタンですぐクローズ', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast message="エラー" type="error" onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: '閉じる' }));
    // 300ms 待って onClose
    vi.advanceTimersByTime(300);
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
