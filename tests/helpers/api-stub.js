import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const fixturePath = fileURLToPath(new URL("../fixtures/products.json", import.meta.url));
export const PRODUCTS = JSON.parse(readFileSync(fixturePath, "utf8"));

export function productBySlug(slug) {
  return PRODUCTS.find((product) => product.slug === slug);
}

function filterProducts(params) {
  const q = (params.get("q") || "").toLowerCase();
  const category = params.get("category") || "";
  const sort = params.get("sort") || "newest";

  let items = PRODUCTS.filter((product) => {
    if (category && product.category !== category) return false;
    if (!q) return true;
    return `${product.name} ${product.team} ${product.description}`.toLowerCase().includes(q);
  });

  if (sort === "price_asc") items = [...items].sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") items = [...items].sort((a, b) => b.price - a.price);
  else items = [...items].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  return items;
}

async function json(route, status, body) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

/* Intercept the Catalog API so UI tests do not need the backend.
   Modes: normal | empty | error. Detail IDs not in the fixture return 404. */
export async function installApiMock(page, { mode = "normal", delay = 0 } = {}) {
  await page.route("**/api/products**", async (route) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));

    if (mode === "error") return json(route, 500, { error: "Test API failure" });

    const url = new URL(route.request().url());
    const path = url.pathname.replace(/\/$/, "");

    if (path === "/api/products") {
      if (mode === "empty") return json(route, 200, []);
      return json(route, 200, filterProducts(url.searchParams));
    }

    const id = decodeURIComponent(path.slice("/api/products/".length));
    const product = PRODUCTS.find((item) => item._id === id);
    if (!product) return json(route, 404, { error: "Product not found" });
    return json(route, 200, product);
  });
}

export function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

export async function overflowState(page) {
  return page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
}
