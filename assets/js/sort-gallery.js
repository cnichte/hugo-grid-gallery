document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("gallery-container");
  if (!container) return;

  const cards = Array.from(container.children);
  const sortLinks = {
    title: document.getElementById("sort-title"),
    count: document.getElementById("sort-count"),
    updated: document.getElementById("sort-updated"),
  };

  const clearMenuSelected = () => {
    Object.values(sortLinks).forEach(link => link?.classList.remove("menu-selected-sek"));
  };

  const sortByTitle = (e) => {
    e?.preventDefault();
    [...cards].sort((a, b) =>
      a.dataset.title.localeCompare(b.dataset.title, 'de', { sensitivity: 'base' })
    ).forEach(card => container.appendChild(card));
    clearMenuSelected();
    sortLinks.title?.classList.add("menu-selected-sek");
  };

  const sortByCount = (e) => {
    e?.preventDefault();
    [...cards].sort((a, b) =>
      parseInt(b.dataset.imageCount) - parseInt(a.dataset.imageCount)
    ).forEach(card => container.appendChild(card));
    clearMenuSelected();
    sortLinks.count?.classList.add("menu-selected-sek");
  };

  const sortByLastUpdated = () => {
    [...cards].sort((a, b) =>
      new Date(b.dataset.updated) - new Date(a.dataset.updated)
    ).forEach(card => container.appendChild(card));
    clearMenuSelected();
    sortLinks.updated?.classList.add("menu-selected-sek");
  };

  sortLinks.title?.addEventListener("click", sortByTitle);
  sortLinks.count?.addEventListener("click", sortByCount);
  sortLinks.updated?.addEventListener("click", sortByLastUpdated);

  sortByTitle(); // default
});