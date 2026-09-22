import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

/**
 * CTA penutup: judul raksasa di-split per huruf, muncul bergelombang; tombol
 * kanal pesan memantul masuk satu per satu.
 *
 * Catatan penting: pakai gsap.set() + .to(), BUKAN .from().
 * Tween `from` di dalam timeline ber-ScrollTrigger bisa salah merekam nilai
 * akhir kalau ScrollTrigger.refresh() sempat meng-invalidate-nya (dipanggil
 * saat font selesai dimuat, window load, dan setiap resize) — akibatnya elemen
 * "selesai" dianimasikan tapi tetap di posisi awal. Dengan set+to nilai akhirnya
 * eksplisit, jadi kebal terhadap invalidasi.
 */
export default function initCta() {
  const section = document.querySelector('[data-cta]');
  if (!section) return;

  const title = section.querySelector('[data-cta-title]');
  const sub = section.querySelector('[data-cta-sub]');
  const buttons = gsap.utils.toArray('[data-cta-button]', section);

  let chars = [];
  if (title) {
    const split = new SplitText(title, { type: 'chars' });
    chars = split.chars;
    gsap.set(chars, { yPercent: 130, opacity: 0, rotate: () => gsap.utils.random(-14, 14) });
  }
  if (sub) gsap.set(sub, { y: 24, opacity: 0 });
  if (buttons.length) gsap.set(buttons, { scale: 0.6, y: 20, opacity: 0 });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top 68%', once: true },
  });

  if (chars.length) {
    tl.to(chars, {
      yPercent: 0,
      opacity: 1,
      rotate: 0,
      duration: 0.8,
      ease: 'back.out(1.8)',
      stagger: 0.05,
    });

    // Goyangan idle dibuat terpisah dari timeline reveal — tween berulang tak
    // berhingga di dalam timeline membuat durasinya Infinity.
    tl.call(() => {
      gsap.to(chars, {
        y: -10,
        duration: 1.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        stagger: { each: 0.08 },
      });
    });
  }

  if (sub) tl.to(sub, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, 0.4);

  if (buttons.length) {
    tl.to(
      buttons,
      {
        scale: 1,
        y: 0,
        opacity: 1,
        duration: 0.55,
        ease: 'back.out(2.2)',
        stagger: 0.09,
      },
      0.55
    );
  }
}
