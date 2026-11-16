import { renderChrome, refreshCartCount } from './components.js?v=6';
import { api } from './api.js';
import { getCart, CART_KEY, MAX_QTY } from './cart-store.js';

const cartMessage = document.getElementById('cart-message');
const cartItems = document.getElementById('cart-items');
const subtotal = document.getElementById('subtotal');
const checkoutButton = document.getElementById('checkout-button');

let loading = false;

// cart-store.js currently keeps saveCart private.
// This helper saves Cart page changes using the shared storage key.
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatPrice(price) {
  return '₱' + Number(price).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function updateCount() {
  refreshCartCount();
}

function removeItem(productId, size) {
  const updated = getCart().filter(item =>
    !(item.productId === productId && item.size === size)
  );

  saveCart(updated);
  renderCart();
}

function updateQuantity(productId, size, newQty) {
  const updated = getCart();

  const item = updated.find(item =>
    item.productId === productId && item.size === size
  );

  if (!item) return;

  item.qty = newQty;
  saveCart(updated);
  renderCart();
}

function showRetryMessage(text) {
  cartMessage.textContent = text + ' ';

  const retry = document.createElement('button');
  retry.textContent = 'Retry';
  retry.addEventListener('click', renderCart);

  cartMessage.appendChild(retry);
}

async function renderCart() {
  if (loading) return;

  loading = true;

  try {
    checkoutButton.disabled = true;
    cartItems.replaceChildren();
    updateCount();

    const cart = getCart();

    if (cart.length === 0) {
      cartMessage.textContent = 'Your cart is empty.';
      subtotal.textContent = formatPrice(0);
      return;
    }

    cartMessage.textContent = 'Loading your cart...';
    subtotal.textContent = '—';

    // Retrieve current product prices and per-size stock.
    // Re-fetching during each render is intentional for this MVP.
    const results = await Promise.allSettled(
      cart.map(item =>
        api('/api/products/' + encodeURIComponent(item.productId))
      )
    );

    let total = 0;
    let hasProblem = false;
    let hasNetworkError = false;

    const updatedCart = getCart();

       results.forEach((result, index) => {
      const item = cart[index];

      const currentItem = updatedCart.find(saved =>
        saved.productId === item.productId &&
        saved.size === item.size
      );

      const row = document.createElement('div');
      row.className = 'cart-item';

      const name = document.createElement('h3');
      name.textContent = item.name || 'Product';
      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';

      removeButton.addEventListener('click', () => {
        removeItem(item.productId, item.size);
      });

      row.appendChild(name);

      // Product API failure or deleted product.
      if (result.status === 'rejected') {
        hasProblem = true;

        if (result.reason?.status !== 404) {
          hasNetworkError = true;
        }

        const error = document.createElement('p');

        error.textContent = result.reason?.status === 404
          ? 'This product is no longer available.'
          : 'Could not check this product. Please retry.';

        row.append(error, removeButton);
        cartItems.appendChild(row);
        return;
      }

      const product = result.value;

      const variant = product.sizes?.find(
        variant => variant.size === item.size
      );

      const stock = Number(variant?.stock ?? 0);
      const maxAllowed = Math.min(MAX_QTY, stock);
      const price = Number(product.price);
      const qty = Number(item.qty);

      const details = document.createElement('p');
      details.textContent =
        `Size: ${item.size} | Price: ${formatPrice(price)}`;

      row.appendChild(details);

      // Identify invalid stock, quantity, or price.
      if (
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(qty) ||
        qty < 1 ||
        qty > maxAllowed
      ) {
        hasProblem = true;

        const warning = document.createElement('p');

        if (!variant) {
          warning.textContent =
            'This size is no longer available.';
        } else if (maxAllowed === 0) {
          warning.textContent =
            'Selected size is out of stock.';
        } else if (qty > maxAllowed) {
          warning.textContent =
            `Only ${maxAllowed} unit(s) available for this size.`;
        } else {
          warning.textContent =
            'Invalid product price or quantity.';
        }

        row.appendChild(warning);
      }

      // Refresh saved product details for Checkout.
      if (
        Number.isFinite(price) &&
        price >= 0 &&
        currentItem
      ) {
        currentItem.name = product.name;
        currentItem.price = price;
      }

      // Show quantity controls when stock is available.
      if (maxAllowed > 0) {
        const quantityLabel = document.createElement('label');
        quantityLabel.textContent = 'Quantity: ';

        const quantity = document.createElement('input');
        quantity.type = 'number';

        quantity.setAttribute(
          'aria-label',
          `Quantity for ${item.name}, size ${item.size}`
        );

        quantity.min = '1';
        quantity.max = String(maxAllowed);
        quantity.value = item.qty;

        const quantityError = document.createElement('p');
        quantityError.className = 'cart-error';
        quantityError.setAttribute('role', 'alert');

        quantity.addEventListener('change', () => {
          const newQty = Number(quantity.value);

          if (
            !Number.isInteger(newQty) ||
            newQty < 1 ||
            newQty > maxAllowed
          ) {
            quantityError.textContent =
              `Please enter a quantity between 1 and ${maxAllowed}.`;

            quantity.value = item.qty;
            return;
          }

          quantityError.textContent = '';
          updateQuantity(item.productId, item.size, newQty);
        });

        quantityLabel.appendChild(quantity);
        row.appendChild(quantityLabel);
        row.appendChild(quantityError);
      }

      // Only include valid Cart lines in the subtotal.
      const lineTotal = price * qty;

      const validQuantity =
        Number.isInteger(qty) &&
        qty >= 1 &&
        qty <= maxAllowed;

      if (
        validQuantity &&
        Number.isFinite(lineTotal) &&
        lineTotal >= 0
      ) {
        total += lineTotal;

        const linePrice = document.createElement('p');
        linePrice.textContent =
          `Line total: ${formatPrice(lineTotal)}`;

        row.appendChild(linePrice);
      }

      row.appendChild(removeButton);
      cartItems.appendChild(row);
    });

    // Save refreshed names and prices when they changed.
    if (JSON.stringify(updatedCart) !== JSON.stringify(cart)) {
      saveCart(updatedCart);
    }

    updateCount();

    if (hasProblem) {
      subtotal.textContent = '—';
      checkoutButton.disabled = true;

      if (hasNetworkError) {
        showRetryMessage(
          'Some products could not be verified.'
        );
      } else {
        cartMessage.textContent =
          'Please correct or remove unavailable items before checkout.';
      }
    } else {
      subtotal.textContent = formatPrice(total);
      cartMessage.textContent = '';
      checkoutButton.disabled = false;
    }

  } catch (error) {
    console.error('Cart rendering failed:', error);

    subtotal.textContent = '—';
    checkoutButton.disabled = true;

    showRetryMessage('Could not load your cart.');
  } finally {
    // Always reset loading, including after early returns.
    loading = false;
  }
}

checkoutButton.addEventListener('click', () => {
  window.location.href = 'checkout.html';
});

// Display the shared site header, navigation, and footer.
renderChrome();

// Load and display the Cart.
renderCart();
