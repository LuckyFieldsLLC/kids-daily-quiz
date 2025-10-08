import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDelayedUnmount } from '../../hooks/useDelayedUnmount';

vi.useFakeTimers();

describe('useDelayedUnmount', () => {
  it('immediately renders when mounted true then exits after delay on unmount', () => {
    const { result, rerender } = renderHook(({ mounted }) => useDelayedUnmount(mounted, 200), { initialProps: { mounted: true } });
    expect(result.current.shouldRender).toBe(true);
    expect(result.current.exiting).toBe(false);
    rerender({ mounted: false });
    expect(result.current.shouldRender).toBe(true);
    expect(result.current.exiting).toBe(true);
    act(() => { vi.advanceTimersByTime(199); });
    expect(result.current.shouldRender).toBe(true);
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
