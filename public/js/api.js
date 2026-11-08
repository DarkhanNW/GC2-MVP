/* API fetcher function */
/*
 How to load the fetch helper function: paste <script src="js/api.js"></script> before the last body tag, and BEFORE any of your own screens' scripts.
 GET and POST examples:
    GET: No options
    const <variable> = await api('/api/<route>');

    GET: w/ query string
    const <variable> = await api('/api/products?category=<category>&sort=<variable>');

    POST: pass the body as a plain object (do NOT stringify it), the function will  stringify it and set the content type.
    const <variable> = await api('/api/<route>', {
    method: 'POST',
    body: {
      <key> : value,
      <key> : {object},
    },
    });

    USAGE WITH STATES:
    status.textContent = 'Loading…';
    try {
      const data = await api('/api/<route>');
      if (!data || data.length === 0) {  empty state  }
      else {  render data  }
    } catch (err) {
      status.textContent = err.error;  
    }

    Returns a value parsed from JSON or null if there's no body.

    Throws an object showing { status, error, field }, a status of 0 means a network error. Show err.error, check err.status for special cases (0 = network, 409 = sold out).

    Warning: Always await this function inside an async function.
*/

async function api(path, options={}) {
    const config = { 
        ...options, 
        headers : { ...options.headers, 'Content-Type' : 'application/json'},
     };

    if (config.body) {
        config.body = JSON.stringify(config.body);
    }

    let response;

    try {
        response = await fetch(path, config);
    } catch {
        throw { status: 0, error: "Network Error."};
    }

    const text = await response.text();

    let value = null;
    if (text) {
    try {
        value = JSON.parse(text);
    } catch {
        value = null;
        }
    }

    if (!response.ok) {
        throw {
            status: response.status,
            error: value?.error ?? `Something went wrong ${response.status}. Please try again.`,
            field: value?.field,
        };
    }
    return value;
}

/* loading, empty, and error screen handling for front-end */

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
