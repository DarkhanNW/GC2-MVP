import { test, expect } from "@playwright/test";
import {
  installApiMock, collectErrors, overflowState, productBySlug,
} from "../helpers/api-stub.js";

const lowStock = productBySlug("kc-home-jersey");
const lowStockTwo = productBySlug("lv-hoodie");
const soldOut = productBySlug("dal-hoodie");
const preOrder = productBySlug("mia-tee");

let errors;

test.beforeEach(async ({ page }) => {
  errors = collectErrors(page);
});

test.afterEach(async ({}, testInfo) => {
  // Intentional API failures and 404 cases produce expected browser errors.
  if (/API fails|retries|404|not found|malformed/i.test(testInfo.title)) return;
  expect(errors).toEqual([]);
});

const cartFrom = (page) => page.evaluate(() =>
  JSON.parse(localStorage.getItem("100yard-cart") || "[]"));

test.describe("Detail screen", () => {
  test("renders full product info and saves the selected quantity to the cart", async ({ page }) => {
    await installApiMock(page);
    await page.goto(`/detail.html?id=${lowStock._id}`);

    await expect(page.locator(".detail__title")).toHaveText(lowStock.name);
    await expect(page.locator(".detail__eyebrow")).toContainText("Kansas City Chiefs");
    await expect(page.locator(".detail__eyebrow")).toContainText("Team Jerseys");
    await expect(page.locator(".detail__price")).toHaveText("₱1,899.00");
    await expect(page.locator(".detail__meta")).toContainText("Low Stock");
    await expect(page.locator("#stock-note")).toHaveText("Only 3 left in L");
    await expect(page.locator('.size-btn[data-size="XL"]')).toBeDisabled();
    await expect(page.locator("#add-to-cart")).toBeDisabled();
    await expect(page.locator("#quantity")).toBeDisabled();
    await expect(page.locator("#toast")).not.toHaveAttribute("aria-live");

    await page.locator('.size-btn[data-size="L"]').click();
    await expect(page.locator("#add-to-cart")).toBeEnabled();
    await expect(page.locator("#quantity")).toBeEnabled();
    await expect(page.locator("#quantity")).toHaveAttribute("max", "3");
    await expect(page.locator("#stock-note")).toHaveText("Only 3 left in L.");

    await page.locator("#quantity").fill("2");
    await page.locator("#add-to-cart").click();
    await expect(page.locator("#toast")).toContainText("2 added");

    const cart = await cartFrom(page);
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({
      productId: lowStock._id,
      name: lowStock.name,
      price: 1899,
      size: "L",
      qty: 2,
    });
  });

  test("disables every size and the CTA for a sold-out product", async ({ page }) => {
    await installApiMock(page);
    await page.goto(`/detail.html?id=${soldOut._id}`);

    await expect(page.locator(".detail__meta")).toContainText("Sold Out");
    await expect(page.locator(".size-btn")).toHaveCount(3);
    await expect(page.locator(".size-btn:disabled")).toHaveCount(3);
    await expect(page.locator("#stock-note")).toHaveText("Sold out — all sizes are unavailable.");
    await expect(page.locator("#quantity")).toBeDisabled();
    await expect(page.locator("#add-to-cart")).toBeDisabled();
    await expect(page.locator("#add-to-cart")).toHaveText("Sold out");
  });

  test("labels a pre-order product", async ({ page }) => {
    await installApiMock(page);
    await page.goto(`/detail.html?id=${preOrder._id}`);

    await expect(page.locator(".detail__meta")).toContainText("Pre-Order");
    await expect(page.locator(".detail__price")).toHaveText("₱1,199.00");
    await expect(page.locator("#quantity")).toBeDisabled();
  });

  test("shows a dedicated 404 state for an unknown id", async ({ page }) => {
    await installApiMock(page);
    await page.goto("/detail.html?id=not-a-real-product");

    await expect(page.locator(".state__title")).toHaveText("We couldn't find that product");
    await expect(page.locator(".state__action a")).toHaveText("Back to shop");
    await expect(page).toHaveTitle(/Product not found/);
  });

  test("shows 404 for malformed, missing, and encoded ids", async ({ page }) => {
    await installApiMock(page);
    const orderRequests = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/orders") {
        orderRequests.push(request.url());
      }
    });

    for (const path of [
      "/detail.html?id=abc",
      "/detail.html",
      "/detail.html?id=../orders",
    ]) {
      await page.goto(path);
      await expect(page.locator(".state__title")).toHaveText("We couldn't find that product");
    }

    expect(orderRequests).toEqual([]);
  });

  test("shows the API error message and retries the failed request", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/products/**", async (route) => {
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
        body: JSON.stringify(lowStock),
      });
    });

    await page.goto(`/detail.html?id=${lowStock._id}`);
    await expect(page.locator(".state__title")).toHaveText("Something went wrong");
    await expect(page.locator(".state")).toContainText("Test API failure");

    await page.locator("[data-retry]").click();
    await expect(page.locator(".detail__title")).toHaveText(lowStock.name);
    expect(calls).toBe(2);
  });

  test("shows a skeleton while loading", async ({ page }) => {
    await installApiMock(page, { delay: 800 });
    await page.goto(`/detail.html?id=${lowStock._id}`);

    await expect(page.locator(".skeleton").first()).toBeVisible();
    await expect(page.locator(".detail__title")).toHaveText(lowStock.name);
  });

  test("caps quantity at the available stock and resets it when size changes", async ({ page }) => {
    await installApiMock(page);
    await page.goto(`/detail.html?id=${lowStockTwo._id}`);

    await page.locator('.size-btn[data-size="M"]').click();
    await expect(page.locator("#quantity")).toHaveAttribute("max", "2");
    await page.locator("#quantity").fill("2");

    await page.locator('.size-btn[data-size="XL"]').click();
    await expect(page.locator("#quantity")).toHaveAttribute("max", "1");
    await expect(page.locator("#quantity")).toHaveValue("1");

    await page.locator('.size-btn[data-size="M"]').click();
    await expect(page.locator("#quantity")).toHaveAttribute("max", "2");
    await expect(page.locator("#quantity")).toHaveValue("1");
  });

  test("merges repeated adds and never exceeds three units", async ({ page }) => {
    await installApiMock(page);
    await page.goto(`/detail.html?id=${lowStock._id}`);
    await page.locator('.size-btn[data-size="L"]').click();

    await page.locator("#quantity").fill("2");
    await page.locator("#add-to-cart").click();
    await expect(page.locator("#toast")).toContainText("2 added");

    await page.locator("#quantity").fill("3");
    await page.locator("#add-to-cart").click();
    await expect(page.locator("#toast")).toContainText("1 added");

    let cart = await cartFrom(page);
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(3);

    await page.locator("#add-to-cart").click();
    await expect(page.locator("#toast")).toContainText("Maximum quantity reached");

    cart = await cartFrom(page);
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(3);
  });

  test("fits a phone viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await installApiMock(page);

    await page.goto(`/detail.html?id=${lowStock._id}`);
    await expect(page.locator(".detail__title")).toHaveText(lowStock.name);
    await page.locator('.size-btn[data-size="L"]').click();
    await page.locator("#quantity").fill("2");

    const width = await overflowState(page);
    expect(width.scrollWidth).toBeLessThanOrEqual(width.innerWidth);
  });
});
