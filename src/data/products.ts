/**
 * Data produk Thago — dua lini yang sengaja dipisah.
 *
 *   products — chia pudding & overnight oats (cup 1.025:1)
 *   drinks   — cold pressed juice (botol 200ml, 0.477:1)
 *
 * DIPISAH, bukan satu array dengan field `category`, karena keduanya nyaris
 * tidak berbagi apa pun: makro cup diukur per cup (protein & serat jadi
 * jualannya), sementara botol menjual fungsi — label aslinya sendiri menyebut
 * "Daily Defense & Radiance Elixir", bukan angka gizi. Dipaksa satu tipe,
 * setengah fieldnya akan selalu kosong di satu sisi.
 *
 * Yang paling menentukan: <Hero> menumpuk seluruh `products` di satu kotak dan
 * menyilangfadekannya. Itu hanya mulus kalau semua siluetnya sebangun. Botol
 * yang jangkung tidak boleh masuk ke array itu — lihat ASSETS.md.
 *
 * ANGKA GIZI diambil dari stiker tutup cup asli (format label: Cals/Fiber/
 * Protein/Carbs/Fat). Label TIDAK memecah gula, yang tertulis "(use stevia)" —
 * karena itu klaim di seluruh situs adalah "tanpa gula tambahan", bukan
 * "0 g gula". Jangan diubah tanpa data lab.
 */

export type Nutrition = {
  kcal: number;
  protein: number;
  fiber: number;
  carbs: number;
  fat: number;
};

/**
 * Harga dalam rupiah penuh, bukan ribuan.
 *
 * WAJIB tampil di halaman, bukan cuma di JSON-LD. Google memperlakukan harga
 * yang ada di structured data tapi tidak terlihat pengunjung sebagai
 * pelanggaran policy, dan sanksinya markup produknya diabaikan seluruhnya.
 * Karena itu angka yang sama dipakai kartu varian, kartu botol, dan JSON-LD.
 */
export const PRICE = { pudding: 35000, juice: 25000 };

/** 35000 → "Rp 35.000" */
export const formatPrice = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

export type Product = {
  id: string;
  /** Persis seperti tercetak di stiker tutup — jangan diterjemahkan. */
  name: string;
  tagline: string;
  description: string;
  /** Rupiah penuh. Lihat catatan di `PRICE`. */
  price: number;
  /** Foto cutout transparan di /public/products. */
  photo: string | null;
  /** Warna panel kartu saat varian ini aktif di rel horizontal. */
  stage: string;
  /** Warna teks di atas `stage`. Semua pasangan sudah diverifikasi ≥ 4.5:1. */
  onStage: string;
  isNew?: boolean;
  nutrition: Nutrition;
  /**
   * Warna ilustrasi cup SVG — hanya dipakai kalau `photo` null. Sejak semua
   * foto asli masuk, ketiganya dibiarkan kosong dan <Cup> memakai defaultnya.
   */
  pudding?: string;
  puddingBottom?: string;
  topping?: string;
};

export type Drink = {
  id: string;
  name: string;
  /** Baris fungsi persis seperti tercetak di label botol. */
  elixir: string;
  /** Terjemahan bebas `elixir` ke bahasa sehari-hari. */
  tagline: string;
  /** Rupiah penuh. Lihat catatan di `PRICE`. */
  price: number;
  volume: string;
  photo: string | null;
  /** Warna jus, disampel langsung dari foto botolnya. */
  fill: string;
  /** Warna teks di atas `fill`. Sudah diverifikasi ≥ 4.5:1. */
  onFill: string;
  /**
   * Bahan — BELUM ADA. Panel samping botol tidak terbaca di foto dan menebak
   * isi produk makanan bukan urusan kode. Selama array ini kosong, barisnya
   * tidak dirender sama sekali (lihat Drinks.astro), jadi aman dibiarkan
   * sampai datanya datang.
   */
  ingredients: string[];
};

/**
 * Urutan kartu = irama warnanya, bukan abjad.
 * terang → gelap → sedang → terang → gelap → terang, supaya dua kartu
 * bersebelahan tidak pernah punya bobot yang sama saat rel bergerak.
 */
