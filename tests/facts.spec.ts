import { test, expect } from '@playwright/test';
import { SITE_NAME } from '@/lib/utils';

test('事實記錄', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(SITE_NAME);

  await page.getByRole('link', { name: '事實' }).click();
  await expect(page).toHaveTitle(/^事實記錄 - /);

  // Fact 1, 連結到錨點
  const fact1 = page.locator('[data-role="fact"]')
    .filter({ has: page.getByText('北縣流浪狗降幅全國第一') });

  await fact1.scrollIntoViewIfNeeded();
  await fact1.hover();
  await fact1.getByRole('link', { name: '錨點連結' }).click();
  await expect(page).toHaveURL('/facts/#fact-2009-08-11_65');

  // Fact 2, 開啟 dialog
  const fact2 = page.locator('[data-role="fact"]')
    .filter({ has: page.getByText('動物保護法（動保法）立法通過') });

  await fact2.scrollIntoViewIfNeeded();
  await fact2.hover();
  await fact2.getByRole('link', { name: '獨占顯示' }).click();
  await expect(
    page.getByRole('dialog').filter({ has: page.getByText('動物保護法（動保法）立法通過') })
  ).toBeVisible();
  await expect(page).toHaveURL('/facts/1998-11-04_1');
  await expect(fact1).not.toBeInViewport();

  // 上一頁，捲動回 Fact 1
  await page.goBack();
  await expect(page).toHaveURL('/facts/#fact-2009-08-11_65');
  await expect(fact1).toBeInViewport();

  // 用「上一頁」返回首頁
  await page.goBack();
  await page.goBack();
  await expect(page).toHaveTitle(SITE_NAME);
});
