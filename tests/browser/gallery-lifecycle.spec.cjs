const fs = require("node:fs");
const path = require("node:path");
const { test, expect } = require("@playwright/test");

async function prepare(page) {
  await page.route(/\/(?:gallery-core|core)\/[^/]+\.js$/, route => {
    const name = path.basename(new URL(route.request().url()).pathname);
    const file = path.join(__dirname, "../../.dist", name);
    return fs.existsSync(file)
      ? route.fulfill({ path: file, contentType: "text/javascript" })
      : route.fulfill({ status: 404 });
  });
  await page.route("**/hugo/js/init-pig.js", route => route.fulfill({
    path: path.join(__dirname, "../../assets/hugo-grid-gallery/js/init-pig.js"),
    contentType: "text/javascript",
  }));
  await page.goto("/galleries/example-gallery/");
  await expect(page.locator(".hugg-grid")).toHaveAttribute("data-hugg-initialized", "true");
}

test("isolates full virtualized inventories and destroys only the owning gallery", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Lifecycle is independent of color scheme.");
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await prepare(page);
  const result = await page.evaluate(async () => {
    const { Gallery } = await import("/gallery-core/gallery.js");
    const { GalleryModel } = await import("/gallery-core/gallery-model.js");
    const source = document.querySelector(".hugg-grid");
    const model = await GalleryModel.load(new URL(source.dataset.huggImageDataUrl, document.baseURI).href);
    const hosts = ["first", "second"].map(id => {
      const host = document.createElement("div");
      host.id = id;
      host.style.width = "800px";
      document.body.prepend(host);
      return host;
    });
    const firstModel = GalleryModel.fromImages(Array.from({ length: 1000 }, (_, index) => ({
      ...model.images[index % model.images.length], id: `work-${index}/photo.jpg`,
    })), document.baseURI);
    const first = new Gallery({ container: hosts[0], model: firstModel });
    const second = new Gallery({ container: hosts[1], model: model.reversed() });
    window.testGalleries = { first, second, hosts, model, Gallery };
    return {
      sources: first.model.images.length,
      rendered: hosts[0].querySelectorAll(".hugg-figure").length,
      expected: first.model.images[999].src,
    };
  });
  expect(result.sources).toBe(1000);
  expect(result.rendered).toBeLessThan(1000);
  await page.evaluate(() => window.testGalleries.first.open("work-999/photo.jpg"));
  await expect(page.locator(".fslightbox-container")).toBeVisible();
  await expect(page.locator(".fslightboxsn span").first()).toHaveText("1000");
  await expect(page.locator(".fslightboxsn span").last()).toHaveText("1000");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".fslightboxsn span").first()).toHaveText("999");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".fslightboxsn span").first()).toHaveText("1000");
  await expect.poll(() => page.locator(".fslightbox-container img").evaluateAll(images =>
    images.some(image => image.src === window.testGalleries.first.model.images[999].src)
  )).toBe(true);
  await page.evaluate(() => window.testGalleries.first.destroy());
  await expect(page.locator("#first .hugg-figure")).toHaveCount(0);
  await expect(page.locator(".fslightbox-container")).toHaveCount(0);
  const before = await page.locator("#second").evaluate(host => host.style.height);
  await page.evaluate(() => {
    const { hosts } = window.testGalleries;
    hosts[1].style.width = "400px";
    window.dispatchEvent(new Event("resize"));
  });
  await expect.poll(() => page.locator("#second").evaluate(host => host.style.height)).not.toBe(before);
  await page.evaluate(() => window.testGalleries.second.open(window.testGalleries.second.model.images[0].id));
  await expect(page.locator(".fslightbox-container")).toBeVisible();
  const cleanup = await page.evaluate(async () => {
    const { first, second, hosts, Gallery, model } = window.testGalleries;
    await Promise.all([first.destroy(), first.destroy(), second.destroy()]);
    const styleCount = document.querySelectorAll("style[data-pig-style]").length;
    const recreated = new Gallery({ container: hosts[0], model });
    await recreated.destroy();
    let rejected = false;
    try { await recreated.open(model.images[0].id); } catch { rejected = true; }
    await new Promise(resolve => setTimeout(resolve, 350));
    return {
      figures: hosts.reduce((sum, host) => sum + host.children.length, 0),
      styles: document.querySelectorAll("style[data-pig-style]").length - styleCount,
      rejected,
      globals: ["__pigGallery", "__pigGalleries", "gdImageData"].filter(key => key in window),
    };
  });
  expect(cleanup).toEqual({ figures: 0, styles: 0, rejected: true, globals: [] });
  expect(errors).toEqual([]);
});

