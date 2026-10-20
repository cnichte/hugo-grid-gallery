# Konzept V2: Grid Gallery Core und Plattform-Adapter

Stand: 17. Oktober 2026  
Status: Architekturvorschlag, noch nicht implementiert

## 1. Ziel und Leitgedanke

Hugo Grid Gallery soll einen eigenständigen, ohne Hugo verwendbaren Kern erhalten. Dieser Kern stellt die Galerie im Browser dar. Plattform-Adapter liefern Bilder, Metadaten und die jeweilige Integration.

**Ein gemeinsamer Core, mehrere Integrationen statt mehrerer unabhängig gepflegter Galerien.**

Angestrebte Einsatzorte:

- Hugo als weiterhin vollständig unterstützte Integration;
- andere Static-Site-Generatoren;
- einfache HTML-Seiten mit JavaScript, ohne eigenen Build-Schritt;
- Anwendungen mit dynamisch erzeugten Ansichten;
- ein späteres Obsidian-Plugin.

Die Bezeichnungen `grid-gallery-core` und die folgenden API-Namen sind Arbeitstitel. Paketnamen, Veröffentlichung und endgültige Signaturen werden vor ihrer Einführung festgelegt. Der Dateiname dieses Konzepts legt keine neue Paket-Hauptversion fest.

## 2. Ausgangslage

Die bestehende Anwendung besitzt bereits eine brauchbare Trennlinie:

1. Hugo sammelt Bilder und Metadaten.
2. Hugo erzeugt Bildvarianten und ein JSON-Asset.
3. Der Browser liest die Bilddaten und erzeugt Grid und Lightbox.

Relevante Ausgangspunkte:

| Bestandteil | Aktuelle Verantwortung | Ziel |
|---|---|---|
| [create-thumbs.html](./layouts/partials/gallery-grid/create-thumbs.html) | Bildvarianten, Größenbegrenzung, optionales Wasserzeichen, Bilddatensätze | Hugo-spezifische Bild-Pipeline |
| [list-gallery.html](./layouts/partials/gallery-grid/list-gallery.html) | Bilder sammeln, Metadaten, Grid-Container, Seitennavigation | Hugo-Adapter und Hugo-Ausgabe |
| [init-pig.js](./assets/hugo-grid-gallery/js/init-pig.js) | JSON laden, Reihenfolge, Bildnummern, Pig initialisieren | Aufteilen in Core und Integrationsschicht |
| [main.js](./assets/hugo-grid-gallery/js/main.js) | Automatischer Start bei `DOMContentLoaded` | Dünner, optionaler Auto-Initializer |
| [pig.js](./assets/ext/pig/pig.js) | Layout, Virtualisierung und direkte fsLightbox-Kopplung | Interne Layout-Engine, von Lightbox entkoppelt |
| [gallery-config.html](./layouts/partials/gallery-grid/gallery-config.html) | CSS und JavaScript über Hugo laden und bauen | Asset-Einbindung des Hugo-Adapters |
| [sort-gallery.js](./assets/hugo-grid-gallery/js/sort-gallery.js) | Sortierung vorhandener Karten | Später optionaler UI-Baustein |

Die bisherige Sichtung ist eine statische Architekturbetrachtung, keine vollständige Bestandsaufnahme oder Laufzeitvalidierung.

### 2.1 Nicht nur Dateien verschieben

Der heutige Browser-Code kennt bereits wenig Hugo, besitzt aber Kopplungen an eine klassische Webseite:

- globale Galerie-Referenzen wie `window.__pigGalleries`;
- globale Initialisierung beim Laden des Dokuments;
- eine feste fsLightbox-Gruppe `gallery`;
- einen gemeinsamen versteckten Lightbox-Quellencontainer;
- Bildzuordnung über Dateinamen;
- noch keinen vollständigen öffentlichen Lifecycle für dynamische Ansichten.

Diese Kopplungen müssen fachlich aufgelöst werden. Eine Umbenennung allein schafft keinen wiederverwendbaren Core.

## 3. Zielarchitektur

