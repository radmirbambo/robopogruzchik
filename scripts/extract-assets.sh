#!/usr/bin/env bash
# Фото для лендинга из презентаций компании → site/src/assets/.
# В PDF есть внутренние цены: отсюда берём только картинки, ни текста, ни чисел.
# materials/ в .gitignore. По умолчанию ищем его в корне основного checkout (работает и из git worktree),
# MATERIALS_DIR=/путь/к/materials переопределяет.
# Нужны poppler (pdfimages, pdftoppm) и python3 с Pillow. Запуск из любой папки: bash site/scripts/extract-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${MATERIALS_DIR:-}" ]]; then
  common=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)
  MATERIALS_DIR=${common:+$(dirname "$common")/materials}
fi
M=${MATERIALS_DIR:-../materials}
A=src/assets
for f in deck-novator.pdf russian-fmr.pdf; do
  [[ -f "$M/$f" ]] || { echo "Нет $M/$f — укажите MATERIALS_DIR" >&2; exit 1; }
done
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$A"

# Номера картинок — порядок в PDF (pdfimages -list), сверен глазами со слайдами
pdfimages -all -f 1 -l 1 "$M/deck-novator.pdf" "$T/d1"  && cp "$T/d1-005.jpg" "$A/robots.jpg"
pdfimages -all -f 4 -l 4 "$M/deck-novator.pdf" "$T/d4"  && cp "$T/d4-002.jpg" "$A/render-pak.jpg"
pdfimages -all -f 7 -l 8 "$M/russian-fmr.pdf" "$T/f7"   && cp "$T/f7-000.jpg" "$A/mvp-1.jpg" && cp "$T/f7-001.jpg" "$A/mvp-2.jpg" && cp "$T/f7-002.jpg" "$A/mvp-3.jpg"

# Слайд 14 «Команда»: в PDF портреты идут не в порядке слайда
pdfimages -all -f 14 -l 14 "$M/deck-novator.pdf" "$T/team"
cp "$T/team-006.jpg" "$A/team-gavrilov.jpg"
cp "$T/team-008.jpg" "$A/team-yakushkova.jpg"
cp "$T/team-005.jpg" "$A/team-antipov.jpg"
cp "$T/team-004.jpg" "$A/team-matalygin.jpg"
# На двух кадрах читаются чужие логотипы — убираем их (team-leus.jpg, team-roshchin.jpg)
python3 - "$T" "$A" <<'PY'
import sys
from PIL import Image, ImageChops, ImageFilter
T, A = sys.argv[1:3]

def load(name, size):
    im = Image.open(f'{T}/{name}').convert('RGB')
    if im.size != size:
        sys.exit(f'{name}: неожиданный размер {im.size}')
    return im

# Леус снят на сцене выставки: на синем заднике логотипы организаторов, одно слово — прямо за головой,
# так что одного кропа мало. Кроп по плечи (квадрат, как остальные) + размытый задник.
# Маска задника — яркий синий; закрытие (расширение, затем сужение) поглощает белые штрихи букв внутри синего.
im = load('team-003.jpg', (262, 262)).crop((22, 30, 192, 200))
r, g, b = im.split()
blue = ImageChops.multiply(b.point(lambda v: 255 if v > 110 else 0),
                           ImageChops.subtract(b, r).point(lambda v: 255 if v > 50 else 0))
mask = blue.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))
top = Image.new('L', im.size, 0)
top.paste(255, (0, 0, im.width, 120))  # ниже — белое кресло и стол, их не трогаем
mask = ImageChops.multiply(mask, top).filter(ImageFilter.GaussianBlur(1.5))
Image.composite(im.filter(ImageFilter.GaussianBlur(10)), im, mask).save(f'{A}/team-leus.jpg', quality=90, optimize=True)

# У Рощина внизу тележки читается марка производителя — размываем этот угол с мягким краем
im = load('team-002.jpg', (256, 256))
box = (214, 202, 254, 226)
patch = im.crop(box).filter(ImageFilter.GaussianBlur(4))
edge = Image.new('L', patch.size, 0)
edge.paste(255, (3, 3, patch.width - 3, patch.height - 3))
im.paste(patch, box[:2], edge.filter(ImageFilter.GaussianBlur(2)))
im.save(f'{A}/team-roshchin.jpg', quality=90, optimize=True)
PY

# Слайд 9: патенты, свидетельства и лицензия МФТИ. Рендер 150 dpi = 2000×1125; берём только документы
# (без заголовка, логотипа и подписей слайда) на фоне bg2 сайта, чтобы картинка сливалась с карточкой.
pdftoppm -f 9 -l 9 -r 150 -png -singlefile "$M/deck-novator.pdf" "$T/p9"
python3 - "$T/p9.png" "$A/license.jpg" <<'PY'
import sys
from PIL import Image
src, dst = sys.argv[1:3]
page = Image.open(src).convert('RGB')
if page.size != (2000, 1125):
    sys.exit(f'license: неожиданный размер рендера {page.size}')
out = Image.new('RGB', page.size, (0x1C, 0x1F, 0x23))
# Патенты слева, свидетельства на товарный знак по центру, свидетельства на ПО справа
for box in ((0, 289, 870, 931), (868, 179, 1175, 985), (1172, 289, 2000, 929)):
    out.paste(page.crop(box), box[:2])
out.crop((0, 169, 2000, 995)).save(dst, quality=85, optimize=True, progressive=True)
PY

ls -la "$A"
