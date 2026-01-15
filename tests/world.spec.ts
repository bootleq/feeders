import { test, expect } from '@playwright/test';
import { SITE_NAME } from '@/lib/utils';

test('世界地圖', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '世界地圖' }).click();
  await expect(page).toHaveTitle(/^世界地圖 - /);

  // 台北市南港區某地點
  await page.goto('/world/area/@25.0423929154,121.609446481');

  const map = await page.locator('.leaflet-container');
  const box = await map.boundingBox();
  if (!box) throw new Error('無法取得地圖容器區塊');

  const responsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname.startsWith('/api/spots/') && response.status() === 200;
  });

  // 拖曳地圖，動態載入圖塊
  const center = {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.move(center.x, center.y + 100, { steps: 10 });
  await page.mouse.up();

  const response = await responsePromise;

  // 上一頁
  await page.goBack();
  await expect(page).toHaveURL('/world/');
  await page.goBack();
  await expect(page).toHaveTitle(/^世界地圖 - /);
});
