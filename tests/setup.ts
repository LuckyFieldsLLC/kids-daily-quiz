import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';

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
