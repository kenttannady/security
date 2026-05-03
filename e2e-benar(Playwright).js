// ✅ BENAR – E2E dengan happy, edge, negative
const { test, expect } = require('@playwright/test');

test.describe('E2E Login - Complete Suite', () => {

  // ========== HAPPY PATH ==========
  test('Happy: Login with correct credential', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'correct-password');
    await page.click('#login');
    await expect(page.locator('.dashboard')).toBeVisible();
    await expect(page.locator('.welcome-msg')).toContainText('Welcome user@example.com');
  });

  // ========== NEGATIVE CASE ==========
  test('Negative: Wrong password shows error', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'wrong-password');
    await page.click('#login');
    await expect(page.locator('.error-msg')).toBeVisible();
    await expect(page.locator('.error-msg')).toContainText(/invalid|wrong/i);
    // Pastikan tidak tetap masuk ke dashboard
    await expect(page.locator('.dashboard')).not.toBeVisible();
  });

  // ========== EDGE CASE #1: Empty fields ==========
  test('Edge: Empty email shows validation', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('#password', 'anything');
    await page.click('#login');
    // Browser validation atau server validation
    await expect(page.locator('.error-msg').first()).toBeVisible();
  });

  // ========== EDGE CASE #2: Very long email (255 chars) ==========
  test('Edge: Extremely long email', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    const longEmail = 'a'.repeat(200) + '@example.com';
    await page.fill('#email', longEmail);
    await page.fill('#password', 'pass');
    await page.click('#login');
    // Harusnya tetap handle dengan baik, tidak crash
    await expect(page.locator('.error-msg')).toBeVisible();
  });

  // ========== NEGATIVE CASE: Multiple failures then lock ==========
  test('Negative: 5 failed attempts then account locked', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Coba gagal 5 kali
    for (let i = 0; i < 5; i++) {
      await page.fill('#email', 'user@example.com');
      await page.fill('#password', 'wrong');
      await page.click('#login');
      await expect(page.locator('.error-msg')).toBeVisible();
    }
    
    // Percobaan ke-6
    await page.fill('#password', 'wrong');
    await page.click('#login');
    await expect(page.locator('.account-locked')).toBeVisible();
    await expect(page.locator('.account-locked')).toContainText(/locked|blocked/i);
  });

  // ========== EDGE CASE: SQL injection attempt ==========
  test('Edge: SQL injection attempt should not bypass login', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', "admin' OR '1'='1");
    await page.fill('#password', "anything' OR '1'='1");
    await page.click('#login');
    // Harusnya tetap gagal (karena aplikasi aman)
    await expect(page.locator('.error-msg')).toBeVisible();
  });
});
