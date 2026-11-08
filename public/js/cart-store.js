const CART_KEY = "100yard-cart";
const MAX_QTY = 3;

export function getCart() {
  try {
    const saved = localStorage.getItem(CART_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("cart:updated"));
}

export function cartCount() {
  return getCart().reduce((total, item) => total + (Number(item.qty) || 0), 0);
}

export function addToCart(line) {
  const qty = Math.min(MAX_QTY, Math.max(1, Number(line.qty) || 1));
  const cart = getCart();
  const existing = cart.find((item) => item._id === line._id && item.size === line.size);

  if (existing) {
    existing.qty = Math.min(MAX_QTY, (Number(existing.qty) || 0) + qty);
  } else {
    cart.push({ ...line, qty });
  }

  saveCart(cart);
  return cartCount();
}

export function updateQuantity(index, qty) {
  const cart = getCart();
  if (!cart[index]) return cartCount();
  cart[index].qty = Math.min(MAX_QTY, Math.max(1, Number(qty) || 1));
  saveCart(cart);
  return cartCount();
}

export function removeLine(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  return cartCount();
}