```text
Hugo          anderer SSG       Obsidian       HTML / JavaScript
  |                |               |                 |
Hugo-Adapter   SSG-Adapter    Obsidian-Adapter   direkte Nutzung
  |                |               |                 |
  +----------------+---------------+-----------------+
                           |
             gemeinsames Bilddatenmodell
                           |
                   grid-gallery-core
            Grid / Virtualisierung / Lifecycle
                           |
              optionale Lightbox-Anbindung
```

Der Core kennt weder Hugo noch Obsidian. Er erhält einen Container, Bilddaten und Darstellungsoptionen.

### 3.1 Verantwortungsgrenzen

| Ebene | Gehört hinein | Gehört nicht hinein |
|---|---|---|
| Browser-Core | Layout, Virtualisierung, Bildvariantenauswahl, progressive Anzeige, Reihenfolge, Instanzverwaltung, Ereignisse, Basis-CSS | Dateisystem, Hugo-APIs, Vault-Zugriff, Thumbnail-Erzeugung |
| Lightbox-Anbindung | Vollständige Bildliste, Öffnen am gewählten Index, Schließen, Ressourcenfreigabe | Grid-Layout, Seitentaxonomien |
| Plattform-Adapter | Bilder ermitteln, URLs auflösen, Metadaten zuordnen, Core starten und entfernen | Eigene Kopie der Layoutlogik |
| Bild-Pipeline | Abmessungen ermitteln, Varianten erzeugen, große Bilder begrenzen, Wasserzeichen anwenden | Verwaltung von Browser-Instanzen |
| Optionale Collection-/UI-Ebene | Karten, Sortierung, Kategorien, Recently Updated, Navigation | Plattformabhängige Seitenmodelle im Grid-Core |
| Website-Erweiterung | Games-Felder und andere domänenspezifische Inhalte | Verpflichtende Abhängigkeiten des allgemeinen Core |

**Ohne Hugo bedeutet nicht, dass alle Arbeit im Browser stattfinden muss.** Bilder können von einem SSG, einem CDN, einem separaten Werkzeug oder einem Obsidian-Adapter vorbereitet werden.

### 3.2 Umfang der ersten Ausbaustufe

Zuerst werden Grid, Lifecycle und optionale Lightbox herausgelöst. Die vorhandene Hugo-Ausgabe für Collections, Karten, Kategorien und Navigation bleibt zunächst bestehen.

Erst bei einem konkreten zweiten Anwendungsfall werden passende Collection-Funktionen verallgemeinert. So wird der Core nicht versehentlich zu einem vollständigen Website-Framework.

## 4. Gemeinsames Bilddatenmodell

Der zentrale Integrationsvertrag ist ein einfaches, dokumentiertes Bildmodell. Es darf keine Hugo-Ressourcenobjekte oder Obsidian-Objekte enthalten.

### 4.1 Beispiel eines Manifestes

Der folgende Aufbau ist ein Entwurf:

```json
{
  "schemaVersion": 1,
  "images": [
    {
      "id": "night-walk/photo-0042",
      "width": 2400,
      "height": 1600,
      "src": "/images/photo-0042-large.jpg",
      "alt": "Straßenszene bei Nacht",
      "title": "Night Walk",
      "badge": "0042",
      "sources": [
        { "width": 20, "src": "/images/photo-0042-preview.jpg" },
        { "width": 250, "src": "/images/photo-0042-small.jpg" },
        { "width": 500, "src": "/images/photo-0042-medium.jpg" }
      ]
    }
  ]
}
```

### 4.2 Vertragsregeln

- `id` ist innerhalb einer Galerie eindeutig und bleibt bei einer Aktualisierung stabil. Dateinamen allein sind keine zuverlässige Identität.
- `width` und `height` sind positive Abmessungen der dargestellten Bildgeometrie; Varianten müssen dasselbe Seitenverhältnis besitzen.
- `src` bezeichnet die große Anzeigeversion. Diese kann bereits begrenzt oder mit einem Wasserzeichen versehen sein.
- `sources` ist optional. Ohne Varianten verwendet das Grid `src`; das funktioniert, kann aber größere Downloads verursachen.
- `alt` dient der zugänglichen Beschreibung; ein leerer Wert muss bewusst möglich sein.
- `title` und `badge` sind optional. Eine Badge muss nicht aus einem Dateinamen stammen.
- Die Reihenfolge des Eingabearrays ist die Ausgangsreihenfolge.
- Der Core verändert die übergebenen Datensätze nicht und hängt keine zyklischen `prev`-/`next`-Referenzen daran.
- Nicht unterstützte Manifestversionen und ungültige Datensätze erzeugen nachvollziehbare Fehler.
- Eine leere Bildliste ist ein gültiger Zustand und kein Ladefehler.

