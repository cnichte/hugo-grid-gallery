const fs = require("node:fs");
const path = require("node:path");
const { test, expect } = require("@playwright/test");

async function prepare(page) {
  await page.route(/\/(?:gallery-core|core)\/[^/]+\.js$/, route => {
    const file = path.join(__dirname, "../../.dist", path.basename(new URL(route.request().url()).pathname));
    return fs.existsSync(file) ? route.fulfill({ path: file, contentType: "text/javascript" }) : route.fulfill({ status: 404 });
  });
  await page.route("**/js/init-pig.js", route => route.fulfill({
    path: path.join(__dirname, "../../assets/hugo-grid-gallery/js/init-pig.js"), contentType: "text/javascript",
  }));
  await page.goto("/galleries/example-gallery/");
  await expect(page.locator(".hugg-grid")).toHaveAttribute("data-hugg-initialized", "true");
  await page.evaluate(async () => {
    const { Gallery } = await import("/core/gallery.js");
    const { GalleryModel } = await import("/core/gallery-model.js");
    const source = document.querySelector(".hugg-grid");
    const model = await GalleryModel.load(new URL(source.dataset.huggImageDataUrl, document.baseURI).href);
    const host = document.createElement("div");
    host.id = "presentation";
    document.body.prepend(host);
    window.presentationTest = { Gallery, GalleryModel, model, host };
  });
}

test("carousel shares order, selected identity and full lightbox inventory without Bootstrap", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await prepare(page);
  const ids = await page.evaluate(() => {
    const { Gallery, model, host } = window.presentationTest;
    const gallery = new Gallery({ container: host, model, presentation: "carousel", initialImageId: model.images[1].id });
    window.presentationTest.gallery = gallery;
    return model.images.map(image => image.id);
  });
  const host = page.locator("#presentation");
  const link = host.locator("a[data-gallery-image-id]");
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute("data-gallery-image-id", ids[1]);
  const height = (await link.boundingBox()).height;
  await host.getByRole("button", { name: "Next image", exact: true }).click();
  await expect(link).toHaveAttribute("data-gallery-image-id", ids[2]);
  expect((await link.boundingBox()).height).toBeCloseTo(height, 1);
  await link.focus();
  await link.press("End");
  await expect(link).toHaveAttribute("data-gallery-image-id", ids[3]);
  await link.press("ArrowRight");
  await expect(link).toHaveAttribute("data-gallery-image-id", ids[0]);
  await link.press("Home");
  await link.press("ArrowLeft");
  await expect(link).toHaveAttribute("data-gallery-image-id", ids[3]);
  await link.press("Enter");
  await expect(page.locator(".fslightboxsn span").first()).toHaveText("4");
  await expect(page.locator(".fslightboxsn span").last()).toHaveText("4");
  await page.keyboard.press("Escape");
  await expect(page.locator(".hugg-lightbox")).toHaveCount(0);
  await expect(link).toBeFocused();
  await page.evaluate(() => window.presentationTest.gallery.destroy());
  await expect(host).toBeEmpty();
  expect(errors).toEqual([]);
});

test("single image retains all approved lightbox sources and explicit selection", async ({ page }) => {
  await prepare(page);
  const result = await page.evaluate(() => {
    const { Gallery, model, host } = window.presentationTest;
    const gallery = new Gallery({ container: host, model: model.reversed(), presentation: "single", initialImageId: model.images[2].id });
    window.presentationTest.gallery = gallery;
    return { id: model.images[2].id, width: model.images[2].width, height: model.images[2].height };
  });
  const host = page.locator("#presentation");
  await expect(host.getByRole("button")).toHaveCount(0);
  const link = host.locator("a[data-gallery-image-id]");
  await expect(link).toHaveAttribute("data-gallery-image-id", result.id);
  await expect(link.locator("img")).toHaveAttribute("width", String(result.width));
  await expect(link.locator("img")).toHaveAttribute("height", String(result.height));
  await link.click();
  await expect(page.locator(".fslightboxsn span").first()).toHaveText("2");
  await expect(page.locator(".fslightboxsn span").last()).toHaveText("4");
  await page.keyboard.press("Escape");
  await expect(page.locator(".hugg-lightbox")).toHaveCount(0);
  const nextId = await page.evaluate(() => {
    const { gallery, model } = window.presentationTest;
    gallery.show(model.images[0].id);
    return model.images[0].id;
  });
  await expect(link).toHaveAttribute("data-gallery-image-id", nextId);
  await page.evaluate(() => window.presentationTest.gallery.destroy());
});

