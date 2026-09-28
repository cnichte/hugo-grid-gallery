# Hugo Grid Gallery

Hugo Grid Gallery is a theme-independent Hugo module for large, responsive
image collections. Images remain Page Resources in Hugo; the module uses them
to generate a high-performance justified grid, a lightbox, and optionally
complete collection, card, and category views.

The module is intended for sites that need more than a static image grid:
large numbers of images, multiple related galleries, automatically generated
thumbnails, stable metadata, sorting, and navigation, without coupling this
logic to a specific Hugo theme.

See it in action:

- [binary-voids.de](https://binary-voids.de/)
- [carsten-nichte.de/projects/binary-voids/](https://carsten-nichte.de/projects/binary-voids/)

## Features

- responsive justified grid based on an extended version of Pig.js
- DOM virtualization for large galleries: images outside the relevant scroll
  range are removed again
- progressive image display with a small 20-pixel preview before the actual
  grid image
- automatic Hugo image variants at widths of 20, 100, 250, and 500 pixels
- separately constrained large image version for the lightbox
- fsLightbox Basic bundled by default, with a consumer override for Pro
- complete lightbox navigation despite DOM virtualization by Pig.js
- optional watermark applied exclusively to the large lightbox version
- configurable image order: normal, reversed, or random
- optional number badges derived from image filenames such as
  `photo-0042-view.jpg`
- multiple galleries as isolated collections with stable IDs
- gallery cards with a cover, image count, description, and modification date
- card sorting by title, image count, or update date
- `Recently Updated` links and configurable highlighting of current galleries
- category cards and virtual category grids spanning multiple leaf bundles
- previous/next navigation within the same collection and role
- role-based filters for different gallery groups
- strict build validation instead of silent path or title fallbacks
- configurable CSS custom properties and overridable Hugo partials
- runnable ExampleSite plus build, DOM, browser, and visual tests

## More than Pig.js

[Pig.js](https://github.com/schlosser/pig.js) calculates a responsive,
row-based image layout and virtualizes the visible DOM area. These two
capabilities remain at the core of the grid. However, Pig.js itself has no
knowledge of Hugo Page Resources, image processing, collections, categories,
metadata, or a lightbox.

Hugo Grid Gallery therefore extends Pig.js with a Hugo-specific pipeline:

1. Hugo collects the images from a leaf bundle or from multiple galleries in
  a category.
2. The image pipeline generates small preview and grid variants as well as a
  size-limited lightbox version.
3. Optionally, only the lightbox version is watermarked; grid thumbnails remain
  unchanged.
4. A signed JSON asset passes dimensions and URLs to the browser and is
  regenerated when the image set changes.
5. The extended Pig.js version connects the virtualized grid to fsLightbox.
  Hidden sources keep all images available in the lightbox, even when Pig.js
  currently retains only a subset in the DOM.
6. The module adds cards, sorting, categories, navigation, Recently Updated
  indicators, and the strict collection contract.

Pig.js is therefore the layout engine, not the module's public API. Content and
themes interact exclusively through Hugo shortcodes, front matter, metadata,
and CSS variables.

## Requirements

- Hugo Extended 0.156.0 or newer
- Node.js 20 or newer for development and testing

Hugo 0.156.0 is the minimum version because the module uses the `hugo.Data`
API introduced in that release. CI verifies this lower bound as well as the
latest Hugo version.

## Installation

After release, consumers can include a version as follows:

```bash
hugo mod get github.com/cnichte/hugo-grid-gallery@v2.0.0
```

```toml
[module]
  [[module.imports]]
    path = "github.com/cnichte/hugo-grid-gallery"
```

For local development, the same import can be replaced without changing any
content:

```toml
[module]
  replacements = "github.com/cnichte/hugo-grid-gallery -> /absolute/path/to/hugo-grid-gallery"

  [[module.imports]]
    path = "github.com/cnichte/hugo-grid-gallery"
```

Node.js is not required to run the module in a consumer. It is used only for
development and this repository's test suite.

## Running the integrated example

After cloning, start the ExampleSite from the repository root:

```bash
npm run dev
```

It is then available at <http://localhost:1313/> by default. Pass a different
port through to Hugo as follows:

```bash
npm run dev -- --port 50831
```

The output must contain a complete URL, for example:

```text
Web Server is available at http://localhost:50831/
```

Running `hugo server` directly in the module root does not start the integrated
site. The corresponding Hugo command is:

```bash
hugo server --source exampleSite --themesDir ../.. --disableFastRender --noHTTPCache
```

The ExampleSite demonstrates standalone and nested collections, identically
named IDs in separate collections, role filters, categories, cards, statistics,
sorting, Recently Updated, and the lightbox.

## Minimal example

A collection starts with a branch bundle file:

```yaml
# content/galleries/_index.md
---
title: Galleries
type: hugo-grid-gallery-index
params:
  hugg:
    collection: photos
    metaKey: galleries
    metaCategoriesKey: gallery_categories
    taxonomyBase: gallery-categories
---
```

Each gallery is a leaf bundle. Images are stored directly next to its
`index.md`:

```text
content/
└── galleries/
    ├── _index.md
    └── city-at-night/
        ├── index.md
        ├── city-0001.jpg
        └── city-0002.jpg
```

```yaml
# content/galleries/city-at-night/index.md
---
title: City at Night
type: hugo-grid-gallery
lastmod: 2026-09-28
params:
  hugg:
    id: city-at-night
    role: standalone
    categories:
      - Night
      - Architecture
---

{{</* gallery-grid */>}}
```

This is enough for Hugo to render the responsive grid with a lightbox. For
collection cards, also add a record under
`data/hugo_grid_gallery/galleries.json`:

```json
[
  {
    "id": "city-at-night",
    "title": "City at Night",
    "subtitle": "A walk after dark",
    "description": "Architecture and light in the city.",
    "cover": "0002"
  }
]
```

## Tests

```bash
npm install
npx playwright install chromium
npm run test:all
```

`npm test` verifies the Hugo builds and DOM contracts. `npm run test:browser`
starts the ExampleSite in isolation on port 4174 and verifies sorting, the
lightbox, responsive breakpoints, and the visual references for desktop/mobile
and light/dark modes.

## Lightbox

The module includes the free, MIT-licensed Basic version of fsLightbox as
`assets/ext/fslightbox/fslightbox.js`. Its version is pinned exactly in
`package.json`; after an update, refresh the public asset with
`npm run vendor:fslightbox`.

Hugo gives assets from the main project precedence over module assets with the
same name. A consumer with its own Pro license therefore places its private
file at the same path:

```text
assets/ext/fslightbox/fslightbox.js
```

This makes the Pro version replace the public Basic fallback only in the
consumer. The Pro file and its associated license data must not be added to
this module repository. The additional
`assets/ext/fslightbox/fslightbox.css` is a local design customization and is
not part of the npm package; consumers can also override it at the same path.

## Site configuration

A collection can hide the included sorting toolbar when the site shell provides
its own controls:

```yaml
params:
  hugg:
    collection: example
    showSortToolbar: false
    showPageTitle: false
```

External controls are connected to the list through `data-hugg-sort-by`.
`aria-controls` identifies the list rendered by the module:

```html
<a href="#" data-hugg-sort-by="title" aria-controls="hugg-gallery-list">Title</a>
<a href="#" data-hugg-sort-by="count" aria-controls="hugg-gallery-list">Count</a>
<a href="#" data-hugg-sort-by="updated" aria-controls="hugg-gallery-list">Updated</a>
```

Without `showSortToolbar: false`, the module renders its own sorting toolbar.
On individual galleries, `showPageTitle: false` hides the module heading when
the site shell already displays the page title elsewhere.

Recently Updated links and tag navigation are centered by default. Consumers
can adjust alignment and selection colors through CSS variables:

```css
:root {
  --hugg-updated-alignment: start;
  --hugg-tags-alignment: start;
  --hugg-tag-selected-background: LinkText;
  --hugg-tag-selected-text: Canvas;
  --hugg-count-background: rgba(0, 0, 0, .5);
  --hugg-count-text: #fff;
}
```

```toml
[params.hugo-grid-gallery]
  debug = false
  teaserWordLimit = 18

[params.hugo-grid-gallery.teaserWordLimits]
  game = 5
  story = 0

[params.hugo-grid-gallery.recentlyUpdated]
  days = 7
  limit = 3
  symbol = "⭐"
  title = "Recently Updated"
```

`debug` enables additional Hugo warnings. `teaserWordLimit` truncates
descriptions only on cards; `0` leaves them complete. `teaserWordLimits`
optionally overrides this value for each `params.hugg.role`.

`gallery-list` displays a Recently Updated block below the sorting toolbar. It
contains the galleries with the newest `lastmod` values within the same
collection and optional `role` filter. `limit` determines the number of links.

Independently, `days` determines how long a card displays the configured
`symbol` next to its image count. The calculation uses Hugo's `params.lastmod`.
For reproducible results, every gallery should maintain an explicit value in
its front matter:

```yaml
lastmod: 2026-09-27
```

- `recentlyUpdated.days` (default: `7`): star highlighting period in days.
- `recentlyUpdated.limit` (default: `3`): maximum number of links in the block.
- `recentlyUpdated.symbol` (default: `⭐`): marker in the title and on recently
  updated cards.
- `recentlyUpdated.title` (default: `Recently Updated`): block heading and
  accessible description of the star.

### Updating `lastmod` during the build

The module reads `lastmod` but does not modify content files itself. Hugo
Modules cannot execute external programs during the build. For this purpose,
the consumer integrates `hugo-update-lastmod` through `hugo-toolbox` into its
npm lifecycle:

```bash
npm install --save-dev hugo-toolbox
```

```json
{
  "targetDirs": [
    "content/galleries/*/",
    "content/stories/*/"
  ],
  "extensions": ["jpg", "jpeg", "png", "webp", "avif"],
  "maxDepth": 1,
  "frontmatterDelim": "---",
  "gitAdd": false
}
```

The file is stored as `hugo-update-lastmod.config.json` in the consumer root.
Adjust the paths to match its content structure. Then run the tool before Hugo:

```json
{
  "scripts": {
    "gallery:lastmod": "hugo-toolbox update-lastmod",
    "gallery:lastmod:dry": "hugo-toolbox update-lastmod --dry-run",
    "predev": "npm run prebuild",
    "dev": "hugo server --disableFastRender --gc",
    "prebuild": "npm run gallery:lastmod",
    "build": "hugo --minify --gc"
  }
}
```

The generated `.hugo-update-lastmod.cache.json` is part of the functional
baseline and should be version-controlled. If it is missing after a fresh
checkout, the tool treats all images as new on its first run and sets all
affected `lastmod` values to the execution time. Use
`npm run gallery:lastmod:dry` to verify detection without writing changes.

## Using the module in content

The core shortcodes work independently of the selected theme:

| Shortcode                              | Purpose                                          |
|----------------------------------------|--------------------------------------------------|
| `{{</* gallery-grid */>}}`             | Image grid for the current gallery or category   |
| `{{</* gallery-list */>}}`             | Cards for all galleries in the same collection   |
| `{{</* gallery-list role="game" */>}}` | Limit cards to one role                          |
| `{{</* gallery-categories */>}}`       | Category cards for the same collection           |
| `{{</* gallery-category-content */>}}` | Render the content of a category                 |
| `{{</* gallery-index */>}}`            | Alias for `gallery-categories`                   |

For an individual leaf bundle, `gallery-grid` is usually the only shortcode
required. The list and category shortcodes provide additional entry pages;
they never search galleries outside the current collection.

## Core concepts

- **Gallery:** A Hugo leaf bundle with images, a stable `id`, and the type
  `hugo-grid-gallery`.
- **Collection:** An isolated group of galleries. IDs need to be unique only
  within their collection.
- **Category:** A freely named assignment that can combine images from multiple
  galleries into a virtual grid.
- **Role:** An optional domain-specific classification such as `story` or
  `game`. It affects filtering and navigation but never a gallery's identity.
- **Metadata:** Descriptions and optional domain-specific fields under
  `data/hugo_grid_gallery/`. They are associated through the gallery ID.

Separating collections from galleries prevents directory names, URLs, titles,
or Hugo sections from unintentionally becoming identities. Two collections
may therefore use the same gallery ID or category name without mixing their
data.

## Data contract

### Collection-Root

Each collection requires a globally unique `collection`. The data keys,
`cardPage`, and `config` are optional and are inherited by all galleries in
the collection.

```toml
[params.hugg]
  collection = "example"
  metaKey = "galleries"
  metaCategoriesKey = "gallery_categories"
  taxonomyBase = "gallery_categories"
  cardPage = "/example/cards/"

[params.hugg.config]
  maxImageSize = 1800
  spaceBetweenImages = 12
```

### Gallery

A gallery is a leaf bundle with `type = "hugo-grid-gallery"`. `id` and
`categories` are required fields; even a gallery without categories uses an
empty list. Valid roles are `game`, `story`, `standalone`, or an empty value.

```toml
type = "hugo-grid-gallery"

[params.hugg]
  id = "example-gallery"
  role = "standalone"
  categories = ["Architecture", "Night"]

[params.hugg.config]
  maxImageSize = 2560
  shuffle = true
```

The stable identity is `<collection>/<id>`. Title, URL, path, and section are
not identity fields.

### Parameter reference

Collection parameters are resolved on the current page or the nearest ancestor
with `params.hugg.collection`:

- `collection` (required): globally unique collection ID using lowercase
  letters, digits, and hyphens.
- `metaKey`: filename without extension for gallery metadata under
  `data/hugo_grid_gallery/`.
- `metaCategoriesKey`: filename without extension for category metadata.
- `taxonomyBase`: URL segment for categories; defaults to
  `gallery_categories`.
- `cardPage`: URL of a card page for bidirectional links.
- `config`: configuration values for all galleries in the collection.

Gallery parameters are defined directly in the leaf bundle:

- `id` (required): ID unique within the collection, using lowercase letters,
  digits, and hyphens.
- `categories` (required): list of categories; explicitly use `[]` when there
  are no categories.
- `role`: `game`, `story`, `standalone`, or empty.
- `config`: configuration values for this gallery only.

Invalid or missing required fields cause the Hugo build to fail. There are no
path, title, or section fallbacks.

### Metadata

The JSON files named by `metaKey` and `metaCategoriesKey` are stored under
`data/hugo_grid_gallery/`. Gallery metadata is associated exclusively through
`id`; category metadata through `name`. A collection record contains all
gallery roles. `id`, `title`, `subtitle`, and `description` form the shared
gallery contract; role-specific fields are optional extensions.

```json
[
  {
    "id": "example-gallery",
    "title": "Example Gallery",
    "subtitle": "Optional subtitle",
    "description": "Optional description",
    "cover": "image-name-or-number",
    "cover_crop": "mitte"
  }
]
```

### Gallery configuration

The module provides neutral defaults in `data/hugo_grid_gallery/config.json`.
A consumer can replace this file and additionally override individual values
in collection or gallery front matter.

```json
{
  "shuffle": false,
  "reverse": false,
  "spaceBetweenImages": 10,
  "maxImageSize": 1920,
  "watermark": {
    "image": "watermarks/example.png",
    "posx": "right",
    "posy": "bottom"
  }
}
```

The precedence is unambiguous:

```text
Gallery > Collection > data/hugo_grid_gallery/config.json
```

| Parameter            | Type                | Default       | Description                                                |
|----------------------|---------------------|---------------|------------------------------------------------------------|
| `shuffle`            | Boolean             | `false`       | Shuffles images during initialization                      |
| `reverse`            | Boolean             | `false`       | Reverses the order when `shuffle` is not active            |
| `spaceBetweenImages` | Number              | `10`          | Spacing between images in pixels                           |
| `maxImageSize`       | Number              | `1920`        | Maximum length of the longer side of the lightbox image    |
| `watermark`          | Object or `false`   | not set       | Optional watermark for the large lightbox version          |
| `watermark.image`    | String              | required      | Path to a Hugo asset                                       |
| `watermark.posx`     | String              | `right`       | `left`, `center`, or `right`                               |
| `watermark.posy`     | String              | `bottom`      | `top`, `center`, or `bottom`                               |

Nested objects are merged. A gallery can completely disable an inherited
watermark with `watermark = false`. Configuration is emitted per grid, allowing
multiple grids on the same page to use different settings.

Category and taxonomy grids aggregate multiple galleries and therefore use the
configuration of their page or collection. Overrides from individual source
galleries are not mixed into an aggregated grid.

### Extension points

The gallery remains theme-independent because Hugo gives files from the main
project precedence over same-named files from modules. Consumers can therefore
provide their own data, shortcodes, partials, assets, and CSS without forking
the core.

Card teasers are currently resolved in this order:

1. the `teaserPartial` set in front matter,
2. `gallery-grid/teaser-games.html` for the `game` role,
3. `gallery-grid/teaser-type-<type>.html`,
4. `gallery-grid/teaser-hook.html`.

The ExampleSite contains runnable examples for standalone, nested, and
same-named collections as well as roles, categories, cards, and statistics.

For example, a gallery with `role = "game"` can extend this base record with
`developer`, `publisher`, `items`, and `review`. Game-specific cards and
statistics filter the shared data set by the roles of the associated gallery
pages.

`cover` selects the card image by exact filename, a contained filename
fragment, or the first number in the filename. `cover_crop` supports `smart`,
`top`/`oben`, `center`/`mitte`, and `bottom`/`unten`. Without `cover`, the
existing selection behavior remains unchanged: first an image with `cover` in
its filename, otherwise the first gallery image. For the card view, a
`cover_crop` value in the metadata record takes precedence over the same page
front matter parameter.

```json
[
  {
    "name": "Architecture",
    "description": "Optional category description",
    "cover": "image-name-fragment",
    "cover_crop": "mitte"
  }
]
```

### Roles and optional add-ons

`story` is a standard role and requires no special extension. The current V2
contract also accepts `game`, `standalone`, or an empty value. Games can use
additional metadata such as `developer`, `publisher`, `items`, and `review`.

In the long term, domain-specific features do not belong in the neutral gallery
engine. The intended module boundary is therefore:

```text
hugo-grid-gallery          neutral grid, collections, and role hooks
hugo-grid-gallery-game     optional game metadata, partials, and shortcodes
Consumer                   custom roles, data, partials, shortcodes, and CSS
```

A role add-on can use Hugo module mounts to provide its own files under
`layouts/`, `assets/`, and `data/`. Until the separate game module is released,
the existing game helpers remain in the V2 core for compatibility.

### Flipbooks and DearFlip

PDF flipbooks are not a feature of an image grid and are therefore not part of
the core. A DearFlip integration should be provided as a separate optional Hugo
module. Consumers with a Pro license can use the same asset paths there to
override the free variant locally.

The npm package `@dearhive/dearflip-jquery-flipbook` is licensed under
`CC BY-NC-ND 4.0` and permits personal, non-commercial use only. It must
therefore not be treated silently as a generally usable core default. A
separate integration module must clearly document this restriction and the
required attribution. Private Pro files and license data remain exclusively in
the consumer repository.

## Releasing

Hugo Grid Gallery is distributed as a Hugo Module through semantic Git tags;
it is not published to npm. The npm package is marked as private and only
provides development, test, vendoring, and release commands.

Before a release, update `CHANGELOG.md`, commit all intended changes, and make
sure the `main` branch is clean and up to date. Then choose the semantic version
increment:

```bash
npm run release:patch
npm run release:minor
npm run release:major
```

Each command runs the complete test suite, updates `package.json` and
`package-lock.json` with `npm version`, creates the corresponding `v*` Git tag,
and pushes the release commit together with its annotated tag. There is no npm
publish step.

Version `2.0.0` is the first tagged V2 release. Because the package already had
that version before release automation was introduced, its initial tag is
created directly instead of incrementing to `2.0.1`.

## Links

- Homepage: [carsten-nichte.de](https://carsten-nichte.de/publications/applications/hugo-grid-gallery/)
