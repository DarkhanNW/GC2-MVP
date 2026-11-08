/* One serializer/parser for the list page's URL state.
   Contract: q, category, sort (newest by default). */

function normalizeListState(state = {}) {
  return {
    category: String(state.category ?? ""),
    q: String(state.q ?? ""),
    sort: String(state.sort || "newest"),
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
