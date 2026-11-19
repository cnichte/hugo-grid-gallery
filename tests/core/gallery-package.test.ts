import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

test('packs an isolated ESM consumer with only the declared runtime and Basic assets', () => {
  const root = path.resolve(__dirname, '../..')
  const temporary = mkdtempSync(path.join(tmpdir(), 'hugg-package-'))
  try {
    execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'pipe' })
    const [packed] = JSON.parse(execFileSync('npm', [
      'pack', '--ignore-scripts', '--json', '--pack-destination', temporary
    ], { cwd: root, encoding: 'utf8' }))
    const files = packed.files.map((file: { path: string }) => file.path).sort()
    assert.deepEqual(files, [
      '.dist/gallery-lightbox.d.ts', '.dist/gallery-lightbox.js',
      '.dist/gallery-model.d.ts', '.dist/gallery-model.js',
      '.dist/gallery-stage.d.ts', '.dist/gallery-stage.js',
      '.dist/gallery.d.ts', '.dist/gallery.js', '.dist/package.json',
      'README.md', 'THIRD_PARTY_NOTICES.md',
      'assets/ext/fslightbox/fslightbox.js', 'assets/ext/pig/pig.js', 'package.json'
    ].sort())
    const consumer = path.join(temporary, 'consumer')
    mkdirSync(consumer)
    writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
    execFileSync('npm', ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund',
      path.join(temporary, packed.filename)], { cwd: consumer, stdio: 'pipe' })
    execFileSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      import { Gallery } from 'hugo-grid-gallery';
      import { GalleryModel } from 'hugo-grid-gallery/model';
      import { readFileSync } from 'node:fs';
      assert.equal(typeof Gallery, 'function');
      assert.equal(GalleryModel.parse({schemaVersion: 1, images: []}, 'https://example.test/').images.length, 0);
      for (const asset of ['runtime/gallery.js', 'runtime/gallery-model.js',
        'runtime/gallery-lightbox.js', 'runtime/gallery-stage.js', 'assets/pig.js', 'assets/fslightbox.js', 'notices']) {
        assert.ok(readFileSync(new URL(import.meta.resolve('hugo-grid-gallery/' + asset))).length > 0);
      }
    `], { cwd: consumer, stdio: 'pipe' })
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
})
