import { test, expect } from '@playwright/test';

async function withoutWebGL(page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl' ? null : original.call(this, type, ...args);
    };
  });
}

test('real WebGL scene renders, respects reduced motion, animates and pauses', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.scene-caption')).toContainText('quiet 3D daydream', { timeout: 60000 });
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByLabel('Pause scene animation')).toHaveCount(0);
  const capture = () => page.screenshot({ clip: { x: 530, y: 100, width: 460, height: 650 } });
  const stillA = await capture();
  await page.waitForTimeout(200);
  const stillB = await capture();
  expect(stillA.equals(stillB)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.getByLabel('Pause scene animation')).toBeVisible();
  await page.waitForTimeout(300);
  await page.getByLabel('Pause scene animation').click();
  await page.waitForTimeout(150);
  const movingA = await capture();
  await page.getByLabel('Play scene animation').click();
  await page.mouse.move(900, 350); await page.waitForTimeout(350);
  await page.getByLabel('Pause scene animation').click();
  await page.waitForTimeout(150);
  const movingB = await capture();
  expect(movingA.equals(movingB)).toBe(false);
  await expect(page.getByLabel('Play scene animation')).toBeVisible();
  await page.waitForTimeout(250);
  const pausedA = await capture(); await page.waitForTimeout(200); const pausedB = await capture();
  expect(pausedA.equals(pausedB)).toBe(true);
  expect(errors).toEqual([]);
});

test('WebGL failure shows a photographic alternative and working calls to action', async ({ page }) => {
  await withoutWebGL(page); await page.goto('/');
  await expect(page.locator('.fallback-photo img')).toBeVisible();
  expect(await page.locator('.fallback-photo img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.getByRole('link', { name: 'Plan Your Wedding', exact: true }).click();
  await expect(page).toHaveURL(/#inquire$/);
  await expect(page.getByRole('button', { name: 'Prepare My Inquiry' })).toBeInViewport();
});

test('service details, gallery filters, lightbox navigation and focus restoration', async ({ page }) => {
  await withoutWebGL(page); await page.goto('/');
  const service = page.getByRole('button', { name: /01 Full wedding planning/ });
  await service.click(); await expect(service).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#service-0')).toContainText('venue research');
  await service.click(); await expect(page.locator('#service-0')).toBeHidden();
  await page.getByRole('button', { name: 'Destination dreams', exact: true }).click();
  await expect(page.locator('.gallery-card')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Destination dreams', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const opener = page.getByRole('button', { name: 'View Where the sea meets forever' });
  await opener.click(); await expect(page.getByRole('dialog', { name: 'Wedding inspiration gallery' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close gallery' })).toBeFocused();
  await page.getByRole('button', { name: 'Next image' }).click();
  await expect(page.locator('.lightbox h2')).toHaveText('The little things, forever');
  await page.keyboard.press('ArrowLeft'); await expect(page.locator('.lightbox h2')).toHaveText('Where the sea meets forever');
  await page.keyboard.press('Escape'); await expect(page.locator('.lightbox')).toHaveCount(0); await expect(opener).toBeFocused();
});

test('inquiry validates, downloads real details and makes no submission request', async ({ page }) => {
  await withoutWebGL(page); await page.goto('/');
  await page.getByRole('button', { name: 'Prepare My Inquiry' }).click();
  await expect(page.getByText('Please tell us your name.')).toBeVisible(); await expect(page.locator('#name')).toBeFocused();
  await page.getByLabel('Your name').fill('Jamie Lee'); await page.getByLabel('Email address').fill('jamie@example.com');
  await page.getByLabel('Wedding date').fill('2099-06-14'); await page.getByLabel('Dream location').fill('Lake Como');
  await page.getByLabel('Estimated guests').fill('85'); await page.getByLabel('Budget range').selectOption('$60,000 – $100,000');
  await page.getByLabel('Tell us what you’re dreaming of').fill('An intimate garden celebration with candlelight.');
  const postRequests = []; page.on('request', r => { if (r.method() === 'POST') postRequests.push(r.url()); });
  await page.getByRole('button', { name: 'Prepare My Inquiry' }).click();
  await expect(page.getByRole('status')).toContainText('It has not been sent');
  const downloadEvent = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download your inquiry' }).click();
  const download = await downloadEvent; expect(download.suggestedFilename()).toBe('ever-after-wedding-inquiry.txt');
  const stream = await download.createReadStream(); const chunks = []; for await (const chunk of stream) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString(); expect(text).toContain('Jamie Lee'); expect(text).toContain('Lake Como'); expect(text).toContain('has not been sent'); expect(postRequests).toEqual([]);
  await page.getByLabel('Your name').fill('Jamie'); await expect(page.getByRole('status')).toHaveCount(0);
});

test('mobile navigation, small-screen layouts, images and credits work', async ({ page }) => {
  await withoutWebGL(page); await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.getByLabel('Open navigation').click(); await expect(page.getByLabel('Close navigation')).toBeVisible();
  await page.locator('.nav').getByRole('link', { name: 'Our services' }).click(); await expect(page).toHaveURL(/#services$/);
  await expect(page.getByLabel('Open navigation')).toHaveAttribute('aria-expanded', 'false');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Image & asset credits' }).click(); await expect(page.locator('#credits')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('#credits')).toBeHidden();
  for (const img of await page.locator('img').all()) { await img.scrollIntoViewIfNeeded(); await expect(img).toHaveJSProperty('complete', true); expect(await img.evaluate(i => i.naturalWidth)).toBeGreaterThan(0); }
});
