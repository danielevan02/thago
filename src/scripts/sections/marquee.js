import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Marquee tak berujung. Isinya digandakan 2× di markup, jadi geser -50%
 * sudah cukup untuk loop yang mulus.
 *
 * Trik SPYLT: arah jalannya membalik mengikuti arah scroll, dan sedikit
 * ngebut kalau user men-scroll cepat.
 */
export default function initMarquees() {
  const marquees = gsap.utils.toArray('[data-marquee]');
  if (!marquees.length) return;

  marquees.forEach((el) => {
    const track = el.querySelector('.marquee__track');
    if (!track) return;

    const speed = parseFloat(el.dataset.speed || '90');
    const reverse = el.dataset.reverse === '1';
    const halfWidth = track.scrollWidth / 2 || 1;
    const duration = halfWidth / speed;

    const tween = gsap.to(track, {
      xPercent: -50,
      ease: 'none',
      duration,
      repeat: -1,
    });

    const base = reverse ? -1 : 1;
    tween.timeScale(base);

    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const boost = gsap.utils.clamp(1, 4, 1 + Math.abs(self.getVelocity()) / 1200);
        gsap.to(tween, {
          timeScale: base * self.direction * boost,
          duration: 0.4,
          overwrite: true,
        });
      },
      // hemat: berhenti saat di luar layar
      onToggle: (self) => (self.isActive ? tween.play() : tween.pause()),
    });
  });
}
