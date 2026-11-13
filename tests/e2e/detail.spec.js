import { test, expect } from "@playwright/test";
import {
  installApiMock, collectErrors, overflowState, productBySlug,
} from "../helpers/api-stub.js";

const lowStock = productBySlug("kc-home-jersey");
const soldOut = productBySlug("dal-hoodie");
const preOrder = productBySlug("mia-tee");

test.describe("Detail screen", () => {
  test("renders full product info, low-stock sizes, and Add to Cart feedback", async ({ page }) => {
    await installApiMock(page);
    const errors = collectErrors(page);

    await page.goto(`/detail.html?id=${lowStock._id}`);

    await expect(page.locator(".detail__title")).toHaveText(lowStock.name);
    await expect(page.locator(".detail__eyebrow")).toContainText("Kansas City Chiefs");
    await expect(page.locator(".detail__eyebrow")).toContainText("Team Jerseys");
    await expect(page.locator(".detail__price")).toHaveText("₱1,899.00");
    await expect(page.locator(".detail__meta")).toContainText("Low Stock");
    await expect(page.locator("#stock-note")).toHaveText("Only 3 left in L");
    await expect(page.locator('.size-btn[data-size="XL"]')).toBeDisabled();
    await expect(page.locator("#add-to-cart")).toBeDisabled();

    await page.locator('.size-btn[data-size="L"]').click();
    await expect(page.locator("#add-to-cart")).toBeEnabled();
    await expect(page.locator("#stock-note")).toHaveText("Only 3 left in L.");

    await page.locator("#add-to-cart").click();
    await expect(page.locator("#toast")).toContainText("added to cart");

    expect(errors).toEqual([]);
  });

  test("disables every size and the CTA for a sold-out product", async ({ page }) => {
    await installApiMock(page);
    await page.goto(`/detail.html?id=${soldOut._id}`);

    await expect(page.locator(".detail__meta")).toContainText("Sold Out");
    await expect(page.locator(".size-btn")).toHaveCount(3);
    await expect(page.locator(".size-btn:disabled")).toHaveCount(3);
    await expect(page.locator("#stock-note")).toHaveText("Sold out — all sizes are unavailable.");
    await expect(page.locator("#add-to-cart")).toBeDisabled();
    await expect(page.locator("#add-to-cart")).toHaveText("Sold out");
  });

  test("labels a pre-order product", async ({ page }) => {
    await installApiMock(page);
    await page.goto(`/detail.html?id=${preOrder._id}`);

    await expect(page.locator(".detail__meta")).toContainText("Pre-Order");
    await expect(page.locator(".detail__price")).toHaveText("₱1,199.00");
  });

  test("shows a dedicated 404 state for an unknown id", async ({ page }) => {
    await installApiMock(page);
    await page.goto("/detail.html?id=not-a-real-product");

    await expect(page.locator(".state__title")).toHaveText("We couldn't find that product");
    await expect(page.locator(".state__action a")).toHaveText("Back to shop");
    await expect(page).toHaveTitle(/Product not found/);
  });

  test("shows a retryable error state when the API fails", async ({ page }) => {
    await installApiMock(page, { mode: "error" });
    await page.goto(`/detail.html?id=${lowStock._id}`);

    await expect(page.locator(".state__title")).toHaveText("Something went wrong");
    await expect(page.locator("[data-retry]")).toBeVisible();
  });

  test("shows a skeleton while loading", async ({ page }) => {
    await installApiMock(page, { delay: 800 });
    await page.goto(`/detail.html?id=${lowStock._id}`);

    await expect(page.locator(".skeleton").first()).toBeVisible();
    await expect(page.locator(".detail__title")).toHaveText(lowStock.name);
  });

  test("fits a phone viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installApiMock(page);

    await page.goto(`/detail.html?id=${lowStock._id}`);
    await expect(page.locator(".detail__title")).toHaveText(lowStock.name);

    const width = await overflowState(page);
    expect(width.scrollWidth).toBeLessThanOrEqual(width.innerWidth);
  });
});
