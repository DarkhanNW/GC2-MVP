
const cartMessage = document.getElementById('cart-message');
const cartItems = document.getElementById('cart-items');
const subtotal = document.getElementById('subtotal');
const checkoutButton = document.getElementById('checkout-button');
const cartCount = document.getElementById('cart-count');


const CART_KEY = '100yard-cart';

function getCart() {
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatPrice(price) {
  return '₱' + Number(price).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function renderCart() {
  const cart = getCart();
  cartItems.replaceChildren();

  const itemCount = cart.reduce((sum, item) => {
    return sum + item.qty;
  }, 0);

  cartCount.textContent = itemCount;

  if (cart.length === 0) {
    cartMessage.textContent = 'Your cart is empty.';
    subtotal.textContent = formatPrice(0);
    checkoutButton.disabled = true;
    return;
  }

  cartMessage.textContent = '';
  checkoutButton.disabled = false;

  let total = 0;

  cart.forEach((item, index) => {
    const lineTotal = item.price * item.qty;
    total += lineTotal;

    const row = document.createElement('div');

    const name = document.createElement('h3');
    name.textContent = item.name;

    const details = document.createElement('p');
    details.textContent =
      `Size: ${item.size} | Price: ${formatPrice(item.price)}`;

    const quantityLabel = document.createElement('label');
    quantityLabel.textContent = 'Quantity: ';

    const quantity = document.createElement('input');
    quantity.type = 'number';
    quantity.min = '1';
    quantity.max = '3';
    quantity.value = item.qty;

    quantity.addEventListener('change', () => {
      const newQty = Number(quantity.value);

      if (!Number.isInteger(newQty) || newQty < 1 || newQty > 3) {
        alert('Quantity must be between 1 and 3.');
        renderCart();
        return;
      }

      const updatedCart = getCart();
      updatedCart[index].qty = newQty;
      saveCart(updatedCart);
      renderCart();
    });

    quantityLabel.appendChild(quantity);

    const linePrice = document.createElement('p');
    linePrice.textContent = `Line total: ${formatPrice(lineTotal)}`;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';

    removeButton.addEventListener('click', () => {
      const updatedCart = getCart();
      updatedCart.splice(index, 1);
      saveCart(updatedCart);
      renderCart();
    });

    row.append(
      name,
      details,
      quantityLabel,
      linePrice,
      removeButton
    );

    cartItems.appendChild(row);
  });

  subtotal.textContent = formatPrice(total);
}

checkoutButton.addEventListener('click', () => {
  window.location.href = 'checkout.html';
});

renderCart();
