import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { createRail, railEntrance } from '../rail.js';

/**
 * Showcase varian — meniru FlavorSection + FlavorSlider SPYLT.
 *
 * Tiga gerakan:
 *  1. Judul masuk sebelum section terpaku: huruf naik dari balik topeng,
 *     kotak highlight tersingkap. Dipicu bertahap (30% → 15% → 5%).
 *  2. Section di-pin, rel digeser horizontal mengikuti scroll.
 *  3. Selama rel bergeser, tiga lapisan judul digeser LAGI dengan kecepatan
 *     berbeda (-30% / -22% / -10%, angka yang sama dipakai SPYLT), sehingga
 *     judulnya terurai berlapis alih-alih bergerak sebagai satu blok kaku.
 */
export default function initProducts({ reduced = false } = {}) {
  const section = document.querySelector('[data-products]');
  if (!section) return;

  // Reduced-motion: tidak ada pin, tidak ada animasi — tapi titik dan panah
  // di mobile tetap harus bekerja. Tanpa ini tombolnya tampil dan diam saja.
  if (reduced) {
    const cards = gsap.utils.toArray('[data-product-card]', section);
    const indexEls = section.querySelectorAll('[data-products-index]');
    const setIndex = (i) => indexEls.forEach((el) => (el.textContent = String(i + 1).padStart(2, '0')));
    gsap.matchMedia().add('(max-width: 1023px)', () =>
      initMobileRail(section, cards, setIndex, { motion: false })
    );
    return;
  }

  const track = section.querySelector('[data-products-track]');
  const cards = gsap.utils.toArray('[data-product-card]', section);
  const introLines = gsap.utils.toArray('[data-intro-line]', section);
  const introTexts = gsap.utils.toArray('[data-intro-text]', section);
  // Dilingkupi [data-products-intro]: kepala mobile punya ClipTitle-nya sendiri
  // dan letaknya LEBIH DULU di DOM, jadi querySelector polos akan salah ambil.
  const introClip = section.querySelector('[data-products-intro] [data-clip-title]');
  const indexEls = section.querySelectorAll('[data-products-index]');
  const hint = section.querySelector('[data-products-hint]');
  if (!track || !cards.length) return;

  /* ---------------- 1. Judul masuk (sebelum pin) ---------------- */
  // Tiga pemicu bertahap seperti FlavorTitle SPYLT, tapi digeser lebih awal.
  // Pemicu terakhir harus punya cukup jarak scroll untuk menyelesaikan
  // animasinya SEBELUM section terpaku di 'top top' — kalau mepet, judulnya
  // masih terbang saat rel horizontal sudah mulai bergerak.
  const introStarts = ['top 62%', 'top 46%', 'top 30%'];

  introTexts.forEach((el, i) => {
    const split = new SplitText(el, { type: 'chars' });
    gsap.set(split.chars, { yPercent: 200 });
    gsap.to(split.chars, {
      yPercent: 0,
      ease: 'power1.inOut',
      duration: 0.8,
      stagger: 0.02,
      scrollTrigger: {
        trigger: section,
        start: i === 0 ? introStarts[0] : introStarts[2],
        toggleActions: 'play none none reverse',
      },
    });
  });

  if (introClip) {
    gsap.to(introClip, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 0.9,
      ease: 'circ.out',
      scrollTrigger: {
        trigger: section,
        start: introStarts[1],
        toggleActions: 'play none none reverse',
      },
    });
  }

  /* ---------------- penghitung varian ---------------- */
  let current = -1;
  function activate(i) {
    if (i === current) return;
    current = i;
    indexEls.forEach((el) => (el.textContent = String(i + 1).padStart(2, '0')));
  }

  if (hint) {
    gsap.to(hint, { x: 10, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  const mm = gsap.matchMedia();

  /* ---------------- Dari 1024px: pin + geser horizontal ---------------- */
  // Batasnya dinaikkan dari 768px: tablet mendapat scroll-snap, bukan pin.
  // Alasannya ditulis lengkap di Products.astro.
  mm.add('(min-width: 1024px)', () => {
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    // Harus TWEEN (bukan timeline) dan ease none — syarat containerAnimation
    // supaya pemicu tiap kartu bisa membaca posisi horizontalnya.
    //
    // Dua keputusan di sini demi transisi vertikal→horizontal yang mulus:
    //  - TANPA anticipatePin. Fitur itu mem-pin lebih awal berdasarkan prediksi
    //    kecepatan scroll — dengan Lenis prediksinya meleset dan muncul sebagai
    //    loncatan pixel tepat di momen pin. anticipatePin hanya berguna untuk
    //    scroll native.
    //  - scrub 1.2 (bukan 0.6/true). Smoothing scrub inilah yang "membelokkan
    //    tikungan": saat pin dimulai, gerak horizontal tidak langsung mengikuti
    //    kecepatan scroll penuh, tapi mengejar dengan inersia ~1 detik. Ini
    //    satu-satunya cara melunakkan awal gerakan tanpa melanggar syarat
    //    ease none milik containerAnimation.
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1.2,
        invalidateOnRefresh: true,
        // Tanpa snap — geserannya bebas dan menerus, seperti FlavorSlider SPYLT.
      },
    });

    // Parallax antar lapisan judul. Selesai tepat di 60% panjang scroll
    // section, jadi setelah titik itu tidak ada lagi yang bergerak pada judul.
    const TITLE_DONE_AT = 0.6;
    const layerShift = [-30, -22, -10];
    gsap
      .timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.max(1, distance() * TITLE_DONE_AT)}`,
          // scrub-nya HARUS sama dengan rel utama — lapisan judul ada di dalam
          // rel, kalau inersianya beda mereka terlihat saling tertinggal
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      })
      .to(
        introLines,
        {
          xPercent: (i) => layerShift[i] ?? -20,
          ease: 'none',
        },
        0
      );

    cards.forEach((card, i) => {
      ScrollTrigger.create({
        trigger: card,
        containerAnimation: tween,
        start: 'left center',
        end: 'right center',
        onToggle: (self) => self.isActive && activate(i),
      });

      const els = card.querySelectorAll('[data-product-el]');
      gsap.set(els, { y: 40, opacity: 0 });
      gsap.to(els, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: card,
          containerAnimation: tween,
          start: 'left 78%',
          toggleActions: 'play none none reverse',
        },
      });

      // kartu mengambang: bergeser vertikal pelan selama melintas, arah
      // selang-seling — parallax kecil yang bikin deretan tidak terasa kaku
      gsap.fromTo(
        card,
        { y: i % 2 === 0 ? 26 : -26 },
        {
          y: i % 2 === 0 ? -26 : 26,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            containerAnimation: tween,
            start: 'left right',
            end: 'right left',
            scrub: true,
          },
        }
      );

      // cup naik pelan saat kartunya melintas — parallax kecil di dalam kartu
      const visual = card.querySelector('[data-product-visual]');
      if (visual) {
        gsap.fromTo(
          visual,
          // Amplitudo diturunkan dari ±8 ke ±5: sejak kotak foto jadi flex-1,
          // tingginya menyusut mengikuti teks, dan geseran 8% dari kotak yang
          // lebih pendek mulai menyenggol judul varian di kartu yang teksnya
          // panjang.
          { yPercent: 5 },
          {
            yPercent: -5,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              containerAnimation: tween,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          }
        );
      }
    });

    return () => {
      gsap.set(track, { x: 0 });
      gsap.set(introLines, { xPercent: 0 });
    };
  });

  /* ---------------- Di bawah 1024px: carousel geser ---------------- */
  mm.add('(max-width: 1023px)', () => initMobileRail(section, cards, activate, { motion: true }));
}

/**
 * Carousel varian di bawah 1024px.
 *
 * Fisika geraknya (kartu aktif diangkat, tetangga miring & mengecil, parallax
 * cup) ada di scripts/rail.js dan dipakai juga oleh section Testimoni. Yang
 * khusus Varian ada di sini: penghitung, titik warna, pendar warna, panah.
 */
function initMobileRail(section, cards, onActive, { motion }) {
  const stage = section.querySelector('[data-products-stage]');
  const track = section.querySelector('[data-products-track]');
  const glow = section.querySelector('[data-products-glow]');
  const dots = [...section.querySelectorAll('[data-products-dot]')];
  const prev = section.querySelector('[data-products-prev]');
  const next = section.querySelector('[data-products-next]');
  if (!stage || !cards.length) return;

  const rail = createRail({
    stage,
    cards,
    motion,
    rotations: cards.map((c) => Number(c.dataset.rotate) || 0),
    parallax: cards.map((c) => c.querySelector('[data-product-visual]')),
    onActive: (i) => {
      onActive(i);
      dots.forEach((d, j) => d.setAttribute('aria-current', j === i ? 'true' : 'false'));
      if (glow) glow.style.backgroundColor = cards[i].dataset.stage;
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === cards.length - 1;
    },
  });

  const onDot = (e) => rail.goTo(dots.indexOf(e.currentTarget));
  const onPrev = () => rail.goTo(rail.active - 1);
  const onNext = () => rail.goTo(rail.active + 1);
  // Panah kiri/kanan saat fokus ada di dalam rel (mis. setelah Tab ke tombol
  // Pesan): tanpa ini pengguna keyboard tidak bisa pindah varian di tablet.
  const onKey = (e) => {
    if (e.key === 'ArrowRight') onNext();
    else if (e.key === 'ArrowLeft') onPrev();
    else return;
    e.preventDefault();
  };

  dots.forEach((d) => d.addEventListener('click', onDot));
  prev?.addEventListener('click', onPrev);
  next?.addEventListener('click', onNext);
  stage.addEventListener('keydown', onKey);

  /* ---- masuk: kepala dulu, lalu rel meluncur dari kanan ---- */
  const cleanups = [];
  if (motion) {
    const headEls = section.querySelectorAll('[data-head-el]');
    const headClip = section.querySelector('[data-head-clip] [data-clip-title]');

    gsap.set(headEls, { y: 36, opacity: 0 });
    const head = gsap
      .timeline({ paused: true })
      .to(headEls, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.09 }, 0);
    if (headClip) {
      head.to(
        headClip,
        { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: 0.8, ease: 'circ.out' },
        0.15
      );
    }
    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top 75%',
      once: true,
      onEnter: () => head.play(),
    });
    cleanups.push(() => st.kill());
    cleanups.push(railEntrance(track, section.querySelector('[data-products-rail]') || stage));
  }

  return () => {
    cleanups.forEach((fn) => fn());
    rail.destroy();
    dots.forEach((d) => d.removeEventListener('click', onDot));
    prev?.removeEventListener('click', onPrev);
    next?.removeEventListener('click', onNext);
    stage.removeEventListener('keydown', onKey);
  };
}
