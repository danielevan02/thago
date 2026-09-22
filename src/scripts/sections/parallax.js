import gsap from 'gsap';

/**
 * Parallax generik untuk elemen dekoratif.
 *
 * Pakai: tempelkan `data-parallax="0.5"` pada elemen apa pun.
 *  - Angkanya = kecepatan. 0.3 pelan (terasa jauh), 0.8 cepat (terasa dekat).
 *  - Angka negatif membalik arah (elemen turun saat halaman naik).
 *
 * Elemen bergeser vertikal ±(140 × speed)px selama section induknya melintasi
 * viewport, di-scrub dengan sedikit inersia. Trigger-nya section terdekat,
 * BUKAN elemennya sendiri — kalau elemen yang dipakai sebagai trigger, posisi
 * yang diukur ulang saat refresh sudah termasuk transform-nya sendiri dan
 * titik mulainya pelan-pelan bergeser.
 *
 * Jangan pakai pada elemen yang sudah dianimasikan properti y-nya oleh section
 * lain (mis. float di Hero) — dua tween memperebutkan transform yang sama.
 */
export default function initParallax() {
  document.querySelectorAll('[data-parallax]').forEach((el) => {
    const speed = parseFloat(el.dataset.parallax || '0.4');
    if (!speed) return;
    const dist = 140 * speed;
    const trigger = el.closest('section') ?? el;

    gsap.fromTo(
      el,
      { y: dist },
      {
        y: -dist,
        ease: 'none',
        scrollTrigger: {
          trigger,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
          invalidateOnRefresh: true,
        },
      }
    );
  });
}
