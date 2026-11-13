/* One serializer/parser for the list page's URL state.
   Contract: q, category, sort (newest by default). */

const CATEGORIES = new Set(["jerseys", "hoodies", "tees"]);
const SORTS = new Set(["newest", "price_asc", "price_desc"]);

function normalizeListState(state = {}) {
  const category = String(state.category ?? "");
  const sort = String(state.sort || "newest");
  return {
    category: CATEGORIES.has(category) ? category : "",
    q: String(state.q ?? ""),
    sort: SORTS.has(sort) ? sort : "newest",
  };
}

export function parseListState(search = location.search) {
  const sp = new URLSearchParams(search);
  return normalizeListState({
    category: sp.get("category"),
    q: sp.get("q"),
    sort: sp.get("sort"),
  });
}

export function buildListHref(state, path = "list.html") {
  const normalized = normalizeListState(state);
  const sp = new URLSearchParams();

  if (normalized.category) sp.set("category", normalized.category);
  if (normalized.q) sp.set("q", normalized.q);
  if (normalized.sort !== "newest") sp.set("sort", normalized.sort);

  const query = sp.toString();
  return `${path}${query ? `?${query}` : ""}`;
}
