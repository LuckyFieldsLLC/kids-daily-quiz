import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as tts from '../../utils/tts';

// Helper to mock speechSynthesis environment
const buildSynth = () => {
  const speak = vi.fn();
  const cancel = vi.fn();
  let speaking = false;
  return {
    api: {
      speak: (u: any) => { speaking = true; speak(u); },
      cancel: () => { speaking = false; cancel(); },
      get speaking() { return speaking; }
    },
    speak, cancel,
    setSpeaking: (v: boolean) => { speaking = v; }
  };
};

// Preserve originals
const originalSynth = (globalThis as any).speechSynthesis;
const originalUtter = (globalThis as any).SpeechSynthesisUtterance;

beforeEach(() => {
  // reset globals before each test
  (globalThis as any).speechSynthesis = undefined;
  (globalThis as any).SpeechSynthesisUtterance = undefined;
});

describe('tts utilities', () => {
  test('isSupported false when APIs absent', () => {
    expect(tts.isSupported()).toBe(false);
  });

  test('speak returns false if not supported', () => {
    expect(tts.speak('hello')).toBe(false);
  });

  test('basic speak true & passes utterance with clamped options', () => {
    const mock = buildSynth();
    (globalThis as any).speechSynthesis = mock.api;
    const utterCtor = vi.fn(function(this: any, text: string){ this.text = text; });
    (globalThis as any).SpeechSynthesisUtterance = utterCtor as any;

    const ok = tts.speak('こんにちは', { rate: 10, pitch: 3 }); // excessive values should clamp
    expect(ok).toBe(true);
    expect(utterCtor).toHaveBeenCalled();
    const inst = (utterCtor.mock.instances[0] as any);
    expect(inst.rate).toBeLessThanOrEqual(2);
    expect(inst.pitch).toBeLessThanOrEqual(2);
    expect(mock.speak).toHaveBeenCalled();
  });

  test('toggle cancels when already speaking', () => {
    const mock = buildSynth();
    (globalThis as any).speechSynthesis = mock.api;
    (globalThis as any).SpeechSynthesisUtterance = function(this: any, text: string){ this.text = text; } as any;

    // first start
    let result = tts.toggle('A');
    expect(result).toEqual({ started: true, supported: true });
    // simulate speaking state
    mock.setSpeaking(true);
    result = tts.toggle('B');
    expect(result).toEqual({ started: false, supported: true });
    expect(mock.cancel).toHaveBeenCalled();
  });

  test('cancel safely no-ops when unsupported', () => {
    expect(() => tts.cancel()).not.toThrow();
  });
});

afterAll(() => {
  // restore
  (globalThis as any).speechSynthesis = originalSynth;
  (globalThis as any).SpeechSynthesisUtterance = originalUtter;
});
