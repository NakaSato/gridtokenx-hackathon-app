import { test, expect } from '@playwright/test';

test.describe('DCA Trading Flow', () => {
  test('should register, login, create, pause, resume, and cancel a DCA order', async ({ page }) => {
    // Use a high timeout for e2e flow touching the db
    test.setTimeout(60000);

    const timestamp = Date.now();
    const username = `dca_ui_${timestamp}`;
    const email = `dca_ui_${timestamp}@example.com`;
    const password = 'Test123!@#';
    const dcaName = `My DCA ${timestamp}`;

    // 1. Visit Homepage
    await page.goto('/');

    // Wait a bit for hydrations
    await page.waitForTimeout(1000);

    // 2. Sign Up
    await page.locator('button', { hasText: /^Connect$/ }).first().click();
    // Wait for modal animation
    await page.waitForTimeout(500);
    await page.click('button:has-text("Or sign in with email")');
    await page.click('button:has-text("Sign up")');

    await page.fill('#signup-username', username);
    await page.fill('#signup-first-name', 'Play');
    await page.fill('#signup-last-name', 'Wright');
    await page.fill('#signup-email', email);
    await page.fill('#signup-password', password);
    await page.fill('#signup-confirm-password', password);
    await page.locator('#agree-terms').click({ force: true });

    await page.click('button:has-text("Sign Up")');

    // Wait for registration success toast
    await expect(page.locator('text=Registration successful').first()).toBeVisible({ timeout: 15000 });

    // Wait for post-registration redirect
    await page.waitForTimeout(2000);

    // 3. Log In
    await page.locator('button', { hasText: /^Connect$/ }).first().click();
    await page.waitForTimeout(1000); // Keep this wait for modal animation

    // The modal remembers its last state ('signup'). We need to click the "Sign in" link at the bottom.
    // The submit button says "Sign Up", but the link says "Sign in". We can click the exact text "Sign in".
    await page.locator('button', { hasText: /^Sign in$/ }).click();

    // Fill login
    await page.fill('#username', username);
    await page.fill('#password', password);
    // The modal login button has text "Sign In" or "Signing In..."
    // Use a broader text match or ID if possible. has-text can match any node containing it.
    // We can just use the exact text or type=submit
    // There is a form with submit, so let's hit the submit button
    await page.locator('button[type="submit"]:has-text("Sign In")').click();

    // Wait for login toast
    await expect(page.locator(`text=Welcome back, ${username}!`)).toBeVisible({ timeout: 15000 });

    // Wait for the auth context to apply and the page to fully load the trading interface
    await page.waitForTimeout(2000);

    // 4. Navigate to DCA form
    // Find the "DCA" tab. It might be in the OrderTypeTabs component.
    await page.click('button:has-text("DCA")');
    await expect(page.locator('text=Strategy Name')).toBeVisible({ timeout: 5000 });

    // 5. Create a Strategy
    await page.fill('input[placeholder="e.g. Daily Solar Buy"]', dcaName);
    await page.fill('input[placeholder="0.00"]', '10.5');

    // Set interval to Daily
    // Clicking the "Daily" button in frequency config
    await page.click('button:has-text("Daily")');

    // Submit form
    await page.click('button:has-text("Start Buying Strategy")');

    // Check for success message inside form or toast
    await expect(page.locator('text=DCA strategy created')).toBeVisible({ timeout: 15000 });

    // Workaround: The RecurringOrdersList doesn't auto-fetch after form submit yet
    await page.reload();
    // Wait for the auth context and data to fetch again
    await page.waitForTimeout(2000);

    // The page reloaded, so it's back on the default "Buy" tab. Click the DCA tab to see the list.
    await page.click('button:has-text("DCA")');
    await page.waitForTimeout(1000);

    // 6. Check Active Strategy in the List
    // The list is on the same page, we look for the name
    const strategyCard = page.locator(`text=${dcaName}`).locator('xpath=./ancestor::div[contains(@class, "group relative")]');

    await expect(strategyCard).toBeVisible({ timeout: 10000 });

    // Verify it is active
    await expect(strategyCard.locator('text=active')).toBeVisible();

    // 7. Pause Strategy
    await strategyCard.locator('button[title="Pause Strategy"]').click();
    await expect(page.locator('text=Order paused successfully')).toBeVisible({ timeout: 15000 });
    await expect(strategyCard.locator('text=paused')).toBeVisible({ timeout: 15000 });

    // 8. Resume Strategy
    await strategyCard.locator('button[title="Resume Strategy"]').click();
    await expect(page.locator('text=Order resumed successfully')).toBeVisible({ timeout: 15000 });
    await expect(strategyCard.locator('text=active')).toBeVisible({ timeout: 15000 });

    // 9. Cancel Strategy
    await strategyCard.locator('button[title="Cancel Strategy"]').click();
    await expect(page.locator('text=Order canceled successfully')).toBeVisible({ timeout: 15000 });

    // Verify it is cancelled
    await expect(strategyCard.locator('text=cancelled')).toBeVisible({ timeout: 5000 });
  });
});
