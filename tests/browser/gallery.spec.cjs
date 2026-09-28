const { test, expect } = require("@playwright/test");

const cardValues = async (page, attribute) =>
  page.locator(".hugg-card").evaluateAll(
    (cards, name) => cards.map((card) => card.getAttribute(name)),
    attribute
  );

test("sorts gallery cards and responds at every layout breakpoint", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Behavior is independent of color scheme.");

  await page.goto("/galleries/");
  await expect(page.locator(".hugg-card")).toHaveCount(4);
  await expect(page.locator(".hugg-updated-title")).toHaveText("Recently Updated ⭐");
  await expect(page.locator(".hugg-updated-link")).toHaveCount(2);
  await expect(page.locator(".hugg-new-symbol")).toHaveCount(4);
  await expect(page.locator(".hugg-index-controls")).toHaveCSS("margin-top", "16px");
  await expect(page.locator(".hugg-index-controls")).toHaveCSS("margin-bottom", "16px");
  await expect(page.locator(".hugg-updated")).toHaveCSS("justify-content", "center");
  await expect(page.locator(".hugg-updated-links")).toHaveCSS("justify-content", "center");
  await expect(page.locator(".hugg-updated-link").first()).toHaveCSS("border-top-style", "none");
  await page.locator(".hugg-updated-link").first().hover();
  await expect(page.locator(".hugg-updated-link").first()).toHaveCSS("text-decoration-line", "underline");
  await expect(page.locator(".hugg-updated-link").first()).toHaveCSS("opacity", "0.8");
  await expect(page.locator(".hugg-num-photos").first()).toHaveCSS("background-color", "rgba(0, 0, 0, 0.5)");
  await expect(page.locator(".hugg-num-photos").first()).toHaveCSS("color", "rgb(255, 255, 255)");

  const titles = await cardValues(page, "data-title");
  expect(titles).toEqual([...titles].sort((left, right) =>
    left.localeCompare(right, "de", { sensitivity: "base" })
  ));
  await expect(page.locator('[data-hugg-sort-by="title"]')).toHaveAttribute("aria-current", "true");

  await page.locator('[data-hugg-sort-by="count"]').click();
  const counts = (await cardValues(page, "data-image-count")).map(Number);
  expect(counts).toEqual([...counts].sort((left, right) => right - left));
  await expect(page.locator('[data-hugg-sort-by="count"]')).toHaveAttribute("aria-current", "true");

  await page.locator('[data-hugg-sort-by="updated"]').click();
  const updated = (await cardValues(page, "data-updated")).map(Date.parse);
  expect(updated).toEqual([...updated].sort((left, right) => right - left));
  await expect(page.locator('[data-hugg-sort-by="updated"]')).toHaveAttribute("aria-current", "true");

  for (const [width, columns] of [[390, 1], [600, 2], [900, 3], [1280, 4]]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(async () => page.locator(".hugg-cards").evaluate((grid) =>
      getComputedStyle(grid).gridTemplateColumns.split(" ").length
    )).toBe(columns);
    const [sortBox, updatedBox] = await Promise.all([
      page.locator(".hugg-toolbar").boundingBox(),
      page.locator(".hugg-updated").boundingBox(),
    ]);
    if (width < 768) {
      expect(updatedBox.y).toBeGreaterThanOrEqual(sortBox.y + sortBox.height);
    } else {
      expect(updatedBox.x).toBeGreaterThanOrEqual(sortBox.x + sortBox.width);
      expect(updatedBox.y).toBeLessThan(sortBox.y + sortBox.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  await page.goto("/galleries/game-fixture/");
  await expect(page.locator(".hugg-tags").first()).toHaveCSS("text-align", "center");
  await expect(page.locator(".hugg-tags a").first()).toHaveCSS("border-top-style", "none");
  await expect(page.locator(".hugg-tags a.hugg-selected").first()).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});

test("opens gallery images in the bundled Basic lightbox", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Behavior is independent of color scheme.");

  await page.goto("/galleries/example-gallery/");
  const grid = page.locator(".hugg-grid");
  await expect(grid).toHaveAttribute("data-hugg-initialized", "true");
  await expect(page.locator(".hugg-figure")).toHaveCount(4);
  const firstFigure = page.locator(".hugg-figure").first();
  await expect(firstFigure).toHaveCSS("cursor", "zoom-in");
  await expect.poll(() => firstFigure.evaluate((figure) => typeof figure.onclick)).toBe("function");
  await expect.poll(() => page.evaluate(() =>
    typeof window.fsLightboxInstances?.gallery?.open
  )).toBe("function");
  await firstFigure.click();
  await expect(page.locator(".fslightbox-container")).toBeVisible();
  await expect(page.locator(".fslightbox-container img").first()).toBeVisible();
});

test("matches the gallery visual reference", async ({ page }) => {
  await page.goto("/galleries/example-gallery/");
  await expect(page.locator(".hugg-grid")).toHaveAttribute("data-hugg-initialized", "true");
  await expect(page.locator(".hugg-figure")).toHaveCount(4);
  await page.evaluate(() => Promise.all(
    [...document.images].map((image) => image.complete ? Promise.resolve() : image.decode())
  ));

  await expect(page).toHaveScreenshot("example-gallery.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  });
});
