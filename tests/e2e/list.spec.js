import { test, expect } from "@playwright/test";
import {
  installApiMock, collectErrors, overflowState, PRODUCTS,
} from "../helpers/api-stub.js";

let errors;

test.beforeEach(async ({ page }) => {
  errors = collectErrors(page);
});

test.afterEach(async ({}, testInfo) => {
  // These tests deliberately trigger a server error; the UI error state is the
  // assertion, not a clean Console.
  if (/API fails|retries the failed request/.test(testInfo.title)) return;
  expect(errors).toEqual([]);
});

test.describe("List screen", () => {
  test("loads products with status badges and a result count", async ({ page }) => {
    await installApiMock(page);

    await page.goto("/list.html");

    await expect(page.locator("#product-grid .card")).toHaveCount(6);
    await expect(page.locator("#result-count")).toHaveText("6 items");
    await expect(page.locator("#product-grid")).toContainText("In Stock");
    await expect(page.locator("#product-grid")).toContainText("Low Stock");
    await expect(page.locator("#product-grid")).toContainText("Sold Out");
    await expect(page.locator("#product-grid")).toContainText("Pre-Order");
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

  test("preserves the search input while typing across a debounced load", async ({ page }) => {
    await installApiMock(page);
    await page.goto("/list.html");
    await expect(page.locator("#product-grid .card")).toHaveCount(6);

    const response = page.waitForResponse((res) =>
      res.url().includes("/api/products?") && res.status() === 200);

    await page.locator("#search").fill("new york ");
    await response;

    await expect(page.locator("#search")).toHaveValue("new york ");
    await page.locator("#search").pressSequentially("giants");

    await expect(page).toHaveURL(/q=new\+york\+giants/);
    await expect(page.locator("#search")).toHaveValue("new york giants");
  });

  test("does not show an error when a pending search is aborted", async ({ page }) => {
    await installApiMock(page, { delay: 600 });
    await page.goto("/list.html");
    await expect(page.locator("#product-grid .card")).toHaveCount(6);

    const pending = page.waitForRequest((req) =>
      new URL(req.url()).searchParams.get("q") === "dolphins");

    await page.locator("#search").fill("dolphins");
    await pending;
    await page.locator("#search").fill("raiders");

    await expect(page.locator("#product-grid .card")).toHaveCount(1);
    await expect(page.locator("#list-status .state__title")).toHaveCount(0);
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

  test("normalizes an invalid sort URL value", async ({ page }) => {
    await installApiMock(page);
    await page.goto("/list.html?sort=bogus");

    await expect(page.locator("#sort")).toHaveValue("newest");
    await expect(page.locator("#product-grid .card")).toHaveCount(6);
    await expect(page.locator("#list-status .state__title")).toHaveCount(0);
  });

  test("normalizes an invalid category URL value", async ({ page }) => {
    await installApiMock(page);
    await page.goto("/list.html?category=caps");

    await expect(page.locator('[data-category=""]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#product-grid .card")).toHaveCount(6);
    await expect(page.locator("#list-status .state__title")).toHaveCount(0);
  });

  test("restores controls on back and forward", async ({ page }) => {
    await installApiMock(page);
    await page.goto("/list.html");
    await expect(page.locator("#product-grid .card")).toHaveCount(6);

    await page.locator("#search").fill("dolphins");
    await expect(page).toHaveURL(/q=dolphins/);

    await page.locator('[data-category="hoodies"]').click();
    await expect(page).toHaveURL(/category=hoodies/);

    await page.locator("#sort").selectOption("price_asc");
    await expect(page).toHaveURL(/sort=price_asc/);

    await page.goBack();
    await expect(page).toHaveURL(/category=hoodies/);
    await expect(page.locator("#sort")).toHaveValue("newest");
    await expect(page.locator("#search")).toHaveValue("dolphins");
    await expect(page.locator('[data-category="hoodies"]')).toHaveAttribute("aria-pressed", "true");

    await page.goForward();
    await expect(page.locator("#sort")).toHaveValue("price_asc");
    await expect(page.locator("#search")).toHaveValue("dolphins");
    await expect(page.locator('[data-category="hoodies"]')).toHaveAttribute("aria-pressed", "true");
  });

  test("keeps pending search text when changing category", async ({ page }) => {
    await installApiMock(page);
    await page.goto("/list.html");
    await expect(page.locator("#product-grid .card")).toHaveCount(6);

    await page.locator("#search").fill("dolphins ");
    await page.locator('[data-category="hoodies"]').click();

    await expect(page).toHaveURL(/category=hoodies&q=dolphins/);
    await expect(page.locator("#search")).toHaveValue("dolphins ");
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
    await expect(page.locator("#list-status .state")).toContainText("Test API failure");
    await expect(page.locator("#list-status [data-retry]")).toBeVisible();
  });

  test("retries the failed request and renders products", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/products**", async (route) => {
      calls += 1;
      if (calls === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Test API failure" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(PRODUCTS),
      });
    });

    await page.goto("/list.html");
    await expect(page.locator("#list-status [data-retry]")).toBeVisible();

    await page.locator("#list-status [data-retry]").click();

    await expect(page.locator("#product-grid .card")).toHaveCount(6);
    expect(calls).toBe(2);
  });

  test("does not duplicate history or refetch for the active category", async ({ page }) => {
    await installApiMock(page);
    await page.goto("/list.html");
    await expect(page.locator("#product-grid .card")).toHaveCount(6);

    let calls = 0;
    page.on("request", (request) => {
      if (request.url().includes("/api/products")) calls += 1;
    });

    await page.locator('[data-category="jerseys"]').click();
    await expect(page.locator("#product-grid .card")).toHaveCount(2);
    await expect(page.locator('[data-category="jerseys"]')).toHaveAttribute("aria-pressed", "true");

    const historyLength = await page.evaluate(() => history.length);
    calls = 0;

    await page.locator('[data-category="jerseys"]').click();
    await page.waitForTimeout(200);

    expect(await page.evaluate(() => history.length)).toBe(historyLength);
    expect(calls).toBe(0);
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
