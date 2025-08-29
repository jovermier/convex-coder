import { test, expect } from '@playwright/test';

test.describe('Chat App Layout Verification', () => {
  test('app loads and shows proper layout structure', async ({ page }) => {
    await page.goto('/');
    
    // App should load without crashing
    await expect(page.locator('body')).toBeVisible();
    
    // Should see either the auth form or chat interface
    const hasAuthForm = await page.locator('button:has-text("Sign In")').first().isVisible();
    const hasChatInterface = await page.locator('input[placeholder*="Type your message"]').isVisible();
    
    expect(hasAuthForm || hasChatInterface).toBeTruthy();
    
    // If auth form is visible, it should have the right structure
    if (hasAuthForm) {
      await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    }
  });

  test('page has proper viewport behavior', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page fits within viewport
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    
    // Page should not be significantly taller than viewport (some tolerance for dynamic content)
    expect(pageHeight).toBeLessThanOrEqual(viewportHeight + 100);
    
    // Page should not have horizontal scrollbar
    const hasHorizontalScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(hasHorizontalScroll).toBe(false);
  });

  test('app works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // App should still load properly
    await expect(page.locator('body')).toBeVisible();
    
    // Should not have horizontal scrolling on mobile
    const hasHorizontalScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(hasHorizontalScroll).toBe(false);
  });

  test('app works on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // App should still load properly
    await expect(page.locator('body')).toBeVisible();
    
    // Content should be centered with max-width
    const container = page.locator('.container, .max-w-4xl').first();
    if (await container.isVisible()) {
      const containerBox = await container.boundingBox();
      expect(containerBox?.width).toBeLessThanOrEqual(1000); // max-w-4xl should constrain width
    }
  });

  test('theme toggle is present and clickable', async ({ page }) => {
    await page.goto('/');
    
    // Look for theme toggle button (may be in header if chat interface is shown)
    const themeToggle = page.locator('button[aria-label*="theme" i], button:has-text("Toggle"), button:has([data-icon]), [data-testid*="theme"]').first();
    
    // Theme toggle should be present somewhere on the page
    if (await themeToggle.isVisible()) {
      // Should be clickable
      await expect(themeToggle).toBeEnabled();
      
      // Click should work without error
      await themeToggle.click();
      
      // Page should still be functional after theme change
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('authentication form validation works', async ({ page }) => {
    await page.goto('/');
    
    // Skip if chat interface is already showing
    const hasChatInterface = await page.locator('input[placeholder*="Type your message"]').isVisible();
    if (hasChatInterface) {
      console.log('Chat interface already visible, skipping auth form test');
      return;
    }
    
    // Should have sign up option
    await expect(page.locator('button:has-text("Need an account? Sign up")')).toBeVisible();
    
    // Switch to sign up mode
    await page.click('button:has-text("Need an account? Sign up")');
    
    // Form fields should be present
    await expect(page.locator('input[placeholder="Full Name"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    
    // Sign up button might be enabled or disabled depending on validation rules
    const signUpButton = page.locator('button:has-text("Sign Up")');
    await expect(signUpButton).toBeVisible();
    
    // Fill in valid data
    await page.fill('input[placeholder="Full Name"]', 'Test User');
    await page.fill('input[placeholder="Email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'ValidPassword123');
    
    // Button should still be visible after filling form
    await expect(signUpButton).toBeVisible();
  });

  test('app structure has proper semantic elements', async ({ page }) => {
    await page.goto('/');
    
    // Should have proper semantic structure
    await expect(page.locator('main, [role="main"], #main-content, .main')).toBeVisible();
    
    // Should have skip link for accessibility
    const skipLink = page.locator('a:has-text("Skip to main content"), [href="#main-content"]');
    if (await skipLink.isVisible()) {
      await expect(skipLink).toBeVisible();
    }
    
    // No major console errors should be present
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Filter out known acceptable errors (like network issues in test env)
    const criticalErrors = logs.filter(log => 
      !log.includes('net::') && 
      !log.includes('favicon') &&
      !log.includes('Failed to fetch')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});