export const products: Product[] = [
  {
    id: 'strawberry',
    name: 'Strawberry',
    tagline: 'Manis kecutnya pas, nggak lebay.',
    description:
      'Chia pudding stroberi dengan potongan buah segar di atasnya. Warna pinknya dari stroberi asli — bukan pewarna.',
    price: PRICE.pudding,
    photo: '/products/strawberry.webp',
    // Pink brand (#e52c74) cuma 3.9:1 dengan krem — gagal untuk chip kecil.
    // Diturunkan ke raspberry ini supaya lolos 5.11:1 tanpa keluar keluarga warna.
    stage: '#c9185e',
    onStage: '#faf5e9',
    nutrition: { kcal: 227, protein: 9, fiber: 8, carbs: 32, fat: 8 },
  },
  {
    id: 'chocolate-banana',
    name: 'Chocolate with Banana',
    tagline: 'Cokelat pekat ketemu pisang.',
    description:
      'Cokelat bubuk murni yang pekat, ditemani irisan pisang yang bikin manisnya datang sendiri. Dessert tanpa rasa bersalah.',
    price: PRICE.pudding,
    photo: '/products/chocolate-banana.webp',
    stage: '#43281a',
    onStage: '#f6d43c',
    nutrition: { kcal: 237, protein: 12, fiber: 13, carbs: 33, fat: 10 },
  },
  {
    id: 'green-tea-strawberry',
    name: 'Green Tea with Strawberry',
    tagline: 'Pahit tipis, manisnya nyusul.',
    description:
      'Green tea yang earthy diseimbangkan potongan stroberi di atasnya. Kedengaran aneh, ternyata nagih.',
    price: PRICE.pudding,
    photo: '/products/green-tea-strawberry.webp',
    stage: '#546e29',
    onStage: '#faf5e9',
    nutrition: { kcal: 223, protein: 12, fiber: 11, carbs: 28, fat: 8 },
  },
  {
    id: 'plain-dragon-fruit',
    name: 'Plain with Dragon Fruit',
    tagline: 'Polos, jujur, apa adanya.',
    description:
      'Chia pudding tanpa perasa, dimahkotai buah naga merah. Buat yang suka rasa bersih tanpa distraksi.',
    price: PRICE.pudding,
    photo: '/products/plain-dragon-fruit.webp',
    stage: '#f2ead6',
    onStage: '#2f1b9c',
    nutrition: { kcal: 196, protein: 9, fiber: 8, carbs: 28, fat: 8 },
  },
  {
    id: 'tiramisu',
    name: 'Tiramisu',
    tagline: 'Dessert kafe, versi yang nggak bikin nyesel.',
    description:
      'Kopi dan cocoa di atas chia pudding yang lembut. Rasanya tiramisu, isinya tetap serat dan protein.',
    price: PRICE.pudding,
    photo: '/products/tiramisu.webp',
    stage: '#5e2ca5',
    onStage: '#faf5e9',
    nutrition: { kcal: 284, protein: 11, fiber: 8, carbs: 26, fat: 17 },
  },
  {
    id: 'overnight-oats',
    name: 'Overnight Oats',
    tagline: 'Sarapan yang nunggu kamu bangun.',
    description:
      'Oat direndam semalaman sampai lembut sempurna, ditumpuk chia dan buah naga. Tinggal ambil dari kulkas.',
    price: PRICE.pudding,
    photo: '/products/overnight-oats.webp',
    stage: '#b4d63c',
    onStage: '#241463',
    // PLACEHOLDER: stiker tutup overnight oats dicetak terang di atas terang
    // dan angkanya tidak terbaca di foto mana pun. Ini satu-satunya varian yang
    // makronya masih karangan — ganti begitu labelnya kebaca.
    nutrition: { kcal: 245, protein: 10, fiber: 9, carbs: 34, fat: 9 },
  },
];

/**
 * Cold pressed juice.
 *
 * Tidak ada padanan `isNew` di sini dan itu disengaja: yang baru bukan salah
 * satu botol, tapi seluruh lininya — jadi penandanya satu stiker "lini baru"
 * di judul section, bukan tiga stiker identik di tiga kartu bersebelahan.
 */
export const drinks: Drink[] = [
  {
    id: 'angry-prisson',
    name: 'Angry Prisson',
    elixir: 'Daily Defense & Radiance Elixir',
    tagline: 'Buat badan yang gampang drop.',
    price: PRICE.juice,
    volume: '200 ml',
    photo: '/products/angry-prisson.webp',
    fill: '#fea001',
    // Satu-satunya botol yang teksnya gelap: krem di atas oranye ini cuma
    // 1.88:1. Label aslinya memang putih, tapi di sana hurufnya sebesar telapak
    // tangan — di layar, chip 12px tidak dapat keringanan yang sama.
    onFill: '#241463',
    ingredients: [],
  },
  {
    id: 'hulk-green',
    name: 'Hulk Green',
    elixir: 'Digestive & Hydration Elixir',
    tagline: 'Buat perut yang lagi nggak enak.',
    price: PRICE.juice,
    volume: '200 ml',
    photo: '/products/hulk-green.webp',
    fill: '#536516',
    onFill: '#faf5e9',
    ingredients: [],
  },
  {
    id: 'red-wine',
    name: 'Red Wine',
    elixir: 'Stamina & Circulation Elixir',
    tagline: 'Buat hari yang butuh tenaga ekstra.',
    price: PRICE.juice,
    volume: '200 ml',
    photo: '/products/red-wine.webp',
    fill: '#5d2b27',
    onFill: '#faf5e9',
    ingredients: [],
  },
];

/** Nomor WhatsApp pemesanan, format internasional tanpa tanda baca. */
export const WHATSAPP = '6282140680152';

/**
 * Jam menerima pesanan, format 24 jam.
 *
 * Sumbernya listing GrabFood. Ditulis di sini supaya satu angka dipakai
 * bersama oleh teks di section pemesanan dan `hoursAvailable` di JSON-LD —
 * jam buka yang berbeda antara halaman dan structured data adalah salah satu
 * hal pertama yang bikin markup diabaikan.
 */
export const HOURS = { opens: '09:00', closes: '21:00' };

/**
 * Link pemesanan.
 *
 * WhatsApp, Instagram, dan GrabFood sudah asli. GoFood dan ShopeeFood masih '#'
 * karena belum terdaftar — selama itu tombolnya tidak melakukan apa pun.
 * Keduanya otomatis tidak dirender di section pemesanan (lihat CtaFooter),
 * jadi tidak ada tombol mati yang sampai ke pengunjung.
 */
export const orderLinks = {
  whatsapp: `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Halo Thago! Aku mau pesan.')}`,
  gofood: '#',
  grabfood: 'https://food.grab.com/id/id/restaurant/thago-marga-sari-delivery/6-C741V3UVUFAKDE',
  shopeefood: '#',
  instagram: 'https://instagram.com/thago.id',
};
