import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDelayedUnmount } from '../../hooks/useDelayedUnmount';

// タイマーを制御
vi.useFakeTimers();

describe('useDelayedUnmount', () => {
  it('immediately renders when mounted true', () => {
    const { result, rerender } = renderHook(({ mounted }) => useDelayedUnmount(mounted, 200), { initialProps: { mounted: true } });
    expect(result.current.shouldRender).toBe(true);
    expect(result.current.exiting).toBe(false);

    // unmount トリガー
    rerender({ mounted: false });
    // exiting フラグが立つ
    expect(result.current.shouldRender).toBe(true);
    expect(result.current.exiting).toBe(true);

    // 200ms 経過で shouldRender false
    act(() => { vi.advanceTimersByTime(199); });
    expect(result.current.shouldRender).toBe(true); // まだ
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.shouldRender).toBe(false);
    expect(result.current.exiting).toBe(false);
  });

  it('respects custom delay', () => {
    const { result, rerender } = renderHook(({ mounted, delay }) => useDelayedUnmount(mounted, delay), { initialProps: { mounted: true, delay: 50 } });
    rerender({ mounted: false, delay: 50 });
    expect(result.current.exiting).toBe(true);
    act(() => { vi.advanceTimersByTime(49); });
    expect(result.current.shouldRender).toBe(true);
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.shouldRender).toBe(false);
  });
});