test("carousel handles directional touch gestures without opening the image and preserves vertical scrolling", async ({ page }) => {
  await prepare(page);
  const ids = await page.evaluate(() => {
    const { Gallery, model, host } = window.presentationTest;
    window.presentationTest.gallery = new Gallery({ container: host, model, presentation: "carousel" });
    return model.images.map(image => image.id);
  });
  const link = page.locator("#presentation a[data-gallery-image-id]");
  const gesture = async (x, y) => {
    await link.dispatchEvent("pointerdown", { pointerId: 7, pointerType: "touch", isPrimary: true, clientX: 200, clientY: 200 });
    await link.dispatchEvent("pointerup", { pointerId: 7, pointerType: "touch", isPrimary: true, clientX: 200 + x, clientY: 200 + y });
  };
  await gesture(-90, 4);
  await expect(link).toHaveAttribute("data-gallery-image-id", ids[1]);
  await link.dispatchEvent("click", { button: 0, detail: 1 });
  await expect(page.locator(".hugg-lightbox")).toHaveCount(0);
  await gesture(80, 2);
  await expect(link).toHaveAttribute("data-gallery-image-id", ids[0]);
  await gesture(-20, 100);
  await expect(link).toHaveAttribute("data-gallery-image-id", ids[0]);
  await expect(link).toHaveCSS("touch-action", "pan-y");
  await page.evaluate(() => window.presentationTest.gallery.destroy());
});

test("Hugo uses the same presentation renderer and rejects invalid modes or IDs before mounting", async ({ page }) => {
  await prepare(page);
  const result = await page.evaluate(async () => {
    const { default: adapter } = await import("/js/init-pig.js");
    const { Gallery, model, host } = window.presentationTest;
    let rejected = 0;
    for (const options of [{ presentation: "unknown" }, { presentation: "single", initialImageId: "missing" }, { initialImageId: model.images[0].id }]) {
      try { new Gallery({ container: host, model, ...options }); } catch { rejected++; }
    }
    const source = document.querySelector(".hugg-grid");
    host.dataset.huggImageDataUrl = source.dataset.huggImageDataUrl;
    host.dataset.huggConfig = JSON.stringify({ presentation: "carousel", initialImageId: model.images[2].id });
    const gallery = await adapter.initContainer(host);
    const selected = host.querySelector("a").dataset.galleryImageId;
    const same = Gallery.forContainer(host) === gallery;
    await adapter.destroyContainer(host);
    const empty = new Gallery({ container: host, model: window.presentationTest.GalleryModel.fromImages([], document.baseURI), presentation: "carousel" });
    const count = host.querySelectorAll("a,button").length;
    await empty.destroy();
    return { rejected, same, selected, expected: model.images[2].id, count, remaining: host.children.length };
  });
  expect(result).toEqual({ rejected: 3, same: true, selected: result.expected, expected: result.expected, count: 0, remaining: 0 });
});

test("actual Hugo pages render configured carousel and single-image presentations", async ({ page }) => {
  await page.goto("/galleries/game-fixture-two/");
  await expect(page.locator(".hugg-grid")).toHaveAttribute("data-hugg-initialized", "true");
  await expect(page.locator(".hugg-stage-carousel")).toHaveCount(1);
  await expect(page.locator(".hugg-stage-carousel a")).toHaveCount(1);
  await page.goto("/galleries/story-fixture/");
  await expect(page.locator(".hugg-grid")).toHaveAttribute("data-hugg-initialized", "true");
  await expect(page.locator(".hugg-stage-single")).toHaveCount(1);
  await expect(page.locator(".hugg-stage-single a")).toHaveCount(1);
});

