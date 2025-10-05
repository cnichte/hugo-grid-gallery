// Robust sorting for gallery cards
// Expects:
//   - container with id="gallery-container"
//   - child cards with class="hugg-card"
//   - data attributes on each card:
//       data-title="..." (string)
//       data-image-count="..." (number)
//       data-updated="2025-10-05T17:00:27+02:00" (ISO-ish date)
//   - optional toolbar links with IDs: sort-title, sort-count, sort-updated

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("gallery-container");
  if (!container) return;

  // Only actual cards (ignore whitespace/text nodes)
  const cards = Array.from(container.querySelectorAll(".hugg-card"));
  if (!cards.length) return;

  const el = (id) => document.getElementById(id);
  const sortLinks = {
    title: el("sort-title"),
    count: el("sort-count"),
    updated: el("sort-updated"),
  };

  const haveToolbar = !!(sortLinks.title || sortLinks.count || sortLinks.updated);

  const clearActive = () =>
    Object.values(sortLinks).forEach((a) => a?.classList.remove("menu-selected-sek"));

  const appendOrder = (ordered) => {
    // Re-append in the new order (keeps nodes, only changes order)
    ordered.forEach((c) => container.appendChild(c));
  };

  const getTitle = (card) => (card.dataset.title || "").toString();
  const getCount = (card) => Number(card.dataset.imageCount || 0);
  const getUpdated = (card) => {
    // Use Date parsing and fallback
    const raw = card.dataset.updated || "";
    const d = new Date(raw);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  const sortByTitle = (ev) => {
    ev?.preventDefault?.();
    const ordered = [...cards].sort((a, b) =>
      getTitle(a).localeCompare(getTitle(b), "de", { sensitivity: "base" })
    );
    appendOrder(ordered);
    clearActive();
    sortLinks.title?.classList.add("menu-selected-sek");
  };

  const sortByCount = (ev) => {
    ev?.preventDefault?.();
    const ordered = [...cards].sort((a, b) => getCount(b) - getCount(a));
    appendOrder(ordered);
    clearActive();
    sortLinks.count?.classList.add("menu-selected-sek");
  };

  const sortByUpdated = (ev) => {
    ev?.preventDefault?.();
    const ordered = [...cards].sort((a, b) => getUpdated(b) - getUpdated(a));
    appendOrder(ordered);
    clearActive();
    sortLinks.updated?.classList.add("menu-selected-sek");
  };

  // Hook up toolbar (if present)
  sortLinks.title?.addEventListener("click", sortByTitle);
  sortLinks.count?.addEventListener("click", sortByCount);
  sortLinks.updated?.addEventListener("click", sortByUpdated);

  // Default: Title
  sortByTitle();

  // No toolbar? fine—just keep default sorting
  if (!haveToolbar) return;
});