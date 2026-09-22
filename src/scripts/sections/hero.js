import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/**
 * Hero:
 *  - masuk  : judul di-split per huruf, naik dengan sedikit rotasi acak (bouncy)
 *  - idle   : bahan melayang naik-turun pelan + ikut gerakan mouse (desktop)
 *  - keluar : parallax multi-layer yang di-scrub — teks, cup, dan bahan bergerak
 *             dengan kecepatan berbeda supaya terasa berlapis
 */
export default function initHero(intro) {
  const section = document.querySelector('[data-hero]');
  if (!section) return;

  const title = section.querySelector('[data-hero-title]');
  const stickers = section.querySelectorAll('[data-hero-sticker]');
  const cta = section.querySelector('[data-hero-cta]');
  const cup = section.querySelector('[data-hero-cup]');
  const floats = section.querySelectorAll('[data-hero-float]');
  const stage = section.querySelector('[data-hero-stage]');
  const flavors = gsap.utils.toArray('[data-hero-flavor]', section);

  const split = new SplitText(title, { type: 'chars,lines', linesClass: 'overflow-hidden' });

  // Kondisi awal dipasang sekarang juga supaya tidak ada kedipan sebelum intro.
  // Wordmark hero sengaja TIDAK disentuh di sini: ia diserahterimakan preloader,
  // yang menerbangkan miliknya ke posisi itu lalu bertukar tempat.
  gsap.set(split.chars, { yPercent: 120, opacity: 0 });
  gsap.set(cta, { y: 30, opacity: 0 });
  gsap.set(stickers, { scale: 0, opacity: 0 });
  gsap.set(cup, { y: 80, scale: 0.86, opacity: 0 });
  gsap.set(floats, { scale: 0, opacity: 0 });

  const tl = gsap.timeline();

  tl.to(split.chars, {
    yPercent: 0,
    opacity: 1,
    duration: 0.85,
    ease: 'back.out(1.7)',
    stagger: { each: 0.022, from: 'start' },
  })
    .to(
      cup,
      { y: 0, scale: 1, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.75)' },
      '-=0.6'
    )
    .to(
      floats,
      {
        scale: 1,
        opacity: 1,
        duration: 0.7,
        ease: 'back.out(2)',
        stagger: { each: 0.06, from: 'random' },
      },
      '-=0.75'
    )
    .to(stickers, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.4)', stagger: 0.1 }, '-=0.5')
    .to(cta, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.4');

  // Sambungkan ke preloader. Label `reveal` ditanam preloader.js pada saat
  // tirainya mulai turun — bukan di akhir — supaya isi hero sudah bergerak
  // ketika tirai menyapu melewatinya. Fallback untuk kalau preloader tidak ada.
  if (intro) intro.add(tl, intro.labels?.reveal !== undefined ? 'reveal' : '-=0.45');

  /**
   * Cup berganti rasa pelan-pelan.
   *
   * Keenam varian ditumpuk di markup dan disilangfadekan, bukan warnanya yang
   * ditukar lewat JS — dengan begitu cara ini tetap bekerja apa adanya begitu
   * foto produk asli masuk: yang bersilangfade tinggal <img>-nya.
   *
   * Diam 3,2 detik per rasa dengan silangfade 1 detik: satu putaran penuh
   * ~25 detik. Sengaja selambat itu — ini latar, bukan tontonan, dan hero
   * sudah punya cukup gerakan dari bahan melayang.
   *
   * Timeline TERPISAH karena `repeat: -1`; kalau digabung ke timeline intro,
   * durasi induknya jadi Infinity.
   */
  if (flavors.length > 1) {
    const HOLD = 3.2;
    const FADE = 1;
    const cycle = gsap.timeline({ repeat: -1 });
    flavors.forEach((el, i) => {
      const next = flavors[(i + 1) % flavors.length];
      cycle
        .to(el, { opacity: 0, duration: FADE, ease: 'sine.inOut' }, `+=${HOLD}`)
        .to(next, { opacity: 1, duration: FADE, ease: 'sine.inOut' }, '<');
    });
  }

  // --- idle: bahan melayang naik-turun ---
  floats.forEach((el, i) => {
    gsap.to(el, {
      y: gsap.utils.random(-16, -30),
      rotation: gsap.utils.random(-8, 8),
      duration: gsap.utils.random(2.4, 3.8),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: i * 0.18,
    });
  });

  // --- keluar: parallax berlapis saat scroll ---
  const outro = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      // scrub sengaja rapat: bobot gerakan sudah ditanggung Lenis, kalau scrub
      // ikut longgar hasilnya bukan "berat" tapi telat
      scrub: 0.5,
    },
  });

  // Gerakan keluar ala SPYLT: seluruh panggung miring, mengecil, dan turun
  // sekaligus — bukan tiap elemen dianimasikan sendiri. Hasilnya hero terasa
  // "terlepas" dari layar, bukan sekadar memudar.
  outro.to(
      stage,
      {
        rotate: 5,
        scale: 0.88,
        yPercent: 12,
        // sudut membulat saat terangkat, jadi terbaca sebagai kartu yang
        // menjauh dari latar gelap di belakangnya
        borderRadius: '2.5rem',
        ease: 'none',
      },
      0
    );

  // Bahan tetap bergerak dengan kedalaman berbeda DI DALAM panggung yang miring,
  // supaya lapisannya tetap terasa.
  floats.forEach((el) => {
    const depth = parseFloat(el.dataset.depth || '1');
    outro.to(el, { yPercent: -40 * depth, rotation: 14 * depth, ease: 'none' }, 0);
  });

  // --- mouse parallax (desktop saja) ---
  const mm = gsap.matchMedia();
  mm.add('(hover: hover) and (pointer: fine)', () => {
    const setters = Array.from(floats).map((el) => ({
      el,
      depth: parseFloat(el.dataset.depth || '1'),
      x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3' }),
    }));
    const cupX = gsap.quickTo(cup, 'x', { duration: 1, ease: 'power3' });

    const onMove = (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      setters.forEach(({ depth, x }) => x(nx * 46 * depth));
      cupX(nx * 18);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  });

  ScrollTrigger.refresh();
}
