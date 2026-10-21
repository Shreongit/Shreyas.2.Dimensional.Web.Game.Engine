import { test, expect } from '@playwright/test';

const base = 'http://127.0.0.1:4173';
test.beforeEach(async ({ page }) => { await page.goto(`${base}/scripts/browser/validation.html`); await page.waitForFunction(() => document.documentElement.dataset.validation !== undefined); });
test('engine integration validation passes', async ({ page, browserName }) => {
  const data = JSON.parse(await page.locator('#results').innerText());
  expect(data.failed, `${browserName}: ${JSON.stringify(data.results.filter(r => !r.ok))}`).toBe(0);
});
test('demo loads without uncaught browser errors', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(String(error)));
  await page.goto(`${base}/examples/box-mover/`); await expect(page.locator('#game')).toBeVisible();
  await page.waitForTimeout(250); expect(errors).toEqual([]);
});
for (const viewport of [{width:800,height:600,dpr:1},{width:1365,height:768,dpr:1},{width:1920,height:1080,dpr:1},{width:390,height:844,dpr:2},{width:1440,height:900,dpr:3}]) {
  test(`viewport and DPR ${viewport.width}x${viewport.height}@${viewport.dpr}`, async ({ browser }) => {
    const context = await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:viewport.dpr});
    const page = await context.newPage(); await page.goto(`${base}/scripts/browser/validation.html`);
    await page.waitForFunction(() => document.documentElement.dataset.validation !== undefined);
    const info = await page.evaluate(() => ({dpr:devicePixelRatio, canvas:document.querySelector('canvas').getBoundingClientRect().toJSON(), validation:JSON.parse(document.querySelector('#results').innerText)}));
    expect(info.dpr).toBe(viewport.dpr); expect(info.canvas.width).toBeGreaterThan(0); expect(info.canvas.height).toBeGreaterThan(0); expect(info.validation.failed).toBe(0);
    await context.close();
  });
}