Direkt übergebene JavaScript-Daten verwenden dasselbe Bildmodell. Die Manifesthülle wird nur für externe Dokumente benötigt.

### 4.3 URLs und Plattformgrenzen

Der Core erhält im jeweiligen Browser-Kontext verwendbare URLs. Relative Manifest-URLs werden von der Ladeschicht gegen die Manifest-URL aufgelöst, nicht zufällig gegen die aktuelle Inhaltsseite.

Der Hugo-Adapter berücksichtigt Basis- und Unterverzeichnis-URLs. Der Obsidian-Adapter übersetzt Vault-Dateien in geeignete Ressourcen-URLs und verwaltet gegebenenfalls selbst erzeugte Blob-URLs.

Eine URL allein erlaubt keinen beliebigen lokalen Dateizugriff. Browserregeln für Ressourcen, Fetch und CORS bleiben gültig. Die einfache HTML-Demo wird über einen statischen HTTP-Server ausgeliefert; `file://` ist kein zugesichertes Laufzeitmodell.

### 4.4 Kompatibilität mit dem bisherigen JSON

Das bisherige Format mit `full`, numerischen Variantenschlüsseln und Dateinamen wird durch eine Normalisierung im Hugo-Adapter auf das neue Modell abgebildet.

Die bisherige Bildnummern-Erkennung wird zunächst kompatibel übernommen und durch explizite `badge`-Werte ergänzbar gemacht. Abweichende Erkennungsregeln sind keine beiläufige Änderung dieser Migration.

## 5. Öffentliche Nutzung

### 5.1 Programmatische API

Beispiel einer möglichen API, noch keine implementierte Signatur:

```js
import { createGallery } from "grid-gallery-core";

const gallery = createGallery({
  container: document.querySelector("#photos"),
  images,
  gap: 10
});

gallery.setImages(updatedImages);
gallery.destroy();
```

Anforderungen:

- expliziter Start unabhängig von `DOMContentLoaded`;
- Container als DOM-Element, nicht ausschließlich über eine globale ID;
- optional ein eigener Scrollbereich;
- Aktualisierung der Bildliste ohne fremde Instanzen zu beeinflussen;
- wiederholtes `destroy()` ohne Nebenwirkungen;
- definierte Reaktion auf Methodenaufrufe nach dem Entfernen;
- eindeutige Meldung von Konfigurations-, Lade- und Laufzeitfehlern;
- begrenzte Ereignisse wie Bildaktivierung und Fehler statt eines allgemeinen Plugin-Frameworks.

### 5.2 Deklarative Nutzung

Eine optionale Komfortschicht kann Container automatisch finden:

```html
<link rel="stylesheet" href="/assets/grid-gallery.css">

<div data-grid-gallery
     data-source="/data/photos.json"></div>

<script type="module" src="/assets/grid-gallery-auto.js"></script>
```

Auch diese Attributnamen sind ein Entwurf. Der Auto-Initializer verwendet ausschließlich die öffentliche Core-API. Fehler müssen sichtbar gemeldet werden; fehlgeschlagene Container dürfen nicht als erfolgreich initialisiert markiert werden.

### 5.3 Auslieferung

- ESM-Paket für Anwendungen und Bundler;
- TypeScript-Typen für die öffentliche Schnittstelle;
- fertige Browser-Module und CSS zur lokalen Einbindung ohne npm;
- separater, optionaler Auto-Initializer;
- keine verpflichtende CDN-Abhängigkeit.

Hugo-Anwender benötigen weiterhin kein Node.js für den Website-Build. Der veröffentlichte Hugo-Adapter enthält beziehungsweise bezieht bereits gebaute Core-Assets über seinen Release-Prozess.

## 6. Layout-Engine, Lifecycle und Isolation

### 6.1 Bestehende Engine zunächst behalten

