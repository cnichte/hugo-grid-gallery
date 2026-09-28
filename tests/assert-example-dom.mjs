import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import * as cheerio from "cheerio";

const publicDir = process.argv[2];
assert.ok(publicDir, "Expected the built ExampleSite directory.");

const load = (relativePath) => {
  const html = fs.readFileSync(path.join(publicDir, relativePath), "utf8");
  return cheerio.load(html);
};
const normalizedText = ($, selector) =>
  $(selector).text().replace(/\s+/g, " ").trim();
const gridConfig = ($) =>
  JSON.parse($(".hugg-grid").first().attr("data-hugg-config"));
const configValue = (config, key) => config[key] ?? config[key.toLowerCase()];

const index = load("galleries/index.html");
assert.equal(
  index('link[rel="stylesheet"][href^="/hugo-grid-gallery/css/hugg"]').length,
  1,
  "Gallery index must load the module stylesheet exactly once."
);
const cards = index(".hugg-card");
assert.equal(cards.length, 4, "Gallery index must contain four cards.");
assert.deepEqual(
  cards.map((_, element) => index(element).attr("data-title")).get(),
  ["Example Gallery", "Game Fixture", "Game Fixture Two", "Story Fixture"],
  "Gallery cards must be sorted by title."
);
assert.equal(
  cards.filter('[data-title="Example Gallery"]').find("img").attr("alt"),
  "03-orbits.jpg",
  "Gallery metadata must select the configured cover."
);
assert.equal(
  cards.filter('[data-title="Example Gallery"]').attr("data-image-count"),
  "4",
  "Gallery card must expose its image count."
);
assert.deepEqual(
  index("[data-hugg-sortable] .hugg-sort-control").map((_, element) => index(element).text().trim()).get(),
  ["Title", "Count", "Updated"],
  "Sort navigation must expose all controls."
);
assert.equal(
  index('[data-hugg-sortable] .hugg-sort-control[aria-controls="hugg-gallery-list"]').length,
  3,
  "Sort controls must identify their sortable list."
);
assert.equal(
  index(".hugg-index-controls > .hugg-toolbar + .hugg-updated").length,
  1,
  "Sort and Recently Updated controls must share one responsive row."
);
assert.equal(
  index(".hugg-updated.tag-cloud-container, .hugg-updated-link.menu-link").length,
  0,
  "Recently Updated must not inherit framed consumer theme controls."
);
assert.deepEqual(
  index(".hugg-updated-link").map((_, element) => index(element).text().trim()).get(),
  ["Story Fixture", "Game Fixture Two"],
  "Recently Updated must list the newest Galleries across the current role scope."
);
assert.equal(index(".hugg-new-symbol").length, 4, "Recent Gallery cards must display the configured symbol.");

const games = load("galleries/games/index.html");
assert.equal(games(".hugg-card").length, 2, "Game list must contain only Game Galleries.");
assert.deepEqual(
  games(".hugg-updated-link").map((_, element) => games(element).text().trim()).get(),
  ["Game Fixture Two", "Game Fixture"],
  "Game Recently Updated links must remain role-scoped."
);
const stories = load("galleries/stories/index.html");
assert.equal(stories(".hugg-card").length, 1, "Story list must contain only Story Galleries.");
assert.deepEqual(
  stories(".hugg-updated-link").map((_, element) => stories(element).text().trim()).get(),
  ["Story Fixture"],
  "Story Recently Updated links must remain role-scoped."
);

const firstGame = load("galleries/game-fixture/index.html");
const firstGameConfig = gridConfig(firstGame);
assert.equal(firstGameConfig.shuffle, false);
assert.equal(firstGameConfig.reverse, false);
assert.equal(
  configValue(firstGameConfig, "maxImageSize"),
  1800,
  "Gallery must inherit its Collection configuration over global defaults."
);
assert.equal(configValue(firstGameConfig, "spaceBetweenImages"), 12);
assert.equal(
  firstGame(".hugg-nav-next a").attr("href"),
  "/galleries/game-fixture-two/",
  "First Game Gallery must navigate to the next Game Gallery."
);
const selectedLinks = firstGame("a.hugg-selected").map((_, element) => firstGame(element).attr("href")).get();
assert.ok(selectedLinks.includes("/galleries/game-fixture/"), "Current Game must be marked as selected.");
assert.ok(selectedLinks.includes("/galleries/gallery-categories/example/"), "Current category must be marked as selected.");
assert.ok(selectedLinks.includes("/galleries/gallery-categories/role/"), "Second current category must be marked as selected.");

const secondGame = load("galleries/game-fixture-two/index.html");
assert.equal(
  secondGame(".hugg-nav-prev a").attr("href"),
  "/galleries/game-fixture/",
  "Second Game Gallery must navigate to the previous Game Gallery."
);

const standaloneGallery = load("galleries/example-gallery/index.html");
const standaloneConfig = gridConfig(standaloneGallery);
assert.equal(standaloneGallery(".hugg-page-header h1").text().trim(), "Example Gallery");
assert.equal(
  configValue(standaloneConfig, "maxImageSize"),
  1600,
  "Gallery configuration must override Collection and global values."
);
assert.equal(configValue(standaloneConfig, "spaceBetweenImages"), 10);

const galleryWithoutModuleTitle = load("collections/alpha/shared-gallery/index.html");
assert.equal(
  galleryWithoutModuleTitle(".hugg-page-header").length,
  0,
  "Collection configuration must be able to hide the module page title."
);

const cardPage = load("galleries/cards/index.html");
assert.equal(cardPage(".hugg-gallery-entry").length, 2, "Card page must contain only Game Cards.");
assert.match(normalizedText(cardPage, "article"), /Images: 9/);
assert.match(normalizedText(cardPage, "article"), /Galleries: 4/);
assert.match(normalizedText(cardPage, "article"), /Games: 2/);
assert.match(normalizedText(cardPage, "article"), /Stories: 1/);
assert.match(normalizedText(cardPage, "article"), /Played: 2 hours and 30 minutes/);

for (const id of ["game-fixture", "game-fixture-two"]) {
  const anchor = `hugg-card--example--${id}`;
  assert.equal(cardPage(`#${anchor}`).length, 1, `Card anchor ${anchor} must exist exactly once.`);
  assert.equal(
    cardPage(`.hugg-card-index a[href="#${anchor}"]`).length,
    1,
    `Card index must link to ${anchor}.`
  );
  const gallery = load(`galleries/${id}/index.html`);
  assert.equal(
    gallery(".hugg-card-link").attr("href"),
    `/galleries/cards/#${anchor}`,
    `Gallery ${id} must link to its Card fragment.`
  );
  assert.equal(
    cardPage(`#${anchor} .hugg-gallery-link`).attr("href"),
    `/galleries/${id}/`,
    `Card ${id} must link back to its Gallery.`
  );
}

const emptyCategory = load("galleries/gallery-categories/empty/index.html");
assert.equal(emptyCategory(".hugg-grid").length, 0, "Empty category must not render a Gallery Grid.");
assert.match(normalizedText(emptyCategory, "article"), /0 virtual Photographs from 0 galleries/);

console.log("PASS: ExampleSite DOM contracts");
