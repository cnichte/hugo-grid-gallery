document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("gallery-container");
  if (!container) return;

  const cards = Array.from(container.children);
  if (!cards.length) return;

  const el = (id) => document.getElementById(id);
  const sortLinks = {
    title: el("sort-title"),
    count: el("sort-count"),
    updated: el("sort-updated"),
  };
  const haveToolbar = !!(
    sortLinks.title ||
    sortLinks.count ||
    sortLinks.updated
  );

  const clear = () =>
    Object.values(sortLinks).forEach((a) =>
      a?.classList.remove("menu-selected-sek")
    );

  const sortByTitle = (e) => {
    e?.preventDefault?.();
    cards
      .sort((a, b) =>
        a.dataset.title.localeCompare(b.dataset.title, "de", {
          sensitivity: "base",
        })
      )
      .forEach((c) => container.appendChild(c));
    clear();
    sortLinks.title?.classList.add("menu-selected-sek");
  };

  const sortByCount = (e) => {
    e?.preventDefault?.();
    cards
      .sort((a, b) => +b.dataset.imageCount - +a.dataset.imageCount)
      .forEach((c) => container.appendChild(c));
    clear();
    sortLinks.count?.classList.add("menu-selected-sek");
  };

  const sortByUpdated = (e) => {
    e?.preventDefault?.();
    cards
      .sort((a, b) => new Date(b.dataset.updated) - new Date(a.dataset.updated))
      .forEach((c) => container.appendChild(c));
    clear();
    sortLinks.updated?.classList.add("menu-selected-sek");
  };

  sortLinks.title?.addEventListener("click", sortByTitle);
  sortLinks.count?.addEventListener("click", sortByCount);
  sortLinks.updated?.addEventListener("click", sortByUpdated);

  // Default-Sortierung: Title
  sortByTitle();
  if (!haveToolbar) return; // kein UI? okay.
});
