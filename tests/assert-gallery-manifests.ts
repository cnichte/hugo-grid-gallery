import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { GalleryModel } from '../assets/hugo-grid-gallery/core/gallery-model'

const directory = process.argv[2]
assert.ok(directory, 'Expected the built ExampleSite directory.')
const base = new URL(process.argv[3] ?? 'https://example.test/')
const files = fs.readdirSync(directory).filter(name => /-gallery(?:\.min)?\.json$/.test(name))
assert.ok(files.length > 0, 'Hugo must emit gallery manifests.')
for (const name of files) {
  const model = GalleryModel.parse(JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')), new URL(name, base).href)
  for (const image of model.images) {
    for (const source of [image, ...(image.sources ?? [])]) {
      const url = new URL(source.src)
      assert.equal(url.origin, base.origin)
      assert.ok(url.pathname.startsWith(base.pathname), `Asset escaped website base path: ${source.src}`)
      const relativePath = decodeURIComponent(url.pathname.slice(base.pathname.length))
      assert.ok(fs.existsSync(path.join(directory, relativePath)), `Missing gallery asset ${source.src}`)
    }
  }
}
console.log(`PASS: ${files.length} Hugo manifests satisfy the shared contract and reference existing assets under ${base.pathname}`)
