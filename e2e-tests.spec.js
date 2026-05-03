const { test, expect } = require('@playwright/test');

test.describe('Complete E2E Test Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  // HAPPY PATHS
  test('HP1: Login success redirects to dashboard', async ({ page }) => {
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'correct');
    await page.click('#login');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('HP2: Add to cart and checkout', async ({ page }) => {
    await page.click('[data-testid="product-1"]');
    await page.click('#add-to-cart');
    await page.click('#cart');
    await page.click('#checkout');
    await expect(page.locator('.order-success')).toBeVisible();
  });

  // NEGATIVE CASES
  test('NC1: Wrong password shows error', async ({ page }) => {
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'wrong');
    await page.click('#login');
    await expect(page.locator('.error')).toContainText(/invalid/i);
  });

  test('NC2: Empty email shows validation', async ({ page }) => {
    await page.fill('#password', 'pass');
    await page.click('#login');
    await expect(page.locator('.error')).toBeVisible();
  });

  test('NC3: 5 failed attempts lock account', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.fill('#email', 'user@example.com');
      await page.fill('#password', 'wrong');
      await page.click('#login');
    }
    await page.fill('#password', 'wrong');
    await page.click('#login');
    await expect(page.locator('.locked')).toBeVisible();
  });

  // EDGE CASES
  test('EC1: Email with spaces', async ({ page }) => {
    await page.fill('#email', '  user@example.com  ');
    await page.fill('#password', 'correct');
    await page.click('#login');
    await expect(page.locator('.dashboard')).toBeVisible();
  });

  test('EC2: 255 character email', async ({ page }) => {
    const longEmail = 'a'.repeat(200) + '@example.com';
    await page.fill('#email', longEmail);
    await page.fill('#password', 'pass');
    await page.click('#login');
    await expect(page.locator('.error')).toBeVisible();
  });

  test('EC3: SQL injection attempt', async ({ page }) => {
    await page.fill('#email', "admin' OR '1'='1");
    await page.fill('#password', "anything");
    await page.click('#login');
    await expect(page.locator('.error')).toBeVisible();
  });

  test('EC4: XSS attempt in comment', async ({ page }) => {
    await page.goto('http://localhost:3000/comments');
    await page.fill('input[name="comment"]', '<script>alert("xss")</script>');
    await page.click('button[type="submit"]');
    await expect(page.locator('li')).toContainText('<script>');
  });
});