Die erweiterte Pig-Engine bleibt zunächst die interne Layout-Implementierung. Die Herauslösung wird nicht mit einem neuen Layoutalgorithmus kombiniert.

Pig-spezifische Datenstrukturen und globale Variablen werden nicht zur öffentlichen API. Ein späterer Engine-Wechsel soll ohne Änderungen am Bildmodell möglich bleiben.

### 6.2 Unabhängige Instanzen

Jede Instanz besitzt ihren eigenen Zustand, ihre Bildzuordnung, Listener und Lightbox-Ressourcen. Zwei Galerien mit gleich benannten Dateien dürfen weder Bilder noch Navigation vermischen.

Die vollständige Bildliste bleibt von der virtualisierten DOM-Teilmenge getrennt. Die Lightbox darf nicht nur aktuell sichtbare Bilder kennen.

### 6.3 Vollständiges Entfernen

`destroy()` muss alle von der Instanz angelegten Ressourcen freigeben:

- Scroll- und sonstige Event-Listener;
- ResizeObserver beziehungsweise instanzbezogene Resize-Abonnements;
- ausstehende Timer und Animation-Frame-Arbeit;
- erzeugte Grid-, Style- und Lightbox-Hilfselemente;
- interne Referenzen und laufende instanzeigene Ladevorgänge.

Späte asynchrone Ergebnisse dürfen eine entfernte Instanz nicht wiederbeleben. Das Entfernen einer Instanz darf andere Galerien nicht deaktivieren.

### 6.4 Dynamische Container

Neben dem Fenster müssen scrollende Panels unterstützt werden. Container-Größenänderungen, zunächst ausgeblendete Ansichten und später sichtbare Panels brauchen ein definiertes Layoutverhalten.

Die vorhandene Pig-Option `scroller` ist ein Ausgangspunkt, aber noch kein Nachweis vollständiger Panel-Unterstützung.

## 7. Optionale Lightbox

Die direkte fsLightbox-Kopplung wird aus der Layout-Engine entfernt. Ein kleiner Adaptervertrag reicht zunächst:

1. vollständige, geordnete Bildliste übernehmen;
2. ein Bild am gewünschten Index öffnen;
3. schließen;
4. Ressourcen freigeben.

Der Core meldet die Aktivierung eines Bildes. Der Adapter entscheidet über die Anzeige. Ohne Lightbox muss die Anwendung Bildaktivierung selbst behandeln oder das Grid ohne Vergrößerung nutzen können.

Für Hugo bleibt fsLightbox zunächst die bestehende Standardintegration. Vor der Festschreibung des Vertrags wird geprüft, welche Isolation und Freigabe die eingesetzte fsLightbox-Version tatsächlich unterstützt. Nicht vorhandene Bibliotheksfunktionen dürfen nicht durch einen nur scheinbar vollständigen Lifecycle verdeckt werden.

Andere Lightbox-Anbindungen oder eine Obsidian-spezifische Anzeige können später denselben Vertrag verwenden. Lizenzhinweise für mitgelieferte Bibliotheken und die Herkunft der Pig-Erweiterung sind vor Veröffentlichung zu prüfen und beizubehalten.

## 8. Plattform-Adapter

### 8.1 Hugo

Der Hugo-Adapter behält:

- Shortcodes, Partials und Front-Matter-Verträge;
- Bildsammlung über Page Resources;
- Thumbnail-Erzeugung, Größenbegrenzung und Wasserzeichen;
- Collections, Taxonomien, Metadaten und Seitennavigation;
- Asset-Einbindung über Hugo;
- die Überschreibbarkeit dokumentierter Integrationspunkte.

Er übersetzt das bestehende Daten- und Konfigurationsmodell in Core-Eingaben. Bestehende Shortcodes und CSS-Anpassungen sollen weiter funktionieren. Die tatsächlich unterstützten Erweiterungspunkte werden vor dem Umbau erfasst; notwendige Brüche werden ausdrücklich dokumentiert und versioniert.

### 8.2 Andere Static-Site-Generatoren

Ein anderer SSG muss nur passende Bilddaten und HTML liefern. Ein eigener Adapter ist erst erforderlich, wenn Bildsammlung, Bildverarbeitung oder Template-Komfort integriert werden sollen.

