# Hugo Grid Gallery

Hugo Grid Gallery ist ein theme-unabhängiges Hugo-Modul für große, responsive
Bildersammlungen. Bilder bleiben als Page Resources in Hugo; das Modul erzeugt
daraus ein performantes Justified Grid, eine Lightbox und optional vollständige
Collection-, Karten- und Kategorieansichten.

Das Modul richtet sich an Sites, die mehr als ein statisches Bilderraster
benötigen: viele Bilder, mehrere zusammengehörige Galleries, automatisch
erzeugte Vorschaubilder, stabile Metadaten, Sortierung und Navigation, ohne
diese Logik an ein bestimmtes Hugo-Theme zu koppeln.

## Features

- responsives Justified Grid auf Basis einer erweiterten Pig.js-Version
- DOM-Virtualisierung für große Galleries: Bilder außerhalb des relevanten
  Scrollbereichs werden wieder entfernt
- progressive Bildanzeige mit einem kleinen 20-Pixel-Preview vor dem
  eigentlichen Grid-Bild
- automatische Hugo-Bildvarianten mit 20, 100, 250 und 500 Pixel Breite
- separat begrenzte große Bildversion für die Lightbox
- fsLightbox Basic als mitgelieferter Standard und Consumer-Override für Pro
- vollständige Lightbox-Navigation trotz DOM-Virtualisierung durch Pig.js
- optionales Wasserzeichen ausschließlich auf der großen Lightbox-Version
- konfigurierbare Bildreihenfolge: normal, umgekehrt oder zufällig
- optionale Nummern-Badges aus Bilddateinamen wie `photo-0042-view.jpg`
- mehrere Galleries als isolierte Collections mit stabilen IDs
- Gallery-Karten mit Cover, Bildanzahl, Beschreibung und Änderungsdatum
- Sortierung der Karten nach Titel, Bildanzahl oder Aktualisierung
- `Recently Updated`-Links und konfigurierbare Markierung aktueller Galleries
- Kategorie-Karten und virtuelle Kategorie-Grids über mehrere Leaf Bundles
- Vorher-/Nächste-Navigation innerhalb derselben Collection und Rolle
- rollenbasierte Filter für unterschiedliche Gallery-Gruppen
- strikte Build-Validierung statt stiller Pfad- oder Titel-Fallbacks
- konfigurierbare CSS Custom Properties und überschreibbare Hugo-Partials
- ausführbare ExampleSite sowie Build-, DOM-, Browser- und Visual-Tests

## Mehr als Pig.js

