#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
fixture="$root/tests/fixtures/invalid"
themes_dir=$(dirname -- "$root")
temporary_root=$(mktemp -d "${TMPDIR:-/tmp}/hugg-tests.XXXXXX")
trap 'rm -rf "$temporary_root"' EXIT HUP INT TERM

if ! cmp -s \
  "$root/node_modules/fslightbox/index.js" \
  "$root/assets/ext/fslightbox/fslightbox.js"; then
  echo "FAIL: Vendored fsLightbox does not match the pinned npm Basic version." >&2
  echo "Run npm run vendor:fslightbox after updating fslightbox." >&2
  exit 1
fi

echo "PASS: fsLightbox Basic vendor asset"

expect_failure() {
  name=$1
  content_dir=$2
  expected=$3
  output="$temporary_root/$name.log"

  if hugo \
    --source "$fixture" \
    --contentDir "$content_dir" \
    --themesDir "$themes_dir" \
    --destination "$temporary_root/$name-public" \
    >"$output" 2>&1; then
    echo "FAIL: $name build unexpectedly succeeded." >&2
    return 1
  fi

  if ! grep -F "$expected" "$output" >/dev/null; then
    echo "FAIL: $name did not report the expected validation error." >&2
    cat "$output" >&2
    return 1
  fi

  echo "PASS: $name"
}

expect_failure \
  "missing-type" \
  "content-missing-type" \
  'hugo-grid-gallery: invalid type "galleries" in galleries/missing-type/index.md; expected hugo-grid-gallery'
expect_failure \
  "missing-categories" \
  "content-missing-categories" \
  'hugo-grid-gallery: missing params.hugg.categories in galleries/missing-categories/index.md; expected a list, including [] when empty'
expect_failure \
  "duplicate-gallery-id" \
  "content-duplicate-gallery-id" \
  'hugo-grid-gallery: duplicate gallery identity invalid/duplicate-id'
expect_failure \
  "missing-card-entry" \
  "content-missing-card-entry" \
  'hugo-grid-gallery: invalid Gallery Card metadata match for invalid/missing-card-entry'

example_output="$temporary_root/example-public"
hugo \
  --source "$root/exampleSite" \
  --themesDir "$themes_dir" \
  --destination "$example_output" \
  --cleanDestinationDir \
  >/dev/null

if ! grep -F 'alt="03-orbits.jpg"' "$example_output/galleries/index.html" >/dev/null; then
  echo "FAIL: Gallery metadata cover was not selected." >&2
  exit 1
fi

echo "PASS: Gallery metadata cover"

if ! grep -F 'A role-filtered gallery used to verify story lists independently' \
  "$example_output/galleries/story-fixture/index.html" >/dev/null; then
  echo "FAIL: Story base metadata was not rendered." >&2
  exit 1
fi

game_card_count=$(grep -o 'class="hugg-gallery-entry"' \
  "$example_output/galleries/cards/index.html" | wc -l | tr -d ' ')
if [ "$game_card_count" -ne 2 ]; then
  echo "FAIL: Expected 2 role-filtered Game Cards, found $game_card_count." >&2
  exit 1
fi

echo "PASS: Unified Gallery metadata roles"

node "$root/tests/assert-example-dom.mjs" "$example_output"
