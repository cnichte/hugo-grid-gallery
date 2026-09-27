# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.
Das Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [2.0.0] - Unveröffentlicht

### Hinzugefügt

- Collection-basierte Gallery-Identität und Navigation.
- Hierarchische Gallery-Konfiguration mit Collection- und Gallery-Overrides.
- Gemeinsame Metadaten für Galleries, Kategorien, Cards und Statistiken.
- Rollen `game`, `story` und `standalone` sowie rollenbasierte Listen.
- Rollenbasierte Recently-Updated-Links und zeitlich begrenzte Kartenmarkierungen.
- Dokumentierter Consumer-Build mit `hugo-toolbox update-lastmod`.
- Konfigurierbare Cover-Auflösung, Bildgrößen und optionale Wasserzeichen.
- fsLightbox Basic mit Consumer-Override für private Pro-Versionen.
- Ausführbare ExampleSite mit positiven und negativen Fixtures.
- Build-, DOM- und Browsertests für Hugo Extended 0.156.0 und aktuelle Versionen.

### Geändert

- Gallery-Seiten verwenden einen strikten `params.hugg`-Vertrag.
- Gallery-Metadaten werden ausschließlich aus `data/hugo_grid_gallery/` geladen.
- Gallery- und Kategorie-Links werden innerhalb ihrer Collection aufgelöst.
- Modul-Defaults verändern Reihenfolge und Bilder nicht mehr ungefragt.

### Entfernt

- Pfad-, Titel- und Section-Fallbacks für Gallery-Identitäten.
- Theme- und Consumer-spezifische Inhalte sowie generierte Build-Dateien.
- Veraltete getrennte Metadatensätze für Game- und Story-Galleries.
