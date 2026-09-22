/**
 * Menyiapkan foto produk mentah jadi aset web.
 *
 *   node scripts/build-product-photos.mjs <folder-foto-mentah>
 *
 * Foto mentah dari sesi foto: PNG 2624×3488, produk sudah di-cutout (kanvas
 * transparan), ~3 MB per file, dan produknya cuma mengisi sekitar sepertiga
 * bingkai. Script ini memotongnya ke kotak bersama, mengecilkan, lalu menulis
 * WebP ke public/products/. Sembilan foto turun dari ~30 MB jadi ~1,4 MB.
 *
 * KENAPA KOTAK CROP-NYA DIPAKAI BERSAMA, bukan bounding box masing-masing:
 * <Hero> menumpuk keenam cup di satu kotak dan menyilangfadekannya. Kalau tiap
 * foto dipotong pas di siluetnya sendiri, tiap varian akan punya skala dan
 * titik tumpu yang sedikit berbeda, dan cup-nya terlihat meloncat tiap
 * pergantian. Satu kotak untuk semua cup mempertahankan ukuran dan posisi
 * relatif apa adanya. Botol punya kotaknya sendiri karena siluetnya lain
 * (0,48:1 lawan 1,02:1).
 *
 * Angka kotaknya diukur dari gabungan bounding box alpha seluruh foto sesi
 * pertama, ditambah margin ~2,5%. Kalau sesi foto berikutnya memakai jarak
 * kamera yang berbeda, ukur ulang — bagian bawah file ini punya --measure
 * untuk itu.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = process.argv[2];
const DST = path.join(process.cwd(), 'public/products');

const CUP = { left: 381, top: 1358, width: 1798, height: 1764, out: 1100 };
const JUICE = { left: 818, top: 1219, width: 916, height: 1890, out: 640 };

/** Nama file mentah → id produk di src/data/products.ts */
const JOBS = [
  ['1', 'angry-prisson', JUICE],
  ['4', 'hulk-green', JUICE],
  ['7', 'red-wine', JUICE],
  ['2', 'chocolate-banana', CUP],
  ['3', 'green-tea-strawberry', CUP],
  ['5', 'overnight-oats', CUP],
  ['6', 'plain-dragon-fruit', CUP],
  ['8', 'strawberry', CUP],
  ['9', 'tiramisu', CUP],
];

/** Cetak bounding box alpha tiap foto — dipakai untuk menghitung ulang kotak crop. */
async function measure() {
  for (const [src] of JOBS) {
    const file = path.join(SRC, `${src}.png`);
    const { data, info } = await sharp(file)
      .ensureAlpha()
      .extractChannel('alpha')
      .raw()
      .toBuffer({ resolveWithObject: true });
    let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (data[y * info.width + x] > 12) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    console.log(`  ${src}.png  x ${x0}–${x1}  y ${y0}–${y1}  (${x1 - x0}×${y1 - y0})`);
  }
}

async function build() {
  await mkdir(DST, { recursive: true });
  let total = 0;
  for (const [src, id, box] of JOBS) {
    const height = Math.round((box.out * box.height) / box.width);
    const info = await sharp(path.join(SRC, `${src}.png`))
      .extract({ left: box.left, top: box.top, width: box.width, height: box.height })
      .resize(box.out, height, { fit: 'fill', kernel: 'lanczos3' })
      .webp({ quality: 86, alphaQuality: 90, effort: 6 })
      .toFile(path.join(DST, `${id}.webp`));
    total += info.size;
    console.log(`  ${id.padEnd(22)} ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
  console.log(`\n  total ${(total / 1024).toFixed(0)} KB untuk ${JOBS.length} foto`);
}

if (!SRC) {
  console.error('Pakai: node scripts/build-product-photos.mjs <folder-foto-mentah> [--measure]');
  process.exit(1);
}
await (process.argv.includes('--measure') ? measure() : build());
