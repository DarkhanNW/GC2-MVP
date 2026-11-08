import {
  renderChrome, skeletonDetail, emptyState, errorState, statusBadgesHTML, refreshCartCount,
} from "./components.js?v=4";
import { getProduct } from "./products-api.js?v=4";
import { addToCart } from "./cart-store.js?v=4";
import { qs, escapeHTML, money, imageFor } from "./ui.js?v=4";
import { stockState, statusFor, stockMessage } from "./stock.js?v=4";
import { BRAND, categoryLabel } from "./catalog.js?v=4";

const id = new URLSearchParams(location.search).get("id");
const root = qs("#detail-root");
const crumb = qs("#crumb-current");

renderChrome({ active: "" });
init();

async function init() {
  if (!id) return renderNotFound();

  root.innerHTML = skeletonDetail();

  try {
    const product = await getProduct(id);
    render(product);
  } catch (err) {
    if (err.status === 404) return renderNotFound();
    root.innerHTML = `<h1 class="sr-only">Product unavailable</h1>${errorState(err)}`;
    root.querySelector("[data-retry]")?.addEventListener("click", init);
  }
}

function renderNotFound() {
  document.title = `Product not found — ${BRAND.name}`;
  crumb.textContent = "Not found";
  root.innerHTML = `<h1 class="sr-only">Product not found</h1>${emptyState({
    title: "We couldn't find that product",
    message: "It may have sold out or the link may be out of date.",
    action: `<a class="btn btn--primary" href="list.html">Back to shop</a>`,
  })}`;
}

/* ---------- render ---------- */

function render(p) {
  document.title = `${p.name} — ${BRAND.name}`;
  crumb.textContent = p.name;

  const image = imageFor(p);
  const stock = stockState(p);
  const status = p.status || statusFor(p, stock);
  const soldOut = status === "sold_out";
  const lowSizes = new Set(stock.lowSizes.map(({ size }) => size));

  root.innerHTML = `
    <div class="detail">
      <div class="gallery">
        <div class="gallery__main">
          <img id="gallery-main" src="${escapeHTML(image)}" alt="${escapeHTML(p.name)}" width="600" height="600" onerror="this.onerror=null;this.src='img/placeholder.svg'">
        </div>
      </div>

      <div class="detail__info">
        <p class="detail__eyebrow">${escapeHTML(p.team)} · ${escapeHTML(categoryLabel(p.category))}</p>
        <h1 class="detail__title">${escapeHTML(p.name)}</h1>

        <div class="detail__meta">
          ${statusBadgesHTML(status, Boolean(p.preOrder))}
        </div>

        <p class="detail__price">${money(p.price)}</p>

        <div class="field">
          <span class="field__label">Size</span>
          <div class="sizes" role="group" aria-label="Select a size">
            ${p.sizes.map(({ size, stock: count }) => {
              const available = count > 0;
              const low = lowSizes.has(size);
              const label = available
                ? (low ? `Size ${size}, only ${count} left` : `Size ${size}`)
                : `Size ${size}, sold out`;
              return `
                <button class="size-btn" type="button"
                  data-size="${escapeHTML(size)}"
                  data-stock="${count}"
                  aria-label="${escapeHTML(label)}"
                  aria-pressed="false"${available ? "" : " disabled"}>${escapeHTML(size)}</button>`;
            }).join("")}
          </div>
          <p class="stock-note${soldOut || lowSizes.size ? " is-low" : ""}" id="stock-note" aria-live="polite">${escapeHTML(stockMessage(p, "", stock))}</p>
        </div>

        <button class="btn btn--primary btn--block" type="button" id="add-to-cart" disabled>
          ${soldOut ? "Sold out" : "Select a size"}
        </button>

        <p class="detail__desc">${escapeHTML(p.description)}</p>

        <dl class="specs">
          <div><dt>Category</dt><dd>${escapeHTML(categoryLabel(p.category))}</dd></div>
          <div><dt>Sizes</dt><dd>${p.sizes.map(({ size }) => escapeHTML(size)).join(" · ")}</dd></div>
        </dl>
      </div>
    </div>`;

  wireSizeSelector(p, soldOut, stock, lowSizes);
}

function wireSizeSelector(p, soldOut, stock, lowSizes) {
  const buttons = [...root.querySelectorAll(".size-btn")];
  const cta = qs("#add-to-cart");
  const note = qs("#stock-note");
  let selected = "";

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      selected = btn.dataset.size;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));

      note.textContent = stockMessage(p, selected, stock);
      note.classList.toggle("is-low", lowSizes.has(selected));

      cta.disabled = false;
      cta.textContent = "Add to cart";
    });
  });

  if (soldOut) return;

  cta.addEventListener("click", () => {
    if (!selected || stock.counts[selected] <= 0) return;
    addToCart({
      _id: p._id,
      productId: p._id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      image: imageFor(p),
      size: selected,
      qty: 1,
    });
    refreshCartCount();
    showToast(`${p.name} (${selected}) added to cart`);
  });
}

/* ---------- toast ---------- */

let toastTimer;
function showToast(message) {
  const toast = qs("#toast");
  toast.textContent = message;
  toast.classList.add("is-open");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-open"), 2200);
}
