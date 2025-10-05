#!/usr/bin/env tsx
/* eslint-disable no-console */

/**
 * Hugo Grid Gallery – update-lastmod.ts
 *
 * Zweck
 * -----
 * - Durchsucht /content rekursiv nach Leaf-Bundles (Ordner mit index.md),
 * - berücksichtigt nur Bundles mit Frontmatter `type: "hugo-grid-gallery"`,
 * - sammelt ALLE Bilder (rekursiv) unterhalb dieses Bundles,
 * - ermittelt das jüngste Änderungsdatum über `git log -1 --format=%cI -- <alle Bilder>`,
 *   Fallback: jüngste mtime,
 * - setzt/aktualisiert `lastmod` im Frontmatter (YAML `---` oder TOML `+++`).
 *
 * Aufruf
 * ------
 *   npx tsx shell-scripts/hgg-ts/update-lastmod.ts [--dry-run] [--stage]
 *
 * Optionen / ENV
 * --------------
 *   --dry-run           : schreibt nichts zurück (nur Logging)
 *   --stage             : führt nach Update `git add index.md` aus
 *
 *   CONTENT_DIR=content : Root des Content-Verzeichnisses
 *   EXT=jpg,jpeg,png,...: Bildendungen (Kommasepariert, alles lower-case)
 *   MAX_DEPTH=0         : 0 = unbegrenzt, sonst Tiefe der Bundle-Suche
 *
 * Rückgabewerte
 * -------------
 *   Exit-Code 0 bei Erfolg, !=0 bei Fehler.
 *
 * Hinweise
 * --------
 * - Funktioniert auf macOS, Linux, Windows (git erforderlich für Git-Timestamp).
 * - Frontmatter wird robust geparst (YAML/TOML Delimiter).
 * - `lastmod` wird als ISO-8601 geschrieben (z. B. 2025-01-31T12:34:56+01:00).
 */

import { promises as fs } from "node:fs";
import { join, resolve, sep } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/* ===================== Konfiguration ===================== */

const CONTENT_DIR = resolve(process.env.CONTENT_DIR ?? "content");
const EXTENSIONS = (process.env.EXT ?? "jpg,jpeg,png,webp,avif")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const DRY_RUN = process.argv.includes("--dry-run");
const STAGE = process.argv.includes("--stage"); // git add index.md
const MAX_DEPTH = Number(process.env.MAX_DEPTH ?? "0"); // 0 = unbegrenzt

const REQUIRED_TYPE = "hugo-grid-gallery";

/* ===================== Hilfsfunktionen ===================== */

type FrontmatterInfo = {
  delimiter: "---" | "+++";
  endOffset: number; // Byte-Offset direkt NACH der FM-Schließzeile
  head: string; // FM-Header ohne Delimiter
  body: string; // Inhalt nach dem Frontmatter
  original: string; // vollständiger Dateiinhalt
};

/** Prüft Dateiendung gegen zugelassene Bildformate */
function isImage(name: string): boolean {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return false;
  const ext = name.slice(dot + 1).toLowerCase();
  return EXTENSIONS.includes(ext);
}