### 8.3 Obsidian

Ein späteres Plugin übernimmt:

- Auswahl von Vault-Bildern;
- Auflösung von Ressourcen-URLs und Bildabmessungen;
- Erzeugen eines Containers, etwa für einen Markdown-Codeblock;
- Übergabe des richtigen Scrollbereichs;
- Aktualisieren bei relevanten Inhaltsänderungen;
- `destroy()` beim Schließen oder Neurendern der Ansicht.

Obsidian-APIs bleiben vollständig außerhalb des Core. Der erste Prototyp dient als Beweis der Wiederverwendbarkeit, nicht als vollständiges Plugin mit allen Komfortfunktionen.

## 9. Repository und Veröffentlichung

Zunächst bleibt die Arbeit im bestehenden Repository. Eigenständiges Paket und eigenständiges Repository sind unterschiedliche Entscheidungen.

Vorgeschlagene zusätzliche Struktur:

```text
packages/
  grid-gallery-core/
    src/
    package.json
examples/
  vanilla/
tests/
  core/
```

Die vorhandenen Hugo-Verzeichnisse bleiben zunächst an ihrem Ort. Es erfolgt kein gleichzeitiger Umzug aller Shortcodes, Partials und Assets.

Die Core-Quelle hat genau einen Pflegeort. Falls gebaute Assets für das Hugo-Modul eingecheckt werden, muss ihr reproduzierbarer Aktualisierungsprozess festgelegt sein; sie werden nicht separat von Hand gepflegt.

Ein späteres eigenes Repository ist möglich, sobald API, Release-Prozess und mindestens zwei Integrationen tragfähig sind. Die Verfügbarkeit des gewünschten Paketnamens und eine Veröffentlichungsstrategie sind noch offen.

## 10. Bewusst nicht Teil der ersten Ausbaustufe

- neuer Layoutalgorithmus;
- vollständiges Collection- oder Website-Framework;
- allgemeines Plugin-System mit beliebigen Hooks;
- integrierte universelle Bildverarbeitungs-CLI;
- NDJSON, Streaming und inkrementelle Datenquellen;
- vollständige Obsidian-Produktoberfläche;
- Aufräumen aller vorhandenen Website-Sonderfälle;
- neue Features aus der bestehenden TODO-Liste, soweit sie die Entkopplung nicht erfordert.

Die NDJSON-Idee aus [TODO.md](./TODO.md) bleibt eine separate Erweiterung. DOM-Virtualisierung begrenzt nicht automatisch den Speicher für die vollständige Bildliste; Streaming erfordert deshalb eine eigene Planung für Layout, Reihenfolge und Lightbox.

## 11. Anforderungen und Erfolgsmaßstab

| ID | Anforderung |
|---|---|
| REQ-001 | Grid und optionale Lightbox laufen ohne Hugo auf einer einfachen HTML-Seite. |
| REQ-002 | Ein dokumentiertes, plattformneutrales Bildmodell unterstützt stabile IDs und optionale Varianten. |
| REQ-003 | Galerien lassen sich explizit erzeugen, aktualisieren und vollständig entfernen. |
| REQ-004 | Mehrere Instanzen bleiben einschließlich Lightbox und Ressourcenverwaltung isoliert. |
| REQ-005 | Eigene Scrollbereiche und dynamische Container werden unterstützt. |
| REQ-006 | Bestehende Hugo-Nutzung bleibt über einen Adapter kompatibel; Node.js ist für Anwender nicht erforderlich. |
| REQ-007 | Lightbox und Grid sind getrennt; Virtualisierung begrenzt nicht die Lightbox-Bildliste. |
| REQ-008 | Fertige Browser-Assets sowie ESM-Nutzung mit Typen sind möglich. |
| REQ-009 | Ein begrenzter Obsidian-Prototyp verwendet denselben Core ohne Core-seitige Obsidian-Abhängigkeit. |
| REQ-010 | Fehler sind nachvollziehbar, Daten werden nicht mutiert, URLs werden kontextgerecht aufgelöst. |

Der wichtigste Nachweis ist nicht ein erfolgreicher Hugo-Build, sondern eine funktionierende Hugo-freie Demo mit demselben Core, den anschließend Hugo verwendet.

