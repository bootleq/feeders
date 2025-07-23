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
  await expect(page).toHaveURL('/facts/1998-11-04_1/');
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

test('事實記錄 篩選', async ({ page }) => {
  await page.goto('/facts');
  await expect(page).toHaveTitle(/^事實記錄 - /);

  const sidebar = page.locator("div[data-role='sidebar']");
  const input = sidebar.getByLabel('包含');
  await input.fill('7 天'); // where `7` is in <span> for testing findRanges across nodes

  // Fact 1, 預期會被隱藏
  const fact1 = page.locator('[data-role="fact"]')
    .filter({ has: page.getByText('北縣流浪狗降幅全國第一') });
  await expect(fact1).toHaveCount(0);

  const fact2 = page.locator('[data-role="fact"]')
    .filter({ has: page.getByText('動保法第 7 次修法') });
  await expect(fact2).toBeInViewport();

  await expect(fact2).toHaveScreenshot('facts/text-filter-w-highlight.png');
});

test.describe('由網址進入獨占顯示：錯誤', () => {
  test('項目找不到', async ({ page }) => {
    const badSlug = '2010-01-27_120548213';
    await page.goto(`/facts/${badSlug}/`);
    await expect(page).toHaveTitle(/^事實記錄 - /);

    const alert = page.getByRole('alert').filter({ has: page.getByText(/無法跳到指定項目/) });
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText(new RegExp(`"${badSlug}" 可能已改名`));

    await alert.getByRole('button', { name: '關閉' }).click();
  });

  test('格式錯誤', async ({ page }) => {
    const badSlug = '623RP';
    await page.goto(`/facts/${badSlug}/`);
    await expect(page).toHaveTitle(/^事實記錄 - /);

    const alert = page.getByRole('alert').filter({ has: page.getByText(/網址不正確/) });
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText(new RegExp(`"${badSlug}" 無法辨識`));

    await alert.getByRole('button', { name: '關閉' }).click();
  });
});
