// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Membuang komentar HTML dari hasil build.
 *
 * Komponen di proyek ini sengaja berkomentar panjang — itu dokumentasinya, dan
 * harus tetap ada di source. Tapi Astro mengirim komentar `<!-- -->` apa adanya
 * ke browser (yang dibuang cuma komentar gaya `{/* *\/}`), dan di halaman ini
 * jumlahnya 26 KB mentah alias 8,6 KB setelah gzip — sekitar 37% dari seluruh
 * transfer HTML, dikirim ke setiap pengunjung tanpa memberi mereka apa pun.
 *
 * Membuangnya di sini, bukan dengan menulis ulang 68 komentar jadi gaya JSX,
 * karena: source tetap terbaca apa adanya, tidak ada diff besar yang menutupi
 * perubahan sungguhan, dan halaman baru ikut bersih tanpa perlu diingat.
 *
 * Isi <script>, <style>, <pre>, dan <textarea> dikecualikan — di dalam sana
 * urutan karakter `<!--` bisa jadi data, bukan komentar.
 */
function stripHtmlComments() {
  const PROTECTED = /<(script|style|pre|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi;
  const COMMENT = /<!--(?!\[if)[\s\S]*?-->/g;

  async function* htmlFiles(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) yield* htmlFiles(full);
      else if (entry.name.endsWith('.html')) yield full;
    }
  }

  return {
    name: 'strip-html-comments',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        let saved = 0;
        for await (const file of htmlFiles(path.fromFileUrl?.(dir) ?? dir.pathname)) {
          const before = await readFile(file, 'utf8');

          const stash = [];
          const masked = before.replace(PROTECTED, (m) => `\u0000${stash.push(m) - 1}\u0000`);
          const after = masked
            .replace(COMMENT, '')
            .replace(/\u0000(\d+)\u0000/g, (_, i) => stash[Number(i)]);

          if (after.length < before.length) {
            await writeFile(file, after);
            saved += before.length - after.length;
          }
        }
        if (saved) logger.info(`komentar HTML dibuang: ${(saved / 1024).toFixed(1)} KB`);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://thago.id',
  integrations: [stripHtmlComments()],
  vite: {
    plugins: [tailwindcss()],
  },
});
