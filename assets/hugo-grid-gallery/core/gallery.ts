import { GalleryModel } from './gallery-model.js'
import { FsLightboxAdapter, type GalleryLightbox } from './gallery-lightbox.js'
import { GalleryStage, type GalleryPresentation } from './gallery-stage.js'

export type { GalleryPresentation } from './gallery-stage.js'

interface PigImage {
  filename: string
  aspectRatio: number
  image: GalleryModel['images'][number] & { full: string }
  imageTag?: string
}

interface PigOptions {
  container: HTMLElement
  containerId: string
  classPrefix: string
  figureTagName: string
  spaceBetweenImages: number
  transitionSpeed: number
  urlForSize(id: string, width: number): string
  onClickHandler(id: string, trigger: HTMLElement): void
}

interface GalleryView {
  enable(): void
  destroy(): void
  show?(id: string): void
}

declare global {
  interface Window {
    Pig?: new (images: PigImage[], options: PigOptions) => GalleryView
  }
}

export interface GalleryOptions {
  container: HTMLElement
  model: GalleryModel
  gap?: number
  lightbox?: GalleryLightbox
  presentation?: GalleryPresentation
  initialImageId?: string
}

export class Gallery {
  private static readonly instances = new WeakMap<HTMLElement, Gallery>()
  private readonly engine: GalleryView
  private readonly lightbox: GalleryLightbox
  private readonly originalId: string
  private readonly originalTabIndex: string | null
  private destroyed = false
  private destruction: Promise<void> | undefined
  readonly model: GalleryModel
  readonly container: HTMLElement

  constructor(options: GalleryOptions) {
    const { container, model, gap = 10, presentation = 'grid', initialImageId } = options
    if (!(container instanceof HTMLElement) || !container.isConnected) throw new Error('Gallery requires a connected HTML container.')
    if (Gallery.instances.has(container)) throw new Error('Gallery container is already initialized.')
    if (container.id && document.querySelectorAll(`#${CSS.escape(container.id)}`).length !== 1) {
      throw new Error('Gallery container id must be unique in the document.')
    }
    if (!(model instanceof GalleryModel)) throw new Error('Gallery requires a validated GalleryModel.')
    if (!Number.isFinite(gap) || gap < 0) throw new Error('Gallery gap must be nonnegative and finite.')
    if (!['grid', 'carousel', 'single'].includes(presentation)) throw new Error('Gallery presentation must be grid, carousel or single.')
    if (initialImageId !== undefined && (presentation === 'grid' || !model.images.some(image => image.id === initialImageId))) {
      throw new Error('Gallery initialImageId requires a known image in carousel or single presentation.')
    }
    const Constructor = window.Pig
    if (presentation === 'grid' && !Constructor) throw new Error('Gallery requires the Pig layout engine to be loaded.')
    this.lightbox = options.lightbox ?? new FsLightboxAdapter(model, container)
    this.container = container
    this.model = model
    this.originalId = container.id
    this.originalTabIndex = container.getAttribute('tabindex')
    if (!container.id) container.id = `hugg-runtime-${crypto.randomUUID()}`
    if (this.originalTabIndex === null) container.tabIndex = -1
    let engine: GalleryView | undefined
    const activate = (id: string, trigger: HTMLElement) => {
      void this.open(id, trigger).catch(error => this.report(error))
    }
    try {
      if (presentation !== 'grid') {
        engine = new GalleryStage({
          container, model, presentation, initialImageId, activate,
          report: error => this.report(error),
        })
      } else if (Constructor) engine = new Constructor(model.images.map(image => ({
        filename: image.id,
        aspectRatio: image.width / image.height,
        image: { ...image, full: image.src },
        imageTag: image.badge,
      })), {
        container, containerId: container.id, classPrefix: 'hugg', figureTagName: 'a',
        spaceBetweenImages: gap,
        transitionSpeed: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500,
        urlForSize: (id, width) => model.source(id, width),
        onClickHandler: activate,
      })
      if (!engine) throw new Error('Gallery layout could not be created.')
      engine.enable()
      this.engine = engine
    } catch (error) {
      engine?.destroy()
      this.restoreContainer()
      throw error
    }
    Gallery.instances.set(container, this)
  }

  static forContainer(container: HTMLElement): Gallery | undefined {
    return this.instances.get(container)
  }

  open(id: string, trigger?: HTMLElement): Promise<void> {
    if (this.destroyed) return Promise.reject(new Error('Gallery has been destroyed.'))
    const index = this.model.images.findIndex(image => image.id === id)
    if (index < 0) return Promise.reject(new Error(`Gallery image id not found: ${id}`))
    return this.lightbox.open(index, trigger)
  }

  show(id: string): void {
    if (this.destroyed) throw new Error('Gallery has been destroyed.')
    if (!this.engine.show) throw new Error('Gallery show requires carousel or single presentation.')
    this.engine.show(id)
  }

  destroy(): Promise<void> {
    if (this.destruction) return this.destruction
    this.destroyed = true
    this.engine.destroy()
    this.destruction = this.lightbox.destroy().then(() => {
      this.restoreContainer()
      Gallery.instances.delete(this.container)
    })
    return this.destruction
  }

  private restoreContainer(): void {
    this.container.id = this.originalId
    if (this.originalTabIndex === null) this.container.removeAttribute('tabindex')
    else this.container.setAttribute('tabindex', this.originalTabIndex)
  }

  private report(error: unknown): void {
    console.error('Gallery operation failed.', error)
    this.container.dispatchEvent(new CustomEvent('gallery:error', { detail: error, bubbles: true }))
  }
}
