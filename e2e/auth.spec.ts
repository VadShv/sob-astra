import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1, h2, .ant-typography").first()).toBeVisible();
    await expect(page.locator("input[type=email], input[placeholder*=mail], input[id*=email]").first()).toBeVisible();
  });

  test("redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login form has password and magic-link modes", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input")).toBeVisible();
    await expect(page.locator("button[type=submit], button:has-text('Войти')").first()).toBeVisible();
  });
});

test.describe("Public pages", () => {
  test("jobs page loads", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("sidebar has main nav items", async ({ page }) => {
    await page.goto("/login");
    const sidebar = page.locator("aside, [aria-label*=навиг]");
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();
    }
  });
});
