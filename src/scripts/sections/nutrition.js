import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

/**
 * Nutrisi — "Label Gizi Raksasa".
 *
 * Urutan dramanya mengikuti scroll:
 *   1. judul naik per huruf + kotak "JUJUR" tersingkap
 *   2. kartu label masuk memantul, cup di baliknya berparallax pelan
 *   3. angka menghitung naik SEKALI (count-up yang di-scrub itu norak —
 *      angkanya kedip-kedip tiap scroll balik)
 *   4. bar %AKG terisi mengikuti scroll (scrub) — bar boleh maju-mundur,
 *      justru terasa taktil
 *   5. stempel "0g GULA" menghantam masuk paling akhir
 *
 * Markup-nya ditulis dalam kondisi final (angka & lebar bar sudah terisi),
 * jadi tanpa JS pun label tetap utuh — JS hanya menganimasikan dari nol.
 */
export default function initNutrition() {
  const section = document.querySelector('[data-nutrition]');
  if (!section) return;

  // --- 1. judul ---
  const title = section.querySelector('[data-nutrition-title]');
  if (title) {
    const split = new SplitText(title, { type: 'chars' });
    gsap.set(split.chars, { yPercent: 400 });
    gsap.to(split.chars, {
      yPercent: 0,
      ease: 'power1.inOut',
      duration: 0.9,
      stagger: 0.02,
      scrollTrigger: {
        trigger: section,
        start: 'top 60%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  const clip = section.querySelector('[data-clip-title]');
  if (clip) {
    gsap.to(clip, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 0.7,
      ease: 'circ.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 55%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  const para = section.querySelector('[data-nutrition-para]');
  if (para) {
    gsap.set(para, { y: 30, opacity: 0 });
    gsap.to(para, {
      y: 0,
      opacity: 1,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 50%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  // --- 2. kartu label + cup ---
  const card = section.querySelector('[data-nutrition-card]');
  if (card) {
    gsap.set(card, { y: 90, opacity: 0, rotate: 4 });
    gsap.to(card, {
      y: 0,
      opacity: 1,
      rotate: -2,
      duration: 0.9,
      ease: 'back.out(1.3)',
      scrollTrigger: {
        trigger: section,
        start: 'top 55%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  /* ---------------- parallax kolase ----------------
   * Label, cup, stempel, dan polaroid bergeser dengan kecepatan berbeda saat
   * section melintasi viewport — kolasenya terasa berlapis, bukan satu gambar
   * datar. Semua drift memakai yPercent, karena `y` (piksel) sudah dipakai
   * animasi masuk kartu; GSAP menjumlahkan keduanya, jadi tidak saling timpa.
   *
   * Logika kedalamannya: cup paling "jauh" di belakang label → paling pelan
   * relatif terhadap kartu; polaroid menempel paling "dekat" ke mata → paling
   * cepat. Kartu sendiri diberi drift kecil sebagai jangkar.
   */
  const drift = (el, from, to) =>
    el &&
    gsap.fromTo(
      el,
      { yPercent: from },
      {
        yPercent: to,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1 },
      }
    );

  drift(card, 5, -5);
  // cup: rentangnya berpusat di -50 karena menggantikan -translate-y-1/2
  // Tailwind — transform inline GSAP menimpa transform dari class CSS
  drift(section.querySelector('[data-nutrition-cup]'), -28, -74);

  // --- 3. angka count-up, sekali saja ---
  section.querySelectorAll('[data-stat-value]').forEach((el, i) => {
    const to = parseFloat(el.dataset.to ?? '0');
    const counter = { v: 0 };
    el.textContent = '0';
    gsap.to(counter, {
      v: to,
      duration: 1.1,
      delay: 0.35 + i * 0.12,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = String(Math.round(counter.v));
      },
      scrollTrigger: { trigger: section, start: 'top 50%', once: true },
    });
  });

  // --- 4. bar %AKG terisi mengikuti scroll ---
  section.querySelectorAll('[data-akg-bar]').forEach((bar, i) => {
    gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          // bertingkat: bar teratas mulai duluan, yang bawah menyusul
          start: `top ${48 - i * 4}%`,
          end: `top ${18 - i * 4}%`,
          scrub: 0.5,
        },
      }
    );
  });

  // --- 5. stempel menghantam + polaroid menyusul ---
  const stamp = section.querySelector('[data-nutrition-stamp]');
  if (stamp) {
    gsap.set(stamp, { scale: 2.6, opacity: 0, rotate: 6 });
    gsap.to(stamp, {
      scale: 1,
      opacity: 1,
      rotate: -14,
      duration: 0.4,
      ease: 'power3.in',
      scrollTrigger: {
        trigger: section,
        start: 'top 28%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  const polaroid = section.querySelector('[data-nutrition-polaroid]');
  if (polaroid) {
    gsap.set(polaroid, { scale: 0, rotate: 24 });
    gsap.to(polaroid, {
      scale: 1,
      rotate: 6,
      duration: 0.6,
      ease: 'back.out(2)',
      scrollTrigger: {
        trigger: section,
        start: 'top 35%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  // drift stempel & polaroid — sengaja "terlepas" dari kartu supaya kolasenya
  // terasa bertumpuk; entrance mereka pakai scale/rotate jadi yPercent bebas
  drift(stamp, 14, -16);
  drift(polaroid, 30, -26);
}
