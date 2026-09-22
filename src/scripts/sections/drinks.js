import gsap from 'gsap';

/**
 * Cold pressed juice — gerakan intinya: panel warnanya TERISI dari bawah,
 * seperti jus yang baru dituang ke gelas.
 *
 * Yang dianimasikan `yPercent` pada lapisan isi di dalam pembungkus
 * ber-overflow-hidden, BUKAN `height` maupun `scaleY`:
 *   - `height` memicu layout tiap frame,
 *   - `scaleY` menggencet garis permukaan setebal 3px itu jadi sub-piksel di
 *     awal lalu memuaikannya — permukaannya jadi berkedip tebal-tipis.
 * Menggeser seluruh lapisan membuat garis permukaannya tetap setebal 3px
 * sepanjang gerakan, dan semuanya tetap di GPU.
 *
 * Urutan per kartu sengaja: botol dulu, baru isinya naik, baru namanya muncul.
 * Botolnya "sudah berdiri di situ" lalu jusnya dituang — kebalikannya terbaca
 * seperti botol yang jatuh ke dalam kolam warna.
 *
 * Nama varian WAJIB menyusul setelah isinya penuh, bukan barengan: teks di
 * dalam panel memakai warna `onFill` yang dipilih untuk kontras dengan warna
 * jus, bukan dengan latar void. Angry Prisson yang bertulisan indigo tua akan
 * benar-benar tak terbaca di atas latar gelap selama panelnya masih kosong.
 */
export default function initDrinks() {
  const section = document.querySelector('[data-drinks]');
  if (!section) return;

  const intro = section.querySelector('[data-drinks-intro]');
  const clip = section.querySelector('[data-clip-title]');
  const cards = gsap.utils.toArray('[data-drink-card]', section);
  if (!cards.length) return;

  /* ---------------- judul ---------------- */
  if (intro) {
    gsap.set(intro, { y: 40, opacity: 0 });
    gsap.to(intro, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 72%', once: true },
    });
  }

  if (clip) {
    gsap.to(clip, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 0.9,
      ease: 'circ.out',
      scrollTrigger: { trigger: section, start: 'top 58%', once: true },
    });
  }

  /* ---------------- tiap botol ---------------- */
  cards.forEach((card, i) => {
    const fill = card.querySelector('[data-drink-fill]');
    const copy = card.querySelector('[data-drink-copy]');
    const bottle = card.querySelector('[data-drink-bottle]');
    const foot = card.querySelector('[data-drink-foot]');

    // Kondisi awal dipasang di JS, bukan CSS. Tanpa JS — dan saat
    // prefers-reduced-motion, karena main.js tidak pernah memanggil section
    // ini — panelnya tampil terisi penuh dan semua teksnya terbaca.
    if (fill) gsap.set(fill, { yPercent: 100 });
    if (copy) gsap.set(copy, { opacity: 0, y: 14 });
    if (bottle) gsap.set(bottle, { y: 44, scale: 0.92, opacity: 0 });
    if (foot) gsap.set(foot, { opacity: 0, y: 18 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        // Kartu ini tinggi (rasio 3:4 plus botol yang menembus ke atas), jadi
        // pemicunya dipatok di 78% layar: cukup awal supaya tuangannya sudah
        // selesai saat kartunya sampai di tengah pandangan.
        start: 'top 78%',
        once: true,
      },
      // Tiga kartu dituang berurutan, bukan serentak — serentak terbaca
      // seperti satu blok yang muncul, bukan tiga botol yang dilayani satu per satu.
      delay: i * 0.14,
      // Mengambangnya BARU dipasang setelah animasi masuk selesai. Kalau
      // dipasang di awal dengan delay sendiri, tween idle itu bisa mulai
      // duluan di halaman yang lama tidak di-scroll, lalu merebut properti `y`
      // dari tween masuk yang belum jalan — botolnya kedutan saat akhirnya
      // kartunya masuk layar.
      onComplete: () => startFloat(bottle, i),
    });

    if (bottle) {
      tl.to(bottle, { y: 0, scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.5)' });
    }
    if (fill) {
      tl.to(fill, { yPercent: 0, duration: 0.95, ease: 'power2.out' }, '-=0.35');
    }
    if (copy) {
      tl.to(copy, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.25');
    }
    if (foot) {
      tl.to(foot, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.35');
    }

  });
}

/**
 * Botol mengambang pelan setelah mendarat. Amplitudonya kecil dan periodenya
 * beda-beda supaya ketiganya tidak pernah sinkron — begitu sinkron, ketiganya
 * terbaca sebagai satu blok yang bergoyang, bukan tiga benda terpisah.
 */
function startFloat(bottle, i) {
  if (!bottle) return;
  gsap.to(bottle, {
    y: -10,
    duration: 2.6 + i * 0.35,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });
}