## 12. Offene Entscheidungen

Vor Implementierung der jeweils betroffenen Phase zu klären:

- endgültige Paketnamen und Veröffentlichung als ein oder mehrere Pakete;
- JavaScript mit Typdefinitionen oder TypeScript als Core-Quellsprache;
- genaue Methoden-, Ereignis- und Fehlersignaturen;
- exakte Semantik von `setImages()`, insbesondere bei geöffneter Lightbox;
- unterstützte Lightbox-Lifecycle-Funktionen und daraus folgende Integrationsgrenzen;
- unterstützte Browser und zugängliche Tastatur-/Fokusinteraktion;
- Umfang bisheriger CSS-, Partial- und Pro-Lightbox-Kompatibilität;
- Release- und Versionierungsstrategie von Core und Hugo-Adapter.

Die Architektur empfiehlt wenige klare Schnittstellen. Diese Entscheidungen sollen nicht durch einen vorschnell umfangreichen Abstraktionsrahmen ersetzt werden.

---

# Anhang A: Umsetzungsplan

Alle Aufgaben sind geplant und noch nicht erledigt. Neue Pfade sind Vorschläge; bestehende Pfade sind Ausgangspunkte. Die Abnahmekriterien beschreiben die später erforderlichen Nachweise, nicht bereits durchgeführte Tests.

## A.1 Phase 1: Vertrag und Kompatibilitätsgrenze festlegen

**Ziel:** Vor der Extraktion steht fest, welche Eingaben und Verhaltensweisen erhalten bleiben.

**Anforderungen:** REQ-002, REQ-006, REQ-010  
**Voraussetzung:** Keine.

- [ ] T001 [Plan:1.1] Bisherige Bilddaten, Optionen, CSS- und Integrationspunkte anhand von [init-pig.js](./assets/hugo-grid-gallery/js/init-pig.js), [create-thumbs.html](./layouts/partials/gallery-grid/create-thumbs.html) und [gallery-config.html](./layouts/partials/gallery-grid/gallery-config.html) erfassen.
- [ ] T002 [Plan:1.2] Bildmodell, Manifestversion, URL-Auflösung und Validierungsregeln für den vorgesehenen Core unter `packages/grid-gallery-core/src/` festlegen.
- [ ] T003 [Plan:1.3] Instanz-, Lightbox- und Fehlervertrag sowie die offenen Kompatibilitätsentscheidungen in diesem Konzept konkretisieren.
- [ ] T004 [Plan:1.4] Die bestehenden Hugo-Build-, DOM- und Browser-Prüfungen aus [package.json](./package.json) als Vergleichsbasis ausführen und Ergebnisse festhalten.

**Abnahme:**

- Für jedes bisher verwendete Bildfeld und jede relevante Option ist die Zuordnung geklärt.
- Das Verhalten bei leeren Daten, ungültigen Daten, identischen Dateinamen und relativen URLs ist definiert.
- Bewusst unterstützte Erweiterungspunkte sind von internen Implementierungsdetails unterschieden.

## A.2 Phase 2: Core und Hugo-freie Demo herauslösen

**Ziel:** Das Grid läuft unabhängig von Hugo und ohne Austausch der Layout-Engine.

**Anforderungen:** REQ-001, REQ-002, REQ-003, REQ-008, REQ-010  
**Voraussetzung:** Phase 1.

- [ ] T005 [Plan:2.1] Core-Paket unter `packages/grid-gallery-core/` mit öffentlichem Einstieg, Typen und passendem Build einrichten; [package.json](./package.json) dafür gezielt erweitern.
- [ ] T006 [Plan:2.2] Datenvalidierung, Bildreihenfolge und Instanzerzeugung aus [init-pig.js](./assets/hugo-grid-gallery/js/init-pig.js) ohne globale Galerieverwaltung übernehmen.
- [ ] T007 [Plan:2.3] Die Layout-/Virtualisierungslogik aus [pig.js](./assets/ext/pig/pig.js) intern integrieren; direkte Lightbox-Kopplung dabei abtrennen.
- [ ] T008 [Plan:2.4] Fertige Browser-Module, Basis-CSS und einen optionalen Auto-Initializer bereitstellen.
- [ ] T009 [Plan:2.5] Unter `examples/vanilla/` eine HTML-Demo mit eigenem Manifest anlegen, die keine Hugo-Templates oder Hugo-generierten Assets benötigt.

