import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Menghasilkan kurva mulus yang benar-benar melewati setiap titik yang diberi
 * (Catmull-Rom dikonversi ke kurva Bezier). Dipakai supaya garis doodle
 * berkelok halus tepat di posisi tiap judul, bukan sekadar mendekatinya.
 */
function smoothThrough(points, tension = 0.9) {
  if (points.length < 2) return '';
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const k = (tension * 2) / 6;
    const c1x = p1[0] + (p2[0] - p0[0]) * k;
    const c1y = p1[1] + (p2[1] - p0[1]) * k;
    const c2x = p2[0] - (p3[0] - p1[0]) * k;
    const c2y = p2[1] - (p3[1] - p1[1]) * k;
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/**
 * Manfaat: tiap judul tersingkap dari tengah melebar ke samping, di-scrub
 * mengikuti scroll dengan titik mulai bertahap — persis cara ClipPathTitle
 * dipakai di BenefitSection SPYLT (aniStart 17/24/31/38).
 *
 * Titik mulainya dinyatakan dalam persen tinggi section, jadi jaraknya ikut
 * menyesuaikan sendiri di layar pendek maupun panjang.
 */
export default function initBenefits() {
  const section = document.querySelector('[data-benefits]');
  if (!section) return;

  const items = gsap.utils.toArray('[data-benefit-item]', section);
  const intro = section.querySelector('[data-benefits-intro]');
  if (!items.length) return;

  /* ---------------- garis doodle yang tergambar mengikuti scroll ----------------
   * Rentangnya sengaja 'top center' → 'bottom center', bukan patokan tepi layar.
   * Dengan begitu progres menggambar = seberapa jauh titik tengah viewport sudah
   * melintasi section, sehingga ujung garis selalu berada kira-kira setinggi mata
   * pembaca. Kalau memakai 'top bottom' → 'bottom top', ujungnya akan berlari
   * mendahului atau tertinggal dari pandangan.
   */
  const line = section.querySelector('[data-benefits-line]');
  if (line) {
    const svg = line.closest('svg');

    /**
     * Jalur digambar ulang dalam piksel asli tiap kali layout berubah, dengan
     * titik belok dikunci ke posisi sebenarnya tiap judul — jadi garisnya
     * benar-benar meliuk melewati judul, bukan menebak koordinat.
     */
    function buildPath() {
      const w = section.offsetWidth;
      const h = section.offsetHeight;
      if (!w || !h) return;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

      const top = section.getBoundingClientRect().top;
      const midY = (el) => {
        const r = el.getBoundingClientRect();
        return r.top - top + r.height / 2;
      };

      const first = midY(items[0]);
      const last = midY(items[items.length - 1]);

      // mulai di luar layar kiri, lalu bergantian kanan–kiri melewati tiap
      // judul, dan keluar di luar layar kanan
      const pts = [[-w * 0.15, Math.max(24, first - (h - last) * 0.25)]];
      items.forEach((item, i) => {
        pts.push([i % 2 === 0 ? w * 0.9 : w * 0.1, midY(item)]);
      });
      pts.push([w * 1.15, Math.min(h - 24, last + (h - last) * 0.5)]);

      line.setAttribute('d', smoothThrough(pts));
    }

    buildPath();

    gsap.fromTo(
      line,
      { drawSVG: '0%' },
      {
        drawSVG: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top center',
          end: 'bottom center',
          scrub: 0.4,
          // panjang jalur berubah setelah dihitung ulang, jadi nilai tween
          // harus ikut dihitung ulang
          invalidateOnRefresh: true,
        },
      }
    );

    // hitung ulang sebelum ScrollTrigger mengukur, mis. saat resize
    ScrollTrigger.addEventListener('refreshInit', buildPath);
  }

  if (intro) {
    gsap.set(intro, { y: 40, opacity: 0 });
    gsap.to(intro, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 72%', once: true },
    });
  }

  items.forEach((item, i) => {
    const clip = item.querySelector('[data-clip-title]');
    const desc = item.querySelector('[data-benefit-desc]');
    const start = 12 + i * 12;

    if (clip) {
      gsap.to(clip, {
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        ease: 'circ.out',
        scrollTrigger: {
          trigger: section,
          start: `${start}% 85%`,
          end: `${start + 10}% 85%`,
          scrub: 0.5,
        },
      });
    }

    if (desc) {
      gsap.set(desc, { opacity: 0, y: 16 });
      gsap.to(desc, {
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: `${start + 4}% 85%`,
          end: `${start + 12}% 85%`,
          scrub: 0.5,
        },
      });
    }
  });
}
