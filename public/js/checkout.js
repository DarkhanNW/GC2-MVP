import { api } from './api.js';

import {
  getCart,
  clearCart,
  MAX_QTY
} from './cart-store.js';

const form = document.getElementById('checkout-form');
const message = document.getElementById('checkout-message');
const orderError = document.getElementById('order-error');
const regionSelect = document.getElementById('region');
const placeOrderButton = document.getElementById('place-order');

const orderItems = document.getElementById('order-items');
const subtotalElement = document.getElementById('checkout-subtotal');
const shippingElement = document.getElementById('shipping-fee');
const totalElement = document.getElementById('checkout-total');
const shippingHint = document.getElementById('shipping-hint');

let shippingTiers = [];
let submitting = false;
let regionsLoaded = false;

// Read the same cart used by Cart #37.

// Display prices in Philippine pesos.
function formatPrice(amount) {
  return '₱' + Number(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Compute the browser's subtotal preview.
function getSubtotal() {
  return getCart().reduce((sum, item) => {
    return sum + Number(item.price) * Number(item.qty);
  }, 0);
}

// Prevent Checkout if the cart is empty or invalid.
function validCart(cart) {
  return cart.length > 0 && cart.every(item =>
    typeof item.productId === 'string' &&
    item.productId.length > 0 &&
    typeof item.name === 'string' &&
    Number.isFinite(Number(item.price)) &&
    Number(item.price) > 0 &&
    Number.isInteger(Number(item.qty)) &&
    Number(item.qty) >= 1 &&
    Number(item.qty) <= MAX_QTY &&
typeof item.size === 'string' &&
item.size.trim().length > 0
  );
}

function updateButton() {
  placeOrderButton.disabled =
    submitting || !regionsLoaded || !validCart(getCart());
}

// Render selected items and preview totals.
function renderSummary() {
  const cart = getCart();
  orderItems.replaceChildren();

  if (!validCart(cart)) {
  form.hidden = true;

  message.textContent = cart.length === 0
    ? 'Your cart is empty. '
    : 'Your cart contains invalid items. ';

  const cartLink = document.createElement('a');
  cartLink.href = 'cart.html';
  cartLink.textContent = 'Return to Cart';

  message.appendChild(cartLink);

  subtotalElement.textContent = formatPrice(0);
  shippingElement.textContent = '—';
  totalElement.textContent = '—';

  updateButton();
  return;
}

form.hidden = false;

  const subtotal = getSubtotal();

  cart.forEach(item => {
    const line = document.createElement('p');

    line.textContent =
      `${item.name} (${item.size}) x ${item.qty} — ` +
      `Est. ${formatPrice(item.price * item.qty)}`;

    orderItems.appendChild(line);
  });

  subtotalElement.textContent = formatPrice(subtotal);
  updateShipping();
}

// Update shipping as soon as the region changes.
function updateShipping() {
  const region = regionSelect.value;
  const tier = shippingTiers.find(t => t.region === region);
  const subtotal = getSubtotal();

  if (!tier) {
    shippingElement.textContent = 'Select region';
    totalElement.textContent = '—';
    shippingHint.textContent = '';
    return;
  }

  const threshold = Number(tier.freeShippingMin);
  const qualifies = threshold > 0 && subtotal >= threshold;
  const fee = qualifies ? 0 : Number(tier.fee);

  shippingElement.textContent =
    fee === 0 ? 'FREE' : formatPrice(fee);

  totalElement.textContent = formatPrice(subtotal + fee);

  if (threshold > 0 && !qualifies) {
    shippingHint.textContent =
      `Add ${formatPrice(threshold - subtotal)} more ` +
      'to qualify for free shipping.';
  } else {
    shippingHint.textContent = '';
  }
}

// Retrieve actual regions from the database API.
async function loadShippingTiers() {
  if (!validCart(getCart())) {
    return;
  }
  message.textContent = 'Loading shipping regions...';
  regionSelect.disabled = true;
  regionSelect.replaceChildren();
  regionSelect.add(new Option('Loading regions...', ''));

  try {
    const data = await api('/api/shipping-tiers');

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No shipping regions are available.');
    }

    shippingTiers = data;

    regionSelect.add(new Option('Select region', ''));

    data.forEach(tier => {
      regionSelect.add(new Option(tier.region, tier.region));
    });

    regionsLoaded = true;
    regionSelect.disabled = false;
    message.textContent = '';
    } catch (error) {
    regionsLoaded = false;

    message.textContent =
      (error.error || error.message || 'Could not load shipping regions.') +
      ' ';

    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Retry';
    retry.addEventListener('click', loadShippingTiers);

    message.appendChild(retry);

    regionSelect.replaceChildren(
      new Option('Shipping regions unavailable', '')
    );
  }

  updateButton();
}

// Remove earlier error messages.
function clearErrors() {
  orderError.textContent = '';

  const itemError = document.getElementById('items-error');
  if (itemError) itemError.remove();

  [
    'name', 'mobile', 'email', 'street',
    'city', 'province', 'region', 'paymentMethod'
  ].forEach(field => {
    document.getElementById(field + '-error').textContent = '';
  });
}

// Put an error beside its corresponding field.
function showFieldError(field, text) {
  // Convert "customer.mobile" into "mobile".
  const normalizedField = field?.startsWith('customer.')
    ? field.slice('customer.'.length)
    : field;

  // Display product-related errors beside the order items.
  if (
    normalizedField === 'items' ||
    normalizedField?.startsWith('items.')
  ) {
    let itemError = document.getElementById('items-error');

    if (!itemError) {
      itemError = document.createElement('p');
      itemError.id = 'items-error';
      itemError.className = 'error error-message';
      itemError.setAttribute('role', 'alert');
      orderItems.appendChild(itemError);
    }

    itemError.textContent = text;
    return;
  }

  const element = document.getElementById(
    normalizedField + '-error'
  );

  if (element) {
    element.textContent = text;
  } else {
    orderError.textContent = text;
  }
}

// Check customer information before sending the request.

function validateCustomer(customer, paymentMethod) {
  let valid = true;

  for (const [field, value] of Object.entries(customer)) {
    if (!value.trim()) {
      showFieldError(field, 'This field is required.');
      valid = false;
    }
  }

  if (customer.mobile && !/^09\d{9}$/.test(customer.mobile)) {
    showFieldError('mobile', 'Enter an 11-digit PH mobile number.');
    valid = false;
  }

  if (
    customer.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)
  ) {
    showFieldError('email', 'Enter a valid email address.');
    valid = false;
  }

  if (
    customer.region &&
    !shippingTiers.some(t => t.region === customer.region)
  ) {
    showFieldError('region', 'Select a valid shipping region.');
    valid = false;
  }

  if (!['gcash', 'maya', 'cod'].includes(paymentMethod)) {
    showFieldError('paymentMethod', 'Choose a payment method.');
    valid = false;
  }

  return valid;
}

