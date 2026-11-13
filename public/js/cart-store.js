export const CART_KEY = "100yard-cart";
export const MAX_QTY = 3;

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function getCart() {
  return readCart();
}

/* Add a line using M5's cart contract. Returns the stored line and the number
   of units actually added, which may be less than requested at the cap. */
export function addToCart(line) {
  const cart = readCart();
  const productId = String(line?.productId ?? "");
  const size = String(line?.size ?? "");
  if (!productId || !size) return { item: null, added: 0 };

  const requested = Math.trunc(Number(line.qty) || 1);
  const qty = Math.min(MAX_QTY, Math.max(1, requested));
  const existing = cart.find(
    (item) => item?.productId === productId && item?.size === size,
  );

  if (existing) {
    const before = Math.max(0, Number(existing.qty) || 0);
    const after = Math.min(MAX_QTY, before + qty);
    existing.qty = after;
    saveCart(cart);
    return { item: existing, added: after - before };
  }

  const item = {
    productId,
    name: String(line.name ?? ""),
    price: Number(line.price),
    size,
    qty,
  };
  cart.push(item);
  saveCart(cart);
  return { item, added: qty };
}
