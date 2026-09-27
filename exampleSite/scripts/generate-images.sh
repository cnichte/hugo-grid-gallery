#!/bin/sh
set -eu

if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick is required to generate the example images." >&2
  exit 1
fi

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
example="$root/content/galleries/example-gallery"
game="$root/content/galleries/game-fixture"
game_two="$root/content/galleries/game-fixture-two"
story="$root/content/galleries/story-fixture"
alpha="$root/content/collections/alpha/shared-gallery"
nested="$root/content/collections/alpha/nested/shared-gallery"
beta="$root/content/collections/beta/shared-gallery"

rm -f "$example"/*.png "$example"/*.jpg
rm -f "$game"/*.png "$game"/*.jpg
rm -f "$game_two"/*.png "$game_two"/*.jpg
rm -f "$story"/*.png "$story"/*.jpg
rm -f "$alpha"/*.png "$alpha"/*.jpg
rm -f "$nested"/*.png "$nested"/*.jpg
rm -f "$beta"/*.png "$beta"/*.jpg

magick -size 1200x800 gradient:'#f7e6a1-#e75b4d' \
  -fill '#17324d' -draw 'polygon 0,650 430,230 760,610 1200,280 1200,800 0,800' \
  -fill '#fff4d6' -draw 'circle 930,180 930,70' "$example/01-cover.jpg"
magick -size 960x1200 gradient:'#16324f-#68b0ab' \
  -fill '#f4d35e' -draw 'rectangle 120,120 330,1080' \
  -fill '#ee964b' -draw 'rectangle 390,260 600,1080' \
  -fill '#f95738' -draw 'rectangle 660,430 870,1080' "$example/02-columns.jpg"
magick -size 1400x900 xc:'#f5f1e8' \
  -stroke '#1f6f78' -strokewidth 34 -fill none \
  -draw 'circle 700,450 700,120 circle 700,450 700,220 circle 700,450 700,320' \
  -fill '#e63946' -stroke none -draw 'circle 700,450 700,400' "$example/03-orbits.jpg"
magick -size 1200x800 gradient:'#101820-#355c7d' \
  -fill '#f67280' -draw 'polygon 0,690 350,250 590,690' \
  -fill '#c06c84' -draw 'polygon 390,690 730,120 1050,690' \
  -fill '#f8b195' -draw 'polygon 820,690 1040,390 1200,610 1200,800 820,800' "$example/04-peaks.jpg"

magick -size 1200x800 gradient:'#14213d-#4361ee' \
  -fill '#fca311' -draw 'rectangle 110,130 390,670' \
  -fill '#e5e5e5' -draw 'rectangle 470,240 750,670' \
  -fill '#4cc9f0' -draw 'rectangle 830,350 1110,670' "$game/01-cover.jpg"
magick -size 900x1200 gradient:'#03045e-#00b4d8' \
  -fill '#ffd166' -draw 'circle 450,310 450,150' \
  -fill '#073b4c' -draw 'polygon 0,1200 0,920 250,690 470,880 700,570 900,760 900,1200' "$game/02-levels.jpg"

magick -size 1200x800 gradient:'#264653-#2a9d8f' \
  -fill '#e9c46a' -draw 'polygon 0,800 260,350 520,680 790,220 1200,690 1200,800' \
  -fill '#e76f51' -draw 'circle 930,170 930,70' "$game_two/01-cover.jpg"

magick -size 1200x800 gradient:'#582f0e-#c38e70' \
  -fill '#ffedd8' -draw 'polygon 0,800 0,500 270,250 530,560 800,190 1200,540 1200,800' \
  -fill '#6f1d1b' -draw 'circle 930,180 930,80' "$story/01-cover.jpg"
magick -size 900x1200 gradient:'#6f1d1b-#bb9457' \
  -stroke '#ffe6a7' -strokewidth 22 -fill none \
  -draw 'line 140,180 760,180 line 140,390 760,390 line 140,600 760,600 line 140,810 760,810 line 140,1020 760,1020' \
  -fill '#432818' -stroke none -draw 'circle 450,600 450,520' "$story/02-chapters.jpg"

magick -size 1200x800 gradient:'#f6bd60-#f28482' \
  -fill '#2b2d42' -draw 'rectangle 0,570 1200,800' \
  -fill '#fff3b0' -draw 'circle 600,390 600,160' "$alpha/01-cover.jpg"
magick -size 1200x800 xc:'#84a59d' \
  -fill '#f7ede2' -draw 'polygon 0,800 0,560 340,310 590,560 850,180 1200,520 1200,800' \
  -fill '#f28482' -draw 'circle 980,150 980,55' "$alpha/02-ridge.jpg"
magick -size 900x1200 gradient:'#f5cac3-#84a59d' \
  -fill '#354f52' -draw 'polygon 0,1200 0,890 190,740 360,860 590,570 900,820 900,1200' \
  -fill '#f6bd60' -draw 'circle 220,250 220,120' "$alpha/03-valley.jpg"
magick -size 1400x900 xc:'#f7ede2' \
  -stroke '#457b9d' -strokewidth 26 -fill none \
  -draw "path 'M 80,700 C 330,120 520,780 760,250 C 950,-40 1110,620 1340,180'" \
  -stroke '#e76f51' -strokewidth 12 -draw 'line 80,760 1340,760' "$alpha/04-current.jpg"

magick -size 1200x800 gradient:'#253237-#5c6b73' \
  -fill '#c2dfe3' -draw 'polygon 0,800 0,610 280,390 520,600 790,250 1200,590 1200,800' \
  -fill '#f4a261' -draw 'circle 910,170 910,70' "$nested/01-cover.jpg"
magick -size 900x1200 gradient:'#9db4c0-#e0fbfc' \
  -stroke '#253237' -strokewidth 24 -fill none \
  -draw 'rectangle 110,130 790,1070 rectangle 220,260 680,940 rectangle 330,390 570,810' "$nested/02-depth.jpg"

magick -size 1200x800 gradient:'#0b132b-#3a506b' \
  -fill '#5bc0be' -draw 'polygon 0,800 250,370 430,610 720,180 1200,700 1200,800' \
  -fill '#f4f1de' -draw 'circle 930,170 930,75' "$beta/01-cover.jpg"
magick -size 1200x800 xc:'#1c2541' \
  -stroke '#5bc0be' -strokewidth 18 -fill none \
  -draw 'line 0,120 1200,120 line 0,280 1200,280 line 0,440 1200,440 line 0,600 1200,600 line 170,0 170,800 line 430,0 430,800 line 690,0 690,800 line 950,0 950,800' \
  -fill '#f25f5c' -stroke none -draw 'circle 690,440 690,360' "$beta/02-grid.jpg"
magick -size 960x1200 gradient:'#240046-#5a189a' \
  -fill '#00b4d8' -draw 'polygon 0,950 250,540 470,810 720,320 960,670 960,1200 0,1200' \
  -fill '#ffd166' -draw 'circle 210,230 210,110' "$beta/03-night.jpg"
magick -size 1400x900 xc:'#0b132b' \
  -stroke '#6fffe9' -strokewidth 24 -fill none \
  -draw 'arc 180,100 1220,820 205,515 arc 330,210 1070,710 210,510' \
  -fill '#ff6b6b' -stroke none -draw 'circle 700,450 700,390' "$beta/04-arcs.jpg"

printf 'Generated 19 example images.\n'
