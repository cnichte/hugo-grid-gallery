// Hugo initialization originally derived from Gallery-Deluxe.
import { GalleryModel } from "../core/gallery-model.js";
import { Gallery } from "../core/gallery.js";

const pending = new WeakMap();
const errors = new WeakMap();

const HugoGridGallery = {
  async init() {
    await Promise.all(Array.from(
      document.querySelectorAll(".hugg-grid[data-hugg-image-data-url]")
    ).map(container => this.initContainer(container)));
  },

  initContainer(container) {
    const existing = Gallery.forContainer(container);
    if (existing) return Promise.resolve(existing);
    if (pending.has(container)) return pending.get(container).promise;
    const controller = new AbortController();
    errors.get(container)?.remove();
    errors.delete(container);
    const operation = this.loadContainer(container, controller.signal).catch(error => {
      if (error?.name !== "AbortError") {
        const notice = document.createElement("p");
        notice.setAttribute("role", "alert");
        notice.textContent = `Gallery could not be loaded: ${error instanceof Error ? error.message : String(error)}`;
        container.append(notice);
        errors.set(container, notice);
        container.dispatchEvent(new CustomEvent("gallery:error", { detail: error, bubbles: true }));
      }
      throw error;
    }).finally(() => pending.delete(container));
    pending.set(container, { promise: operation, controller });
    return operation;
  },

  async loadContainer(container, signal) {
    const dataUrl = container.getAttribute("data-hugg-image-data-url");
    if (!dataUrl) throw new Error("HUGG grid requires data-hugg-image-data-url.");
    const params = JSON.parse(container.dataset.huggConfig || "{}");
    if (!params || typeof params !== "object" || Array.isArray(params)) {
      throw new Error(`Invalid Gallery configuration for ${container.id}`);
    }
    let model = await GalleryModel.load(new URL(dataUrl, document.baseURI).href, fetch, signal);
    signal.throwIfAborted();
    if (!container.isConnected) throw new Error("Gallery container was removed while loading.");
    if (params.shuffle) model = model.shuffled();
    else if (params.reverse) model = model.reversed();
    const gallery = new Gallery({
      container, model,
      gap: params.spaceBetweenImages ?? params.spacebetweenimages ?? 10,
    });
    container.dataset.huggInitialized = "true";
    return gallery;
  },

  async destroyContainer(container) {
    const loading = pending.get(container);
    if (loading) {
      loading.controller.abort();
      try {
        await loading.promise;
      } catch (error) {
        if (error?.name !== "AbortError") throw error;
      }
    }
    const gallery = Gallery.forContainer(container);
    if (gallery) await gallery.destroy();
    errors.get(container)?.remove();
    errors.delete(container);
    delete container.dataset.huggInitialized;
  },
};

export default HugoGridGallery;
