import type { GalleryModel } from './gallery-model.js'

export type GalleryPresentation = 'grid' | 'carousel' | 'single'

interface GalleryStageOptions {
  container: HTMLElement
  model: GalleryModel
  presentation: 'carousel' | 'single'
  initialImageId?: string
  activate(id: string, trigger: HTMLElement): void
  report(error: Error): void
}

export class GalleryStage {
  private readonly root = document.createElement('section')
  private readonly link = document.createElement('a')
  private readonly image = document.createElement('img')
  private readonly caption = document.createElement('p')
  private readonly status = document.createElement('p')
  private readonly notice = document.createElement('p')
  private readonly previous = document.createElement('button')
  private readonly next = document.createElement('button')
  private readonly events = new AbortController()
  private readonly observer: ResizeObserver
  private current = 0
  private enabled = false
  private pointer: { id: number; x: number; y: number } | undefined
  private suppressClick = false

  constructor(private readonly options: GalleryStageOptions) {
    this.current = options.initialImageId === undefined ? 0 : options.model.images.findIndex(image => image.id === options.initialImageId)
    this.root.className = `hugg-stage hugg-stage-${options.presentation}`
    this.root.setAttribute('aria-label', 'Image gallery')
    if (options.presentation === 'carousel') this.root.setAttribute('aria-roledescription', 'carousel')
    this.link.className = 'hugg-stage-image'
    this.link.style.display = 'block'
    const initialImage = options.model.images[this.current]
    if (initialImage) this.link.style.aspectRatio = `${initialImage.width} / ${initialImage.height}`
    this.link.style.touchAction = options.presentation === 'carousel' ? 'pan-y' : 'auto'
    this.image.style.cssText = 'display:block;width:100%;height:100%;object-fit:contain'
    this.image.decoding = 'async'
    this.caption.className = 'hugg-stage-caption'
    this.status.className = 'hugg-stage-status'
    this.status.setAttribute('aria-live', 'polite')
    this.status.setAttribute('aria-atomic', 'true')
    this.notice.setAttribute('role', 'alert')
    this.notice.hidden = true
    this.link.append(this.image)
    if (options.model.images.length) this.root.append(this.link, this.caption)
    this.root.append(this.status, this.notice)
    this.previous.type = this.next.type = 'button'
    this.previous.textContent = 'Previous image'
    this.next.textContent = 'Next image'
    if (options.presentation === 'carousel' && options.model.images.length > 1) {
      const controls = document.createElement('div')
      controls.className = 'hugg-stage-controls'
      controls.style.cssText = 'display:flex;justify-content:space-between;gap:1rem'
      controls.append(this.previous, this.next)
      this.root.append(controls)
    }
    const eventOptions = { signal: this.events.signal }
    this.previous.addEventListener('click', () => this.move(-1), eventOptions)
    this.next.addEventListener('click', () => this.move(1), eventOptions)
    this.root.addEventListener('keydown', event => {
      if (options.presentation !== 'carousel' || event.altKey || event.ctrlKey || event.metaKey ||
          options.model.images.length < 2) return
      const targets: Record<string, number> = {
        ArrowLeft: (this.current - 1 + options.model.images.length) % options.model.images.length,
        ArrowRight: (this.current + 1) % options.model.images.length,
        Home: 0, End: options.model.images.length - 1,
      }
      if (Object.hasOwn(targets, event.key)) {
        event.preventDefault()
        this.select(targets[event.key])
      }
    }, eventOptions)
    this.link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      if (this.suppressClick) {
        this.suppressClick = false
        if (event.detail !== 0) {
          event.preventDefault()
          return
        }
      }
      event.preventDefault()
      options.activate(options.model.images[this.current].id, this.link)
    }, eventOptions)
    this.link.addEventListener('pointerdown', event => {
      this.suppressClick = false
      if (!event.isPrimary) this.pointer = undefined
      if (options.presentation === 'carousel' && event.pointerType === 'touch' && event.isPrimary) {
        this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
      }
    }, eventOptions)
    this.link.addEventListener('pointerup', event => {
      const start = this.pointer
      this.pointer = undefined
      if (!start || start.id !== event.pointerId) return
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5 && options.model.images.length > 1) {
        this.suppressClick = true
        this.move(dx < 0 ? 1 : -1)
      }
    }, eventOptions)
    this.link.addEventListener('pointercancel', () => { this.pointer = undefined }, eventOptions)
    this.image.addEventListener('error', () => {
      const error = new Error(`Gallery image could not be loaded: ${options.model.images[this.current]?.id}`)
      this.notice.textContent = error.message
      this.notice.hidden = false
      options.report(error)
    }, eventOptions)
    this.observer = new ResizeObserver(() => this.updateSource())
    window.addEventListener('resize', () => this.updateSource(), eventOptions)
  }

  enable(): void {
    if (this.enabled) return
    this.enabled = true
    if (this.options.model.images.length === 0) {
      this.link.hidden = true
      this.link.style.display = 'none'
      this.status.textContent = 'No images'
    } else this.select(this.current)
    this.options.container.append(this.root)
    this.observer.observe(this.root)
    this.updateSource()
  }

  show(id: string): void {
    const index = this.options.model.images.findIndex(image => image.id === id)
    if (index < 0) throw new Error(`Gallery image id not found: ${id}`)
    this.select(index)
  }

  destroy(): void {
    this.enabled = false
    this.events.abort()
    this.observer.disconnect()
    this.image.removeAttribute('src')
    this.root.remove()
    this.pointer = undefined
  }

  private move(direction: number): void {
    this.select((this.current + direction + this.options.model.images.length) % this.options.model.images.length)
  }

  private select(index: number): void {
    this.current = index
    this.notice.textContent = ''
    const image = this.options.model.images[index]
    this.link.href = image.detailUrl ?? image.src
    this.link.dataset.galleryImageId = image.id
    this.link.setAttribute('aria-label', image.title || image.alt || 'Open image')
    this.image.alt = image.alt
    this.image.width = image.width
    this.image.height = image.height
    this.caption.textContent = image.title ?? ''
    this.caption.hidden = !image.title
    this.status.textContent = `${index + 1} / ${this.options.model.images.length}`
    this.notice.hidden = true
    this.updateSource()
  }

  private updateSource(): void {
    if (!this.enabled || this.options.model.images.length === 0) return
    const width = this.link.getBoundingClientRect().width
    if (width <= 0) return
    const src = this.options.model.source(this.options.model.images[this.current].id, width * window.devicePixelRatio)
    if (this.image.src !== src) this.image.src = src
  }
}
