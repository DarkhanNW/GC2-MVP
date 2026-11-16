import { collectErrors } from '../helpers/api-stub.js';
import { test, expect } from '@playwright/test';

const productId = '6650f1000000000000000001';

const shippingTiers = [
  { region: 'Metro Manila', fee: 100, freeShippingMin: 5000 },
  { region: 'Luzon', fee: 130, freeShippingMin: 5000 },
  { region: 'Visayas', fee: 160, freeShippingMin: 5000 },
  { region: 'Mindanao', fee: 180, freeShippingMin: 5000 }
];

// Prepare a test Cart and test shipping API.
async function setupCheckout(page, price = 1000) {
    page.on('pageerror', error => {
    console.log('BROWSER ERROR:', error.message);
  });

  page.on('console', message => {
    if (message.type() === 'error') {
      console.log('CONSOLE ERROR:', message.text());
    }
  });

  page.on('response', response => {
    if (!response.ok()) {
      console.log('FAILED RESPONSE:', response.status(), response.url());
    }
  });
  await page.addInitScript(({ id, price }) => {
    // Initialize the test Cart only once per browser tab.
    if (sessionStorage.getItem('checkout-test-seeded') === '1') {
      return;
    }

    localStorage.setItem('100yard-cart', JSON.stringify([{
      productId: id,
      name: 'Test Jersey',
      size: 'M',
      price: price,
      qty: 1
    }]));

    sessionStorage.setItem('checkout-test-seeded', '1');
  }, { id: productId, price });



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

  test('Loads Checkout without browser errors', async ({ page }) => {
  const errors = collectErrors(page);

  await setupCheckout(page);

  await expect(page.locator('#checkout-form')).toBeVisible();

  expect(errors).toEqual([]);
});



  test('Validates an empty customer form', async ({ page }) => {
    await setupCheckout(page);

    // Submit the empty form only once.
    await page.locator('#place-order').click();

    // All required-field errors should appear together.
    await expect(page.locator('#name-error')).toBeVisible();
    await expect(page.locator('#mobile-error')).toBeVisible();
    await expect(page.locator('#email-error')).toBeVisible();
    await expect(page.locator('#street-error')).toBeVisible();
    await expect(page.locator('#city-error')).toBeVisible();
    await expect(page.locator('#province-error')).toBeVisible();
    await expect(page.locator('#region-error')).toBeVisible();
  });



  test('Shows correct Metro Manila shipping preview', async ({ page }) => {
    // Start collecting browser errors.
    const errors = collectErrors(page);

    await setupCheckout(page);

    await page.locator('#region').selectOption('Metro Manila');

    // Subtotal should be ₱1,000.
    await expect(page.locator('#checkout-subtotal'))
      .toContainText('1,000.00');

    // Metro Manila shipping fee should be ₱100.
    await expect(page.locator('#shipping-fee'))
      .toContainText('100.00');

    // Estimated total should be ₱1,100.
    await expect(page.locator('#checkout-total'))
      .toContainText('1,100.00');

    // Customer should see how much more is needed for free shipping.
    await expect(page.locator('#shipping-hint'))
      .toContainText('Add ₱4,000.00 more');

    // A normal shipping preview should have no browser errors.
    expect(errors).toEqual([]);
  });



  test('Shows free shipping when subtotal reaches ₱5,000', async ({ page }) => {
    const errors = collectErrors(page);

    // Create a test Cart worth ₱5,000.
    await setupCheckout(page, 5000);

    await page.locator('#region').selectOption('Metro Manila');

    await expect(page.locator('#checkout-subtotal'))
      .toContainText('5,000.00');

    await expect(page.locator('#shipping-fee'))
      .toContainText('FREE');

    await expect(page.locator('#checkout-total'))
      .toContainText('5,000.00');

    await expect(page.locator('#shipping-hint'))
      .toBeEmpty();

    expect(errors).toEqual([]);
  });


  test('Shows Return to Cart when checkout cart is empty', async ({ page }) => {
    // Start Checkout with an empty Cart.
    await page.addInitScript(() => {
      localStorage.setItem('100yard-cart', JSON.stringify([]));
    });

    await page.goto('/checkout.html');

    // Customer should see an empty-Cart message.
    await expect(page.locator('#checkout-message'))
      .toContainText('Your cart is empty');

    // Customer can return to the Cart page.
    await expect(
      page.getByRole('link', { name: 'Return to Cart' })
    ).toHaveAttribute('href', 'cart.html');

    // The checkout form should not be usable.
    await expect(page.locator('#checkout-form'))
      .toBeHidden();
  });

  test('Shows Retry when shipping API fails', async ({ page }) => {
    let attempts = 0;

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
      attempts++;

      if (attempts === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Shipping service unavailable.'
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(shippingTiers)
        });
      }
    });

    await page.goto('/checkout.html');

    await expect(page.getByRole('button', { name: 'Retry' }))
      .toBeVisible();

    await expect(page.locator('#region'))
      .toBeDisabled();

    await page.getByRole('button', { name: 'Retry' }).click();

    await expect(page.locator('#region'))
      .toBeEnabled();

    await expect(page.getByRole('button', { name: 'Retry' }))
      .toHaveCount(0);

    expect(attempts).toBe(2);
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
      .toContainText('Not enough stock available');

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

  test('Prevents duplicate orders during submission', async ({ page }) => {
    let orderRequests = 0;

    await page.route('**/api/orders', async route => {
      orderRequests++;

      // Keep the order request pending briefly.
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

    // Submit once.
    await page.locator('#place-order').click();

    // Attempt another submission while the first is processing.
    await expect(page.locator('#place-order')).toBeDisabled();

    await page.locator('#checkout-form').evaluate(form => {
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
    });

    await expect(page.locator('#order-error'))
      .toContainText('Simulated request failure.');

    // Only one API request should have been made.
    expect(orderRequests).toBe(1);
  });

  test('Checkout fits a 375px mobile screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await setupCheckout(page);

    // Ensure Checkout form is visible on mobile.
    await expect(page.locator('#checkout-form')).toBeVisible();

    // Ensure Place Order is visible and usable.
    await expect(page.locator('#place-order')).toBeVisible();

    // Check that the page does not overflow horizontally.
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth >
        document.documentElement.clientWidth;
    });

    expect(hasHorizontalOverflow).toBe(false);
  });



  test('Redirects to Confirmation after a successful response', async ({ page }) => {
    const orderId = '6650f2000000000000000002';
    let orderRequests = 0;

    // Mock the Confirmation page so navigation works during testing.
    await page.route('**/confirmation.html?*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!DOCTYPE html><html><body>Confirmation</body></html>'
      });
    });

    // Mock a successful order.
    await page.route('**/api/orders', async route => {
      orderRequests++;

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ _id: orderId })
      });
    });

    await setupCheckout(page);
    await fillCustomer(page);

    // Observe whether Place Order becomes enabled again after submitting.
    await page.locator('#place-order').evaluate(button => {
      let submissionStarted = false;

      const observer = new MutationObserver(() => {
        if (button.disabled && button.textContent.includes('Placing Order')) {
          submissionStarted = true;
        }

        if (submissionStarted && !button.disabled) {
          sessionStorage.setItem('checkout-reenabled-after-submit', 'true');
        }
      });

      observer.observe(button, {
        attributes: true,
        childList: true,
        subtree: true
      });
    });

    // Submit the order.
    await page.locator('#place-order').click();

    // Confirm the redirect.
    await expect(page).toHaveURL(
      new RegExp('confirmation\\.html\\?id=' + orderId)
    );

    // Make sure Place Order was not re-enabled after submission started.
    const reenabled = await page.evaluate(() => {
      return sessionStorage.getItem('checkout-reenabled-after-submit');
    });

    expect(reenabled).toBeNull();

    // Make sure only one order request was made.
    expect(orderRequests).toBe(1);

    // Make sure Checkout cleared the Cart.
    const savedCart = await page.evaluate(() => {
      return localStorage.getItem('100yard-cart');
    });

    expect(savedCart === null || JSON.parse(savedCart).length === 0)
      .toBe(true);
  });


});
