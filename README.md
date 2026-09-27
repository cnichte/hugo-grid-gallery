# Hugo Grid Gallery

Ein theme-unabhängiges Hugo-Modul für responsive Bilder-Grids, Gallery- und
Kategorie-Karten, Collection-Navigation und fsLightbox.

## Voraussetzungen

- Hugo Extended 0.156.0 oder neuer
- Node.js 20 oder neuer für Entwicklung und Tests

Hugo 0.156.0 ist die Mindestversion, weil das Modul die dort eingeführte
`hugo.Data`-API verwendet. Die CI prüft diese Untergrenze und die jeweils
aktuelle Hugo-Version.

## Installation

Nach der Veröffentlichung wird eine Version im Consumer eingebunden:

```bash
hugo mod get github.com/cnichte/hugo-grid-gallery@v2.0.0
```

```toml
[module]
  [[module.imports]]
    path = "github.com/cnichte/hugo-grid-gallery"
```

Für lokale Entwicklung kann derselbe Import ohne Content-Änderungen ersetzt
werden:

```toml
[module]
  replacements = "github.com/cnichte/hugo-grid-gallery -> /absolute/path/to/hugo-grid-gallery"

  [[module.imports]]
    path = "github.com/cnichte/hugo-grid-gallery"
```

## Smoke test

```bash
hugo server --disableFastRender --noHTTPCache
```

## Tests

```bash
npm install
npx playwright install chromium
npm run test:all
```

`npm test` prüft die Hugo-Builds und DOM-Verträge. `npm run test:browser`
startet die ExampleSite isoliert auf Port 4174 und prüft Sortierung, Lightbox,
responsive Breakpoints sowie die visuellen Referenzen für Desktop/Mobil und
Hell/Dunkel.

## Lightbox

Das Modul liefert die kostenlose MIT-lizenzierte Basic-Version von fsLightbox
als `assets/ext/fslightbox/fslightbox.js` mit. Ihre Version ist in
`package.json` exakt festgeschrieben; nach einem Update wird das öffentliche
Asset mit `npm run vendor:fslightbox` erneuert.

Hugo bevorzugt Assets des Hauptprojekts vor gleichnamigen Modul-Assets. Ein
Consumer mit eigener Pro-Lizenz legt seine private Datei daher unter demselben
Pfad ab:

```text
assets/ext/fslightbox/fslightbox.js
```

Damit ersetzt die Pro-Version ausschließlich im Consumer das öffentliche
Basic-Fallback. Die Pro-Datei und zugehörige Lizenzdaten dürfen nicht in dieses
Modul-Repository übernommen werden. Der zusätzliche
`assets/ext/fslightbox/fslightbox.css` ist eine lokale Designanpassung und kein
Bestandteil des npm-Pakets; auch er kann im Consumer über denselben Pfad
überschrieben werden.

## Site-Konfiguration

```toml
[params.hugo-grid-gallery]
  debug = false
  teaserWordLimit = 18

[params.hugo-grid-gallery.recentlyUpdated]
  days = 7
  limit = 3
  symbol = "⭐"
  title = "Recently Updated"
```

`debug` aktiviert zusätzliche Hugo-Warnungen. `teaserWordLimit` kürzt
Beschreibungen ausschließlich in Karten; `0` lässt sie vollständig.

`gallery-list` zeigt unter der Sortierleiste einen Recently-Updated-Block. Er
enthält die nach `lastmod` neuesten Galleries innerhalb derselben Collection
und des optionalen `role`-Filters. `limit` bestimmt die Anzahl dieser Links.

`days` bestimmt unabhängig davon, wie lange eine Karte das konfigurierte
`symbol` an ihrer Bildanzahl trägt. Die Auswertung verwendet Hugos
`params.lastmod`. Für reproduzierbare Ergebnisse sollte jede Gallery einen
expliziten Wert im Frontmatter pflegen:

```yaml
lastmod: 2026-09-27
```

