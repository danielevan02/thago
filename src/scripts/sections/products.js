import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

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
export default function initProducts() {
  const section = document.querySelector('[data-products]');
  if (!section) return;

  const track = section.querySelector('[data-products-track]');
  const stage = section.querySelector('[data-products-stage]');
  const cards = gsap.utils.toArray('[data-product-card]', section);
  const introLines = gsap.utils.toArray('[data-intro-line]', section);
  const introTexts = gsap.utils.toArray('[data-intro-text]', section);
  const introClip = section.querySelector('[data-intro-clip], [data-clip-title]');
  const indexEl = section.querySelector('[data-products-index]');
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
    if (indexEl) indexEl.textContent = String(i + 1).padStart(2, '0');
  }

  if (hint) {
    gsap.to(hint, { x: 10, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  const mm = gsap.matchMedia();

  /* ---------------- Desktop: pin + geser horizontal ---------------- */
  mm.add('(min-width: 768px)', () => {
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
          { yPercent: 8 },
          {
            yPercent: -8,
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

  /* ---------------- Mobile: native scroll-snap ---------------- */
  mm.add('(max-width: 767px)', () => {
    if (!stage) return;
    stage.style.overflowX = 'auto';
    stage.style.overscrollBehaviorX = 'contain';
    stage.style.scrollSnapType = 'x mandatory';
    stage.style.scrollbarWidth = 'none';
    cards.forEach((c) => {
      c.style.scrollSnapAlign = 'center';
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) activate(cards.indexOf(e.target));
        });
      },
      { root: stage, threshold: 0.6 }
    );
    cards.forEach((c) => io.observe(c));

    return () => {
      io.disconnect();
      stage.style.overflowX = '';
      stage.style.scrollSnapType = '';
      stage.style.overscrollBehaviorX = '';
      cards.forEach((c) => {
        c.style.scrollSnapAlign = '';
      });
    };
  });
}
