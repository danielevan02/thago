/**
 * Memotret /og jadi public/og-image.png (1200×630) dan public/logo.png (512×512).
 *
 *   npm i -D playwright && npx playwright install chromium   # sekali saja
 *   npx astro dev --background                                # server harus hidup
 *   node scripts/build-og-image.mjs
 *   npx astro dev stop
 *
 * Playwright SENGAJA tidak dijadikan dependency tetap: berkas gambarnya sudah
 * ada di public/ dan ikut ter-commit, jadi build maupun deploy biasa tidak
 * membutuhkannya sama sekali. Yang perlu memasangnya hanya orang yang mau
 * membuat ulang gambarnya — mis. setelah ada varian baru atau warna brand
 * berubah — dan itu jarang.
 *
 * Pakai Chromium headless, bukan rasterizer SVG, karena wordmark THAGO dirakit
 * dari elemen <text> ber-font Modak (lihat src/data/wordmark.ts). Rasterizer
 * seperti resvg/librsvg hanya mengenal font yang terpasang di sistem, sedangkan
 * Modak di sini hidup sebagai woff2 di node_modules — hasilnya wordmark akan
 * jatuh ke font default dan logonya salah.
 *
 * Tata letaknya diedit di src/pages/og.astro, bukan di sini.
 */
import { chromium } from 'playwright';
import path from 'node:path';

const URL_OG = process.env.OG_URL ?? 'http://localhost:4321/og';
const OUT = path.join(process.cwd(), 'public');

/**
 * Playwright yang terpasang lewat npx bisa berbeda versi dengan browser yang
 * sudah ter-cache, jadi lokasinya boleh ditunjuk manual. Kosongkan kalau
 * `npx playwright install` sudah dijalankan.
 */
const EXECUTABLE = process.env.CHROMIUM_PATH || undefined;

const SHOTS = [
  { sel: '#og-card', file: 'og-image.png', w: 1200, h: 630 },
  { sel: '#og-logo', file: 'logo.png', w: 512, h: 512 },
];

const browser = await chromium.launch(EXECUTABLE ? { executablePath: EXECUTABLE } : {});
const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } });

const res = await page.goto(URL_OG, { waitUntil: 'networkidle' });
if (!res?.ok()) {
  console.error(`Tidak bisa membuka ${URL_OG} — jalankan dulu \`npx astro dev --background\`.`);
  await browser.close();
  process.exit(1);
}

// Tanpa ini wordmark sempat ter-render dengan font fallback saat dipotret.
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

for (const s of SHOTS) {
  const el = await page.$(s.sel);
  if (!el) {
    console.error(`  ${s.sel} tidak ditemukan di halaman`);
    continue;
  }
  await el.screenshot({ path: path.join(OUT, s.file) });
  console.log(`  public/${s.file}  ${s.w}×${s.h}`);
}

await browser.close();
