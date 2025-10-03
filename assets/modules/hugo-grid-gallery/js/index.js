// assets/js/hugo-grid-gallery/index.js
// Hier wird assets/ext/pig/pig.js initialisiert und konfiguriert.
// Der Ursprüngliche Code stammt von Gallery-Deluxe,
// wurde aber stark angepasst und erweitert:
// - sfLightbox support
// - Nummern der Bilder aus dem Dateinamen extrahieren und als Tag-Overlay im Grid-Tumbnail anzeigen.
"use strict";

import { Pig } from "../../../ext/pig/pig-wrapper";

var debug = 0 ? console.log.bind(console, "[hugo-grid-gallery]") : function () {};

let params = {};

try {
  const paramScript = document.getElementById("gd-config");
  if (paramScript?.textContent) {
    params = JSON.parse(paramScript.textContent);
  }
} catch (e) {
  console.error("❌ Fehler beim Parsen von hugogridgallery-params", e);
}

let HugoGridGallery = {
  init: async function () {
    const galleryId = "hugogridgallery";
    const dataAttributeName = "data-gd-image-data-url";
    const container = document.getElementById(galleryId);
    if (!container) throw new Error(`No element with id ${galleryId} found.`);

    const dataUrl = container.getAttribute(dataAttributeName);
    if (!dataUrl) throw new Error(`No ${dataAttributeName} attribute found.`);

    let images = await (await fetch(dataUrl)).json();

    if (params.shuffle) {
      images = images
        .map((value) => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
    } else if (params.reverse) {
      images = images.reverse();
    }

    let imagesMap = new Map();
    let imageData = [];

    for (let i = 0; i < images.length; i++) {
      let image = images[i];
      image.prev = images[(i + images.length - 1) % images.length];
      image.next = images[(i + 1) % images.length];

      const filename = image.title || image.name || image.full;
      const imageTag = extractNumberFromFilename(filename);
      image.imageTag = imageTag;

      imageData.push({
        filename,
        image,
        imageTag,
        aspectRatio: image.width / image.height,
      });

      imagesMap.set(filename, image);
    }

    if (!window.gdImageData) {
      window.gdImageData = imageData.map((item) => ({
        imageTag: item.image.imageTag,
        filename: item.filename,
      }));
    }

    var options = {
      containerId: galleryId,
      spaceBetweenImages: 10,
      classPrefix: "gd",
      /*
      onClickHandler: function (filename) { /// ← wichtig: wird aufgerufen, wenn ein Bild angeklickt wird
        console.log("⏩ Öffne fslightbox für", filename);
        const image = imagesMap.get(filename);
        console.log("⏩ Öffne fslightbox mit", image);
        // if (!image || !image.full) return;

        const a = document.createElement("a");
        a.href = image.full;
        a.setAttribute("data-fslightbox", "gallery");
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        // a.remove();
      },
*/
      urlForSize: function (filename, size) {
        const image = imagesMap.get(filename);
        if (!image) return "";

        const val = image[size];
        if (typeof val === "string") return val;
        if (val && typeof val === "object" && val.RelPermalink)
          return val.RelPermalink;

        return "";
      },

      styleForElement: function (filename) {
        let image = imagesMap.get(filename);
        if (!image || image.colors.size < 1) return "";
        let colors = image.colors;
        let first = colors[0];
        let second = colors.length > 1 ? colors[1] : "#ccc";
        return ` background: linear-gradient(15deg, ${first}, ${second});`;
      },
    };

    if (window.__pigGalleryInitialized) {
      console.warn("Pig-Galerie bereits initialisiert – Abbruch");
      return;
    }

    window.__pigGalleryInitialized = true;

    let pig = new Pig(imageData, options);
    console.log("🐷 Pig hat Bilder (vor enable):", pig.images.length);

    pig.getImageFromFilename = function (filename) {
      const entry = this.images.find((e) => e.filename === filename);
      if (!entry) return undefined;
      return {
        ...entry.image,
        imageTag: entry.imageTag,
        filename: entry.filename,
      };
    };

    pig.enable();

    console.log(
      "🐷 Visible count (nach enable):",
      document.querySelectorAll("figure.gd-figure").length
    );

    setTimeout(() => {
      window.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("resize"));
      requestAnimationFrame(() => {
        window.__pigGallery?.update();
      });
    }, 200);
  },
};

function extractNumberFromFilename(filename) {
/* 
Da regex ja immer wieder rätselhaft ist, hier eine ausführliche Erklärung:

- Das Regex /-(\d{3,6})-/ sucht nach einer Zeichenfolge 
- der Form -XXX- bis -XXXXXX-, also 3 bis 6 Ziffern zwischen Bindestrichen 
- und extrahiert die Ziffern in der Erfassungsgruppe für die weitere Verarbeitung.

1. Aufbau des Regex
   - `/.../` : Die Schrägstriche begrenzen das Regex in JavaScript.
   - `-` : Stimmt exakt mit einem Bindestrich (`-`) überein.
   - `(\d{3,6})` : Dies ist eine Erfassungsgruppe (durch die Klammern `()`), die Folgendes bedeutet:
     - `\d` : Stimmt mit einer Ziffer (0-9) überein.
     - `{3,6}` : Gibt an, dass zwischen 3 und 6 Ziffern (einschließlich) erfasst werden sollen.
   - `-` : Stimmt mit einem weiteren Bindestrich (`-`) überein.

2. Was es tut
   - Das Regex sucht im `filename`-String nach einer Sequenz, die mit einem Bindestrich (`-`) beginnt, gefolgt von 3 bis 6 Ziffern, und mit einem weiteren Bindestrich (`-`) endet.
   - Die Ziffern (3 bis 6) werden in der Erfassungsgruppe gespeichert und können später abgerufen werden.

3. Rückgabe von `match`
   - Wenn eine Übereinstimmung gefunden wird, gibt `filename.match(/-(\d{3,6})-/)` ein Array zurück:
     - Index `0`: Der gesamte übereinstimmende String (z. B. `-12345-`).
     - Index `1`: Der Inhalt der ersten Erfassungsgruppe, also die Ziffern (z. B. `12345`).
   - Wenn keine Übereinstimmung gefunden wird, gibt `match` den Wert `null` zurück.

4. Beispiele
   - `filename = "test-12345-file.txt"`:
     - `match` ergibt: `["-12345-", "12345"]`
     - `match[1]` gibt: `"12345"`
   - `filename = "test-123-file.txt"`:
     - `match` ergibt: `["-123-", "123"]`
   - `filename = "test-12-file.txt"`:
     - `match` ergibt: `null` (weil weniger als 3 Ziffern nicht passen).
   - `filename = "test-1234567-file.txt"`:
     - `match` ergibt: `null` (weil mehr als 6 Ziffern nicht passen).
*/
  const match = filename.match(/-(\d{2,6})-/); // <-- //! Regex zum Extrahieren der Nummer
  return match ? match[1] : null;
}

export default HugoGridGallery;