test("stage resizes public variants, preserves consumer content and reports image failures", async ({ page }) => {
  await prepare(page);
  await page.route("**/broken-public-image.jpg", route => route.fulfill({ status: 404 }));
  const result = await page.evaluate(() => {
    const { Gallery, GalleryModel, model, host } = window.presentationTest;
    host.style.width = "80px";
    host.append(document.createTextNode("Consumer content"));
    const images = [
      { ...model.images[0], title: "<img src=x onerror=alert(1)>", detailUrl: new URL("/public/detail/", location.origin).href },
      { id: "broken", width: 600, height: 400, src: new URL("/broken-public-image.jpg", location.origin).href, alt: "" },
    ];
    const stageModel = GalleryModel.fromImages(images, document.baseURI);
    window.presentationTest.gallery = new Gallery({ container: host, model: stageModel, presentation: "single" });
    let notified = 0;
    host.addEventListener("gallery:error", () => { notified++; host.dataset.errors = String(notified); });
    return { small: stageModel.source(images[0].id, 80 * devicePixelRatio), large: stageModel.source(images[0].id, 1100 * devicePixelRatio) };
  });
  const host = page.locator("#presentation");
  await expect(host.locator("img")).toHaveAttribute("src", result.small);
  await expect(host.locator("a")).toHaveAttribute("href", /\/public\/detail\/$/);
  await expect(host.locator(".hugg-stage-caption")).toHaveText("<img src=x onerror=alert(1)>");
  await expect(host.locator(".hugg-stage-caption img")).toHaveCount(0);
  await page.evaluate(() => { window.presentationTest.host.style.width = "1100px"; });
  await expect(host.locator("img")).toHaveAttribute("src", result.large);
  await page.evaluate(() => window.presentationTest.gallery.show("broken"));
  await expect(host.getByRole("alert")).toBeVisible();
  await expect(host).toHaveAttribute("data-errors", "1");
  await page.evaluate(() => window.presentationTest.gallery.destroy());
  await expect(host).toHaveText("Consumer content");
  const rejected = await page.evaluate(() => {
    try { window.presentationTest.gallery.show("broken"); } catch { return true; }
    return false;
  });
  expect(rejected).toBe(true);
});

test("browser touch input advances once without triggering an overlay", async ({ page }) => {
  await prepare(page);
  const nextId = await page.evaluate(() => {
    const { Gallery, model, host } = window.presentationTest;
    window.presentationTest.gallery = new Gallery({ container: host, model, presentation: "carousel" });
    return model.images[1].id;
  });
  const link = page.locator("#presentation a[data-gallery-image-id]");
  await expect(link.locator("img")).toHaveJSProperty("complete", true);
  await link.scrollIntoViewIfNeeded();
  const box = await link.boundingBox();
  const client = await page.context().newCDPSession(page);
  try {
    const point = { x: box.x + box.width * 0.8, y: box.y + Math.min(box.height / 2, 100) };
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
    for (let step = 1; step <= 5; step++) {
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, x: point.x - box.width * 0.6 * step / 5 }] });
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(link).toHaveAttribute("data-gallery-image-id", nextId);
    await expect(page.locator(".hugg-lightbox")).toHaveCount(0);
    await link.focus();
    await link.press("Enter");
    await expect(page.locator(".hugg-lightbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".hugg-lightbox")).toHaveCount(0);
  } finally {
    await client.detach();
    await page.evaluate(() => window.presentationTest.gallery.destroy());
  }
});

test("stage handles 1000 identities with constant DOM and releases its resources without Pig", async ({ page }) => {
  await prepare(page);
  const result = await page.evaluate(async () => {
    const { Gallery, GalleryModel, model, host } = window.presentationTest;
    const inventory = GalleryModel.fromImages(Array.from({ length: 1000 }, (_, index) => ({
      ...model.images[index % model.images.length], id: `work-${index}/photo.jpg`,
    })), document.baseURI);
    const constructor = window.ResizeObserver;
    let observed = 0;
    window.ResizeObserver = class extends constructor {
      observe(...args) { observed++; return super.observe(...args); }
      disconnect() { observed--; super.disconnect(); }
    };
    const original = window.Pig;
    let opened;
    let destroyed = 0;
    const lightbox = { open: async index => { opened = index; }, destroy: async () => { destroyed++; } };
    try {
      window.Pig = undefined;
      for (const presentation of ["carousel", "single"]) {
        for (let iteration = 0; iteration < 5; iteration++) {
          const gallery = new Gallery({ container: host, model: inventory, presentation, lightbox });
          gallery.show(inventory.images[999].id);
          if (host.querySelectorAll("img").length !== 1 || host.querySelectorAll("a").length !== 1) throw new Error("Nonconstant stage DOM.");
          await gallery.open(inventory.images[999].id);
          await Promise.all([gallery.destroy(), gallery.destroy()]);
        }
      }
      await new Promise(resolve => requestAnimationFrame(resolve));
      return { opened, destroyed, observed, children: host.children.length, pigAbsent: !window.Pig };
    } finally {
      window.Pig = original;
      window.ResizeObserver = constructor;
    }
  });
  expect(result).toEqual({ opened: 999, destroyed: 10, observed: 0, children: 0, pigAbsent: true });
});
