import gsap from 'gsap';

/**
 * Video pin — panggungnya ditempelkan dengan `position: sticky` di markup,
 * BUKAN dengan `pin: true`. Timeline di sini cuma men-scrub apa yang terjadi
 * selama ia menempel.
 *
 *  - Desktop, dua babak:
 *      MENGEMBANG  50vh   lingkaran 6% → 100%, caption memudar.
 *      TAHAN      100vh   fullscreen; di sinilah testimoni merangkak menutupi.
 *  - Scrub 1.5 — berat, videonya terasa "mengambang" mengejar scroll.
 *  - Mobile: tanpa lingkaran sama sekali, video penuh sejak awal.
 *
 * TIDAK ADA BABAK PERJALANAN, dan itu keputusan setelah membaca sumbernya.
 * Dua versi sempat dibuat dengan lingkaran yang "mengikuti pembaca" sebelum
 * mengembang; keduanya salah. VideoPinCompo di SPYLT tidak punya fase itu sama
 * sekali — pin mulai, lingkaran langsung mengembang, selesai. Yang membuatnya
 * terasa hidup di sana adalah KECEPATAN: `duration: 5` dari total 15 pada
 * rentang 136vh, jadi sekitar 45vh saja. Versi kita sempat 120vh — 2,6 kali
 * lebih lambat, dan itu yang terbaca sebagai berlarut-larut.
 *
 * Kondisi awal clip dipasang di sini per breakpoint, bukan di markup — jadi
 * tanpa JS / reduced-motion video tampil penuh, tidak terjebak jadi titik.
 *
 * SATUAN WAKTU: 1 satuan timeline = 10vh scroll. Total durasi HARUS sama dengan
 * (tinggi track − tinggi panggung) di VideoPin.astro:
 *   desktop 15 satuan = 150vh  ↔  track 260svh − panggung 110svh
 *   mobile  18 satuan = 180vh  ↔  track 280svh − panggung 100svh
 */

/**
 * Section sesudah video ditarik ke atas sebesar satu layar penuh supaya ia
 * MENIMPA video yang masih ter-pin, seperti `marginTop: -190vh` di referensi.
 *
 * Kenapa margin statis, bukan di-tween seperti referensi: ScrollTrigger
 * mengukur posisi semua trigger saat refresh. Kalau margin-nya berubah selama
 * scroll, semua pemicu DI DALAM section testimoni jadi salah tempat — itulah
 * akar bug "kartu muncul sebelum kata ketiga terbaca" di referensi. Dengan
 * margin statis, layout tetap, pengukuran benar, dan hasil visualnya sama:
 * video membeku di belakang sementara testimoni merangkak naik menutupinya.
 *
 * NILAINYA = TINGGI PANGGUNG, bukan panjang babak HOLD.
 *
 * Sempat disamakan dengan HOLD (100vh) sementara panggung desktop sudah 110svh,
 * dan akibatnya panggung lepas menempel 10vh SEBELUM testimoni menutup layar —
 * persis celah yang diperingatkan paragraf di atas. Turunannya:
 *
 *   puncak testimoni  = puncak section + tinggi track − OVERLAP
 *   panggung lepas di = puncak section + tinggi track − tinggi panggung
 *
 * Kedua baris itu hanya berimpit kalau OVERLAP = tinggi panggung. Karena tinggi
 * panggung beda per breakpoint, nilainya pun beda.
 */
const OVERLAP = { desktop: '-110vh', mobile: '-100vh' };

