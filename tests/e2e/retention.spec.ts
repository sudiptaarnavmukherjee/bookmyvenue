import { expect, test } from '@playwright/test';

test.describe('Retention Automation Hardening', () => {
  test('retention admin page redirects unauthenticated users to sign in', async ({ page }) => {
    await page.goto('/admin/retention');

    await expect(page).toHaveURL(/\/auth\/signin|\/login|\/signin/i);
  });

  test('retention health endpoint responds successfully', async ({ request }) => {
    const response = await request.get('/api/admin/retention/trigger');

    expect(response.ok()).toBeTruthy();
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        status: 'healthy',
        service: 'retention-automation',
      })
    );
  });

  test('retention trigger endpoint rejects unauthenticated post requests', async ({ request }) => {
    const response = await request.post('/api/admin/retention/trigger');

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: expect.stringMatching(/unauthorized/i),
      })
    );
  });

  test('retention settings endpoint rejects unauthenticated access', async ({ request }) => {
    const response = await request.get('/api/admin/retention/settings');

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Unauthorized',
    });
  });
});