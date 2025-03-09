import { test, expect } from '@playwright/test';

test.use({ headless: false });

test('文字片段親和性', async ({ page }) => {
  await page.goto('/laws/#:~:text=非經主管機關許可');
  await expect(page).toHaveTitle(/^法規 - /);
  await expect(page).toHaveURL('/laws/');

  const sect = page.locator('[data-role="law"]')
    .filter({ has: page.getByText('捕捉動物，不得使用下列方法') });

  await expect(sect).toBeInViewport();
  await expect(sect).toHaveScreenshot('laws/text-targeted.png');
});
