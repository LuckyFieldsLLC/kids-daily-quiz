import { test, expect } from '@playwright/test';

const GEMINI_KEY = process.env.E2E_GEMINI_KEY; // Optional for real AI call

test.describe('Quiz end-to-end flow', () => {
  test('settings -> AI generate -> save -> history (smoke)', async ({ page }) => {
    test.skip(!GEMINI_KEY, 'E2E_GEMINI_KEY not provided');

    await page.goto('/');

    // Open settings
    await page.getByRole('button', { name: /設定/ }).click();
    await page.getByLabel('Gemini APIキー').fill(GEMINI_KEY!);
    await page.getByRole('button', { name: '保存' }).click();

    // Open AI generate
    await page.getByRole('button', { name: /AIで作成/ }).click();
    await page.getByRole('button', { name: '生成' }).click();

    // Wait for form modal (question textarea)
    const textarea = page.getByLabel('問題文');
    await expect(textarea).toBeVisible();

    // Fill answer if empty
    const answerInput = page.getByLabel('正解');
    const val = await answerInput.inputValue();
    if (!val) {
      await answerInput.fill('テスト');
    }

    await page.getByRole('button', { name: '保存' }).click();

    // Navigate to history page
    await page.getByRole('link', { name: '履歴' }).click();
    await expect(page).toHaveURL(/history/);
  });
});
