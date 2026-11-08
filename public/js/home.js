import { renderChrome, productGrid, skeletonGrid, emptyState, errorState } from "./components.js?v=4";
import { getFeatured } from "./products-api.js?v=4";;
import { qs, qsa } from "./ui.js?v=4";
import { categoryById, categoryHref } from "./catalog.js?v=4";

qsa(".tile[data-category]").forEach((tile) => {
  const category = categoryById(tile.dataset.category);
  if (!category) return;
  tile.href = categoryHref(category.id);
  const label = tile.querySelector(".tile__label");
  if (label) label.textContent = category.plural;
});

renderChrome({ active: "home" });
loadFeatured();

async function loadFeatured() {
  const grid = qs("#featured-grid");
  grid.innerHTML = skeletonGrid(4);

  try {
    const items = await getFeatured();
    grid.innerHTML = items.length
      ? productGrid(items.slice(0, 8))
      : emptyState({
        title: "No featured gear right now",
        message: "New drops are on the way. Browse the full shop in the meantime.",
        action: `<a class="btn btn--primary" href="list.html">Browse all gear</a>`,
      });
  } catch (err) {
    grid.innerHTML = errorState(err);
    grid.querySelector("[data-retry]")?.addEventListener("click", loadFeatured);
  }
}