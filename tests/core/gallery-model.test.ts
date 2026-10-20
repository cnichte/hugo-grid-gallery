import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GalleryModel } from '../../assets/hugo-grid-gallery/core/gallery-model'

const image = (id = 'work/photo') => ({
  id, width: 1200, height: 800, src: '../images/full.jpg', alt: '',
  sources: [{ width: 300, height: 200, src: '../images/small.jpg' }, { width: 600, height: 400, src: '../images/medium.jpg' }]
})
const base = 'https://example.test/portfolio/data/gallery.json'

test('normalizes manifest-relative URLs, preserves stable IDs and never mutates caller data', () => {
  const manifest = { schemaVersion: 1, images: [image(), { ...image('second'), alt: '<caption>', title: 'Same name', detailUrl: '../works/second/' }] }
  const before = structuredClone(manifest)
  const model = GalleryModel.parse(manifest, base)
  assert.equal(model.images[0].src, 'https://example.test/portfolio/images/full.jpg')
  assert.equal(model.images[0].sources?.[0].src, 'https://example.test/portfolio/images/small.jpg')
  assert.equal(model.images[1].detailUrl, 'https://example.test/portfolio/works/second/')
  assert.deepEqual(manifest, before)
  manifest.images[0].sources[0].src = 'changed'
  assert.equal(model.images[0].sources?.[0].src, 'https://example.test/portfolio/images/small.jpg')
  assert.equal(Object.isFrozen(model.images[0]), true)
  assert.equal(Object.isFrozen(model.images[0].sources), true)
  assert.equal(Object.isFrozen(model.images), true)
  assert.equal(Object.isFrozen(model), true)
})

test('uses the same strict contract for direct images and permits an intentionally empty list', () => {
  assert.deepEqual(GalleryModel.fromImages([image()], base).images, GalleryModel.parse({ schemaVersion: 1, images: [image()] }, base).images)
  assert.deepEqual(GalleryModel.fromImages([], base).images, [])
  for (const value of [[], { images: [] }, { schemaVersion: 2, images: [] }, { schemaVersion: 1, images: [], password: 'private' }]) {
    assert.throws(() => GalleryModel.parse(value, base), /Gallery/)
  }
})

test('rejects ambiguous identities, unsafe URLs, invalid geometry and raw unexpected properties', () => {
  assert.throws(() => GalleryModel.fromImages([image(), image()], base), /id/)
  for (const patch of [
    { id: '' }, { width: 0 }, { height: Infinity }, { width: 1.5 }, { alt: undefined },
    { src: 'javascript:alert(1)' }, { src: 'data:image/svg+xml,<svg />' }, { src: 'file:///private/photo.jpg' },
    { src: 'https://name:password@example.test/photo.jpg' }, { detailUrl: 'javascript:alert(1)' },
    { sources: [{ width: 300, height: 100, src: 'bad-ratio.jpg' }] },
    { sources: [{ width: 300, height: 200, src: 'a.jpg' }, { width: 300, height: 200, src: 'b.jpg' }] },
    { sources: [{ width: 300, height: 200, src: 'a.jpg', private: true }] },
    { metadata: { gps: 'private' } }, { full: 'old-payload.jpg' }, { badge: 42 }
  ]) assert.throws(() => GalleryModel.fromImages([{ ...image(), ...patch }], base), /Gallery/)
  assert.throws(() => GalleryModel.fromImages([image()], 'file:///private/manifest.json'), /Gallery/)
  assert.throws(() => GalleryModel.fromImages([Object.assign(Object.create({ id: 'inherited' }), image())], base), /Gallery/)
})

test('selects variants by actual width and never loses duplicate filenames or mutates order', () => {
  const model = GalleryModel.fromImages([image('first'), image('second')], base)
  assert.equal(model.source('first', 20), 'https://example.test/portfolio/images/small.jpg')
  assert.equal(model.source('first', 400), 'https://example.test/portfolio/images/medium.jpg')
  assert.equal(model.source('first', 900), 'https://example.test/portfolio/images/full.jpg')
  assert.deepEqual(model.reversed().images.map(value => value.id), ['second', 'first'])
  assert.deepEqual(model.images.map(value => value.id), ['first', 'second'])
  assert.throws(() => model.source('missing', 20), /Gallery/)
  assert.throws(() => model.source('first', NaN), /Gallery/)
})

test('loads the response manifest against its final URL and reports HTTP, JSON and validation failures', async () => {
  const fetcher = async () => new Response(JSON.stringify({ schemaVersion: 1, images: [image()] }))
  const loaded = await GalleryModel.load(base, fetcher)
  assert.equal(loaded.images[0].id, 'work/photo')
  await assert.rejects(GalleryModel.load(base, async () => new Response('no', { status: 404 })), /Gallery.*404/)
  await assert.rejects(GalleryModel.load(base, async () => new Response('not json')), /Gallery.*JSON/)
  await assert.rejects(GalleryModel.load(base, async () => new Response('[]')), /Gallery/)
  const response = new Response(JSON.stringify({ schemaVersion: 1, images: [image()] }))
  Object.defineProperty(response, 'url', { value: 'https://example.test/redirected/data/gallery.json' })
  assert.equal((await GalleryModel.load(base, async () => response)).images[0].src, 'https://example.test/redirected/images/full.jpg')
})

test('retains the complete 1000-image inventory across independent orderings', () => {
  const images = Array.from({ length: 1000 }, (_, index) => image(`work-${index}/photo.jpg`))
  const model = GalleryModel.fromImages(images, base)
  const shuffled = model.shuffled()
  assert.equal(shuffled.images.length, 1000)
  assert.equal(new Set(shuffled.images.map(image => image.id)).size, 1000)
  assert.deepEqual(shuffled.images.map(image => image.id).sort(), model.images.map(image => image.id).sort())
  assert.deepEqual(model.images.map(image => image.id), images.map(image => image.id))
  assert.equal(model.reversed().images[0].id, 'work-999/photo.jpg')
  assert.equal(model.images.some(value => 'prev' in value || 'next' in value), false)
})

test('passes manifest cancellation to fetch and propagates explicit aborts', async () => {
  const controller = new AbortController()
  let received: AbortSignal | null | undefined
  const fetcher: typeof fetch = async (_url, options) => {
    received = options?.signal
    received?.throwIfAborted()
    return new Response('{}')
  }
  controller.abort()
  await assert.rejects(GalleryModel.load(base, fetcher, controller.signal), { name: 'AbortError' })
  assert.equal(received, controller.signal)
  const bodyController = new AbortController()
  const stream = new ReadableStream({
    start(body) {
      bodyController.signal.addEventListener('abort', () => body.error(bodyController.signal.reason), { once: true })
    }
  })
  const loading = GalleryModel.load(base, async () => new Response(stream), bodyController.signal)
  bodyController.abort()
  await assert.rejects(loading, { name: 'AbortError' })
})