test("restores focus, uses source-specific links and survives repeated mount/early destroy", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Lifecycle is independent of color scheme.");
  await prepare(page);
  await page.evaluate(async () => {
    const { Gallery } = await import("/gallery-core/gallery.js");
    const { GalleryModel } = await import("/gallery-core/gallery-model.js");
    const source = document.querySelector(".hugg-grid");
    const model = await GalleryModel.load(new URL(source.dataset.huggImageDataUrl, document.baseURI).href);
    const host = document.createElement("div");
    host.id = "dynamic";
    host.style.width = "600px";
    document.body.prepend(host);
    const styles = document.querySelectorAll("style[data-pig-style]").length;
    for (let index = 0; index < 10; index++) {
      const gallery = new Gallery({ container: host, model });
      await gallery.destroy();
    }
    if (document.querySelectorAll("style[data-pig-style]").length !== styles) throw new Error("Leaked styles.");
    const gallery = new Gallery({ container: host, model });
    window.testGalleries = { gallery, host, model };
  });
  const first = page.locator("#dynamic a.hugg-figure").first();
  await expect(first).toHaveAttribute("href", /https?:/);
  await first.focus();
  await first.press("Enter");
  await expect(page.locator(".fslightbox-container")).toBeVisible();
  await expect(page.locator(".hugg-lightbox")).toBeFocused();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.querySelector(".hugg-lightbox").contains(document.activeElement))).toBe(true);
  expect(await page.evaluate(() => document.activeElement.tagName)).toBe("BUTTON");
  await expect(page.getByRole("button", { name: "Close", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".fslightbox-container")).toHaveCount(0);
  await expect(first).toBeFocused();
  await page.evaluate(() => window.testGalleries.gallery.destroy());
  await expect(page.locator("#dynamic")).toBeEmpty();
});

test("serializes overlays without mixing sources when another instance opens or is destroyed", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Lifecycle is independent of color scheme.");
  await prepare(page);
  const expected = await page.evaluate(async () => {
    const { Gallery } = await import("/gallery-core/gallery.js");
    const { GalleryModel } = await import("/gallery-core/gallery-model.js");
    const source = document.querySelector(".hugg-grid");
    const model = await GalleryModel.load(new URL(source.dataset.huggImageDataUrl, document.baseURI).href);
    const hosts = Array.from({ length: 2 }, () => {
      const host = document.createElement("div");
      document.body.prepend(host);
      return host;
    });
    const first = new Gallery({ container: hosts[0], model });
    const secondModel = GalleryModel.fromImages([model.images[1]], document.baseURI);
    const second = new Gallery({ container: hosts[1], model: secondModel });
    await first.open(model.images[0].id);
    await second.open(secondModel.images[0].id);
    window.switchedGalleries = { first, second };
    return secondModel.images[0].src;
  });
  await expect(page.locator(".fslightbox-container img").first()).toHaveAttribute("src", expected);
  const result = await page.evaluate(async () => {
    const { first, second } = window.switchedGalleries;
    const containers = document.querySelectorAll(".fslightbox-container").length;
    await first.destroy();
    const remaining = document.querySelectorAll(".fslightbox-container").length;
    await second.destroy();
    return { containers, remaining, final: document.querySelectorAll(".fslightbox-container").length };
  });
  expect(result).toEqual({ containers: 1, remaining: 1, final: 0 });
});

