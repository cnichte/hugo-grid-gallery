
# HUGG - Die Grid Gallery aus binary-voids.de als Hugo Modul

## git

remote auf github anlegen <https://github.com/cnichte/>

```bash
echo "# hugo-grid-gallery" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/cnichte/hugo-grid-gallery.git
git push -u origin main
```

```bash
tree -a -L 3 ./assets

# was kennt git
git status
git ls-files | wc -l            # wie viele Dateien sind getrackt?
git ls-files | sed -n '1,30p'   # Beispielanzeige

# „Doctor“-Block zum direkt Ausführen Führt die wichtigsten Checks nacheinander aus
echo "== Repo Status ==" && git status && \
echo "== Remote ==" && git remote -v && \
echo "== Branch/History ==" && git branch --show-current && git log --oneline --decorate -n 5 && \
echo "== Any nested .git? ==" && find . -type d -name ".git" && \
echo "== .gitmodules ==" && (cat .gitmodules || echo "(none)") && \
echo "== Ignored? (sample) ==" && git check-ignore -v -- assets js static layouts 2>/dev/null || true
```

### Versionen taggen und updaten

Im Modul-Repo:

```bash
git tag v0.1.0
git push --tags
```

In der nutzenden Webseite:

```bash
hugo mod get github.com/cnichte/hugo-grid-gallery@v0.1.0
# oder neueste:
hugo mod get -u github.com/cnichte/hugo-grid-gallery
```

## Smoke test

```bash
hugo server --disableFastRender --noHTTPCache
```

## Einbinden

```toml
# hugo.toml (Der nutzenden Webseite)

[params.hugo-grid-gallery]
    debug = false                # Logausgabe still oder geschwätzig
    sass_transpiler = "dartsass" # oder "libsass"
    isNewSince = -7              # Tage
    isNewSymbol = "⭐"           # Gallery is new or updated
    coverfoto_identifier="cover" # kann irgendwo im Dateinamen stecken

[module]
  proxy = "direct"

  [[module.imports]]
    path = "github.com/cnichte/hugo-grid-gallery"

  # OPTIONAL: Assets aus dem Modul in die Site „mounten“
  [[module.mounts]]
    source = "assets"
    target = "assets"

```

## Verwenden im Content

In Doks verwenden, ohne das Theme anzufassen über  Shortcodes im Content:

- Grid überall: `{{< gallery-grid >}}`
- Collection-basierte Kategorie-Karten: `{{< gallery-categories >}}`
- Kompatibilitätsalias: `{{< gallery-index >}}`

## Verwenden im Theme

...

## Datenvertrag

```toml
[params.hugo-grid-gallery]
  debug = false
```

### Collection-Root

Jede Collection benötigt eine global eindeutige `collection`. Die Data-Keys und
`cardPage` sind optional und werden von allen enthaltenen Galerien geerbt.

```toml
[params.hugg]
  collection = "example"
  metaKey = "galleries"
  metaCategoriesKey = "gallery_categories"
  taxonomyBase = "gallery_categories"
  cardPage = "/example/cards/"
```

### Gallery

Eine Gallery ist ein Leaf Bundle mit `type = "hugo-grid-gallery"`. `id` und
`categories` sind Pflichtfelder; auch eine Gallery ohne Kategorien verwendet
eine leere Liste. Zulässige Rollen sind `game`, `story`, `standalone` oder ein
leerer Wert.

```toml
type = "hugo-grid-gallery"

[params.hugg]
  id = "example-gallery"
  role = "standalone"
  categories = ["Architecture", "Night"]
```

Die stabile Identität lautet `<collection>/<id>`. Titel, URL, Pfad und Section
sind keine Identitätsfelder.

### Metadaten

Die in `metaKey` und `metaCategoriesKey` genannten JSON-Dateien liegen unter
`data/hugo_grid_gallery/`. Gallery-Metadaten werden ausschließlich über `id`
zugeordnet; Kategorie-Metadaten über `name`.

```json
[
  {
    "id": "example-gallery",
    "title": "Example Gallery",
    "subtitle": "Optional subtitle",
    "description": "Optional description"
  }
]
```

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
