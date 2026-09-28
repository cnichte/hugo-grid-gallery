// Robust sorting for gallery cards
// Expects:
//   - a root with data-hugg-sortable
//   - a child container with class="hugg-cards"
//   - child cards with class="hugg-card"
//   - data attributes on each card:
//       data-title="..." (string)
//       data-image-count="..." (number)
//       data-updated="2025-10-05T17:00:27+02:00" (ISO-ish date)
//   - optional controls with data-hugg-sort-by; external controls target the
//     sortable root via aria-controls

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-hugg-sortable]").forEach((root) => {
    const container = root.querySelector(".hugg-cards");
    if (!container) return;

    // Only actual cards (ignore whitespace/text nodes)
    const cards = Array.from(container.querySelectorAll(":scope > .hugg-card"));
    if (!cards.length) return;

    const control = (sortBy) =>
      root.querySelector(`[data-hugg-sort-by="${sortBy}"]`) ||
      (root.id
        ? document.querySelector(
            `[data-hugg-sort-by="${sortBy}"][aria-controls="${root.id}"]`
          )
        : null);
    const sortControls = {
      title: control("title"),
      count: control("count"),
      updated: control("updated"),
    };

    const haveToolbar = Object.values(sortControls).some(Boolean);

    const clearActive = () => {
      Object.values(sortControls).forEach((link) => {
        link?.classList.remove("hugg-selected");
        link?.removeAttribute("aria-current");
      });
    };

    const selectControl = (controlElement) => {
      controlElement?.classList.add("hugg-selected");
      controlElement?.setAttribute("aria-current", "true");
    };

    const appendOrder = (ordered) => {
      ordered.forEach((card) => container.appendChild(card));
    };

    const getTitle = (card) => (card.dataset.title || "").toString();
    const getCount = (card) => Number(card.dataset.imageCount || 0);
    const getUpdated = (card) => {
      const raw = card.dataset.updated || "";
      const date = new Date(raw);
      return isNaN(date.getTime()) ? new Date(0) : date;
    };

    const sortByTitle = () => {
      const ordered = [...cards].sort((a, b) =>
        getTitle(a).localeCompare(getTitle(b), "de", { sensitivity: "base" })
      );
      appendOrder(ordered);
      clearActive();
      selectControl(sortControls.title);
    };

    const sortByCount = () => {
      const ordered = [...cards].sort((a, b) => getCount(b) - getCount(a));
      appendOrder(ordered);
      clearActive();
      selectControl(sortControls.count);
    };

    const sortByUpdated = () => {
      const ordered = [...cards].sort((a, b) => getUpdated(b) - getUpdated(a));
      appendOrder(ordered);
      clearActive();
      selectControl(sortControls.updated);
    };

    sortControls.title?.addEventListener("click", (event) => {
      event.preventDefault();
      sortByTitle();
    });
    sortControls.count?.addEventListener("click", (event) => {
      event.preventDefault();
      sortByCount();
    });
    sortControls.updated?.addEventListener("click", (event) => {
      event.preventDefault();
      sortByUpdated();
    });

    sortByTitle();

    if (!haveToolbar) return;
  });
});
