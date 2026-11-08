/* Product availability from the backend contract.
   `sizes` is an array of { size, stock }; `lowStockAt` defaults to 3. */

const DEFAULT_LOW_STOCK_AT = 3;

function lowStockAt(product) {
  const value = Number(product?.lowStockAt);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_LOW_STOCK_AT;
}

export function stockState(product) {
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const counts = Object.create(null);
  let total = 0;

  for (const entry of sizes) {
    if (!entry || typeof entry !== "object") continue;
    const size = String(entry.size ?? "");
    if (!size) continue;
    const count = Math.max(0, Number(entry.stock) || 0);
    counts[size] = count;
    total += count;
  }

  const threshold = lowStockAt(product);
  const soldOut = total <= 0;
  const lowSizes = soldOut
    ? []
    : sizes
      .filter((entry) => {
        const count = counts[entry.size];
        return count > 0 && count <= threshold;
      })
      .map((entry) => ({ size: entry.size, count: counts[entry.size] }));

  return { counts, total, soldOut, lowSizes, lowStockAt: threshold };
}

export function statusFor(product, state = stockState(product)) {
  if (state.soldOut) return "sold_out";
  if (state.lowSizes.length) return "low_stock";
  if (product?.preOrder) return "pre_order";
  return "in_stock";
}

/* Plain-text availability copy for the detail page. */
export function stockMessage(product, selectedSize = "", state = stockState(product)) {
  const status = product?.status || statusFor(product, state);

  if (status === "sold_out") return "Sold out — all sizes are unavailable.";
  if (status === "pre_order") return "Available for pre-order.";

  if (selectedSize) {
    const count = state.counts[selectedSize] ?? 0;
    if (count <= 0) return "Sold out.";
    return count <= state.lowStockAt
      ? `Only ${count} left in ${selectedSize}.`
      : "In stock.";
  }

  if (state.lowSizes.length) {
    return state.lowSizes
      .map(({ size, count }) => `Only ${count} left in ${size}`)
      .join(" · ");
  }

  return "In stock — select a size.";
}