export default function initVideoPin() {
  const section = document.querySelector('[data-videopin]');
  if (!section) return;

  // Dipasang dari JS, bukan CSS: tanpa JS panggungnya menempel tanpa animasi
  // apa pun, jadi margin negatif ini cuma akan menelan section video sendiri.
  //
  // Dipasang sebagai margin-BOTTOM di section video, bukan margin-top di
  // section testimoni, karena testimoni itu ter-pin: GSAP memindahkan margin
  // elemen yang di-pin ke `pin-spacer` lalu menolkan margin aslinya, sehingga
  // nilainya bisa hilang pada refresh berikutnya.
  //
  // Nilainya dipasang di dalam masing-masing breakpoint di bawah, karena ia
  // mengikuti tinggi panggung yang berbeda antara desktop dan mobile.

  const track = section.querySelector('[data-videopin-track]');
  const bg = section.querySelector('[data-videopin-bg]');
  const pin = section.querySelector('[data-videopin-pin]');
  const clip = section.querySelector('[data-videopin-clip]');
  const caption = section.querySelector('[data-videopin-caption]');
  const overlay = section.querySelector('[data-videopin-overlay]');
  const badge = section.querySelector('[data-videopin-badge]');
  const video = section.querySelector('video');
  if (!track || !pin || !clip) return;

  /**
   * Pemutaran dipisah dari timeline pin, DAN dari ScrollTrigger sama sekali.
   *
   * Tiga kesalahan yang sudah dilewati, ketiganya jangan diulang:
   *
   *  1. play() menumpang trigger pin yang mulai di 'top top' — titik yang sama
   *     persis dengan awal animasi lingkaran. Video baru men-decode tepat pada
   *     frame ia terlihat, jadi isi lingkaran kecil itu gambar beku dulu.
   *
   *  2. ScrollTrigger sendiri dengan end 'bottom top'. Tinggi section ini
   *     TUMBUH 220% begitu GSAP menyisipkan pin-spacer, jadi 'bottom' yang
   *     terukur tidak sama dengan ujung section yang sebenarnya — videonya
   *     berhenti di tengah jalan, sekitar saat lingkaran selesai membuka dan
   *     teks CTA masuk.
   *
   *  3. rootMargin satu layar, untuk "mendahului" masalah (1). Klip ini sebuah
   *     PROGRESI — mulai product shot berlogo, dolly maju sampai jadi makro
   *     rapat. Memutarnya sebelum terlihat berarti bagian pembukanya habis
   *     sebelum ada yang menonton. Yang perlu siap lebih awal itu datanya,
   *     bukan pemutarannya, dan itu sudah dijawab preload="auto" di MediaSlot.
   *
   * IntersectionObserver membaca keterlihatan elemen videonya langsung, jadi ia
   * kebal terhadap perubahan tinggi akibat pin. Selama pin aktif elemennya
   * position:fixed di dalam viewport sehingga selalu terpotong viewport —
   * video jalan terus sepanjang section, termasuk saat teks CTA menimpanya.
   *
   * Tanpa rootMargin, pemicunya jatuh saat elemen menyentuh tepi bawah layar.
   * Di situ potongan lingkaran kecilnya memang sudah kelihatan, dan masih
   * tersisa satu layar penuh scroll sebelum lingkarannya mulai mengembang.
   */
  if (video) {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    io.observe(video);
  }

  const mm = gsap.matchMedia();

  /**
   * Sejauh mana section video ditarik naik menimpa ekor section mitos.
   *
   * HARUS separuh tinggi panggung desktop (110svh ÷ 2), karena itulah jarak
   * dari tepi atas panggung ke pusat lingkarannya. Menariknya sejauh itu
   * memindahkan titik awal lingkaran dari "570px di bawah kartu fakta" jadi
   * "tepat di bawahnya" — yang selama ini diminta dan tidak pernah tercapai.
   *
   * Dipasang dari JS, bukan CSS, karena tumpangan ini cuma aman kalau
   * animasinya jalan. Tanpa JS / reduced-motion, clip-path tidak pernah
   * dipasang sehingga videonya tampil PENUH — kalau tumpangannya tetap ada,
   * video itu akan menutupi kartu mitos alih-alih cuma sebuah lingkaran kecil.
   */
  const OVERHANG = '55svh';

  /* --------- Desktop: titik 6% → mengembang → tahan --------- */
  mm.add('(min-width: 768px)', () => {
    gsap.set(clip, { clipPath: 'circle(6% at 50% 50%)' });

    // Section naik menimpa Myths; latarnya digeser turun sejauh yang sama
    // supaya petak tumpang tindihnya transparan dan kartu mitos tetap terbaca.
    section.style.marginTop = `-${OVERHANG}`;
    if (bg) bg.style.top = OVERHANG;
    section.style.marginBottom = OVERLAP.desktop;


    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: track,
        // Panggung menempel persis di antara kedua titik ini, jadi scrub-nya
        // berhimpit sempurna dengan durasi menempelnya — bukan diperkirakan
        // lewat '+=220%' seperti dulu.
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
        invalidateOnRefresh: true,
      },
    });

    /*
     * BABAK LEAD — satuan 0 sampai 6 (60vh). TIDAK ADA TWEEN DI SINI, dan itu
     * memang benar: sepanjang jarak ini lingkarannya terkunci di tengah layar
     * sementara halaman terus bergulir di belakangnya — mula-mula kartu mitos
     * yang masih tersisa (section ini menimpanya 55svh, lihat OVERHANG), lalu
     * caption yang naik menghampiri.
     *
     * Relatif terhadap halaman, LINGKARANNYA yang turun menuju celah teks.
     * Caption tidak disentuh sedikit pun sampai satuan 6 — ia elemen biasa di
     * dalam track dan bergulir sendiri. Versi sebelumnya menaruhnya di dalam
     * panggung lalu menyalakan-matikan opacity-nya, yang membuat teksnya ikut
     * terkunci bersama lingkaran alih-alih didatangi.
     *
     * Pertemuannya jatuh di satuan 6 karena caption ditaruh di top-[60svh]
     * setinggi 110svh → pusat celahnya 115svh dari puncak track, sedangkan
     * lingkaran terkunci di 55svh. Selisihnya 60vh. Kalau salah satu angka itu
     * diubah, ketiganya harus dihitung ulang.
     */
    // MENGEMBANG 5 satuan = 50vh, menyalin rasio referensi (duration 5 dari
    // total 15 pada rentang 136vh ≈ 45vh).
    tl.to(clip, { clipPath: 'circle(100% at 50% 50%)', ease: 'power1.inOut', duration: 5 }, 6)
      .to(caption, { opacity: 0, scale: 1.08, ease: 'none', duration: 3 }, 6)
      .to(badge, { opacity: 0, scale: 0.7, ease: 'power2.in', duration: 2 }, 9)
      .to(overlay, { opacity: 1, ease: 'power2.out', duration: 2 }, 11)
      // Babak HOLD. BUKAN diam: sepanjang 120vh inilah section testimoni
      // merangkak naik menutupi video yang masih menempel.
      .to({}, { duration: 12 }, 13);
    // total = LEAD 6 + MENGEMBANG 5 + CTA 2 + TAHAN 12 = 25 satuan = 250vh
    // panggung desktop 110svh → track 110 + 250 = 360svh ✓
    //
    // KENAPA TAHAN 12, BUKAN 10. Testimoni mulai mengintip dari tepi bawah
    // layar di satuan (tinggi track − OVERLAP − 100vh) ÷ 10 = (360−110−100)÷10
    // = 15, sedangkan teks CTA baru mencapai opacity penuh di satuan 13. Dengan
    // TAHAN 10 (track 320svh) angkanya jadi 12 lawan 13 — section berikutnya
    // masuk sementara teksnya masih setengah transparan. Dua satuan tambahan
    // ini yang memberi jeda 20vh antara teks penuh dan testimoni muncul.

    return () => {
      gsap.set(clip, { clearProps: 'clipPath' });
      gsap.set(caption, { clearProps: 'opacity' });
      section.style.marginTop = '';
      section.style.marginBottom = '';
      if (bg) bg.style.top = '';
    };
  });

  /* ---------------- Mobile: video penuh, tanpa lingkaran ---------------- */
  mm.add('(max-width: 767px)', () => {
    gsap.set(clip, { clipPath: 'none' });
    section.style.marginBottom = OVERLAP.mobile;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.7,
        invalidateOnRefresh: true,
      },
    });

    // Panggung mobile tetap 100svh (110svh cuma dipasang di breakpoint md),
    // jadi jarak menempel = 280 − 100 = 180vh, cocok dengan 18 satuan di bawah.
    //
    // Beat-nya lebih rapat: CTA penuh di 60vh, testimoni mulai menimpa di 80vh.
    tl.to(caption, { opacity: 0, scale: 1.08, ease: 'none', duration: 3 }, 0)
      .to(badge, { opacity: 0, scale: 0.7, ease: 'power2.in', duration: 3 }, 2)
      .to(overlay, { opacity: 1, ease: 'power2.out', duration: 2 }, 4)
      .to({}, { duration: 12 }, 6);
    // total = 18 satuan = 180vh ↔ track 280svh
  });
}