// Submit the order to Rynne's Orders API.
form.addEventListener('submit', async event => {
  event.preventDefault();

  if (submitting) return;

  clearErrors();

  const cart = getCart();

  if (!validCart(cart)) {
    orderError.textContent = 'Your cart is empty or invalid.';
    return;
  }

  const customer = {
    name: form.elements.name.value.trim(),
    mobile: form.elements.mobile.value.trim(),
    email: form.elements.email.value.trim(),
    street: form.elements.street.value.trim(),
    city: form.elements.city.value.trim(),
    province: form.elements.province.value.trim(),
    region: regionSelect.value
  };

  const paymentMethod =
    form.querySelector('input[name="paymentMethod"]:checked')?.value || '';

  if (!validateCustomer(customer, paymentMethod)) return;

  const items = cart.map(item => ({
    productId: item.productId,
    size: item.size,
    qty: Number(item.qty)
  }));

  submitting = true;
  updateButton();
  placeOrderButton.textContent = 'Placing Order...';
  message.textContent = 'Submitting your order...';
  try {
    const order = await api('/api/orders', {
      method: 'POST',
      body: { customer, items, paymentMethod }
    });

    if (!order || !order._id) {
      throw new Error('The server did not return an order ID.');
    }

    // Clear the purchased items only after a confirmed success.
    clearCart();

    // Do not unlock the button after a successful order.
    message.textContent = 'Order placed! Redirecting...';

    window.location.href =
      'confirmation.html?id=' + encodeURIComponent(order._id);

  } catch (error) {
    message.textContent = '';

    const errorText =
      error.error || error.message || 'Could not place order.';

    if (error.status === 409) {
      showFieldError('items', errorText);
    } else if (error.field) {
      showFieldError(error.field, errorText);
    } else {
      orderError.textContent = errorText;
    }

    // Allow another attempt ONLY when submission failed.
    submitting = false;
    placeOrderButton.textContent = 'Place Order';
    updateButton();
  }

});

// Start the checkout page.
regionSelect.addEventListener('change', updateShipping);
renderSummary();
loadShippingTiers();
