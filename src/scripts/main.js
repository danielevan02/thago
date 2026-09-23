import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

import initPreloader from './sections/preloader.js';
import initNav from './sections/nav.js';
import initHero from './sections/hero.js';
import initMessage from './sections/message.js';
import initProducts from './sections/products.js';
import initDrinks from './sections/drinks.js';
import initBenefits from './sections/benefits.js';
import initNutrition from './sections/nutrition.js';
import initMyths from './sections/myths.js';
import initVideoPin from './sections/videopin.js';
import initTestimonials from './sections/testimonials.js';
import initCta from './sections/cta.js';
import initMarquees from './sections/marquee.js';
import initDoodles from './sections/doodles.js';
import initParallax from './sections/parallax.js';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Lepas penyembunyian awal supaya konten tidak pernah tertinggal tak terlihat. */
function revealAll() {
  document.querySelectorAll('[data-anim]').forEach((el) => el.classList.add('is-ready'));
}

/**
 * Bobot smooth scroll — ini kenop yang paling sering mau diutak-atik.
 *
 * Mode `duration` + easing expo dipilih (bukan `lerp`) karena inilah yang
 * memberi kesan "berat": tiap putaran wheel meluncur jauh lalu mengerem pelan,
 * bukan sekadar mengikuti kursor dengan halus.
 *
 * Cara menyetel:
 *   SCROLL_DURATION  besarkan  → makin berat & meluncur lama (1.8–2.2 = sangat berat)
 *                    kecilkan  → makin responsif (0.8–1.0 = ringan)
 *   WHEEL_MULTIPLIER besarkan  → satu putaran wheel menempuh jarak lebih jauh
 */
const SCROLL_DURATION = 1.6;
const WHEEL_MULTIPLIER = 1.1;

function setupSmoothScroll() {
  const lenis = new Lenis({
    duration: SCROLL_DURATION,
    // expo-out: start cepat, rem panjang — sumber rasa "punya massa"
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    wheelMultiplier: WHEEL_MULTIPLIER,
    smoothWheel: true,
    // Sentuh dibiarkan native — lebih enak dan hemat baterai di HP
    syncTouch: false,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Anchor link lewat Lenis supaya ikut smooth
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.3 });
    });
  });

  return lenis;
}

function boot() {
  if (reduced) {
    // Preloader hanya dibongkar oleh timeline animasinya. Kalau animasi
    // dilewati, tirainya harus dibuang manual — kalau tidak, seluruh halaman
    // tertutup layar ungu selamanya.
    document.querySelector('[data-preloader]')?.remove();
    revealAll();
    // Tetap pasang interaksi non-esensial yang tidak bergantung gerak
    initMyths({ reduced: true });
    // WAJIB: sejak semua tautan pindah ke dalam menu selayar penuh,
    // melewatkan initNav di sini berarti situsnya tanpa navigasi sama sekali.
    initNav({ reduced: true });
    // Titik & panah carousel varian di mobile — tanpa gerak, tapi harus bisa diklik.
    initProducts({ reduced: true });
    return;
  }

  const lenis = setupSmoothScroll();

  // Kunci scroll selama preloader
  lenis.stop();

  // Scroll dibuka saat tirai preloader mendarat, bukan saat seluruh intro
  // selesai — di titik itu halaman sudah utuh terlihat, dan menahannya lebih
  // lama hanya membuat orang mengira webnya macet.
  const intro = initPreloader({
    onReveal: () => {
      lenis.start();
      ScrollTrigger.refresh();
    },
  });

  revealAll();

  initNav({ lenis });
  initHero(intro);
  initMessage();
  initProducts();
  initDrinks();
  initBenefits();
  initNutrition();
  initMyths({ reduced: false });
  initVideoPin();
  initTestimonials();
  initCta();
  initMarquees();
  initDoodles();
  initParallax();

  // Layout bisa bergeser setelah font & gambar selesai dimuat
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

boot();
