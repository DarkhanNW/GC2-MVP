/* Single source of truth for brand and category metadata.
   Keep this module free of imports so it stays a leaf in the module graph. */

export const BRAND = Object.freeze({
  name: "100-Yard Apparel",
  mark: "100-YARD",
});

export const DEFAULT_CURRENCY = "PHP";

export const CATEGORIES = Object.freeze([
  { id: "jerseys", label: "Team Jerseys", plural: "Team Jerseys" },
  { id: "hoodies", label: "Hoodies & Fleece", plural: "Hoodies & Fleece" },
  { id: "tees", label: "Tees & Tops", plural: "Tees & Tops" },
]);

const CATEGORY_BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

export function categoryById(id) {
  return CATEGORY_BY_ID.get(id);
}

export function categoryLabel(id, { plural = false } = {}) {
  const category = categoryById(id);
  if (!category) return id || "";
  return plural ? category.plural : category.label;
}

export function categoryHref(id) {
  return id ? `list.html?category=${encodeURIComponent(id)}` : "list.html";
}
