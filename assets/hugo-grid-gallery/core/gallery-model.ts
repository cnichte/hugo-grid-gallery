export interface GallerySource {
  readonly width: number
  readonly height: number
  readonly src: string
}

export interface GalleryImage extends GallerySource {
  readonly id: string
  readonly alt: string
  readonly title?: string
  readonly badge?: string
  readonly detailUrl?: string
  readonly sources?: readonly GallerySource[]
}

export interface GalleryManifest {
  readonly schemaVersion: 1
  readonly images: readonly GalleryImage[]
}

export class GalleryModel {
  private readonly byId: ReadonlyMap<string, GalleryImage>

  private constructor(readonly images: readonly GalleryImage[]) {
    this.byId = new Map(images.map(image => [image.id, image]))
    Object.freeze(this)
  }

  static parse(value: unknown, baseUrl: string): GalleryModel {
    const manifest = this.object(value, ['schemaVersion', 'images'], 'manifest')
    if (manifest.schemaVersion !== 1) throw new Error('Gallery manifest requires schemaVersion 1.')
    return this.fromImages(manifest.images, baseUrl)
  }

  static fromImages(value: unknown, baseUrl: string): GalleryModel {
    const base = this.url(baseUrl, undefined, 'base URL')
    if (!Array.isArray(value)) throw new Error('Gallery images must be an array.')
    const ids = new Set<string>()
    const images = value.map((entry, index): GalleryImage => {
      const label = `image ${index}`
      const data = this.object(entry, ['id', 'width', 'height', 'src', 'alt', 'title', 'badge', 'detailUrl', 'sources'], label)
      const id = this.text(data.id, `${label} id`)
      if (!id.trim() || ids.has(id)) throw new Error(`Gallery ${label} requires a unique nonempty id.`)
      ids.add(id)
      const geometry = this.geometry(data, base, label)
      const image: GalleryImage = {
        ...geometry, id, alt: this.text(data.alt, `${label} alt`),
        ...(data.title !== undefined ? { title: this.text(data.title, `${label} title`) } : {}),
        ...(data.badge !== undefined ? { badge: this.text(data.badge, `${label} badge`) } : {}),
        ...(data.detailUrl !== undefined ? { detailUrl: this.url(data.detailUrl, base, `${label} detailUrl`) } : {}),
        ...(data.sources !== undefined ? { sources: this.sources(data.sources, geometry, base, label) } : {})
      }
      return Object.freeze(image)
    })
    return new GalleryModel(Object.freeze(images))
  }

  static async load(url: string, fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<GalleryModel> {
    const manifestUrl = this.url(url, undefined, 'manifest URL')
    const response = await fetcher(manifestUrl, { signal })
    if (!response.ok) throw new Error(`Gallery manifest request failed (${response.status}): ${manifestUrl}`)
    let value: unknown
    try {
      value = await response.json()
    } catch (error) {
      signal?.throwIfAborted()
      throw new Error(`Gallery manifest is not valid JSON: ${manifestUrl}`, { cause: error })
    }
    signal?.throwIfAborted()
    return this.parse(value, response.url || manifestUrl)
  }

  source(id: string, width: number): string {
    const image = this.byId.get(id)
    if (!image) throw new Error(`Gallery image id not found: ${id}`)
    if (!Number.isFinite(width) || width <= 0) throw new Error('Gallery requested width must be positive and finite.')
    const sources = [...(image.sources ?? []), image].sort((a, b) => a.width - b.width)
    return (sources.find(source => source.width >= width) ?? sources[sources.length - 1]).src
  }

  reversed(): GalleryModel {
    return new GalleryModel(Object.freeze([...this.images].reverse()))
  }

  shuffled(): GalleryModel {
    const images = [...this.images]
    for (let index = images.length - 1; index > 0; index--) {
      const target = Math.floor(Math.random() * (index + 1))
      ;[images[index], images[target]] = [images[target], images[index]]
    }
    return new GalleryModel(Object.freeze(images))
  }

  private static object(value: unknown, fields: readonly string[], label: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(value)) ||
        Object.keys(value).some(key => !fields.includes(key))) {
      throw new Error(`Gallery ${label} must be an object containing only declared fields.`)
    }
    return value as Record<string, unknown>
  }

  private static text(value: unknown, label: string): string {
    if (typeof value !== 'string') throw new Error(`Gallery ${label} must be text.`)
    return value
  }

  private static url(value: unknown, base: string | undefined, label: string): string {
    const text = this.text(value, label)
    if (!text.trim()) throw new Error(`Gallery ${label} must not be empty.`)
    let url: URL
    try {
      url = new URL(text, base)
    } catch (error) {
      throw new Error(`Gallery ${label} is not a valid URL.`, { cause: error })
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error(`Gallery ${label} requires an HTTP(S) URL without credentials.`)
    }
    return url.href
  }

  private static geometry(data: Record<string, unknown>, base: string, label: string): GallerySource {
    const { width, height } = data
    if (typeof width !== 'number' || typeof height !== 'number' ||
        !Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
      throw new Error(`Gallery ${label} dimensions must be positive safe integers.`)
    }
    return { width, height, src: this.url(data.src, base, `${label} src`) }
  }

  private static sources(value: unknown, image: GallerySource, base: string, label: string): readonly GallerySource[] {
    if (!Array.isArray(value)) throw new Error(`Gallery ${label} sources must be an array.`)
    const widths = new Set<number>()
    return Object.freeze(value.map((entry, index) => {
      const source = this.geometry(this.object(entry, ['width', 'height', 'src'], `${label} source ${index}`), base, label)
      // A resize can round one dimension by a pixel.
      const ratioError = Math.abs(source.height - source.width * image.height / image.width)
      if (widths.has(source.width) || ratioError > 1) throw new Error(`Gallery ${label} variants require unique widths and matching aspect ratios.`)
      widths.add(source.width)
      return Object.freeze(source)
    }).sort((a, b) => a.width - b.width))
  }
}
