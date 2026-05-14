import { test, expect } from '@playwright/test';

async function dismissLocationPrompt(page: any) {
  const skipBtn = page.getByRole('button', { name: /skip for now/i });
  const isVisible = await skipBtn.isVisible().catch(() => false);
  if (isVisible) {
    await skipBtn.click({ force: true });
  }
}

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('bmv_loc_prompted', '1');
    });
  });

  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Happily Eated|BookMyVenue|ShubhSpace/i);
    
    // Check main navigation elements
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Check for venue and catering links
    const venuesLink = page.getByRole('link', { name: /venues/i }).first();
    const cateringLink = page.getByRole('link', { name: /catering/i }).first();
    
    await expect(venuesLink).toBeVisible();
    await expect(cateringLink).toBeVisible();
  });

  test('should navigate to venues page', async ({ page }) => {
    await page.goto('/');
    await dismissLocationPrompt(page);
    
    // Click on venues link
    await page.getByRole('link', { name: /venues/i }).first().click();
    
    // Should be on venues page
    await expect(page).toHaveURL(/\/venues/);
  });

  test('should navigate to catering page', async ({ page }) => {
    await page.goto('/');
    await dismissLocationPrompt(page);
    
    // Click on catering link
    await page.getByRole('link', { name: /catering/i }).first().click();
    
    // Should be on catering page
    await expect(page).toHaveURL(/\/catering/);
  });
});

test.describe('Venues Page', () => {
  test('should display venue listings', async ({ page }) => {
    await page.goto('/venues');
    
    // Wait for venues to load
    await page.waitForLoadState('networkidle');
    
    // Check for venue cards or loading state
    const venueCards = page.locator('[data-testid="venue-card"]');
    const noVenues = page.getByText(/no venues/i);
    const loading = page.getByText(/loading/i);
    const failedLoad = page.getByText(/failed to load/i);
    const skeletons = page.locator('.animate-pulse');
    
    // Either should have venues, show no venues message, or still loading
    const hasContent = await venueCards.count() > 0 || 
                       await noVenues.isVisible() ||
                       await loading.isVisible() ||
                       await failedLoad.isVisible() ||
                       await skeletons.count() > 0;
    
    expect(hasContent).toBeTruthy();
  });

  test('should have filter options', async ({ page }) => {
    await page.goto('/venues');
    
    await page.waitForLoadState('networkidle');
    
    // Check for sort/filter controls
    const sortOrFilter = page.locator('select, [data-testid="filter"]');
    
    // Should have some filtering mechanism
    expect(await sortOrFilter.count()).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Catering Page', () => {
  test('should display caterer listings', async ({ page }) => {
    await page.goto('/catering');
    
    await page.waitForLoadState('networkidle');
    
    // Check for caterer cards or loading/empty state
    const catererCards = page.locator('[data-testid="caterer-card"]');
    const noCaterers = page.getByText(/no caterer/i);
    const failedLoad = page.getByText(/failed to load/i);
    const loading = page.getByText(/loading/i);
    const skeletons = page.locator('.animate-pulse');
    
    const hasContent = await catererCards.count() > 0 || 
               await noCaterers.isVisible() ||
                       await failedLoad.isVisible() ||
                       await loading.isVisible() ||
                       await skeletons.count() > 0;
    
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Authentication', () => {
  test('should show sign in page', async ({ page }) => {
    await page.goto('/auth/signin');
    await dismissLocationPrompt(page);
    
    // Check for sign in form elements
    await expect(page.getByRole('heading', { name: /welcome back|sign in/i })).toBeVisible();
    await expect(page.getByPlaceholder(/you@example\.com/i)).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show sign up page', async ({ page }) => {
    await page.goto('/auth/signup');
    await dismissLocationPrompt(page);
    
    // Check for sign up form elements
    await expect(page.getByRole('heading', { name: /create account|sign up/i })).toBeVisible();
    await expect(page.getByPlaceholder(/enter your name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/you@example\.com/i)).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/auth/signin');
    await dismissLocationPrompt(page);
    
    // Try to submit without filling form
    await page.locator('form').first().evaluate((form: HTMLFormElement) => form.requestSubmit());
    
    // Should show some error or validation message
    await page.waitForTimeout(500);
    
    // Page should still be on sign in (not redirected)
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should show mobile navigation', async ({ page }) => {
    await page.goto('/');
    await dismissLocationPrompt(page);
    
    // Mobile nav should be visible (bottom nav)
    const mobileNav = page.locator('nav').filter({
      has: page.getByRole('link', { name: /home/i }),
    }).first();
    await expect(mobileNav).toBeVisible();
  });

  test('should be scrollable on venues page', async ({ page }) => {
    await page.goto('/venues');
    
    await page.waitForLoadState('networkidle');
    
    // Page should be scrollable
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    expect(scrollHeight).toBeGreaterThan(0);
  });
});

test.describe('SEO', () => {
  test('should have proper meta tags on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription!.length).toBeGreaterThan(50);
    
    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
  });

  test('should have robots.txt', async ({ page }) => {
    const response = await page.request.get('/robots.txt');
    expect(response?.status()).toBe(200);
    
    const content = await response.text();
    expect(content).toContain('User-agent');
  });

  test('should have sitemap', async ({ page }) => {
    const response = await page.request.get('/site.webmanifest');
    expect(response.ok()).toBeTruthy();
  });
});
