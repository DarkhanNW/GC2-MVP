
import { test, expect } from '@playwright/test';

// A sample product used only by these automated tests.
// Nothing here changes the real MongoDB database.
const product = {
  _id: '6650f1000000000000000001',
  name: 'Test Football Jersey',
  price: 1000,
  sizes: [{ size: 'M', stock: 2 }]
};

// Prepare the Cart before the page loads.
async function setupCart(page, stock, qty = 1, apiError = false) {
  const testProduct = {
    ...product,
    sizes: [{ size: 'M', stock }]
  };

  // Simulate Bryan's Product API.
  await page.route('**/api/products/*', async (route) => {
    if (apiError) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service unavailable' })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(testProduct)
    });
  });

  // Save a test item before opening the Cart.
  await page.addInitScript((quantity) => {
    if (!sessionStorage.getItem('cart-test-ready')) {
      localStorage.setItem('100yard-cart', JSON.stringify([{
        productId: '6650f1000000000000000001',
        name: 'Test Football Jersey',
        price: 1000,
        size: 'M',
        qty: quantity
      }]));

      sessionStorage.setItem('cart-test-ready', 'yes');
    }
  }, qty);

  await page.goto('/cart.html');

  // Wait until the Cart has finished loading.
  await expect(page.locator('#cart-message'))
    .not.toHaveText('Loading your cart...');
}

// Read the actual saved quantity from localStorage.
async function savedQuantity(page) {
  return page.evaluate(() => {
    const cart = JSON.parse(
      localStorage.getItem('100yard-cart') || '[]'
    );

    return cart[0]?.qty;
  });
}

test.describe('Cart stock validation - Issue #79', () => {

  test('Rejects quantity 3 when stock is only 2', async ({ page }) => {
    await setupCart(page, 2);

    const quantity = page.locator('input[type="number"]');

    await quantity.fill('3');
    await quantity.press('Tab');

    await expect(page.getByRole('alert'))
      .toContainText('between 1 and 2');

    await expect(quantity).toHaveValue('1');
    expect(await savedQuantity(page)).toBe(1);
  });

  test('Accepts quantity 2 when stock is 2', async ({ page }) => {
    await setupCart(page, 2);

    const quantity = page.locator('input[type="number"]');

    await quantity.fill('2');
    await quantity.press('Tab');

    await expect(quantity).toHaveValue('2');

    await expect(page.locator('#subtotal'))
      .toHaveText('₱2,000.00');

    expect(await savedQuantity(page)).toBe(2);
  });

  test('Rejects quantity 4 even when stock is 10', async ({ page }) => {
    await setupCart(page, 10);

    const quantity = page.locator('input[type="number"]');

    await quantity.fill('4');
    await quantity.press('Tab');

    await expect(page.getByRole('alert'))
      .toContainText('between 1 and 3');

    await expect(quantity).toHaveValue('1');
    expect(await savedQuantity(page)).toBe(1);
  });

  test('Disables Checkout when stock is zero', async ({ page }) => {
    await setupCart(page, 0);

    await expect(page.locator('#cart-message'))
      .toContainText('Please correct or remove');

    await expect(page.locator('#cart-items'))
      .toContainText('out of stock');

    await expect(page.locator('input[type="number"]'))
      .toHaveCount(0);

    await expect(page.locator('#checkout-button'))
      .toBeDisabled();
  });

  test('Removes a product and updates the subtotal', async ({ page }) => {
    await setupCart(page, 2);

    await page.getByRole('button', { name: 'Remove' }).click();

    await expect(page.locator('#cart-message'))
      .toHaveText('Your cart is empty.');

    await expect(page.locator('#subtotal'))
      .toHaveText('₱0.00');

    await expect(page.locator('#checkout-button'))
      .toBeDisabled();

    const cart = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('100yard-cart') || '[]')
    );

    expect(cart).toEqual([]);
  });

  test('Disables Checkout when Product API fails', async ({ page }) => {
    await setupCart(page, 2, 1, true);

    await expect(page.locator('#cart-message'))
      .toContainText('Some products could not be verified');

    await expect(page.getByRole('button', { name: 'Retry' }))
      .toBeVisible();

    await expect(page.locator('#checkout-button'))
      .toBeDisabled();
  });

});
