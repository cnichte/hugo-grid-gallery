# 🧩 Hugo Grid Gallery – TypeScript Utility Scripts

Dieses Verzeichnis enthält optionale **Hilfsskripte in TypeScript**  
für den Einsatz mit dem Hugo-Modul [`hugo-grid-gallery`](https://github.com/cnichte/hugo-grid-gallery).

Die Skripte sind plattformunabhängig (macOS, Linux, Windows)  
und werden über [`tsx`](https://github.com/esbuild-kit/tsx) direkt ausgeführt –  
kein Transpiling nötig.

## Installation & Integration

### Voraussetzungen

Im Projekt, das `hugo-grid-gallery` verwendet:

typescript etc

### Verfügbare Skripte

🕒 update-lastmod.ts

Aktualisiert das lastmod-Datum im Frontmatter jeder Galerie-Seite,
sobald sich darin enthaltene Bilder geändert haben (basierend auf git log).

Verhalten:

- durchsucht automatisch alle content/-Unterverzeichnisse mit _index.md oder index.md
- erkennt Bildtypen (jpg, jpeg, png, webp, avif)
- prüft letzte git commit-Änderung der Bilder
- schreibt lastmod:-Feld im Frontmatter aktualisiert zurück
- kompatibel mit macOS, Linux und Windows

```bash
 npx tsx shell-scripts/hgg-ts/update-lastmod.ts
 # oder kurz
 npm run preflight
```
