# Changelog

All notable changes to this project are documented in this file.
This project follows [Semantic Versioning](https://semver.org/).

## [2.0.9] - 2026-09-29

### Fixed in 2.0.9

- minor css fixes

## [2.0.8] - 2026-09-28

### Fixed in 2.0.8

- dflip paramteters and sfLightbox pro override fixed
- minor css fixes

## [2.0.7] - 2026-09-28

### Changed in 2.0.7

- Make the Pig grid image loading placeholder themeable through `--hugg-image-placeholder-color`.

## [2.0.6] - 2026-09-28

### Fixed in 2.0.6

- Connect external sort controls to Category indexes and expose each Category's latest Gallery update for Updated sorting.

## [2.0.5] - 2026-09-28

### Fixed in 2.0.5

- Restore Gallery Card fragment navigation after browser page restoration on long Card pages.

## [2.0.4] - 2026-09-28

### Fixed in 2.0.4

- Keep category descriptions and their image and gallery statistics in one paragraph.

## [2.0.3] - 2026-09-28

### Changed in 2.0.3

- Center Recently Updated in its available row space and give the index controls equal top and bottom margins.

## [2.0.2] - 2026-09-28

### Added in 2.0.2

- Add independently overridable index-control, sorting, and Recently Updated partials with documented CSS hookpoints.
- Add `showRecentlyUpdated` for collections that compose the controls in their own layouts.

### Changed in 2.0.2

- Place sorting and Recently Updated in one row on wider screens and wrap them below 768 pixels, using plain theme-compatible links.

### Fixed in 2.0.2

- Always emit the Gallery stylesheet for a rendered component instead of suppressing it through page Scratch shared across Hugo output formats.

## [2.0.1] - 2026-09-28

### Fixed in 2.0.1

- Allow `story` and `standalone` galleries without Gallery Card metadata while preserving strict Card metadata validation for `game` galleries.

## [2.0.0] - 2026-09-28

### Added in 2.0.0

- Collection-based gallery identity and navigation.
- Hierarchical gallery configuration with collection and gallery overrides.
- Shared metadata for galleries, categories, cards, and statistics.
- The `game`, `story`, and `standalone` roles and role-filtered lists.
- Role-filtered recently updated links and time-limited card markers.
- A documented consumer build using `hugo-toolbox update-lastmod`.
- Configurable cover resolution, image sizes, and optional watermarks.
- fsLightbox Basic with consumer overrides for private Pro versions.
- An executable example site with positive and negative fixtures.
- Build, DOM, and browser tests for Hugo Extended 0.156.0 and current versions.

### Changed in 2.0.0

- Gallery pages use a strict `params.hugg` contract.
- Gallery metadata is loaded exclusively from `data/hugo_grid_gallery/`.
- Gallery and category links are resolved within their collection.
- Module defaults no longer modify image order or image contents implicitly.

### Removed in 2.0.0

- Path, title, and section fallbacks for gallery identities.
- Theme-specific and consumer-specific content and generated build files.
- Obsolete separate metadata sets for game and story galleries.
