# Example site

From the module repository root, start the standalone example with:

```sh
npm run dev
```

Open <http://localhost:1313/>. To select another port:

```sh
npm run dev -- --port 50831
```

The equivalent direct Hugo command is:

```sh
hugo server --source exampleSite --themesDir ../..
```

Build the standalone example without starting a server with:

```sh
hugo --source exampleSite --themesDir ../..
```

## Example images

The committed JPEG fixtures are deterministic geometric compositions. Rebuild
all of them from the module repository root with ImageMagick:

```sh
sh exampleSite/scripts/generate-images.sh
```

No downloaded or third-party source images are used. See
[`IMAGE-LICENSE.md`](IMAGE-LICENSE.md) for the CC0 dedication.

## Included fixtures

- `/galleries/`: one standalone Gallery plus explicit Game and Story role
  fixtures. Its Collection config sets `maxImageSize` to `1800`; the standalone
  Gallery overrides it with `1600` to exercise both inheritance levels. Stable
  `lastmod` values verify Recently Updated ordering and card markers.
- `/galleries/games/` and `/galleries/stories/`: role-filtered Gallery lists,
  including role-scoped Recently Updated links.
- `/galleries/gallery-categories/empty/`: category metadata with no matching
  Gallery or images.
- `/galleries/cards/`: Collection statistics and stable Gallery Card links.
- `/collections/alpha/` and `/collections/beta/`: two Collections below the
  same top-level Section. Both intentionally use the Gallery ID
  `shared-gallery` and category `Shared` to verify Collection isolation.
- `/collections/alpha/nested/`: a Collection nested below Alpha with its own
  data keys and another `shared-gallery` ID.

The intentionally invalid fixtures live outside the ExampleSite. Run their
expected build failures from the module repository root with:

```sh
npm test
```

Run the browser interactions and screenshot comparisons with:

```sh
npm run test:browser
```

Or run both suites with `npm run test:all`.

The negative fixtures cover a missing Gallery `type`, missing
`params.hugg.categories`, a duplicate Gallery ID within one Collection and a
Gallery without the required Card metadata entry.