| Parameter | Standard | Bedeutung |
| --- | --- | --- |
| `recentlyUpdated.days` | `7` | Zeitraum der Sternmarkierung in Tagen |
| `recentlyUpdated.limit` | `3` | Maximale Zahl der Links im Block |
| `recentlyUpdated.symbol` | `⭐` | Markierung im Titel und auf aktuellen Karten |
| `recentlyUpdated.title` | `Recently Updated` | Überschrift des Blocks und zugängliche Sternbeschreibung |

### `lastmod` im Build aktualisieren

Das Modul liest `lastmod`, verändert Content-Dateien aber nicht selbst. Hugo
Modules können während des Builds keine externen Programme ausführen. Der
Consumer bindet dafür `hugo-update-lastmod` über die `hugo-toolbox` in seinen
npm-Lifecycle ein:

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

Die Datei liegt als `hugo-update-lastmod.config.json` im Consumer-Root. Die
Pfade werden an dessen Content-Struktur angepasst. Danach wird das Tool vor
Hugo ausgeführt:

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

Die erzeugte `.hugo-update-lastmod.cache.json` gehört zur fachlichen Baseline
und sollte versioniert werden. Fehlt sie bei einem frischen Checkout, bewertet
das Tool beim ersten Lauf sämtliche Bilder als neu und setzt alle betroffenen
`lastmod`-Werte auf den Ausführungszeitpunkt. Mit
`npm run gallery:lastmod:dry` lässt sich die Erkennung ohne Schreibzugriff
prüfen.

## Verwenden im Content

Die Kern-Shortcodes können unabhängig vom verwendeten Theme eingesetzt werden:

- Bilder-Grid der aktuellen Gallery: `{{< gallery-grid >}}`
- Gallery-Karten: `{{< gallery-list >}}`
- Rollenfilter: `{{< gallery-list role="game" >}}`
- Collection-basierte Kategorie-Karten: `{{< gallery-categories >}}`
- Kategorieinhalt: `{{< gallery-category-content >}}`
- Alias für Kategorie-Karten: `{{< gallery-index >}}`

## Datenvertrag

### Collection-Root

Jede Collection benötigt eine global eindeutige `collection`. Die Data-Keys,
`cardPage` und `config` sind optional und werden von allen enthaltenen Galerien
geerbt.

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

[params.hugg.config]
  maxImageSize = 2560
  shuffle = true