**Abnahme:**

- Ein gewöhnlicher statischer HTTP-Server reicht zum Anzeigen der Demo.
- Direkte Bildarrays und externe Manifeste funktionieren.
- Bilder ohne Varianten funktionieren ebenfalls.
- Fehlerhafte Daten werden eindeutig gemeldet, Eingabedaten bleiben unverändert.

## A.3 Phase 3: Lifecycle, Container und Lightbox absichern

**Ziel:** Der Core ist auch für dynamische Ansichten statt nur für einmal geladene Webseiten geeignet.

**Anforderungen:** REQ-003, REQ-004, REQ-005, REQ-007, REQ-010  
**Voraussetzung:** Phase 2.

- [ ] T010 [Plan:3.1] `setImages()` und `destroy()` einschließlich Listenern, Observern, Timern und asynchronen Ergebnissen im Core vervollständigen.
- [ ] T011 [Plan:3.2] Elementbasierte Container, eigene Scrollbereiche und Container-Größenänderungen in der internen Pig-Anbindung umsetzen.
- [ ] T012 [Plan:3.3] fsLightbox über den festgelegten Adaptervertrag anbinden; Quellen und Gruppen nachweislich pro Instanz isolieren.
- [ ] T013 [Plan:3.4] Unter `examples/vanilla/` Fälle für mehrere Galerien, gleiche Dateinamen, Panel-Scrolling und wiederholtes Erzeugen/Entfernen ergänzen.

**Abnahme:**

- Das Entfernen einer Galerie lässt die zweite funktionsfähig.
- Ein erneuter Aufbau erzeugt keine doppelten Listener oder verwaisten Hilfselemente.
- Größenänderungen eines Panels aktualisieren das Layout ohne Fenster-Resize.
- Die Lightbox erreicht auch Bilder außerhalb der aktuell gerenderten DOM-Teilmenge.
- Aktualisierungen und Entfernungen während ausstehender Arbeit hinterlassen keinen veralteten Zustand.

## A.4 Phase 4: Hugo als ersten Adapter anschließen

**Ziel:** Bestehende Hugo-Nutzung läuft über denselben Core wie die Vanilla-Demo.

**Anforderungen:** REQ-002, REQ-006, REQ-007, REQ-008, REQ-010  
**Voraussetzung:** Phase 3.

- [ ] T014 [Plan:4.1] Bestehende Bilddaten und Konfiguration in [init-pig.js](./assets/hugo-grid-gallery/js/init-pig.js) beziehungsweise einem schmalen Nachfolger auf das Core-Modell abbilden.
- [ ] T015 [Plan:4.2] [gallery-config.html](./layouts/partials/gallery-grid/gallery-config.html) und [main.js](./assets/hugo-grid-gallery/js/main.js) auf die Core-Assets und deren Initialisierung umstellen.
- [ ] T016 [Plan:4.3] Die Asset-Verteilung so einrichten, dass Hugo-Anwender keine npm-Installation benötigen und Core-Quellen nicht doppelt gepflegt werden.
- [ ] T017 [Plan:4.4] Shortcodes, Metadaten, Bildvarianten, Wasserzeichen, CSS-Anpassungen und dokumentierte Lightbox-Overrides gegen die Vergleichsbasis prüfen.

**Abnahme:**

- Die bestehende ExampleSite verwendet den neuen Core.
- Build-, DOM- und Browser-Prüfungen bleiben erfolgreich; bewusste Unterschiede sind erklärt.
- Bestehende Thumbnail- und Wasserzeichenregeln bleiben erhalten.
- Eine Consumer-Site kann den veröffentlichten Hugo-Adapter ohne Node.js bauen.

## A.5 Phase 5: Wiederverwendbarkeit mit Obsidian belegen

**Ziel:** Ein andersartiger Host verwendet den Core ohne plattformspezifische Änderungen daran.

**Anforderungen:** REQ-003, REQ-004, REQ-005, REQ-009, REQ-010  
**Voraussetzung:** Phase 3; Phase 4 ist die empfohlene Reihenfolge zur Absicherung des bestehenden Produkts.