[Pig.js](https://github.com/schlosser/pig.js) berechnet ein responsives,
zeilenbasiertes Bilderlayout und virtualisiert den sichtbaren DOM-Bereich.
Diese beiden Eigenschaften bleiben der Kern des Grids. Pig.js allein kennt
jedoch weder Hugo Page Resources noch Bildverarbeitung, Collections,
Kategorien, Metadaten oder eine Lightbox.

Hugo Grid Gallery ergänzt Pig.js deshalb um eine Hugo-spezifische Pipeline:

1. Hugo sammelt die Bilder eines Leaf Bundles oder mehrerer Galleries einer
  Kategorie.
2. Die Image Pipeline erzeugt kleine Preview- und Grid-Varianten sowie eine
  größenbegrenzte Lightbox-Version.
3. Optional wird nur die Lightbox-Version mit einem Wasserzeichen versehen;
  Grid-Thumbnails bleiben unverändert.
4. Ein signiertes JSON-Asset übergibt Abmessungen und URLs an den Browser und
  wird bei einer veränderten Bildmenge neu erzeugt.
5. Die erweiterte Pig.js-Version verbindet das virtualisierte Grid mit
  fsLightbox. Versteckte Quellen halten alle Bilder in der Lightbox verfügbar,
  auch wenn Pig.js gerade nur einen Ausschnitt im DOM hält.
6. Das Modul ergänzt Karten, Sortierung, Kategorien, Navigation,
  Recently-Updated-Anzeigen und den strikten Collection-Vertrag.

Pig.js ist damit die Layout-Engine, nicht die öffentliche API des Moduls.
Content und Themes arbeiten ausschließlich mit Hugo-Shortcodes, Frontmatter,
Metadaten und CSS-Variablen.

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

Node.js wird nicht für den Betrieb im Consumer benötigt. Es wird nur für die
Entwicklung und die Test-Suite dieses Repositorys verwendet.

## Integriertes Beispiel starten

Nach dem Klonen wird die ExampleSite aus dem Repository-Root gestartet:

```bash
npm run dev
```

Danach ist sie standardmäßig unter <http://localhost:1313/> erreichbar. Einen
anderen Port reicht man an Hugo weiter:

```bash
npm run dev -- --port 50831
```

Die Ausgabe muss eine vollständige URL enthalten, zum Beispiel:

```text
Web Server is available at http://localhost:50831/
```

Ein direktes `hugo server` im Modul-Root startet nicht die integrierte Site.
Der entsprechende Hugo-Befehl lautet:

```bash
hugo server --source exampleSite --themesDir ../.. --disableFastRender --noHTTPCache
```

Die ExampleSite demonstriert eigenständige und verschachtelte Collections,
gleichnamige IDs in getrennten Collections, Rollenfilter, Kategorien, Karten,
Statistiken, Sortierung, Recently Updated und die Lightbox.

## Minimalbeispiel

Eine Collection beginnt mit einer Branch-Bundle-Datei:

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

Jede Gallery ist ein Leaf Bundle. Bilder liegen direkt neben dessen
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

Damit rendert Hugo bereits das responsive Grid mit Lightbox. Für
Collection-Karten legt man zusätzlich einen Datensatz unter
`data/hugo_grid_gallery/galleries.json` an:

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

Eine Collection kann die mitgelieferte Sortierleiste ausblenden, wenn die
Sitehülle eigene Controls bereitstellt:

```yaml
params:
  hugg:
    collection: example
    showSortToolbar: false
    showPageTitle: false
```

Externe Controls werden über `data-hugg-sort-by` an die Liste gebunden.
`aria-controls` benennt dabei die vom Modul gerenderte Liste:

```html
<a href="#" data-hugg-sort-by="title" aria-controls="hugg-gallery-list">Title</a>
<a href="#" data-hugg-sort-by="count" aria-controls="hugg-gallery-list">Count</a>
<a href="#" data-hugg-sort-by="updated" aria-controls="hugg-gallery-list">Updated</a>
```

Ohne `showSortToolbar: false` rendert das Modul seine eigene Sortierleiste.
`showPageTitle: false` blendet auf Einzelgalerien die Modulüberschrift aus,
wenn die Sitehülle den Seitentitel bereits an anderer Stelle darstellt.

Recently-Updated-Links und Tag-Navigation sind standardmäßig zentriert. Ein
Consumer kann Ausrichtung und Auswahlfarben über CSS-Variablen anpassen:

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

`debug` aktiviert zusätzliche Hugo-Warnungen. `teaserWordLimit` kürzt
Beschreibungen ausschließlich in Karten; `0` lässt sie vollständig.
`teaserWordLimits` überschreibt diesen Wert optional pro `params.hugg.role`.

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

| Parameter                | Standard           | Bedeutung                                                |
|--------------------------|--------------------|----------------------------------------------------------|
| `recentlyUpdated.days`   | `7`                | Zeitraum der Sternmarkierung in Tagen                    |
| `recentlyUpdated.limit`  | `3`                | Maximale Zahl der Links im Block                         |
| `recentlyUpdated.symbol` | `⭐`                | Markierung im Titel und auf aktuellen Karten             |
| `recentlyUpdated.title`  | `Recently Updated` | Überschrift des Blocks und zugängliche Sternbeschreibung |

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

Die Kern-Shortcodes funktionieren unabhängig vom verwendeten Theme:

| Shortcode                              | Zweck                                            |
|----------------------------------------|--------------------------------------------------|
| `{{</* gallery-grid */>}}`             | Bilder-Grid der aktuellen Gallery oder Kategorie |
| `{{</* gallery-list */>}}`             | Karten aller Galleries derselben Collection      |
| `{{</* gallery-list role="game" */>}}` | Karten auf eine Rolle begrenzen                  |
| `{{</* gallery-categories */>}}`       | Kategorie-Karten derselben Collection            |
| `{{</* gallery-category-content */>}}` | Inhalt einer Kategorie rendern                   |
| `{{</* gallery-index */>}}`            | Alias für `gallery-categories`                   |

`gallery-grid` ist für ein einzelnes Leaf Bundle meist der einzige benötigte
Shortcode. Die Listen- und Kategorie-Shortcodes bilden zusätzliche
Einstiegsseiten; sie durchsuchen nie Galleries außerhalb der aktuellen
Collection.

## Grundbegriffe

- **Gallery:** Ein Hugo Leaf Bundle mit Bildern, einer stabilen `id` und dem
  Typ `hugo-grid-gallery`.
- **Collection:** Eine isolierte Gruppe von Galleries. IDs müssen nur innerhalb
  ihrer Collection eindeutig sein.
- **Kategorie:** Eine frei benannte Zuordnung, die Bilder mehrerer Galleries zu
  einem virtuellen Grid zusammenführen kann.
- **Rolle:** Eine optionale fachliche Klassifikation wie `story` oder `game`.
  Sie beeinflusst Filter und Navigation, aber niemals die Identität einer
  Gallery.
- **Metadaten:** Beschreibungen und optionale fachliche Felder unter
  `data/hugo_grid_gallery/`. Sie werden über die Gallery-ID zugeordnet.

Die Trennung zwischen Collection und Gallery verhindert, dass Verzeichnisname,
URL, Titel oder Hugo-Section unbeabsichtigt zur Identität werden. Zwei
Collections dürfen deshalb dieselbe Gallery-ID oder denselben Kategorienamen
verwenden, ohne Daten miteinander zu vermischen.

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

| Parameter           | Pflicht | Bedeutung                                                                      |
|---------------------|---------|--------------------------------------------------------------------------------|
| `collection`        | ja      | Global eindeutige Collection-ID aus Kleinbuchstaben, Ziffern und Bindestrichen |
| `metaKey`           | nein    | Dateiname ohne Endung für Gallery-Metadaten unter `data/hugo_grid_gallery/`    |
| `metaCategoriesKey` | nein    | Dateiname ohne Endung für Kategorie-Metadaten                                  |
| `taxonomyBase`      | nein    | URL-Segment der Kategorien; Standard `gallery_categories`                      |
| `cardPage`          | nein    | URL einer Card-Seite für bidirektionale Links                                  |
| `config`            | nein    | Konfigurationswerte für alle Galleries der Collection                          |

Gallery-Parameter stehen direkt im Leaf Bundle:

| Parameter    | Pflicht | Bedeutung                                                                             |
|--------------|---------|---------------------------------------------------------------------------------------|
| `id`         | ja      | Innerhalb der Collection eindeutige ID aus Kleinbuchstaben, Ziffern und Bindestrichen |
| `categories` | ja      | Liste von Kategorien; ohne Kategorien ausdrücklich `[]`                               |
| `role`       | nein    | `game`, `story`, `standalone` oder leer                                               |
| `config`     | nein    | Konfigurationswerte nur für diese Gallery                                             |

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

| Parameter            | Typ                 | Standard      | Bedeutung                                                  |
|----------------------|---------------------|---------------|------------------------------------------------------------|
| `shuffle`            | Boolean             | `false`       | Mischt die Bilder beim Initialisieren                      |
| `reverse`            | Boolean             | `false`       | Kehrt die Reihenfolge um, sofern `shuffle` nicht aktiv ist |
| `spaceBetweenImages` | Zahl                | `10`          | Abstand zwischen Bildern in Pixeln                         |
| `maxImageSize`       | Zahl                | `1920`        | Maximale Länge der größeren Seite des Lightbox-Bildes      |
| `watermark`          | Objekt oder `false` | nicht gesetzt | Optionales Wasserzeichen für die große Lightbox-Version    |
| `watermark.image`    | String              | erforderlich  | Pfad eines Hugo-Assets                                     |
| `watermark.posx`     | String              | `right`       | `left`, `center` oder `right`                              |
| `watermark.posy`     | String              | `bottom`      | `top`, `center` oder `bottom`                              |

Verschachtelte Objekte werden zusammengeführt. Eine Gallery kann ein geerbtes
Wasserzeichen mit `watermark = false` vollständig deaktivieren. Die
Konfiguration wird pro Grid ausgegeben, sodass mehrere Grids auf derselben
Seite unterschiedliche Einstellungen verwenden können.

Kategorie- und Taxonomie-Grids aggregieren mehrere Galleries und verwenden
deshalb die Konfiguration ihrer Seite beziehungsweise Collection. Overrides
einzelner Quell-Galleries werden in einem aggregierten Grid nicht vermischt.

### Erweiterungspunkte

Die Galerie bleibt theme-unabhängig, weil Hugo dem Hauptprojekt Vorrang vor
gleichnamigen Dateien aus Modulen gibt. Ein Consumer kann deshalb eigene Daten,
Shortcodes, Partials, Assets und CSS bereitstellen, ohne den Core zu forken.

Kartenteaser werden aktuell in dieser Reihenfolge aufgelöst:

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

### Rollen und optionale Add-ons

`story` ist eine reine Standardrolle und benötigt keine besondere Erweiterung.
Der aktuelle V2-Vertrag akzeptiert außerdem `game`, `standalone` oder einen
leeren Wert. Games können zusätzliche Metadaten wie `developer`, `publisher`,
`items` und `review` verwenden.

Fachliche Funktionen gehören langfristig nicht in die neutrale Gallery-Engine.
Die vorgesehene Modulgrenze ist daher:

```text
hugo-grid-gallery          neutrales Grid, Collections und Rollen-Hooks
hugo-grid-gallery-game     optionale Game-Metadaten, Partials und Shortcodes
Consumer                   eigene Rollen, Daten, Partials, Shortcodes und CSS
```

Ein Rollen-Add-on kann mit Hugos Modul-Mounts eigene Dateien unter `layouts/`,
`assets/` und `data/` liefern. Bis das separate Game-Modul veröffentlicht ist,
bleiben die vorhandenen Game-Helfer aus Kompatibilitätsgründen im V2-Core.

### Flipbooks und DearFlip

PDF-Flipbooks sind keine Funktion eines Bilder-Grids und deshalb nicht Teil
des Core. Eine DearFlip-Integration soll als separates optionales Hugo-Modul
bereitgestellt werden. Ein Consumer mit Pro-Lizenz kann dort dieselben
Assetpfade verwenden und damit die freie Variante lokal überschreiben.

Das npm-Paket `@dearhive/dearflip-jquery-flipbook` steht unter
`CC BY-NC-ND 4.0` und erlaubt nur persönliche, nichtkommerzielle Nutzung. Es
darf daher nicht still als allgemein verwendbarer Core-Default behandelt
werden. Ein separates Integrationsmodul muss diese Einschränkung und die
erforderliche Attribution deutlich dokumentieren. Private Pro-Dateien und
Lizenzdaten verbleiben ausschließlich im Consumer-Repository.
