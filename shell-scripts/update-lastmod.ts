#!/usr/bin/env tsx
/* eslint-disable no-console */

import { promises as fs } from "node:fs";
import { join, resolve, sep } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/* ========== Konfiguration (per ENV oder CLI) ========== */
const CONTENT_DIR = resolve(process.env.CONTENT_DIR ?? "content");
const EXTENSIONS = (process.env.EXT ?? "jpg,jpeg,png,webp,avif")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const DRY_RUN = process.argv.includes("--dry-run");
const STAGE   = process.argv.includes("--stage"); // git add index.md

// Bei sehr großen Repos kann man das einschränken (0 = unendlich)
const MAX_DEPTH = Number(process.env.MAX_DEPTH ?? "0"); // 0 = unlimited

/* ========== Hilfsfunktionen ========== */

type FrontmatterInfo = {
  delimiter: "---" | "+++";
  start: number;
  end: number;
  head: string; // Inhalt zwischen den Delimitern (ohne Delimiter)
  body: string; // Rest der Datei nach dem 2. Delimiter
  original: string; // vollständiger Inhalt
};

function isImage(name: string): boolean {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return false;
  const ext = name.slice(idx + 1).toLowerCase();
  return EXTENSIONS.includes(ext);
}

async function statSafe(p: string) {
  try { return await fs.stat(p); } catch { return null; }
}

async function readDirSafe(p: string) {
  try { return await fs.readdir(p, { withFileTypes: true }); } catch { return []; }
}

function detectFrontmatter(text: string): FrontmatterInfo | null {
  // Akzeptiert:
  // ---\n ... \n---\n
  // +++\n ... \n+++\n
  const firstLineEnd = text.indexOf("\n");
  if (firstLineEnd < 0) return null;

  const firstLine = text.slice(0, firstLineEnd).trim();
  if (firstLine !== "---" && firstLine !== "+++") return null;

  const delimiter = firstLine as "---" | "+++";
  const endIdx = text.indexOf(`\n${delimiter}`, firstLineEnd);
  if (endIdx < 0) return null;

  const fmHead = text.slice(firstLineEnd + 1, endIdx).replace(/^\n+|\n+$/g, "");
  const after = text.slice(endIdx + delimiter.length + 1); // + newline
  const fmCloseLineEnd = after.indexOf("\n");
  const body = fmCloseLineEnd >= 0 ? after.slice(fmCloseLineEnd + 1) : "";

  return {
    delimiter,
    start: 0,
    end: endIdx + delimiter.length + 1 + (fmCloseLineEnd >= 0 ? fmCloseLineEnd + 1 : 0),
    head: fmHead,
    body,
    original: text,
  };
}

function upsertLastmod(fm: FrontmatterInfo, isoDate: string): string {
  const lines = fm.head.split(/\r?\n/);
  let found = false;
  const updated = lines.map((l) => {
    // YAML/TOML tolerant: "lastmod: ..." oder "lastmod = ..."
    if (/^\s*lastmod\s*[:=]\s*/i.test(l)) {
      found = true;
      // Einheitlich in Anführungszeichen
      const sep = l.includes("=") ? "=" : ":";
      return `lastmod ${sep} "${isoDate}"`;
    }
    return l;
  });
  if (!found) {
    updated.push(`lastmod: "${isoDate}"`);
  }

  const rebuilt =
    `${fm.delimiter}\n${updated.join("\n")}\n${fm.delimiter}\n` +
    (fm.body.startsWith("\n") ? fm.body : `\n${fm.body}`);
  return rebuilt;
}

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

async function getLatestMTimeISO(files: string[]): Promise<string | null> {
  let latest = 0;
  for (const f of files) {
    const s = await statSafe(f);
    if (s && s.isFile()) {
      const t = s.mtimeMs;
      if (t > latest) latest = t;
    }
  }
  return latest ? new Date(latest).toISOString() : null;
}

// depth: 0 = unlimited
async function* walkBundles(root: string, depth = 0): AsyncGenerator<string> {
  const entries = await readDirSafe(root);
  const hasIndex = entries.some((d) => d.isFile() && d.name.toLowerCase() === "index.md");

  if (hasIndex) {
    yield root;
    // In Leaf-Bundles typischerweise keine weiteren Bundles tiefer
    return;
  }

  if (depth > 0 && MAX_DEPTH > 0 && depth > MAX_DEPTH) return;

  for (const e of entries) {
    if (e.isDirectory()) {
      // skip dot folders
      if (e.name.startsWith(".")) continue;
      const sub = join(root, e.name);
      yield* walkBundles(sub, depth + 1);
    }
  }
}

async function collectBundleImages(dir: string): Promise<string[]> {
  const entries = await readDirSafe(dir);
  const list: string[] = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (isImage(e.name)) list.push(join(dir, e.name));
  }
  return list;
}

async function updateBundle(dir: string): Promise<void> {
  const indexPath = join(dir, "index.md");
  const hasIndex = await statSafe(indexPath);
  if (!hasIndex) return;

  const images = await collectBundleImages(dir);
  if (images.length === 0) {
    console.log(`⚠️  Keine Bilder in ${rel(dir)} – überspringe`);
    return;
  }

  // 1) Git-Datum, sonst mtime-Fallback
  const gitISO = await getGitLastCommitISO(images);
  const lastmodISO = gitISO ?? (await getLatestMTimeISO(images));
  if (!lastmodISO) {
    console.log(`⚠️  Konnte kein Datum ermitteln für ${rel(dir)} – überspringe`);
    return;
  }

  const original = await fs.readFile(indexPath, "utf8");
  const fm = detectFrontmatter(original);
  if (!fm) {
    console.log(`❌ Kein gültiges Frontmatter in ${rel(indexPath)} – überspringe`);
    return;
  }

  // vorhandenen lastmod extrahieren
  const m = fm.head.match(/^\s*lastmod\s*[:=]\s*("?)([^"\n]+)\1\s*$/im);
  const current = m ? m[2].trim() : null;

  if (current === lastmodISO) {
    console.log(`✔️  ${rel(indexPath)} ist aktuell: ${lastmodISO}`);
    return;
  }

  console.log(`📝 ${rel(indexPath)} → lastmod: ${current ?? "<leer>"} → ${lastmodISO}`);

  const updated = upsertLastmod(fm, lastmodISO);
  if (DRY_RUN) return;

  await fs.writeFile(indexPath, updated, "utf8");

  if (STAGE) {
    try {
      await execFileAsync("git", ["add", indexPath], { windowsHide: true });
    } catch {
      // non-fatal
    }
  }
}

function rel(p: string) {
  const r = p.startsWith(process.cwd()) ? p.slice(process.cwd().length + 1) : p;
  return r.split(sep).join("/");
}

/* ========== Main ========== */

(async () => {
  console.log("🔍 Prüfe Bundle-Änderungen und aktualisiere lastmod (nur Bilder) …");
  const contentExists = await statSafe(CONTENT_DIR);
  if (!contentExists) {
    console.error(`❌ CONTENT_DIR nicht gefunden: ${CONTENT_DIR}`);
    process.exit(1);
  }

  let found = 0;
  for await (const dir of walkBundles(CONTENT_DIR)) {
    found++;
    await updateBundle(dir);
  }

  if (found === 0) {
    console.log("ℹ️  Keine Leaf-Bundles gefunden (Ordner mit index.md).");
  }

  console.log("✅ Fertig.");
})().catch((err) => {
  console.error("❌ Fehler:", err);
  process.exit(1);
});