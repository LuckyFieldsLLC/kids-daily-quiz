import '@testing-library/jest-dom';
import { beforeEach, afterEach, afterAll, expect } from 'vitest';

// JSDOM polyfills / globals adjustments if needed
// Example: crypto.randomUUID mock for environments lacking it
if (!('randomUUID' in crypto)) {
  // @ts-ignore
  crypto.randomUUID = () => Math.random().toString(36).slice(2);
}

// Reset localStorage before each test for isolation
beforeEach(() => {
  localStorage.clear();
});

// --- Optional diagnostics ---
// Enable via env vars in PowerShell (example):
// $env:VITEST_HEARTBEAT=1; $env:VITEST_DIAG_HANDLES=1; $env:VITEST_TRACE_TESTS=1; npm run test:serial

declare const global: any;

// Heartbeat: print a timestamp every N seconds so "停止に見える" 状態か判別しやすくする
if (!global.__vitestHeartbeat && process.env.VITEST_HEARTBEAT) {
  const intervalMs = Number(process.env.VITEST_HEARTBEAT_INTERVAL || 10000);
  const start = Date.now();
  const timer = setInterval(() => {
    const up = ((Date.now() - start) / 1000).toFixed(1);
    const handles = (process as any)._getActiveHandles?.();
    const reqs = (process as any)._getActiveRequests?.();
    const hCount = Array.isArray(handles) ? handles.length : 'n/a';
    const rCount = Array.isArray(reqs) ? reqs.length : 'n/a';
    const extra = process.env.VITEST_DIAG_HANDLES ? ` [handles=${hCount} requests=${rCount}]` : '';
    // Keep it short and single-line for readability
    console.log(`[vitest][heartbeat] +${up}s${extra}`);
    if (process.env.VITEST_DIAG_HANDLES) {
      // Print minimal handle types to locate offenders without flooding
      if (Array.isArray(handles)) {
        const kinds = handles.map((h: any) => (h?.constructor?.name || typeof h)).slice(0, 10);
        console.log(`[vitest][handles] ${kinds.join(', ')}${handles.length > 10 ? ' …' : ''}`);
      }
    }
  }, intervalMs);
  // Expose to clear on teardown
  global.__vitestHeartbeat = timer;
  afterAll(() => clearInterval(timer));
  process.on('exit', () => clearInterval(timer));
}

// Trace per-test start/end (noisy). Enable only when investigating.
if (process.env.VITEST_TRACE_TESTS) {
  beforeEach(() => {
    try {
      // Vitest provides Jest-compatible expect state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const name = (expect as any).getState?.().currentTestName;
      if (name) console.log(`[vitest][case:start] ${name}`);
    } catch {}
  });
  afterEach(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const name = (expect as any).getState?.().currentTestName;
      if (name) console.log(`[vitest][case:end]   ${name}`);
    } catch {}
  });
}
