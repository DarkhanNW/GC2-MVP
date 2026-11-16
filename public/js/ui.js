/* Small shared helpers. No DOM rendering of API data happens without escapeHTML(). */

import { DEFAULT_CURRENCY } from "./catalog.js?v=4";

export const qs  = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

export const escapeHTML = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const formatters = new Map();

export const money = (pesos, currency = DEFAULT_CURRENCY) => {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-PH", { style: "currency", currency });
    formatters.set(currency, formatter);
  }
  return formatter.format(Number(pesos) || 0);
};

export function debounce(fn, ms = 300) {
  let t;
  const wrapped = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = () => clearTimeout(t);
  return wrapped;
}

/* The backend supplies `image`; keep one neutral fallback for missing art. */
export function imageFor(product) {
  return product?.image || "img/placeholder.svg";
}
