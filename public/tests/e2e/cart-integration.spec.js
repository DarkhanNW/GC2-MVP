import { test, expect } from "@playwright/test";
import {
  installApiMock, collectErrors, productBySlug,
} from "../helpers/api-stub.js";

const product = productBySlug("kc-home-jersey");
const CART_KEY = "100yard-cart";

test.describe("Cart integration", () => {
  test("adds a Detail line to the shared cart and updates the header count", async ({ page }) => {
    await page.addInitScript((key) => localStorage.removeItem(key), CART_KEY);
    await installApiMock(page);
    const errors = collectErrors(page);

    await page.goto(`/detail.html?id=${product._id}`);
    await page.locator('.size-btn[data-size="L"]').click();
    await page.locator("#add-to-cart").click();

    await expect(page.locator("[data-cart-count]")).toHaveText("1");
    const cart = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), CART_KEY);
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({
      _id: product._id,
      productId: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      size: "L",
      qty: 1,
    });

    expect(errors).toEqual([]);
  });

  test("merges a repeated size instead of creating a duplicate line", async ({ page }) => {
    await page.addInitScript((key) => localStorage.removeItem(key), CART_KEY);
    await installApiMock(page);

    await page.goto(`/detail.html?id=${product._id}`);
    await page.locator('.size-btn[data-size="L"]').click();
    await page.locator("#add-to-cart").click();
    await page.locator("#add-to-cart").click();

    await expect(page.locator("[data-cart-count]")).toHaveText("2");
    const cart = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), CART_KEY);
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({ _id: product._id, size: "L", qty: 2 });
  });

  test("points the header cart link at the Cart screen", async ({ page }) => {
    await page.addInitScript((key) => localStorage.removeItem(key), CART_KEY);
    await installApiMock(page);

    await page.goto("/index.html");

    await expect(page.locator(".cart-btn")).toHaveAttribute("href", "cart.html");
    await expect(page.locator("[data-cart-count]")).toHaveText("0");
  });
});
