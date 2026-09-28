# Changelog

All notable changes to this project are documented in this file.
This project follows [Semantic Versioning](https://semver.org/).

## [2.0.0] - 2026-09-28

### Added

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

### Changed

- Gallery pages use a strict `params.hugg` contract.
- Gallery metadata is loaded exclusively from `data/hugo_grid_gallery/`.
- Gallery and category links are resolved within their collection.
- Module defaults no longer modify image order or image contents implicitly.

### Removed

- Path, title, and section fallbacks for gallery identities.
- Theme-specific and consumer-specific content and generated build files.
- Obsolete separate metadata sets for game and story galleries.