test("Hugo adapter deduplicates initialization and cancels pending manifests without mounting", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Lifecycle is independent of color scheme.");
  await prepare(page);
  const requests = [];
  await page.route("**/delayed-manifest.json", route => { requests.push(route); });
  const started = page.waitForRequest("**/delayed-manifest.json");
  await page.evaluate(async () => {
    const { default: adapter } = await import("/hugo/js/init-pig.js");
    const source = document.querySelector(".hugg-grid");
    const host = document.createElement("div");
    host.id = "hugo-dynamic";
    host.dataset.huggImageDataUrl = source.dataset.huggImageDataUrl;
    document.body.prepend(host);
    const [first, second] = await Promise.all([adapter.initContainer(host), adapter.initContainer(host)]);
    if (first !== second) throw new Error("Duplicate initialization.");
    await adapter.destroyContainer(host);
    if (host.dataset.huggInitialized || host.children.length) throw new Error("Hugo instance leaked.");
    host.dataset.huggImageDataUrl = "/delayed-manifest.json";
    const pending = adapter.initContainer(host).then(() => "unexpected success", error => error.name);
    window.testHugo = { adapter, host, pending };
  });
  await started;
  const result = await page.evaluate(async () => {
    const { adapter, host, pending } = window.testHugo;
    await adapter.destroyContainer(host);
    return { result: await pending, initialized: host.dataset.huggInitialized, count: host.children.length };
  });
  expect(result).toEqual({ result: "AbortError", initialized: undefined, count: 0 });
  expect(requests).toHaveLength(1);
});

test("rejects duplicate mounts and invalid inputs and preserves consumer content on teardown", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Lifecycle is independent of color scheme.");
  await prepare(page);
  const result = await page.evaluate(async () => {
    const { Gallery } = await import("/gallery-core/gallery.js");
    const { GalleryModel } = await import("/gallery-core/gallery-model.js");
    const host = document.createElement("div");
    host.style.height = "25px";
    host.tabIndex = 2;
    const text = document.createElement("p");
    text.textContent = "Consumer-owned content";
    host.append(text);
    document.body.prepend(host);
    const model = GalleryModel.fromImages([], document.baseURI);
    let rejected = 0;
    try { new Gallery({ container: host, model, gap: -1 }); } catch { rejected++; }
    const gallery = new Gallery({ container: host, model });
    try { new Gallery({ container: host, model }); } catch { rejected++; }
    try { await gallery.open("unknown"); } catch { rejected++; }
    const pendingOpen = gallery.open("unknown").catch(() => "rejected");
    await gallery.destroy();
    await pendingOpen;
    return {
      rejected, text: host.textContent, height: host.style.height,
      tabIndex: host.tabIndex, id: host.id, owned: Gallery.forContainer(host) !== undefined,
    };
  });
  expect(result).toEqual({
    rejected: 3, text: "Consumer-owned content", height: "25px", tabIndex: 2, id: "", owned: false,
  });
});

test("releases listeners and styles after queued opens and rapid mount/destroy cycles", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Lifecycle is independent of color scheme.");
  await prepare(page);
  const result = await page.evaluate(async () => {
    const { Gallery } = await import("/gallery-core/gallery.js");
    const { GalleryModel } = await import("/gallery-core/gallery-model.js");
    const source = document.querySelector(".hugg-grid");
    const model = await GalleryModel.load(new URL(source.dataset.huggImageDataUrl, document.baseURI).href);
    const host = document.createElement("div");
    document.body.prepend(host);
    const listeners = new Map();
    const prototype = EventTarget.prototype;
    const add = prototype.addEventListener;
    const remove = prototype.removeEventListener;
    prototype.addEventListener = function (type, callback, options) {
      if (this === window || this === document) {
        let callbacks = listeners.get(type);
        if (!callbacks) listeners.set(type, callbacks = new Set());
        callbacks.add(callback);
      }
      return add.call(this, type, callback, options);
    };
    prototype.removeEventListener = function (type, callback, options) {
      if (this === window || this === document) listeners.get(type)?.delete(callback);
      return remove.call(this, type, callback, options);
    };
    const styles = document.querySelectorAll("style[data-pig-style], style[data-gallery-lightbox-style]").length;
    try {
      for (let index = 0; index < 10; index++) {
        const gallery = new Gallery({ container: host, model });
        const opening = gallery.open(model.images[0].id).then(() => "opened", error => error.message);
        await gallery.destroy();
        await opening;
      }
      const gallery = new Gallery({ container: host, model });
      await Promise.all([gallery.open(model.images[0].id), gallery.open(model.images[1].id)]);
      await gallery.destroy();
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("scroll"));
      await new Promise(resolve => setTimeout(resolve, 350));
      return {
        listeners: Array.from(listeners, ([type, callbacks]) => [type, callbacks.size]).filter(([, size]) => size),
        styles: document.querySelectorAll("style[data-pig-style], style[data-gallery-lightbox-style]").length - styles,
        children: host.children.length,
        overlays: document.querySelectorAll(".fslightbox-container").length,
      };
    } finally {
      prototype.addEventListener = add;
      prototype.removeEventListener = remove;
    }
  });
  expect(result).toEqual({ listeners: [], styles: 0, children: 0, overlays: 0 });
});

