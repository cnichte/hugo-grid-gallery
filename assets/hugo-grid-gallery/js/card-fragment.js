"use strict";

const cardFragmentPrefix = "#hugg-card--";

function scrollToCardFragment() {
  if (!window.location.hash.startsWith(cardFragmentPrefix)) return;

  const targetId = decodeURIComponent(window.location.hash.slice(1));
  const target = document.getElementById(targetId);
  if (!target?.classList.contains("hugg-gallery-entry")) return;

  window.requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
}

if (document.readyState === "complete") {
  scrollToCardFragment();
} else {
  window.addEventListener("load", scrollToCardFragment, { once: true });
}

window.addEventListener("pageshow", scrollToCardFragment);
window.addEventListener("hashchange", scrollToCardFragment);
