# update-lastmod.sh - Für macOS, Linux
# Herausfinden ob sich Bilder in den Gallerien content/galleries geändert haben.
# Aktualisiert das lastmod Property im Frontmatter der jeweiligen index.md.
#
# Voraussetzungen:
# https://github.com/mikefarah/yq muss installiert sein: brew install yq
# ausführbar machen: chmod +x update-lastmod.sh
#
# einbinden in package.json zum Beispiel: "build": "./update-lastmod.sh && hugo --minify --gc"
#
# Damit das letztlich greift, müssen die geänderten Bilder im git commited sein.
# update-lastmod.sh
#!/bin/bash
set -e
set -euo pipefail

############################################
# Verzeichnisse (Globs erlaubt)
TARGET_DIRS=(
  "content/galleries/*/"
  "content/stories/*/"
)

############################################
# 
EXTENSIONS=('jpg' 'jpeg' 'png' 'webp' 'avif')
MAXDEPTH="${MAXDEPTH:-1}"
FRONTMATTER_DELIM='---'

echo "🔍 Prüfe Bundle-Änderungen und aktualisiere lastmod (nur Bilder)…"

process_bundle() {
  local dir="$1"
  local index="$dir/index.md"
  [[ -f "$index" ]] || return 0

  # Bilder einsammeln (nullbyte-sicher)
  local tmpfile
  tmpfile="$(mktemp)"

  # find-Argumente bauen
  local -a find_args=(-maxdepth "$MAXDEPTH" -type f \( )
  local first=1
  local ext
  for ext in "${EXTENSIONS[@]}"; do
    (( first == 0 )) && find_args+=(-o)
    find_args+=(-iname "*.${ext}")
    first=0
  done
  find_args+=( \) -print0 )

  # Dateien sammeln
  find "$dir" "${find_args[@]}" >"$tmpfile" 2>/dev/null || true

  # in Array lesen
  local -a files=()
  local f
  while IFS= read -r -d '' f; do
    files+=("$f")
  done <"$tmpfile"
  rm -f "$tmpfile"

  if [[ "${#files[@]}" -eq 0 ]]; then
    echo "⚠️  Keine Bilder in $dir – überspringe"
    return 0
  fi

  # letztes Änderungsdatum aus git
  local lastmod
  lastmod=$(git log -1 --format="%cI" -- "${files[@]}" 2>/dev/null || true)
  if [[ -z "${lastmod:-}" ]]; then
    echo "⚠️  Keine Commit-Infos zu Bildern in $dir – überspringe"
    return 0
  fi

  # Frontmatter-Grenzen
  local fm_start fm_end
  fm_start=$(grep -n "^${FRONTMATTER_DELIM}$" "$index" | sed -n '1p' | cut -d: -f1 || true)
  fm_end=$(grep -n "^${FRONTMATTER_DELIM}$" "$index" | sed -n '2p' | cut -d: -f1 || true)
  if [[ -z "${fm_start:-}" || -z "${fm_end:-}" || "$fm_end" -le "$fm_start" ]]; then
    echo "❌ Kein gültiges Frontmatter in $index – überspringe"
    return 0
  fi

  # aktuellen lastmod lesen
  local frontmatter body current_lastmod new_fm
  frontmatter=$(sed -n "$((fm_start+1)),$((fm_end-1))p" "$index")
  body=$(sed -n "$((fm_end+1)),\$p" "$index")
  current_lastmod=$(printf "%s\n" "$frontmatter" | grep '^lastmod:' | sed 's/^lastmod:[[:space:]]*//;s/"//g' || true)

  if [[ "$current_lastmod" == "$lastmod" ]]; then
    echo "✔️  $index ist aktuell: $lastmod"
    return 0
  fi

  echo "📝 $index → Aktualisiere lastmod: ${current_lastmod:-<leer>} → $lastmod"

  if printf "%s\n" "$frontmatter" | grep -q '^lastmod:'; then
    new_fm=$(printf "%s\n" "$frontmatter" | sed "s/^lastmod:.*/lastmod: \"$lastmod\"/")
  else
    new_fm=$(printf "%s\nlastmod: \"%s\"\n" "$frontmatter" "$lastmod")
  fi

  { printf "%s\n" "$FRONTMATTER_DELIM";
    printf "%s\n" "$new_fm";
    printf "%s\n" "$FRONTMATTER_DELIM";
    printf "%s\n" "$body";
  } > "$index"

  git add "$index" 2>/dev/null || true
}

any_found=0
shopt -s nullglob
for glob in "${TARGET_DIRS[@]}"; do
  for dir in $glob; do
    [[ -d "$dir" ]] || continue
    any_found=1
    process_bundle "$dir"
  done
done
shopt -u nullglob

if [[ "$any_found" -eq 0 ]]; then
  echo "ℹ️  Keine passenden Verzeichnisse gefunden. (TARGET_DIRS prüfen)"
fi

echo "✅ Fertig: lastmod ggf. aktualisiert."