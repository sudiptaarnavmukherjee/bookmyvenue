import { test, expect } from '@playwright/test';

test.describe('Utility Pages Hardening', () => {
  test('wishlist redirects unauthenticated users to sign in', async ({ page }) => {
    await page.goto('/wishlist');

    await expect(page).toHaveURL(/\/auth\/signin|\/login|\/signin/i);
  });

  test('bookings redirects unauthenticated users to sign in', async ({ page }) => {
    await page.goto('/bookings');

    await expect(page).toHaveURL(/\/auth\/signin|\/login|\/signin/i);
  });

  test('venues compare handles empty selection gracefully', async ({ page }) => {
    await page.goto('/venues/compare');

    await expect(page.getByRole('heading', { name: /no venues to compare/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /browse venues/i })).toBeVisible();
  });

  test('catering compare handles empty selection gracefully', async ({ page }) => {
    await page.goto('/catering/compare');

    await expect(page.getByRole('heading', { name: /no caterers to compare/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /browse caterers/i })).toBeVisible();
  });

  test('public utility pages remain responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/venues/compare');
    await expect(page.getByText(/no venues to compare/i)).toBeVisible();

    await page.goto('/catering/compare');
    await expect(page.getByText(/no caterers to compare/i)).toBeVisible();
  });
});
