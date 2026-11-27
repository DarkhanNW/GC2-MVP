import { api } from "./api.js";
import { renderChrome } from "./components.js";
import { escapeHTML } from "./ui.js";
import { BRAND, categoryLabel } from "./catalog.js";

const root = document.getElementById("status-root");

const STATUS_META = Object.freeze({
  declined: { label: "Declined", badgeClass: "badge--declined" },
  pooling: { label: "Pooling", badgeClass: "badge--pooling" },
  ordered: { label: "Ordered", badgeClass: "badge--ordered" },
  ready: { label: "Ready", badgeClass: "badge--ready" },
  completed: { label: "Completed", badgeClass: "badge--completed" },
  cancelled: { label: "Cancelled", badgeClass: "badge--cancelled" },
});

let shippingTiersCache = null;

renderChrome();
loadRequest();

function peso(n) {
  const value = Number(n);
  return "₱" + (Number.isFinite(value) ? value : 0).toLocaleString("en-PH");
}

function formatTeam(slug) {
  return String(slug ?? "")
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function skeletonRequest() {
  return `
    <h1 class="sr-only">Loading request status</h1>
    <div class="card confirm__card" aria-hidden="true">
      <div class="skeleton sk-line" style="width:35%"></div>
      <div class="skeleton sk-line" style="width:70%;height:26px"></div>
      <div class="skeleton sk-line" style="width:90%"></div>
      <div class="skeleton" style="width:100%;height:72px;border-radius:8px"></div>
      <div class="skeleton sk-line" style="width:60%"></div>
      <div class="skeleton sk-line" style="width:50%"></div>
    </div>`;
}

function renderNotFound() {
  document.title = `Request not found | ${BRAND.name}`;
  root.innerHTML = `
    <div class="state">
      <h1 class="state__title">We couldn't find that request</h1>
      <p>The link may be incomplete or the sourcing request does not exist.</p>
      <div class="state__action request-status__actions">
        <a class="btn btn--primary" href="request.html">Submit a new request</a>
        <a class="btn btn--ghost" href="list.html">Back to shop</a>
      </div>
    </div>`;
}

function renderError(err) {
  document.title = `Request unavailable | ${BRAND.name}`;
  const message = err?.error || err?.message || "We couldn't load this right now.";
  root.innerHTML = `
    <div class="state" role="alert">
      <h1 class="state__title">Something went wrong</h1>
      <p>${escapeHTML(message)}</p>
      <div class="state__action">
        <button class="btn btn--primary" type="button" data-retry>Try again</button>
      </div>
    </div>`;
  root.querySelector("[data-retry]")?.addEventListener("click", loadRequest);
}

function renderPricingBlock(isDeclined, maxPrice, quotedPrice, qty) {
  if (isDeclined) {
    return `
      <div class="request-status__pricing">
        <p class="request-status__headline">Your max ${peso(maxPrice)} · Counter-offer ${peso(quotedPrice)}</p>
        <p class="request-status__subtext">Our lowest pooled price per item is ${peso(quotedPrice)} (above your ${peso(maxPrice)} max).</p>
      </div>`;
  }

  const totalText = qty > 1
    ? `${peso(quotedPrice)} × ${qty} = ${peso(quotedPrice * qty)} total · includes pooled overseas shipping`
    : "Includes pooled overseas shipping";
  const savingsText = maxPrice > quotedPrice
    ? ` · saves ${peso(maxPrice - quotedPrice)}/item vs your max`
    : "";

  return `
    <div class="request-status__pricing">
      <p class="request-status__headline">Your max ${peso(maxPrice)} · You pay ${peso(quotedPrice)}</p>
      <p class="request-status__subtext">${totalText}${savingsText}</p>
    </div>`;
}

function renderPoolBlock(req) {
  // Contract: `pool` is omitted (absent, not null) on every status except `pooling`.
  const hasPool =
    Object.hasOwn(req, "pool") &&
    req.pool != null &&
    typeof req.pool === "object" &&
    Number(req.pool.target) > 0;
  if (!hasPool) return "";

  const joined = Math.max(0, Number(req.pool.joined) || 0);
  const target = Number(req.pool.target);
  const progressValue = Math.min(joined, target);

  let shippingHTML = "";
  if (req.pool.shippingSolo != null && req.pool.shippingPooled != null) {
    const solo = Number(req.pool.shippingSolo);
    const pooled = Number(req.pool.shippingPooled);
    const saved = solo - pooled;
    const savedNote = saved > 0
      ? ` (save ${peso(saved)}/item, included in your price)`
      : " (included in your price)";
    shippingHTML = `<p class="pool__shipping">Overseas shipping: ${peso(pooled)} pooled vs ${peso(solo)} solo${savedNote}</p>`;
  }

  return `
    <div class="request-status__pool">
      <label for="pool-progress" class="pool__label">${joined} of ${target} fans joined, ships when full</label>
      <progress id="pool-progress" class="pool-progress" value="${progressValue}" max="${target}"></progress>
      ${shippingHTML}
    </div>`;
}

function renderDeliveryText(req, tier) {
  if (tier) {
    const feeText = Number(tier.fee) === 0 ? "FREE" : peso(tier.fee);
    return `${feeText} (${escapeHTML(tier.region)} · paid at handover)`;
  }
  if (req.customer?.region) {
    return `${escapeHTML(req.customer.region)} · paid at handover`;
  }
  return "Paid at handover";
}

function renderRequest(req, tier) {
  const teamName = formatTeam(req.team);
  const catName = categoryLabel(req.category);
  document.title = `${teamName || "Request"} Status | ${BRAND.name}`;

  const rawStatus = String(req.status ?? "");
  const statusInfo = STATUS_META[rawStatus] || { label: rawStatus || "Unknown", badgeClass: "" };
  const isDeclined = rawStatus === "declined";
  const qty = Number(req.qty) || 1;
  const maxPrice = Number(req.maxPrice) || 0;
  const quotedPrice = Number(req.quotedPrice) || 0;
  const details = String(req.details ?? "").trim();
  const customerName = String(req.customer?.name ?? "").trim();
  const statusNote = String(req.statusNote ?? "").trim();

  const actionsHTML = isDeclined
    ? `
      <a href="request.html" class="btn btn--primary btn--block">Submit a new request</a>
      <a href="list.html" class="btn btn--ghost btn--block">Back to shop</a>`
    : `<a href="list.html" class="btn btn--ghost btn--block">Back to shop</a>`;

  root.innerHTML = `
    <article class="card confirm__card request-status">
      <div class="request-status__head">
        <div>
          <p class="confirm__no">Sourcing Request #${escapeHTML(req._id || "")}</p>
          <h1 class="confirm__title">${escapeHTML(teamName || "Custom Request")}</h1>
        </div>
        <span class="badge ${statusInfo.badgeClass}">${escapeHTML(statusInfo.label)}</span>
      </div>

      ${statusNote ? `<p class="request-status__note${isDeclined ? " request-status__note--declined" : ""}">${escapeHTML(statusNote)}</p>` : ""}

      ${renderPricingBlock(isDeclined, maxPrice, quotedPrice, qty)}

      ${renderPoolBlock(req)}

      <dl class="specs">
        <div><dt>Team</dt><dd>${escapeHTML(teamName)}</dd></div>
        <div><dt>Category</dt><dd>${escapeHTML(catName)}</dd></div>
        <div><dt>Size</dt><dd>${escapeHTML(req.size)}</dd></div>
        <div><dt>Quantity</dt><dd>${escapeHTML(String(qty))}</dd></div>
        <div><dt>Your max price</dt><dd>${peso(maxPrice)} / item</dd></div>
        <div><dt>${isDeclined ? "Counter-offer" : "You pay"}</dt><dd>${peso(quotedPrice)} / item</dd></div>
        <div><dt>Local delivery</dt><dd>${renderDeliveryText(req, tier)}</dd></div>
        ${details ? `<div><dt>Details</dt><dd>${escapeHTML(details)}</dd></div>` : ""}
        ${customerName ? `<div><dt>Requested by</dt><dd>${escapeHTML(customerName)}</dd></div>` : ""}
      </dl>

      <div class="request-status__actions">
        ${actionsHTML}
      </div>
    </article>`;
}

async function fetchShippingTier(region) {
  if (!region) return null;
  if (shippingTiersCache === null) {
    try {
      const tiers = await api("/api/shipping-tiers");
      if (Array.isArray(tiers)) shippingTiersCache = tiers;
    } catch {
      return null;
    }
  }
  return Array.isArray(shippingTiersCache)
    ? shippingTiersCache.find((t) => t.region === region) || null
    : null;
}

async function loadRequest() {
  const id = new URLSearchParams(window.location.search).get("id")?.trim();
  if (!id) {
    renderNotFound();
    return;
  }

  root.innerHTML = skeletonRequest();

  let req;
  try {
    req = await api("/api/sourcing-requests/" + encodeURIComponent(id));
  } catch (err) {
    if (err?.status === 404) renderNotFound();
    else renderError(err);
    return;
  }

  if (!req || typeof req !== "object") {
    renderError(new Error("Unexpected response from server."));
    return;
  }

  const tier = await fetchShippingTier(req?.customer?.region);
  renderRequest(req, tier);
}
