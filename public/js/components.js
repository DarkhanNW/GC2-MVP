import { escapeHTML, money, imageFor } from "./ui.js?v=4";
import { statusFor } from "./stock.js?v=4";
import { BRAND, CATEGORIES, categoryHref } from "./catalog.js?v=4";

/* ---------------- chrome ---------------- */

const NAV_LINKS = [
  { href: "index.html", label: "Home", key: "home" },
  { href: "list.html", label: "Shop All", key: "list" },
  ...CATEGORIES.map((category) => ({
    href: categoryHref(category.id),
    label: category.plural,
    key: "list",
    cat: category.id,
  })),
];

const isActiveLink = (link, active, category) =>
  link.key === active && (link.cat ?? "") === category;

export function renderChrome({ active = "", category = "" } = {}) {
  const header = document.querySelector("#site-header");
  const footer = document.querySelector("#site-footer");
  if (!header || !footer) return;

  const navHTML = NAV_LINKS.map((link) => `
    <a href="${link.href}"
      data-nav-key="${link.key}"
      data-nav-cat="${link.cat ?? ""}"${isActiveLink(link, active, category) ? ' aria-current="page"' : ""}>${link.label}</a>
  `).join("");

  header.innerHTML = `
    <div class="container site-header__bar">
      <a class="logo" href="index.html"><span class="logo__mark" aria-hidden="true"></span>${BRAND.mark}</a>
    </div>
    <nav class="container site-nav" aria-label="Primary">${navHTML}</nav>`;

  footer.innerHTML = `
    <div class="container footer__inner">
      <div class="footer__brand">
        <span class="logo"><span class="logo__mark" aria-hidden="true"></span>${BRAND.mark}</span>
        <p>Authentic-feel NFL gear, sourced overseas and delivered locally. Built for the Bowl.</p>
      </div>
      <nav class="footer__col" aria-label="Shop">
        <h4>Shop</h4>
        ${CATEGORIES.map((category) => `<a href="${categoryHref(category.id)}">${category.plural}</a>`).join("")}
      </nav>
    </div>
    <div class="container footer__legal">
      <span>© ${new Date().getFullYear()} ${BRAND.name}</span>
      <span>Metro Manila, PH</span>
    </div>`;
}

/* Update only the active nav item; do not rebuild the chrome on every load. */
export function syncChrome({ active = "", category = "" } = {}) {
  document.querySelectorAll(".site-nav a[data-nav-key]").forEach((link) => {
    const isActive = link.dataset.navKey === active && link.dataset.navCat === category;
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

/* ---------------- status ---------------- */

export const STATUS_LABELS = Object.freeze({
  in_stock: "In Stock",
  low_stock: "Low Stock",
  sold_out: "Sold Out",
  pre_order: "Pre-Order",
});

const STATUS_CLASSES = {
  in_stock: "badge--instock",
  low_stock: "badge--low",
  sold_out: "badge--soldout",
  pre_order: "badge--preorder",
};

export function statusBadgesHTML(status, preOrder = false) {
  const label = STATUS_LABELS[status] || status;
  const badges = [
    `<span class="badge ${STATUS_CLASSES[status] || ""}">${escapeHTML(label)}</span>`,
  ];
  if (preOrder && status !== "pre_order") {
    badges.push(`<span class="badge badge--preorder">Pre-Order</span>`);
  }
  return badges.join("");
}

/* ---------------- product card ---------------- */

export function productCard(p) {
  const status = p.status || statusFor(p);
  const soldOut = status === "sold_out";
  const badges = statusBadgesHTML(status, Boolean(p.preOrder));

  return `
    <a class="card${soldOut ? " card--soldout" : ""}" href="detail.html?id=${encodeURIComponent(p._id)}">
      <div class="card__media">
        <img src="${escapeHTML(imageFor(p))}" alt="${escapeHTML(p.name)}" loading="lazy" width="400" height="400" onerror="this.onerror=null;this.src='img/placeholder.svg'">
        <div class="card__badges">${badges}</div>
      </div>
      <div class="card__body">
        <span class="card__team">${escapeHTML(p.team)}</span>
        <h3 class="card__name">${escapeHTML(p.name)}</h3>
        <span class="card__price">${money(p.price)}</span>
      </div>
    </a>`;
}

export const productGrid = (items) => items.map(productCard).join("");

/* ---------------- loading / empty / error ---------------- */

export function skeletonGrid(n = 8) {
  return Array.from({ length: n }, () => `
    <div class="card" aria-hidden="true">
      <div class="card__media skeleton"></div>
      <div class="card__body">
        <div class="skeleton sk-line" style="width:45%"></div>
        <div class="skeleton sk-line" style="width:85%;margin-top:10px"></div>
        <div class="skeleton sk-line" style="width:35%;margin-top:14px"></div>
      </div>
    </div>`).join("");
}

export function skeletonDetail() {
  return `
    <div class="detail" aria-hidden="true">
      <div class="gallery__main skeleton"></div>
      <div class="detail__info">
        <div class="skeleton sk-line" style="width:30%"></div>
        <div class="skeleton sk-line" style="width:80%;height:26px;margin-top:14px"></div>
        <div class="skeleton sk-line" style="width:40%;margin-top:14px"></div>
        <div class="skeleton" style="width:100%;height:130px;margin-top:20px;border-radius:10px"></div>
      </div>
    </div>`;
}

export function emptyState({ title, message, action = "" }) {
  return `
    <div class="state">
      <p class="state__title">${escapeHTML(title)}</p>
      <p>${escapeHTML(message)}</p>
      ${action ? `<div class="state__action">${action}</div>` : ""}
    </div>`;
}

export function errorState(err, { title = "Something went wrong" } = {}) {
  return `
    <div class="state">
      <p class="state__title">${escapeHTML(title)}</p>
      <p>${escapeHTML(err?.message || "We couldn't load this right now.")}</p>
      <div class="state__action">
        <button class="btn btn--primary" type="button" data-retry>Try again</button>
      </div>
    </div>`;
}
