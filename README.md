# Thago — Landing Page

Landing page chia pudding Thago. Referensi interaksinya SPYLT versi lama
(Awwwards SOTD): scroll-driven storytelling dengan GSAP ScrollTrigger — pin,
scrub, horizontal scroll, clip-path reveal — tapi dengan kepribadian visual
Thago sendiri (bubbly, ungu/pink/lime, doodle).

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # output statis ke dist/
npm run preview
```

## Tech stack

- **Astro 7** — statis, zero JS by default. Yang dikirim ke browser cuma GSAP-nya.
- **Tailwind CSS v4** — token brand didefinisikan di `src/styles/global.css` (`@theme`).
- **GSAP 3** — ScrollTrigger, SplitText, DrawSVGPlugin (semua gratis sejak GSAP diakuisisi Webflow).
- **Lenis** — smooth scroll; inilah yang bikin gerakannya terasa "mahal".
- **Fontsource** — font self-hosted, subset latin saja.

## Font

| Peran | Font | Kenapa |
| --- | --- | --- |
| Display | Modak | Font logo asli Thago |
| Body | Fredoka | Rounded sans, satu keluarga visual dengan display, tetap terbaca |
| Aksen | Caveat | Untuk anotasi tulisan tangan seperti coretan di IG |

## Struktur section

| # | Section | Animasi utama |
| --- | --- | --- |
| 0 | Preloader | Huruf THAGO elastic stagger, tirai naik. < 2 detik. |
| 1 | Hero | SplitText per huruf, parallax berlapis saat scroll, bahan melayang ikut mouse |
| 2 | Manifesto | Kata menyala satu per satu mengikuti scroll (scrub) — signature move SPYLT |
| 3 | Varian | Desktop: pin + horizontal scroll + snap, warna panggung ikut kartu aktif. Mobile: native scroll-snap |
| 4 | Manfaat | Pin, cup berputar, 4 manfaat bergantian + bar progres |
| 5 | Nutrisi | Angka count-up sekali jalan + marquee |
| 6 | Mitos vs Fakta | Kartu flip 3D mengikuti scroll, juga bisa diklik |
| 7 | Video | Pin + clip-path lingkaran membesar penuh layar |
| 8 | Testimoni | Tiga kolom parallax beda kecepatan |
| 9 | CTA + Footer | SplitText bergelombang, tombol memantul, marquee logo |

## Catatan teknis penting

**Pakai `gsap.set()` + `.to()`, jangan `.from()`, untuk animasi yang dipicu
ScrollTrigger.** Tween `from` menyimpan nilai akhir dengan membaca kondisi
elemen saat tween dibuat. Kalau `ScrollTrigger.refresh()` sempat meng-invalidate
tween itu (dipanggil saat font selesai dimuat, window load, dan setiap resize),
nilai akhir yang terbaca justru kondisi awal yang sudah terlanjur dipasang —
akibatnya elemen dilaporkan "selesai dianimasikan" tapi tetap tersangkut di
posisi awal. Ini pernah terjadi pada tombol CTA. Dengan `set` + `to`, nilai
akhirnya eksplisit sehingga kebal terhadap invalidasi.

**Tween berulang tak berhingga jangan dimasukkan ke dalam timeline reveal.**
`repeat: -1` membuat durasi timeline jadi `Infinity` dan mengacaukan posisi
tween setelahnya. Buat sebagai tween terpisah (lihat `sections/cta.js`).

**Mobile ditangani lewat `gsap.matchMedia()`.** Horizontal scroll yang di-pin
diganti native scroll-snap, dan parallax kolom testimoni dimatikan. Konteks
matchMedia otomatis membersihkan semua animasi yang dibuat di dalamnya saat
breakpoint berubah.

**`prefers-reduced-motion` dihormati** — semua animasi dilewati, konten langsung
tampil, interaksi klik kartu mitos tetap jalan.

## Aset

Semua foto/video masih placeholder. Lihat [ASSETS.md](ASSETS.md) untuk daftar
lengkap apa yang dibutuhkan dan cara memasangnya.

## Struktur folder

```
src/
  components/        satu file per section
    ui/              komponen kecil dipakai ulang (Cup, Doodle, Fruit, MediaSlot, …)
  data/products.ts   data varian + link pemesanan  ← paling sering diedit
  layouts/Base.astro font, meta, SEO
  scripts/
    main.js          bootstrap: Lenis, registrasi plugin, panggil tiap section
    sections/        satu file animasi per section
  styles/global.css  token brand & utility
```