test("reports failed Hugo loads visibly and allows an explicit retry", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Lifecycle is independent of color scheme.");
  await prepare(page);
  await page.route("**/invalid-gallery.json", route => route.fulfill({ contentType: "application/json", body: "[]" }));
  const result = await page.evaluate(async () => {
    const { default: adapter } = await import("/hugo/js/init-pig.js");
    const source = document.querySelector(".hugg-grid");
    const host = document.createElement("div");
    document.body.prepend(host);
    host.dataset.huggImageDataUrl = "/invalid-gallery.json";
    let notified = 0;
    host.addEventListener("gallery:error", () => { notified++; });
    try { await adapter.initContainer(host); } catch { /* Expected strict validation error. */ }
    const failed = {
      alerts: host.querySelectorAll('[role="alert"]').length,
      initialized: host.dataset.huggInitialized,
      notified,
    };
    host.dataset.huggImageDataUrl = source.dataset.huggImageDataUrl;
    await adapter.initContainer(host);
    const retried = { alerts: host.querySelectorAll('[role="alert"]').length, initialized: host.dataset.huggInitialized };
    await adapter.destroyContainer(host);
    return { failed, retried, children: host.children.length };
  });
  expect(result).toEqual({
    failed: { alerts: 1, initialized: undefined, notified: 1 },
    retried: { alerts: 0, initialized: "true" },
    children: 0,
  });
});

test("honors reduced motion in grid and overlay", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Emulated preference is independent of project scheme.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await prepare(page);
  await page.locator(".hugg-figure").first().click();
  await expect(page.locator(".hugg-lightbox")).toBeVisible();
  await expect(page.locator(".hugg-lightbox")).toHaveCSS("animation-duration", "0s");
  await expect(page.locator(".hugg-figure img").first()).toHaveCSS("transition-duration", "0s");
  await page.keyboard.press("Escape");
  await expect(page.locator(".hugg-lightbox")).toHaveCount(0);
});

test("waits for a hidden container to acquire geometry and responds to container-only resizes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Geometry lifecycle is independent of color scheme.");
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await prepare(page);
  await page.evaluate(async () => {
    const { Gallery } = await import("/gallery-core/gallery.js");
    const { GalleryModel } = await import("/gallery-core/gallery-model.js");
    const source = document.querySelector(".hugg-grid");
    const model = await GalleryModel.load(new URL(source.dataset.huggImageDataUrl, document.baseURI).href);
    const host = document.createElement("div");
    host.id = "hidden-gallery";
    host.style.display = "none";
    host.style.width = "800px";
    document.body.prepend(host);
    const gallery = new Gallery({ container: host, model });
    window.hiddenGallery = { gallery, host };
  });
  await expect(page.locator("#hidden-gallery .hugg-figure")).toHaveCount(0);
  await page.evaluate(() => { window.hiddenGallery.host.style.display = "block"; });
  await expect(page.locator("#hidden-gallery .hugg-figure")).toHaveCount(4);
  const height = await page.locator("#hidden-gallery").evaluate(host => host.style.height);
  await page.evaluate(() => { window.hiddenGallery.host.style.width = "300px"; });
  await expect.poll(() => page.locator("#hidden-gallery").evaluate(host => host.style.height)).not.toBe(height);
  await page.evaluate(() => window.hiddenGallery.gallery.destroy());
  expect(errors).toEqual([]);
});
