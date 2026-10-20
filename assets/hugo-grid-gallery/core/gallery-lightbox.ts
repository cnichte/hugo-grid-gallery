import type { GalleryModel } from './gallery-model.js'

interface FsLightboxInstance {
  props: {
    sources: string[]
    types: string[]
    customAttributes: Array<{ alt: string }>
    loadOnlyCurrentSource: boolean
    onOpen: () => void
    onClose: () => void
  }
  open(index: number): void
  close(): void
}

declare global {
  interface Window {
    FsLightbox?: new () => FsLightboxInstance
  }
}

export interface GalleryLightbox {
  open(index: number, trigger?: HTMLElement): Promise<void>
  destroy(): Promise<void>
}

export class FsLightboxAdapter implements GalleryLightbox {
  // Basic owns document-wide scroll/fullscreen state, so overlays must not overlap.
  private static active: FsLightboxAdapter | undefined
  private static queue: Promise<void> = Promise.resolve()
  private instance: FsLightboxInstance | undefined
  private opened = false
  private closing = false
  private destroyed = false
  private trigger: HTMLElement | undefined
  private closed: Promise<void> = Promise.resolve()
  private resolveClosed: (() => void) | undefined
  private destruction: Promise<void> | undefined
  private motionStyle: HTMLStyleElement | undefined

  constructor(private readonly model: GalleryModel, private readonly focusTarget: HTMLElement) {
    if (!window.FsLightbox) throw new Error('Gallery requires fsLightbox Basic to be loaded.')
  }

  open(index: number, trigger?: HTMLElement): Promise<void> {
    if (this.destroyed) return Promise.reject(new Error('Gallery lightbox has been destroyed.'))
    if (!Number.isInteger(index) || index < 0 || index >= this.model.images.length) {
      return Promise.reject(new Error('Gallery lightbox index is out of range.'))
    }
    const run = async () => {
      if (this.destroyed) throw new Error('Gallery lightbox has been destroyed.')
      const active = FsLightboxAdapter.active
      if (active) await active.close()
      await this.closed
      if (this.destroyed) throw new Error('Gallery lightbox has been destroyed.')
      if (!this.instance) {
        const Constructor = window.FsLightbox
        if (!Constructor) throw new Error('Gallery requires fsLightbox Basic to be loaded.')
        const instance = new Constructor()
        instance.props.sources = this.model.images.map(image => image.src)
        instance.props.types = this.model.images.map(() => 'image')
        instance.props.customAttributes = this.model.images.map(image => ({ alt: image.alt }))
        instance.props.loadOnlyCurrentSource = true
        instance.props.onOpen = () => {
          this.opened = true
          FsLightboxAdapter.active = this
          this.closed = new Promise(resolve => { this.resolveClosed = resolve })
          const overlay = Array.from(document.querySelectorAll<HTMLElement>('.fslightbox-container')).at(-1)
          if (!overlay) throw new Error('fsLightbox did not create its overlay.')
          if (!this.motionStyle) {
            this.motionStyle = document.createElement('style')
            this.motionStyle.dataset.galleryLightboxStyle = ''
            this.motionStyle.textContent = `
              .hugg-lightbox button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
              @media (prefers-reduced-motion: reduce) {
                .hugg-lightbox, .hugg-lightbox * { animation-duration: 0s !important; transition-duration: 0s !important; }
              }`
            document.head.append(this.motionStyle)
          }
          overlay.classList.add('hugg-lightbox')
          overlay.setAttribute('role', 'dialog')
          overlay.setAttribute('aria-modal', 'true')
          overlay.setAttribute('aria-label', 'Image gallery')
          overlay.tabIndex = -1
          overlay.querySelectorAll<HTMLButtonElement>('button').forEach(control => {
            const label = control.title || control.closest<HTMLElement>('[title]')?.title
            if (label) control.setAttribute('aria-label', label)
          })
          overlay.onkeydown = event => this.handleKey(event, overlay)
          overlay.focus({ preventScroll: true })
        }
        instance.props.onClose = () => {
          this.opened = false
          this.closing = false
          if (FsLightboxAdapter.active === this) FsLightboxAdapter.active = undefined
          const target = this.trigger?.isConnected ? this.trigger : this.focusTarget
          if (target.isConnected) target.focus({ preventScroll: true })
          this.trigger = undefined
          this.resolveClosed?.()
          this.resolveClosed = undefined
        }
        this.instance = instance
      }
      this.trigger = trigger
      this.instance.open(index)
    }
    const operation = FsLightboxAdapter.queue.then(run, run)
    FsLightboxAdapter.queue = operation
    return operation
  }

  destroy(): Promise<void> {
    if (this.destruction) return this.destruction
    this.destroyed = true
    this.destruction = this.close().then(() => {
      this.instance = undefined
      this.motionStyle?.remove()
      this.motionStyle = undefined
    })
    return this.destruction
  }

  private close(): Promise<void> {
    if (this.opened && !this.closing) {
      this.closing = true
      this.instance?.close()
    }
    return this.closed
  }

  private handleKey(event: KeyboardEvent, overlay: HTMLElement): void {
    if (event.key !== 'Tab') return
    const controls = Array.from(overlay.querySelectorAll<HTMLElement>('button, [href], [tabindex="0"]'))
      .filter(control => control.getClientRects().length > 0)
    const current = controls.findIndex(control => control === document.activeElement)
    const next = event.shiftKey
      ? (current <= 0 ? controls.length - 1 : current - 1)
      : (current + 1) % controls.length
    event.preventDefault()
    ;(controls[next] ?? overlay).focus()
  }
}
