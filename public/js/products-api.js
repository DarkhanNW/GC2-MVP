import { API_BASE } from "./config.js?v=4";

const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v != null));

async function getJSON(path, { signal } = {}) {
  const res = await fetch(`${API_BASE}${path}`, { signal });
  if (!res.ok) {
    const message = res.status === 404 ? "Not found" : `Request failed (${res.status})`;
    throw Object.assign(new Error(message), { status: res.status });
  }
  return res.json();
}

/* ---------- public API ---------- */

export async function getProducts(params = {}, opts = {}) {
  const query = new URLSearchParams(clean(params)).toString();
  const data = await getJSON(`/products${query ? `?${query}` : ""}`, opts);
  if (!Array.isArray(data)) throw new Error("Unexpected products response");
  return data;
}

export async function getProduct(id, opts = {}) {
  return getJSON(`/products/${encodeURIComponent(id)}`, opts);
}

export async function getFeatured(opts = {}) {
  const items = await getProducts({}, opts);
  return items.filter((p) => p.featured).slice(0, 8);
}
