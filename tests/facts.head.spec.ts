import { test, expect } from '@playwright/test';
import { SITE_NAME } from '@/lib/utils';

test.use({ headless: false });

test('獨占顯示，文字片段親和性', async ({ page }) => {
  await page.goto('/facts/2010-01-27_74/#:~:text=享有繁殖的權利');
  await expect(page).toHaveTitle(/動保法第 7 次修法/);
  await expect(page).toHaveURL('/facts/2010-01-27_74/');

  const dialog = page.getByRole('dialog').filter({ has: page.getByText('因為那是他的權利') });

  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveScreenshot('facts/text-targeted-dialog.png');
});
