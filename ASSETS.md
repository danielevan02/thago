# Daftar Aset Thago

Foto produk sudah masuk semua. Yang tersisa tinggal logo vektor, link
pemesanan, dan beberapa lubang data yang ditandai di bawah.

## Dua lini produk

Keduanya sengaja dipisah di `src/data/products.ts` dan punya section sendiri —
lihat komentar di file itu untuk alasannya.

| Lini | Kemasan | Rasio foto | Data | Section |
| --- | --- | --- | --- | --- |
| Chia pudding & overnight oats | cup | 1,02:1 | `products` (6) | `Products.astro` → `#varian` |
| Cold pressed juice | botol 200 ml | 0,48:1 | `drinks` (3) | `Drinks.astro` → `#minuman` |

**Botol tidak boleh dimasukkan ke array `products`.** `Hero.astro` menumpuk
seluruh isi array itu di satu kotak dan menyilangfadekannya; siluet botol yang
jangkung akan terlihat meloncat di tiap pergantian.

## Foto produk — SUDAH

Sembilan foto cutout ada di `public/products/*.webp`, total ~1,4 MB (dari ~30 MB
mentah).

### Kalau ada sesi foto baru

```
node scripts/build-product-photos.mjs <folder-foto-mentah>
node scripts/build-product-photos.mjs <folder-foto-mentah> --measure   # cek bounding box
```

Yang harus dijaga saat memotret:

- **Cutout dengan latar transparan.** Sesi pertama sudah begini dan hasilnya
  bersih di atas panel warna apa pun.
- **Satu sesi, satu jarak kamera, satu sudut per lini.** Script memotong semua
  cup dengan satu kotak yang sama (dan semua botol dengan satu kotak lain),
  justru supaya skala relatif antar varian tetap utuh. Kalau jarak kameranya
  berubah, jalankan `--measure` lalu perbarui konstanta `CUP`/`JUICE` di script.
- Cup harus bersih — tidak ada embun atau sidik jari. Foto ditampilkan besar.

## Yang masih kurang

| Aset | Kenapa perlu | Tempatnya |
| --- | --- | --- |
| ⚠️ **Makro Overnight Oats** | Satu-satunya varian yang angkanya masih karangan — stikernya dicetak terang di atas terang dan tidak terbaca di foto | `src/data/products.ts` → `overnight-oats.nutrition` |
| ⚠️ **Konfirmasi makro Chocolate with Banana** | Terbaca 237 kkal / 13 g serat / 33 g karbo, tapi digit 3 dan 5 nyaris sama di resolusi itu | `src/data/products.ts` |
| **Bahan tiap juice** | Panel samping botol tidak terbaca di foto. Selama `ingredients` kosong, barisnya tidak dirender — jadi aman, cuma kartunya lebih sepi | `src/data/products.ts` → `drinks[].ingredients` |
| **Logo Thago** | SVG/AI vektor. Wordmark sekarang dirakit dari font Modak di `ui/Logo.astro`, jadi bentuknya bergantung font itu — vektor aslinya akan lebih aman | `src/components/ui/Logo.astro` |
| **Link GoFood/GrabFood/ShopeeFood** | Masih `'#'`. WhatsApp & Instagram sudah asli | `src/data/products.ts` → `orderLinks` |
| ⚠️ **Nama asli pemberi testimoni** | Tiga kartu pertama menampilkan wajah DAN suara orang sungguhan, tapi labelnya masih nama karangan (Dinda, Raka, Nabila). Minta izin, lalu ganti — sebelum dipublikasikan | `src/components/Testimonials.astro` → `name` |
| **3 dari 6 reel testimoni** | Tiga sudah masuk. Kalau memang cuma ada tiga, kurangi jumlah kartunya daripada menampilkan kotak "Video menyusul" | `src/components/Testimonials.astro` → array `cards` |
| Cutout bahan mentah | Menggantikan ilustrasi buah melayang di Hero | `src/components/ui/Fruit.astro` |

## Soal klaim gula

Stiker tutup cup **tidak memecah gula** — yang tertulis "(use stevia)" dan
karbohidrat total (26–33 g, datang dari buah, susu, dan oat). Karena itu seluruh
klaim di situs berbunyi **"tanpa gula tambahan"**, bukan "0 g gula":

- stempel di `Nutrition.astro`
- baris tulisan tangan di tiap kartu varian
- baris "Gula Tambahan" di label gizi

Jangan dikembalikan ke "0 g gula" tanpa hasil uji lab.

## Angka gizi

Diambil dari stiker tutup asli dan disimpan **sekali saja** di
`src/data/products.ts`. `Nutrition.astro` menurunkan barisnya dan menghitung
%AKG sendiri dari acuan BPOM 2150 kkal — jadi cukup ubah satu tempat.

Label gizi raksasa itu menampilkan **satu varian** (yang pertama di array,
cup-nya juga yang mengintip di sebelah kartu), bukan rata-rata: rentang antar
varian terlalu lebar untuk dirata-ratakan dengan jujur, 196 kkal di Plain sampai
284 di Tiramisu.

## Aset yang sudah ada

- `/video/hero.mp4` — 730×720, 736 KB
- `/video/testi-1..3.mp4` — masing-masing 12 detik
- `/photo/nutrition-macro.jpg` — 600×600, 32 KB

## Yang tidak perlu disiapkan

Doodle (panah, coretan, bintang, sparkle), blob background, ikon manfaat, badge
MYTH/FACT, dan pola gelombang antar-section semuanya sudah dibuat sebagai SVG di
dalam kode. Ilustrasi cup SVG (`ui/Cup.astro`) juga masih ada sebagai jaring
pengaman kalau suatu saat `photo` dikosongkan lagi.

## SEO

Sudah terpasang: JSON-LD `Organization` + `WebSite` + `ItemList` (9 produk
berharga), `robots.txt`, `sitemap.xml`, OG/Twitter lengkap dengan URL absolut.

**Tipe schema-nya `Organization`, bukan `LocalBusiness`** — usaha rumahan tanpa
outlet, dan `LocalBusiness` mewajibkan `address` yang berarti alamat rumah
tertulis permanen di source halaman. Alasan lengkapnya di
`src/components/StructuredData.astro`. Kalau nanti ada outlet, barulah naik
tipe dengan alamat outlet itu.

**Harga di JSON-LD wajib sama dengan yang tampil di kartu.** Keduanya membaca
`price` dari `products.ts`, jadi tidak bisa berselisih. Jangan menaruh harga di
markup tanpa menampilkannya — Google memperlakukan itu sebagai pelanggaran
policy dan mengabaikan seluruh markup produknya.

### OG image

`public/og-image.png` (1200×630) dan `public/logo.png` (512×512) dihasilkan dari
halaman `/og`, bukan digambar tangan — jadi wordmark, warna, dan fotonya selalu
ikut brand yang berlaku di kode. Tata letaknya diedit di `src/pages/og.astro`.
Cara membuat ulang ada di `scripts/build-og-image.mjs`.

### Yang masih bisa ditambah

- **`areaServed`** di `StructuredData.astro` — sengaja dikosongkan sampai area
  pengirimannya dipastikan. Cukup level kota, tanpa alamat jalan.
- **Google Business Profile** tipe *service-area business* — di luar repo ini,
  tapi untuk usaha rumahan F&B dampaknya jauh melebihi structured data. Tipe itu
  memang dirancang untuk yang mengantar tanpa alamat publik.
- **Halaman per varian** — kalau nanti dibuat, `Product` markup baru berpeluang
  muncul sebagai rich result. Di satu halaman berisi 9 produk, Google jarang
  merendernya.
