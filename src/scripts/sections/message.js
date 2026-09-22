import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

/**
 * Manifesto. Tiga gerakan, semuanya diadopsi dari MessageSection SPYLT:
 *
 * 1. Kata menyala satu per satu mengikuti scroll — yang dianimasikan `color`,
 *    bukan opacity, jadi kata yang belum menyala tetap terbaca samar.
 * 2. Kotak highlight tersingkap dengan clip-path saat masuk viewport.
 * 3. Paragraf penutup: kata-katanya naik dari balik topeng per baris.
 */
const DIM = 'rgba(250, 245, 233, 0.14)';
const LIT = '#faf5e9';

export default function initMessage() {
  const section = document.querySelector('[data-message]');
  if (!section) return;

  // --- 1. kalimat menyala per kata ---
  section.querySelectorAll('[data-message-line]').forEach((line) => {
    const words = line.querySelectorAll('[data-message-word]');
    if (!words.length) return;

    gsap.set(words, { color: DIM });
    gsap.to(words, {
      color: LIT,
      ease: 'power1.in',
      stagger: 1,
      scrollTrigger: {
        trigger: line,
        start: 'top 78%',
        end: 'bottom 55%',
        scrub: 0.5,
      },
    });
  });

  // --- 2. kotak highlight tersingkap ---
  const clip = section.querySelector('[data-clip-title]');
  if (clip) {
    gsap.to(clip, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 0.8,
      ease: 'circ.inOut',
      scrollTrigger: {
        trigger: clip,
        start: 'top 78%',
        // Urutannya: onEnter, onLeave, onEnterBack, onLeaveBack.
        // Yang terakhir membuat kotaknya menutup lagi saat user scroll balik
        // ke atas melewati titik mulai, dan terbuka lagi kalau turun lagi.
        // (`once: true` tidak bisa dipakai di sini — pemicunya langsung
        // dibuang setelah sekali jalan, jadi tidak ada yang bisa membalik.)
        toggleActions: 'play none none reverse',
      },
    });
  }

  // --- 3. paragraf: kata naik dari balik topeng baris ---
  const para = section.querySelector('[data-message-para]');
  if (para) {
    const split = new SplitText(para, {
      type: 'words,lines',
      linesClass: 'paragraph-line',
    });
    gsap.set(split.words, { yPercent: 160, rotate: 3 });
    gsap.to(split.words, {
      yPercent: 0,
      rotate: 0,
      duration: 0.9,
      ease: 'power2.out',
      stagger: 0.015,
      scrollTrigger: { trigger: para, start: 'top 82%', once: true },
    });
  }
}
