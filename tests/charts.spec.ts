import { test, expect } from '@playwright/test';
import { SITE_NAME } from '@/lib/utils';

test('圖表', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '圖表' }).click();
  await expect(page).toHaveTitle(/^圖表頁 目錄 - /);

  // 上一頁
  await page.goBack();
  await expect(page).toHaveTitle(SITE_NAME);
});