```

Die stabile Identität lautet `<collection>/<id>`. Titel, URL, Pfad und Section
sind keine Identitätsfelder.

### Parameterreferenz

Collection-Parameter werden auf der aktuellen Seite oder dem nächsten Vorfahren
mit `params.hugg.collection` aufgelöst:

| Parameter | Pflicht | Bedeutung |
| --- | --- | --- |
| `collection` | ja | Global eindeutige Collection-ID aus Kleinbuchstaben, Ziffern und Bindestrichen |
| `metaKey` | nein | Dateiname ohne Endung für Gallery-Metadaten unter `data/hugo_grid_gallery/` |
| `metaCategoriesKey` | nein | Dateiname ohne Endung für Kategorie-Metadaten |
| `taxonomyBase` | nein | URL-Segment der Kategorien; Standard `gallery_categories` |
| `cardPage` | nein | URL einer Card-Seite für bidirektionale Links |
| `config` | nein | Konfigurationswerte für alle Galleries der Collection |

Gallery-Parameter stehen direkt im Leaf Bundle:

| Parameter | Pflicht | Bedeutung |
| --- | --- | --- |
| `id` | ja | Innerhalb der Collection eindeutige ID aus Kleinbuchstaben, Ziffern und Bindestrichen |
| `categories` | ja | Liste von Kategorien; ohne Kategorien ausdrücklich `[]` |
| `role` | nein | `game`, `story`, `standalone` oder leer |
| `config` | nein | Konfigurationswerte nur für diese Gallery |

Ungültige oder fehlende Pflichtfelder brechen den Hugo-Build ab. Es gibt keine
Pfad-, Titel- oder Section-Fallbacks.

### Metadaten

Die in `metaKey` und `metaCategoriesKey` genannten JSON-Dateien liegen unter
`data/hugo_grid_gallery/`. Gallery-Metadaten werden ausschließlich über `id`
zugeordnet; Kategorie-Metadaten über `name`. Ein Collection-Datensatz enthält
alle Gallery-Rollen. `id`, `title`, `subtitle` und `description` bilden den
gemeinsamen Gallery-Vertrag; rollenbezogene Felder sind optionale Erweiterungen.

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

### Gallery-Konfiguration

Das Modul liefert neutrale Defaults in `data/hugo_grid_gallery/config.json`.
Ein Consumer kann diese Datei ersetzen und einzelne Werte zusätzlich im
Collection- oder Gallery-Frontmatter überschreiben.

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

Die Priorität ist eindeutig:

```text
Gallery > Collection > data/hugo_grid_gallery/config.json
```

| Parameter | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `shuffle` | Boolean | `false` | Mischt die Bilder beim Initialisieren |
| `reverse` | Boolean | `false` | Kehrt die Reihenfolge um, sofern `shuffle` nicht aktiv ist |
| `spaceBetweenImages` | Zahl | `10` | Abstand zwischen Bildern in Pixeln |
| `maxImageSize` | Zahl | `1920` | Maximale Länge der größeren Seite des Lightbox-Bildes |
| `watermark` | Objekt oder `false` | nicht gesetzt | Optionales Wasserzeichen für die große Lightbox-Version |
| `watermark.image` | String | erforderlich | Pfad eines Hugo-Assets |
| `watermark.posx` | String | `right` | `left`, `center` oder `right` |
| `watermark.posy` | String | `bottom` | `top`, `center` oder `bottom` |

Verschachtelte Objekte werden zusammengeführt. Eine Gallery kann ein geerbtes
Wasserzeichen mit `watermark = false` vollständig deaktivieren. Die
Konfiguration wird pro Grid ausgegeben, sodass mehrere Grids auf derselben
Seite unterschiedliche Einstellungen verwenden können.

Kategorie- und Taxonomie-Grids aggregieren mehrere Galleries und verwenden
deshalb die Konfiguration ihrer Seite beziehungsweise Collection. Overrides
einzelner Quell-Galleries werden in einem aggregierten Grid nicht vermischt.

### Erweiterungspunkte

Kartenteaser können in dieser Reihenfolge durch Consumer-Partials erweitert
werden:

1. das im Frontmatter gesetzte `teaserPartial`,
2. `gallery-grid/teaser-games.html` für die Rolle `game`,
3. `gallery-grid/teaser-type-<type>.html`,
4. `gallery-grid/teaser-hook.html`.

Die ExampleSite enthält ausführbare Beispiele für eigenständige, verschachtelte
und gleichnamige Collections sowie Rollen, Kategorien, Cards und Statistiken.

Eine Gallery mit `role = "game"` kann diesen Basiseintrag beispielsweise um
`developer`, `publisher`, `items` und `review` erweitern. Gamespezifische
Cards und Statistiken filtern den gemeinsamen Datensatz über die Rollen der
zugehörigen Gallery-Seiten.

`cover` wählt das Kartenbild über exakten Dateinamen, enthaltenen
Dateinamensbestandteil oder die erste Zahl im Dateinamen. `cover_crop`
unterstützt `smart`, `top`/`oben`, `center`/`mitte` und `bottom`/`unten`.
Ohne `cover` bleibt die bisherige Auswahl erhalten: zuerst ein Bild mit
`cover` im Dateinamen, andernfalls das erste Gallery-Bild. Ein
`cover_crop` im Metadatensatz hat für die Kartenansicht Vorrang vor dem
gleichnamigen Page-Frontmatter.

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
