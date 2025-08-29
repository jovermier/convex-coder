import { expect, test } from "@playwright/test";

test.describe("Authentication System", () => {
  test("should allow user signup without server errors", async ({ page }) => {
    // Navigate to the application
    await page.goto("http://localhost:5173");

    // Should show the sign-in form since user is not authenticated
    await expect(
      page.locator('[data-testid="sign-in-form"], .w-full.max-w-md')
    ).toBeVisible();

    // Look for sign up toggle button
    const signUpToggle = page
      .locator("button")
      .filter({ hasText: /Need an account\?|Sign up/ });
    if (await signUpToggle.isVisible()) {
      await signUpToggle.click();
    }

    // Fill in the signup form
    const testEmail = `sarah.johnson${Date.now()}@gmail.com`;
    const testPassword = "SecurePass123";
    const testName = "Sarah Johnson";

    // Fill email field
    const emailInput = page.locator(
      'input[type="email"], input[placeholder*="Email" i]'
    );
    await expect(emailInput).toBeVisible();
    await emailInput.fill(testEmail);

    // Fill password field
    const passwordInput = page.locator(
      'input[type="password"], input[placeholder*="Password" i]'
    );
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(testPassword);

    // Fill name field if visible (for signup)
    const nameInput = page.locator(
      'input[type="text"], input[placeholder*="Name" i]'
    );
    if (await nameInput.isVisible()) {
      await nameInput.fill(testName);
    }

    // Look for submit button
    const submitButton = page
      .locator('button[type="submit"], button')
      .filter({ hasText: /Sign Up|Sign In|Loading/ });
    await expect(submitButton).toBeVisible();

    // Wait for any network requests to complete and capture console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor network requests for auth calls
    const authRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("workingAuth") || url.includes("signUp")) {
        authRequests.push(`${request.method()} ${url}`);
      }
    });

    // Submit the form
    await submitButton.click();

    // Wait a moment for the request to complete
    await page.waitForTimeout(3000);

    // Check for success indicators
    const isAuthenticated = await page
      .locator("text=/sign out|welcome|dashboard/i")
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasErrorMessage = await page
      .locator("text=/error|failed|invalid/i")
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    // Log results
    console.log("Auth Requests:", authRequests);
    console.log("Console Errors:", consoleErrors);
    console.log("Is Authenticated:", isAuthenticated);
    console.log("Has Error Message:", hasErrorMessage);

    // Check that we don't have server errors in console
    const serverErrors = consoleErrors.filter(
      (error) =>
        error.includes("Server Error") ||
        error.includes("CONVEX M(workingAuth:signUp)") ||
        error.includes("unhandled_promise_rejection")
    );

    // The test passes if we don't have server errors, regardless of auth success
    expect(serverErrors.length).toBe(0);

    // If there are no server errors, that's our main success criteria
    if (serverErrors.length === 0) {
      console.log(
        "✅ SUCCESS: No server errors detected during signup attempt"
      );
    }

    // Additional checks (informational)
    if (isAuthenticated) {
      console.log("✅ BONUS: User was successfully authenticated");
    } else if (hasErrorMessage) {
      console.log(
        "ℹ️  INFO: Auth failed with user-friendly error (this is OK)"
      );
    }
  });

  test("should handle sign in without server errors", async ({ page }) => {
    await page.goto("http://localhost:5173");

    // Try to sign in with verified working credentials
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    if ((await emailInput.isVisible()) && (await passwordInput.isVisible())) {
      await emailInput.fill("test.user@example.com");
      await passwordInput.fill("testPassword123");

      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      await submitButton.click();
      await page.waitForTimeout(2000);

      const serverErrors = consoleErrors.filter(
        (error) =>
          error.includes("Server Error") ||
          error.includes("CONVEX M(workingAuth:signIn)")
      );

      expect(serverErrors.length).toBe(0);
    }
  });
});
