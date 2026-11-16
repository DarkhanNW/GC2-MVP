import { test, expect } from "@playwright/test";
import {
  installApiMock, productBySlug,
} from "../helpers/api-stub.js";

const product = productBySlug("kc-home-jersey");
const CART_KEY = "100yard-cart";

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    if (!sessionStorage.getItem("pr4-test-init")) {
      localStorage.removeItem(key);
      sessionStorage.setItem("pr4-test-init", "1");
    }
  }, CART_KEY);
});

test.describe("Cart integration", () => {
  test("shows the cart link and an empty initial count", async ({ page }) => {
    await installApiMock(page);
    await page.goto("/index.html");

    await expect(page.locator(".cart-btn")).toHaveAttribute("href", "cart.html");
    await expect(page.locator(".cart-btn")).toHaveAttribute("aria-label", "Cart, 0 items");
    await expect(page.locator("[data-cart-count]")).toHaveText("0");
  });

  test("updates the header count after adding a Detail line", async ({ page }) => {
    await installApiMock(page);
    await page.goto(`/detail.html?id=${product._id}`);

    await expect(page.locator("[data-cart-count]")).toHaveText("0");
    await page.locator('.size-btn[data-size="L"]').click();
    await page.locator("#add-to-cart").click();

    await expect(page.locator("[data-cart-count]")).toHaveText("1");
    await expect(page.locator(".cart-btn")).toHaveAttribute("aria-label", "Cart, 1 item");

    const cart = await page.evaluate((key) =>
      JSON.parse(localStorage.getItem(key) || "[]"), CART_KEY);
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({
      productId: product._id,
      name: product.name,
      price: product.price,
      size: "L",
      qty: 1,
    });
  });

  test("keeps the count across storefront navigation", async ({ page }) => {
    await installApiMock(page);
    await page.goto(`/detail.html?id=${product._id}`);
    await page.locator('.size-btn[data-size="L"]').click();
    await page.locator("#add-to-cart").click();
    await expect(page.locator("[data-cart-count]")).toHaveText("1");

    await page.goto("/index.html");
    await expect(page.locator("[data-cart-count]")).toHaveText("1");

    await page.goto("/list.html");
    await expect(page.locator("[data-cart-count]")).toHaveText("1");
  });

  test("opens the M5 cart page with the saved line", async ({ page }) => {
    await installApiMock(page);
    await page.goto(`/detail.html?id=${product._id}`);
    await page.locator('.size-btn[data-size="L"]').click();
    await page.locator("#add-to-cart").click();

    await page.locator(".cart-btn").click();

    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(page.locator("#cart-items")).toContainText(product.name);
    await expect(page.locator("#cart-count")).toHaveText("1");
  });

  test("refreshes the count when the page is restored", async ({ page }) => {
    await installApiMock(page);
    await page.goto("/index.html");
    await expect(page.locator("[data-cart-count]")).toHaveText("0");

    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify([{
        productId: "test-product",
        name: "Test Product",
        price: 100,
        size: "M",
        qty: 2,
      }]));
      window.dispatchEvent(new Event("pageshow"));
    }, CART_KEY);

    await expect(page.locator("[data-cart-count]")).toHaveText("2");
  });
});
