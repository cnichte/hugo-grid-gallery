const path = require("node:path");
const { test, expect } = require("@playwright/test");

test("Hugo and direct JavaScript consume the same ordered manifest and variants", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Contract is independent of color scheme.");
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/shared-gallery-model.js", route => route.fulfill({
    path: path.join(__dirname, "../../.dist/gallery-model.js"),
    contentType: "text/javascript",
  }));
  await page.goto("/galleries/example-gallery/");
  await expect(page.locator(".hugg-grid")).toHaveAttribute("data-hugg-initialized", "true");
  const result = await page.evaluate(async () => {
    const { GalleryModel } = await import("/shared-gallery-model.js");
    const grid = document.querySelector(".hugg-grid");
    const model = await GalleryModel.load(new URL(grid.dataset.huggImageDataUrl, document.baseURI).href);
    const host = document.createElement("nav");
    host.setAttribute("aria-label", "Direct JavaScript consumer");
    const links = model.images.map(image => {
      const link = document.createElement("a");
      link.href = image.detailUrl || image.src;
      link.textContent = image.title || image.id;
      link.dataset.imageId = image.id;
      host.append(link);
      return { id: image.id, src: link.href };
    });
    document.body.append(host);
    return {
      links,
      hugo: Array.from(grid.querySelectorAll("a.hugg-figure")).map(link => ({
        id: link.dataset.galleryImageId, src: link.href,
      })),
      thumb: model.source(model.images[0].id, 20),
      badge: model.images[0].badge,
      alt: model.images[0].alt,
      reverse: model.reversed().images.map(image => image.id),
      original: model.images.map(image => image.id),
    };
  });
  expect(result.links).toEqual(result.hugo);
  expect(result.links).toHaveLength(4);
  expect(result.reverse).toEqual([...result.original].reverse());
  await expect(page.locator(".hugg-thumbnail").first()).toHaveAttribute("src", result.thumb);
  await expect(page.locator(".hugg-figure").first().locator("img").nth(1)).toHaveAttribute("alt", result.alt);
  await page.locator(".hugg-figure").first().click();
  await expect(page.locator(".fslightbox-container")).toBeVisible();
  await expect(page.locator(".fslightbox-container img").first()).toBeVisible();
  for (const link of result.links) expect((await page.request.get(link.src)).ok()).toBe(true);
  expect(errors).toEqual([]);
});

test("direct JavaScript model isolates duplicate filenames and resolves manifest subpaths", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Contract is independent of color scheme.");
  await page.route("**/shared-gallery-model.js", route => route.fulfill({
    path: path.join(__dirname, "../../.dist/gallery-model.js"),
    contentType: "text/javascript",
  }));
  await page.goto("/galleries/");
  const result = await page.evaluate(async () => {
    const { GalleryModel } = await import("/shared-gallery-model.js");
    const first = GalleryModel.fromImages([
      { id: "a/photo.jpg", width: 600, height: 400, src: "../a/photo.jpg", alt: "" },
      { id: "b/photo.jpg", width: 600, height: 400, src: "../b/photo.jpg", alt: "" },
    ], new URL("/portfolio/data/images.json", location.origin).href);
    const second = GalleryModel.fromImages([
      { id: "a/photo.jpg", width: 300, height: 200, src: "../different/photo.jpg", alt: "" },
    ], new URL("/other/data/images.json", location.origin).href);
    return {
      first: first.images.map(image => new URL(image.src).pathname),
      second: new URL(second.source("a/photo.jpg", 100)).pathname,
      original: first.images.map(image => image.id),
    };
  });
  expect(result.first).toEqual(["/portfolio/a/photo.jpg", "/portfolio/b/photo.jpg"]);
  expect(result.second).toBe("/other/different/photo.jpg");
  expect(result.original).toEqual(["a/photo.jpg", "b/photo.jpg"]);
});
