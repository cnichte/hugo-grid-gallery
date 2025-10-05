// assets/js/main.js
// Die Einbindung erfolgt in layouts/partials/gallery-grid/gallery-config.html
import HugoGridGallery from "./init-pig";
import "./scroll-to-top.js";
import "./sort-gallery.js";
// import "./theme-switcher.js"; // optional – per Theme

window.addEventListener("DOMContentLoaded", () => {
  HugoGridGallery.init().catch(console.error);
});