# TODO  - HUGG

Was ist noch zu tun?

## Allgemein

- [ ] `dflip` gehört hier eingentlich auch nicht hin.
- [ ] Eine Variante von `gallery-config.html` -> `gallery-head.html`/`gallery-foot.html`, um die ressourcen korrekt in header und footer zu laden?

- [ ] games.json  verallgemeinern.
  - Gibt es ein hook oder callback Feature oder einen anderen Möglichkeit Code ein zu schleusen?
  - Vermutlich dort ein weiteres kleines Partial einsetzen, und das später überschreiben: `provide-metadata-content`
- [ ] Das Seitenverhältnis konfigurierbar machen.
- [ ] data/gallery/config.json - Dokumentieren
- [ ] REGEX für das parsen der Nummer in config
- [ ] Sorter zentrieren
- [ ] „Recently updated“ Info auch in der Gallery (vor allem bei Single wichtig) 
- [ ] Goto top + bottom ???? Ist der da? - auf jeden Fall auch konfigurierbar machen. - useToTop = true | false

- [ ] Kleinere Thumbnails bitte ohne Watermark.

- [ ] Aufräumen/Refaktorieren…. Ein paar Verzeichnisse umbenennen, und shortcodes und partials umziehen. Zb 
  - data/hugo-grid-gallery/
  - /config/
  - /meta/
  - Usw… alles in ein unterberzeichnis
  - /hugo-grid-gallery/
  - /partials/hugo-grid-gallery/
  - /shortcodes/hugo-grid-gallery/

## Einzelgalerie

<http://localhost:1313/street-photography/>

-[ ] `Der Title` mit den Kategorien-Links fehlt: Cyberpunk 2077 | All Action Roleplay Dystopia Science Fiction
-[ ] Der Kopf mit den Metadaten fehlt
-[ ] Einzel-Gallerie zeigt

Galleries
Binary Voids Categories <---
Street Photography <---

Die gehören da nicht hin. Bei anderen Gallerien ist der fehler nicht.

## Galerie Index

ZB.
<http://localhost:1313/anderland-galleries/>
<http://localhost:1313/binary-voids-galleries/>

- [ ] Der Recently Updated ⭐ Block fehlt.
- [ ] Der Kopf mit den Metadaten fehlt.
- [ ] In den Cards fehlen die Metadaten.
- [ ] Index: * Für aktualisiert erscheint noch nich neben dem count-

Gallerie

<http://localhost:1313/binary-voids-galleries/gallery-2/>

- [ ] Der Kopf mit den Metadaten ist da, aber Anzahl der Bilder fehlt.

## Kategorien Index

<http://localhost:1313/binary-voids-categories/>

-[ ] Der Kopf mit den Metadaten fehlt
-[x] In den Cards werden Metadaten angezeigt.
-[ ] Anzahl der Bilder: Nummer ist da aber text "Bilder" fehlt noch.

<http://localhost:1313/categories/>

- [ ] In den Cards fehlen die Metadaten.

## Sonstiges

- [ ] in PIG die alte Lightbox (vielleicht etwsa verbessert) wieder in `pig.js` einbauen, und den `fslightbox` support optional machen.
  - `fslightbox` muss man (sollte man) halt lizensieren.
  - [ ] Wenn das erledigt ist: git des Moduls wieder öffentlich schalten.

- [ ] `fslightbox` bekommt noch nicht alle bilder sondern immer nur den gerade geladenen ausschnitt.

- [ ] öffentliches remote git anlegen mit dieser Testwebseite.
  - [ ] Ordentliche Beispiel Galerien anlegen mit Testbildern.
  - [ ] Mehr Testfälle: Zweite Single-Gallery. Tiefere Struktur mit single und multi.
  - [ ] Dokumentation!

## Aufräumen

Nur core `data` support ins Modul.

games.json ist zB. ne typische Erweiterung, die in der webseite binary-voids customized wird.
Die Base hat weniger daten.
Die partials müssen von binary voids überschrieben werden.

Wie kollidiert das mit anderen arten von gallerien  ?
wie gehe ich mit unterschiedlichen "games.json" um?

## Einbauen

- in `binary-voids.de`
- in `carsten-nichte.de`
