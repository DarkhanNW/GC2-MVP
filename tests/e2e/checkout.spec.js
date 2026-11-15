
import { test, expect } from '@playwright/test';

const productId = '6650f1000000000000000001';

const shippingTiers = [
  { region: 'Metro Manila', fee: 100, freeShippingMin: 5000 },
  { region: 'Luzon', fee: 130, freeShippingMin: 5000 },
  { region: 'Visayas', fee: 160, freeShippingMin: 5000 },
  { region: 'Mindanao', fee: 180, freeShippingMin: 5000 }
];

// Prepare a test Cart and test shipping API.
async function setupCheckout(page) {
  await page.addInitScript((id) => {
    localStorage.setItem('100yard-cart', JSON.stringify([{
      productId: id,
      name: 'Test Jersey',
      size: 'M',
      price: 1000,
      qty: 1
    }]));
  }, productId);

  await page.route('**/api/shipping-tiers', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(shippingTiers)
    });
  });

  await page.goto('/checkout.html');

  await expect(page.locator('#region')).toBeEnabled();
}

// Fill the form with valid test information.
async function fillCustomer(page) {
  await page.locator('#name').fill('Test Customer');
  await page.locator('#mobile').fill('09171234567');
  await page.locator('#email').fill('test@example.com');
  await page.locator('#street').fill('123 Test Street');
  await page.locator('#city').fill('Quezon City');
  await page.locator('#province').fill('Metro Manila');
  await page.locator('#region').selectOption('Metro Manila');
  await page.locator('input[value="cod"]').check();
}

test.describe('Checkout - Issue #38', () => {

  test('Validates an empty customer form', async ({ page }) => {
    await setupCheckout(page);

    await page.locator('#place-order').click();

    await expect(page.locator('#name-error'))
      .toContainText('required');
  });

  test('Displays server 400 mobile error beside the field', async ({ page }) => {
    await page.route('**/api/orders', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Mobile number was rejected by the server.',
          field: 'customer.mobile'
        })
      });
    });

    await setupCheckout(page);
    await fillCustomer(page);

    await page.locator('#place-order').click();

    await expect(page.locator('#mobile-error'))
      .toContainText('Mobile number was rejected');
  });

  test('Displays server 400 email error beside the field', async ({ page }) => {
    await page.route('**/api/orders', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Email was rejected by the server.',
          field: 'customer.email'
        })
      });
    });

    await setupCheckout(page);
    await fillCustomer(page);

    await page.locator('#place-order').click();

    await expect(page.locator('#email-error'))
      .toContainText('Email was rejected');
  });

  test('Displays server 409 stock error beside the items', async ({ page }) => {
    await page.route('**/api/orders', async route => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Not enough stock available.',
          field: 'items'
        })
      });
    });

    await setupCheckout(page);
    await fillCustomer(page);

    await page.locator('#place-order').click();

    await expect(page.locator('#items-error'))
      .toContainText('Insufficient stock');

    await expect(page.locator('#place-order')).toBeEnabled();
  });

  test('Disables Place Order during submission', async ({ page }) => {
    await page.route('**/api/orders', async route => {
      // Simulate a slow server, without creating an order.
      await new Promise(resolve => setTimeout(resolve, 1000));

      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Simulated request failure.'
        })
      });
    });

    await setupCheckout(page);
    await fillCustomer(page);

    await page.locator('#place-order').click();

    await expect(page.locator('#place-order')).toBeDisabled();
    await expect(page.locator('#place-order'))
      .toHaveText('Placing Order...');

    await expect(page.locator('#order-error'))
      .toContainText('Simulated request failure.');

    await expect(page.locator('#place-order')).toBeEnabled();
  });

  test('Redirects to Confirmation after a successful response', async ({ page }) => {
    const orderId = '6650f2000000000000000002';

    await page.route('**/api/orders', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ _id: orderId })
      });
    });

    await setupCheckout(page);
    await fillCustomer(page);

    await page.locator('#place-order').click();

    await expect(page).toHaveURL(
      new RegExp('confirmation\\.html\\?id=' + orderId)
    );
  });

});