async function statSafe(p: string) {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

async function readDirSafe(p: string) {
  try {
    return await fs.readdir(p, { withFileTypes: true });
  } catch {
    return [];
  }
}

/**
 * Ermittelt Frontmatter (YAML '---' oder TOML '+++').
 * Gibt den reinen FM-Text, den Body und den Delimiter zurück.
 */
function detectFrontmatter(text: string): FrontmatterInfo | null {
  // Frontmatter muss direkt am Anfang der Datei stehen
  const firstLineEnd = text.indexOf("\n");
  if (firstLineEnd < 0) return null;

  const first = text.slice(0, firstLineEnd).trim();
  if (first !== "---" && first !== "+++") return null;

  const delimiter = first as "---" | "+++";
  // Finde die Zeile mit dem schließenden Delimiter
  const closeIdx = text.indexOf(`\n${delimiter}`, firstLineEnd);
  if (closeIdx < 0) return null;

  // Head ist zwischen erster und schließender Delimiter-Zeile (ohne beide Delimiter)
  const head = text.slice(firstLineEnd + 1, closeIdx).replace(/^\n+|\n+$/g, "");
  // Nach dem schließenden Delimiter folgt noch ein '\n' und dann die nächste Zeile -> Body ab nachfolgender Zeile
  const after = text.slice(closeIdx + 1 + delimiter.length); // steht auf '\n'
  const nextNL = after.indexOf("\n");
  const body = nextNL >= 0 ? after.slice(nextNL + 1) : "";

  const endOffset = closeIdx + 1 + delimiter.length + 1 + (nextNL >= 0 ? nextNL + 1 : 0);
  return { delimiter, endOffset, head, body, original: text };
}

/**
 * Liest `type` aus dem Frontmatter-Head. Akzeptiert:
 *   type: "hugo-grid-gallery"
 *   type: 'hugo-grid-gallery'
 *   type = "hugo-grid-gallery"
 *   type = 'hugo-grid-gallery'
 */
function extractTypeFromFMHead(head: string): string | null {
  const m = head.match(/^\s*type\s*[:=]\s*("?|'?)([^"'\n]+)\1\s*$/im);
  return m ? m[2].trim() : null;
}

/** Fügt/aktualisiert lastmod im Frontmatter-Head (YAML/TOML-tolerant) */
function upsertLastmod(fm: FrontmatterInfo, isoDate: string): string {
  const lines = fm.head.split(/\r?\n/);
  let found = false;

  const patched = lines.map((line) => {
    if (/^\s*lastmod\s*[:=]\s*/i.test(line)) {
      found = true;
      const sep = line.includes("=") ? "=" : ":";
      return `lastmod ${sep} "${isoDate}"`;
    }
    return line;
  });

  if (!found) patched.push(`lastmod: "${isoDate}"`);

  // Datei neu zusammensetzen (Delimiter bleiben erhalten)
  return `${fm.delimiter}\n${patched.join("\n")}\n${fm.delimiter}\n${fm.body}`;
}

/** Jüngstes Git-Commit-Datum (ISO-8601) über eine Dateiliste */
async function getGitLastCommitISO(files: string[]): Promise<string | null> {
  if (files.length === 0) return null;
  try {
    const { stdout } = await execFileAsync("git", ["log", "-1", "--format=%cI", "--", ...files], {
      cwd: process.cwd(),
      windowsHide: true,
    });
    const iso = stdout.trim();
    return iso || null;
  } catch {
    return null;
  }
}

/** Fallback: jüngste mtime über eine Dateiliste (ISO-8601) */
async function getLatestMTimeISO(files: string[]): Promise<string | null> {
  let latest = 0;
  for (const f of files) {
    const st = await statSafe(f);
    if (st?.isFile()) {
      if (st.mtimeMs > latest) latest = st.mtimeMs;
    }
  }
  return latest ? new Date(latest).toISOString() : null;
}

/** Relativer, hübscher Pfad fürs Logging */
function rel(p: string) {
  const cwd = process.cwd();
  const r = p.startsWith(cwd) ? p.slice(cwd.length + 1) : p;
  return r.split(sep).join("/");
}

/**
 * Durchläuft /content rekursiv, findet **alle** Ordner mit index.md
 * (Leaf-Bundles) – bricht NICHT an einem gefundenen Bundle ab, d. h.
 * geht „bis in den letzten Winkel“.
 * depth: 0=Root, MAX_DEPTH=0 bedeutet unbegrenzt
 */
async function* walkBundles(root: string, depth = 0): AsyncGenerator<string> {
  if (MAX_DEPTH > 0 && depth > MAX_DEPTH) return;

  const entries = await readDirSafe(root);
  const hasIndex = entries.some((d) => d.isFile() && d.name.toLowerCase() === "index.md");
  if (hasIndex) yield root;

  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith(".")) continue;
    yield* walkBundles(join(root, e.name), depth + 1);
  }
}

/** Sammelt **rekursiv** alle Bilddateien unterhalb des Bundle-Verzeichnisses. */
async function collectImagesRecursive(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(d: string) {
    const entries = await readDirSafe(d);
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) {
        if (e.name.startsWith(".")) continue;
        await walk(p);
      } else if (e.isFile()) {
        if (isImage(e.name)) out.push(p);
      }
    }
  }
  await walk(dir);
  return out;
}

/** Verarbeitet ein einzelnes Bundle-Verzeichnis (nur wenn type=="hugo-grid-gallery"). */
async function updateBundle(dir: string): Promise<void> {
  const indexPath = join(dir, "index.md");
  const st = await statSafe(indexPath);
  if (!st) return;

  // Frontmatter einlesen & type prüfen
  const original = await fs.readFile(indexPath, "utf8");
  const fm = detectFrontmatter(original);
  if (!fm) {
    console.log(`❌ Kein gültiges Frontmatter in ${rel(indexPath)} – überspringe`);
    return;
  }
  const pageType = extractTypeFromFMHead(fm.head);
  if (pageType !== REQUIRED_TYPE) {
    // bewusst still: nur kurze Info, um Log nicht zu fluten
    console.log(`↪︎ Skip (type=${pageType ?? "∅"}): ${rel(dir)}`);
    return;
  }

  // Bilder rekursiv sammeln
  const images = await collectImagesRecursive(dir);
  if (images.length === 0) {
    console.log(`⚠️  Keine Bilder in ${rel(dir)} – überspringe`);
    return;
  }

  // Git-Timestamp, Fallback mtime
  const gitISO = await getGitLastCommitISO(images);
  const lastmodISO = gitISO ?? (await getLatestMTimeISO(images));
  if (!lastmodISO) {
    console.log(`⚠️  Konnte kein Datum ermitteln für ${rel(dir)} – überspringe`);
    return;
  }

  // aktuelles lastmod vergleichen
  const m = fm.head.match(/^\s*lastmod\s*[:=]\s*("?|'?)([^"'\n]+)\1\s*$/im);
  const current = m ? m[2].trim() : null;

  if (current === lastmodISO) {
    console.log(`✔️  ${rel(indexPath)} ist aktuell: ${lastmodISO}`);
    return;
  }

  console.log(`📝 ${rel(indexPath)} → lastmod: ${current ?? "<leer>"} → ${lastmodISO}`);

  if (DRY_RUN) return;

  const updated = upsertLastmod(fm, lastmodISO);
  await fs.writeFile(indexPath, updated, "utf8");

  if (STAGE) {
    try {
      await execFileAsync("git", ["add", indexPath], { windowsHide: true });
    } catch {
      /* non-fatal */
    }
  }
}

/* ===================== Main ===================== */

(async () => {
  console.log("🔍 Prüfe Bundles (type: \"hugo-grid-gallery\") und aktualisiere lastmod …");
  const exists = await statSafe(CONTENT_DIR);
  if (!exists) {
    console.error(`❌ CONTENT_DIR nicht gefunden: ${CONTENT_DIR}`);
    process.exit(1);
  }

  let found = 0;
  for await (const dir of walkBundles(CONTENT_DIR)) {
    found++;
    await updateBundle(dir);
  }

  if (found === 0) {
    console.log("ℹ️  Keine Bundles (Ordner mit index.md) gefunden.");
  }

  console.log("✅ Fertig.");
})().catch((err) => {
  console.error("❌ Fehler:", err);
  process.exit(1);
});