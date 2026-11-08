import {
  renderChrome, syncChrome, productGrid, skeletonGrid,
  emptyState, errorState,
} from "./components.js?v=4";
import { getProducts } from "./products-api.js?v=4";
import { parseListState, buildListHref } from "./list-url.js?v=4";
import { categoryById } from "./catalog.js?v=4";
import { qs, qsa, debounce } from "./ui.js?v=4";

const els = {
  grid: qs("#product-grid"),
  status: qs("#list-status"),
  count: qs("#result-count"),
  search: qs("#search"),
  sort: qs("#sort"),
  categoryChips: qsa("[data-category]"),
};

let controller = null;

/* Keep chip labels tied to the catalog without replacing authored HTML. */
els.categoryChips.forEach((chip) => {
  const category = categoryById(chip.dataset.category);
  if (category) chip.textContent = category.plural;
});

const initial = parseListState(location.search);
renderChrome({ active: "list", category: initial.category });

function writeParams(p, { push = false } = {}) {
  const url = buildListHref(p, location.pathname);
  history[push ? "pushState" : "replaceState"](null, "", url);
}

function syncControls(p) {
  els.search.value = p.q;
  els.sort.value = p.sort;
  els.categoryChips.forEach((btn) =>
    btn.setAttribute("aria-pressed", String(btn.dataset.category === p.category)));
}

/* ---------- render ---------- */

async function load() {
  const params = parseListState(location.search);
  syncControls(params);
  syncChrome({ active: "list", category: params.category });

  controller?.abort();
  const ctrl = (controller = new AbortController());
  els.grid.setAttribute("aria-busy", "true");
  els.grid.innerHTML = skeletonGrid(8);
  els.count.textContent = "";
  els.status.innerHTML = "";

  try {
    const items = await getProducts(params, { signal: ctrl.signal });
    if (controller !== ctrl) return;

    if (items.length === 0) {
      els.grid.innerHTML = "";
      els.count.textContent = "0 items";
      els.status.innerHTML = emptyState({
        title: "No gear matches those filters",
        message: "Try removing a filter or searching for a different team.",
        action: `<a class="btn btn--ghost" href="list.html">Clear all filters</a>`,
      });
      return;
    }

    els.grid.innerHTML = productGrid(items);
    els.count.textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;
  } catch (err) {
    if (err.name === "AbortError" || controller !== ctrl) return;
    els.grid.innerHTML = "";
    els.count.textContent = "";
    els.status.innerHTML = errorState(err);
    els.status.querySelector("[data-retry]")?.addEventListener("click", load);
  } finally {
    if (controller === ctrl) els.grid.setAttribute("aria-busy", "false");
  }
}

/* ---------- events ---------- */

function apply(patch, { push = false } = {}) {
  const current = parseListState(location.search);
  // Preserve text that is still inside the debounce window when another
  // control changes; otherwise choosing a filter would erase the query.
  if (!("q" in patch)) onSearchInput.cancel();
  const next = "q" in patch ? patch : { ...patch, q: els.search.value.trim() };
  writeParams({ ...current, ...next }, { push });
  load();
}

const onSearchInput = debounce(() => {
  apply({ q: els.search.value.trim() });
}, 300);

els.search.addEventListener("input", onSearchInput);
els.sort.addEventListener("change", () => apply({ sort: els.sort.value }, { push: true }));

els.categoryChips.forEach((btn) => {
  btn.addEventListener("click", () => apply({ category: btn.dataset.category }, { push: true }));
});

window.addEventListener("popstate", () => {
  onSearchInput.cancel();
  load();
});

load();
