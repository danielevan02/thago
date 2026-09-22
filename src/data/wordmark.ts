/**
 * Penataan huruf wordmark THAGO.
 *
 * Logo aslinya bergaya stiker: tiap huruf punya garis tepi krem SENDIRI lalu
 * huruf-hurufnya saling bertindih sedikit, sehingga ada garis krem yang
 * memisahkan huruf satu dari yang lain. Itu tidak bisa dibuat dengan satu
 * elemen <text>: di sana stroke dicat sekali untuk seluruh kata, jadi garis
 * tepi antar huruf melebur dan hilang. Tiap huruf harus jadi elemen sendiri,
 * digambar berurutan kiri ke kanan supaya yang kanan menindih yang kiri.
 *
 * Karena tiap huruf ditempatkan manual, posisinya perlu lebar maju (advance)
 * tiap glyph. Angka di bawah diukur dari font Modak yang terpasang, memakai
 * canvas measureText pada font-size 100px.
 */

/** Lebar maju tiap huruf Modak, per 100px font-size. */
const ADVANCE: Record<string, number> = {
  T: 58.94,
  H: 62.74,
  A: 65.87,
  G: 65.63,
  O: 65.77,
};

/** Tinggi kapital Modak sebagai fraksi font-size (ascent ink huruf besar). */
export const CAP_HEIGHT = 0.646;

/**
 * Seberapa dalam huruf saling bertindih, fraksi font-size.
 *
 * Batas atasnya ditentukan huruf G: pada 0,05em ke atas, tepi O memakan palang
 * G sehingga terbaca sebagai "C". Pada 0,035em pemisah kremnya sudah tegas
 * seperti di logo asli, tapi tiap huruf masih utuh.
 */
export const OVERLAP = 0.035;

/** Lebar stroke garis tepi, fraksi font-size. Yang terlihat separuhnya. */
export const STROKE = 0.14;

/**
 * Kemiringan tiap huruf, derajat. Tandanya berselang-seling: huruf ganjil
 * miring ke kiri, huruf genap ke kanan — inilah yang membuat wordmark-nya
 * terasa melompat, bukan sekadar deretan huruf tebal.
 */
export const TILT = 5;

export interface Letter {
  ch: string;
  /** tepi kiri kotak maju huruf */
  x: number;
  /** derajat rotasi; negatif = miring ke kiri */
  tilt: number;
  /** titik putar mendatar — tengah kotak maju huruf */
  cx: number;
}

/**
 * Hitung posisi tiap huruf plus garis dasarnya, terpusat di dalam kotak
 * boxW × boxH pada ukuran font tertentu.
 *
 * Yang dipusatkan adalah bentuk BERGARIS TEPI, bukan hurufnya saja — stroke
 * menambah setengah lebarnya di tiap sisi, dan kalau diabaikan wordmark-nya
 * akan terlihat sedikit meleset ke kiri-atas.
 */
export function layoutWordmark(text: string, fontSize: number, boxW: number, boxH: number) {
  const chars = [...text];
  const steps = chars.map((c) => ((ADVANCE[c] ?? 60) / 100) * fontSize);
  const overlap = OVERLAP * fontSize;
  const stroke = STROKE * fontSize;

  // lebar sampai tepi maju huruf terakhir, tumpangan sudah dikurangi
  const width = steps.reduce((a, b) => a + b, 0) - overlap * (chars.length - 1);

  // Tepi kiri bentuk bergaris tepi = x0 - stroke/2, dan lebarnya width + stroke.
  // Menyetel keduanya agar terpusat menghasilkan x0 = (boxW - width) / 2 —
  // suku stroke-nya saling meniadakan.
  let cursor = (boxW - width) / 2;
  const letters: Letter[] = chars.map((ch, i) => {
    const x = cursor;
    cursor += steps[i] - overlap;
    // Diputar pada tengah huruf, bukan pada garis dasarnya: kalau tumpuannya
    // di garis dasar, kaki hurufnya diam sementara kepalanya mengayun jauh —
    // deretannya jadi terlihat berjatuhan, bukan melompat.
    return { ch, x, tilt: i % 2 === 0 ? -TILT : TILT, cx: x + steps[i] / 2 };
  });

  const capH = CAP_HEIGHT * fontSize;
  const baseline = (boxH - (capH + stroke)) / 2 + stroke / 2 + capH;

  return { letters, baseline, width, strokeWidth: stroke, capHeight: capH };
}
