import { test, expect } from "@playwright/test";
import {
  installApiMock, collectErrors, overflowState,
} from "../helpers/api-stub.js";

test.describe("List screen", () => {
  test("loads products with status badges and a result count", async ({ page }) => {
    await installApiMock(page);
    const errors = collectErrors(page);

    await page.goto("/list.html");

    await expect(page.locator("#product-grid .card")).toHaveCount(6);
    await expect(page.locator("#result-count")).toHaveText("6 items");
    await expect(page.locator("#product-grid")).toContainText("In Stock");
    await expect(page.locator("#product-grid")).toContainText("Low Stock");
    await expect(page.locator("#product-grid")).toContainText("Sold Out");
    await expect(page.locator("#product-grid")).toContainText("Pre-Order");

    expect(errors).toEqual([]);
  });

  test("searches products and keeps the query in the URL", async ({ page }) => {
    await installApiMock(page);
    await page.goto("/list.html");
    await expect(page.locator("#product-grid .card")).toHaveCount(6);

    await page.locator("#search").fill("dolphins");

    await expect(page).toHaveURL(/q=dolphins/);
    await expect(page.locator("#product-grid .card")).toHaveCount(1);
    await expect(page.locator("#result-count")).toHaveText("1 item");
    await expect(page.locator("#product-grid")).toContainText("Dolphins Aqua Tee");
  });

  test("filters by category and sorts by price", async ({ page }) => {
    await installApiMock(page);
    await page.goto("/list.html");
    await expect(page.locator("#product-grid .card")).toHaveCount(6);

    await page.locator('[data-category="hoodies"]').click();
    await expect(page).toHaveURL(/category=hoodies/);
    await expect(page.locator("#product-grid .card")).toHaveCount(3);
    await expect(page.locator("#result-count")).toHaveText("3 items");

    await page.locator("#sort").selectOption("price_asc");
    await expect(page).toHaveURL(/sort=price_asc/);
    await expect(page.locator("#product-grid .card__price").first()).toHaveText("₱2,299.00");
  });

  test("shows skeletons while loading", async ({ page }) => {
    await installApiMock(page, { delay: 800 });
    await page.goto("/list.html");

    await expect(page.locator("#product-grid .skeleton").first()).toBeVisible();
    await expect(page.locator("#product-grid .card")).toHaveCount(6);
  });

  test("shows the empty state for a zero-result search", async ({ page }) => {
    await installApiMock(page);
    await page.goto("/list.html?q=zzzz");

    await expect(page.locator("#result-count")).toHaveText("0 items");
    await expect(page.locator("#list-status .state__title")).toHaveText("No gear matches those filters");
    await expect(page.locator("#list-status .state__action a")).toHaveText("Clear all filters");
  });

  test("shows a retryable error state when the API fails", async ({ page }) => {
    await installApiMock(page, { mode: "error" });
    await page.goto("/list.html");

    await expect(page.locator("#list-status .state__title")).toHaveText("Something went wrong");
    await expect(page.locator("#list-status [data-retry]")).toBeVisible();
  });

  test("fits a phone viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installApiMock(page);

    await page.goto("/list.html");
    await expect(page.locator("#product-grid .card")).toHaveCount(6);

    const width = await overflowState(page);
    expect(width.scrollWidth).toBeLessThanOrEqual(width.innerWidth);
  });
});
