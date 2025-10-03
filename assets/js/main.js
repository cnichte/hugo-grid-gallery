// assets/js/main.js
// Die Einbindung erfolgt in der baseof.html (im header)

import HugoGridGallery from '../modules/hugo-grid-gallery/js/index';
window.addEventListener('DOMContentLoaded', () => {
	HugoGridGallery.init().catch(console.error);
});

import "./scroll-to-top.js";
import "./sort-gallery.js";
import "./theme-switcher.js";
// Matomo Analytics geht separat weil es im footer eingebunden wird.
// siehe: layouts/partials/page-base/footer.html