- [ ] T018 [Plan:5.1] Den Ablageort eines begrenzten Obsidian-Prototyps festlegen; keine Obsidian-Abhängigkeiten in `packages/grid-gallery-core/` aufnehmen.
- [ ] T019 [Plan:5.2] Einen Markdown-Codeblock oder eine einfache Ansicht mit Vault-Bildauflösung, Abmessungen und eigener Containerverwaltung implementieren.
- [ ] T020 [Plan:5.3] Neurendern, Schließen und gleichzeitige Ansichten an den Core-Lifecycle anbinden; selbst erzeugte Ressourcen freigeben.

**Abnahme:**

- Derselbe Core-Build funktioniert in Vanilla, Hugo und dem Prototyp.
- Schließen und erneutes Öffnen hinterlassen keine alten Galerien.
- Vault-spezifische Pfade und APIs bleiben im Adapter.

## A.6 Phase 6: Dokumentation und erste Veröffentlichung

**Ziel:** Der entkoppelte Core ist nachvollziehbar nutzbar und reproduzierbar auslieferbar.

**Anforderungen:** REQ-001 bis REQ-010  
**Voraussetzung:** Phasen 1 bis 5.

- [ ] T021 [Plan:6.1] [README.md](./README.md) um Architektur, Vanilla-Nutzung, Hugo-Kompatibilität, Lifecycle und Links zur API-Dokumentation ergänzen.
- [ ] T022 [Plan:6.2] Herkunft, Lizenzen und mitgelieferte Drittanbieterbestandteile in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) prüfen und passend dokumentieren.
- [ ] T023 [Plan:6.3] Paketinhalt und reproduzierbare Browser-/Hugo-Assets prüfen; Versionierung und Release-Reihenfolge festlegen.
- [ ] T024 [Plan:6.4] Die Abnahmekriterien der vorherigen Phasen gemeinsam prüfen und verbleibende Einschränkungen explizit dokumentieren.

**Abnahme:**

- Dokumentierte Beispiele entsprechen der tatsächlich veröffentlichten API.
- Auslieferungsartefakte enthalten alle nötigen Assets und Lizenzhinweise.
- Hugo-Kompatibilität und Hugo-Unabhängigkeit sind getrennt nachgewiesen.
- Keine Plattform muss eine eigene Kopie der Grid-Logik pflegen.

## A.7 Zuordnung der Anforderungen

| Anforderung | Planabschnitte | Vorgesehener Nachweis |
|---|---|---|
| REQ-001 | A.2, A.6 | Hugo-freie Vanilla-Demo |
| REQ-002 | A.1, A.2, A.4 | Dokumentiertes Modell und Hugo-Normalisierung |
| REQ-003 | A.2, A.3, A.5 | Erzeugen, Aktualisieren, Entfernen in dynamischen Ansichten |
| REQ-004 | A.3, A.5 | Mehrere unabhängige Grid-/Lightbox-Instanzen |
| REQ-005 | A.3, A.5 | Scrollendes Panel und Container-Größenänderung |
| REQ-006 | A.1, A.4 | ExampleSite und Consumer-Build ohne Node.js |
| REQ-007 | A.3, A.4 | Optionale Lightbox mit vollständiger Bildnavigation |
| REQ-008 | A.2, A.4, A.6 | ESM, Typen und fertige Browser-/Hugo-Assets |
| REQ-009 | A.5 | Begrenzter Obsidian-Prototyp ohne Host-Abhängigkeit im Core |
| REQ-010 | A.1 bis A.5 | Validierung, URL-Auflösung, unveränderte Eingaben, Fehler- und Lifecycle-Fälle |

## A.8 Mögliche Folgearbeiten

Erst nach dem stabilen ersten Core:

- Karten, Kategorien und Collection-Ansichten anhand konkreter Verbraucher verallgemeinern;
- weitere SSG-Adapter entwickeln;
- eine zusätzliche Lightbox anbinden;
- Streaming/NDJSON und inkrementelle Layouts separat konzipieren;
- bei Bedarf Paket und Repository organisatorisch trennen.

Diese Folgearbeiten sind kein Bestandteil der ersten Core-Extraktion.
