import { API_BASE } from "./config.js?v=4";
import { api } from "./api.js?v=4";

const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v != null));

async function getJSON(path, opts = {}) {
  return api(`${API_BASE}${path}`, opts);
}

/* ---------- public API ---------- */

export async function getProducts(params = {}, opts = {}) {
  const query = new URLSearchParams(clean(params)).toString();
  const data = await getJSON(`/products${query ? `?${query}` : ""}`, opts);
  if (!Array.isArray(data)) {
    throw { status: 200, error: "Unexpected products response" };
  }
  return data;
}

export async function getProduct(id, opts = {}) {
  return getJSON(`/products/${encodeURIComponent(id)}`, opts);
}

export async function getFeatured(opts = {}) {
  const items = await getProducts({}, opts);
  return items.filter((p) => p.featured).slice(0, 8);
}
