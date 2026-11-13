import { test, expect } from "@playwright/test";
import {
  installApiMock, collectErrors, overflowState,
} from "../helpers/api-stub.js";

test.describe("Home screen", () => {
  test("renders the value proposition, featured products, and Browse entry points", async ({ page }) => {
    await installApiMock(page);
    const errors = collectErrors(page);

    await page.goto("/index.html");

    await expect(page.locator("h1")).toHaveText("Built for the Bowl.");
    await expect(page.locator("#featured-grid .card")).toHaveCount(6);
    await expect(page.locator("#featured-grid")).toContainText("In Stock");
    await expect(page.locator("#featured-grid")).toContainText("Low Stock");
    await expect(page.locator("#featured-grid")).toContainText("Sold Out");
    await expect(page.locator("#featured-grid")).toContainText("Pre-Order");
    await expect(page.locator(".tile")).toHaveCount(3);
    await expect(page.locator('.hero__actions a[href="list.html"]')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("shows skeletons while the featured request is loading", async ({ page }) => {
    await installApiMock(page, { delay: 800 });

    await page.goto("/index.html");

    await expect(page.locator("#featured-grid .skeleton").first()).toBeVisible();
    await expect(page.locator("#featured-grid .card")).toHaveCount(6);
  });

  test("renders the empty state when there are no featured products", async ({ page }) => {
    await installApiMock(page, { mode: "empty" });

    await page.goto("/index.html");

    await expect(page.locator("#featured-grid .state__title")).toHaveText("No featured gear right now");
    await expect(page.locator("#featured-grid .state__action a")).toHaveText("Browse all gear");
  });

  test("renders a retryable error state when the API fails", async ({ page }) => {
    await installApiMock(page, { mode: "error" });

    await page.goto("/index.html");

    await expect(page.locator("#featured-grid .state__title")).toHaveText("Something went wrong");
    await expect(page.locator("#featured-grid .state")).toContainText("Test API failure");
    await expect(page.locator("#featured-grid [data-retry]")).toBeVisible();
  });

  test("fits a phone viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installApiMock(page);

    await page.goto("/index.html");
    await expect(page.locator("#featured-grid .card")).toHaveCount(6);

    const width = await overflowState(page);
    expect(width.scrollWidth).toBeLessThanOrEqual(width.innerWidth);
  });
});
