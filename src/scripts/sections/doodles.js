import gsap from 'gsap';

/**
 * Doodle bergaris "digambar" saat masuk viewport, meniru coretan tangan
 * di feed IG. Pakai DrawSVGPlugin (sekarang gratis setelah GSAP diakuisisi Webflow).
 */
export default function initDoodles() {
  const doodles = gsap.utils.toArray('[data-doodle]');
  if (!doodles.length) return;

  doodles.forEach((svg) => {
    const paths = svg.querySelectorAll('path');
    if (!paths.length) return;

    gsap.fromTo(
      paths,
      { drawSVG: '0%' },
      {
        drawSVG: '100%',
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.12,
        scrollTrigger: { trigger: svg, start: 'top 88%', once: true },
      }
    );
  });
}
