import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as ls from '../../utils/localStorageManager';

// Simple in-memory mock (allows injecting failures)
class MemoryStorage implements Storage {
  private data = new Map<string,string>();
  length = 0;
  quotaFail = false;
  getItem(key: string): string | null { return this.data.has(key) ? this.data.get(key)! : null; }
  setItem(key: string, value: string): void { if (this.quotaFail) { const e: any = new Error('QuotaExceededError'); e.name='QuotaExceededError'; throw e; } this.data.set(key,value); this.length=this.data.size; }
  removeItem(key: string): void { this.data.delete(key); this.length=this.data.size; }
  clear(): void { this.data.clear(); this.length=0; }
  key(index: number): string | null { return Array.from(this.data.keys())[index] ?? null; }
}

const originalLocalStorage = globalThis.localStorage;
let mem: MemoryStorage;

beforeEach(() => {
  mem = new MemoryStorage();
  // @ts-ignore
  globalThis.localStorage = mem;
});

// Helper for valid AppSettings object
const validSettings = () => ({
  storageMode: 'local' as const,
  dbConfig: {},
  apiKeys: { gemini: 'g', openai: 'o' },
  display: { fontSize: '標準' as const },
  appearance: { appName: 'KidsQuiz', appIcon: '⭐', appTheme: 'blue' as const },
  apiProvider: 'gemini' as const,
  models: { geminiModel: 'gemini-1.5-flash' as const, openaiModel: 'gpt-4o-mini' as const }
});

describe('localStorageManager settings', () => {
  test('saveSettings / getSettings success', () => {
    const s = validSettings();
    ls.saveSettings(s);
    expect(ls.getSettings()).toEqual(s);
  });

  test('saveSettings quota exceeded handled gracefully', () => {
    mem.quotaFail = true;
    const s = validSettings();
    expect(() => ls.saveSettings(s)).not.toThrow();
    expect(ls.getSettings()).toBe(null); // nothing stored
  });

  test('getSettings broken JSON returns null', () => {
    mem.setItem(ls.SETTINGS_KEY, '{ broken json');
    expect(ls.getSettings()).toBeNull();
  });
});

describe('localStorageManager quizzes', () => {
  test('getQuizzes empty returns []', async () => {
    const list = await ls.getQuizzes();
    expect(list).toEqual([]);
  });

  test('getQuizzes broken JSON resets storage and returns []', async () => {
    mem.setItem(ls.QUIZZES_KEY, '{ bad json');
    const list = await ls.getQuizzes();
    expect(list).toEqual([]);
    expect(mem.getItem(ls.QUIZZES_KEY)).toBeNull();
  });

  test('createQuiz then updateQuiz pathway', async () => {
    const quiz = await ls.createQuiz({ question: 'Q', answer: 'A', options: [{ text: 'A'},{ text:'B'}], is_active: true, difficulty:2, fun_level:2 });
    expect(quiz.id).toBeTruthy();
    const updated = await ls.updateQuiz({ ...quiz, question: 'Q2' });
    expect(updated.question).toBe('Q2');
    const list = await ls.getQuizzes();
    expect(list[0].question).toBe('Q2');
  });

  test('updateQuiz not found throws', async () => {
    await expect(ls.updateQuiz({ id: 'x', question:'q', answer:'a', options:[{ text:'a'}], is_active:true, difficulty:2, fun_level:2, created_at:new Date().toISOString(), updated_at:new Date().toISOString() })).rejects.toThrow('Quiz not found');
  });

  test('deleteQuiz not found throws', async () => {
    await expect(ls.deleteQuiz('zzz')).rejects.toThrow('Quiz not found for deletion');
  });
});

afterAll(() => {
  // restore
  // @ts-ignore
  globalThis.localStorage = originalLocalStorage;
});
