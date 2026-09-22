import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/**
 * Mitos vs Fakta — "coret mitosnya".
 *
 * Tiap mitos di-split per BARIS, lalu setiap baris diberi overlay SVG berisi
 * satu coretan bergelombang yang digambar dalam piksel asli baris itu (1:1,
 * bukan viewBox yang diregangkan — pelajaran dari garis section manfaat:
 * penskalaan tak seragam bikin tebal garis belang).
 *
 * Saat scroll: coretan tergambar baris demi baris (scrub, bisa maju-mundur),
 * teks mitosnya meredup, lalu stiker fakta menghantam masuk ala stempel.
 *
 * Mode reduced-motion tidak masuk ke sini — CSS line-through di global.css
 * yang mengambil alih, supaya mitos tidak pernah tampil tanpa coretan.
 */

/** Coretan tangan: garis bergelombang melintasi pita tengah baris. */
function strikePath(w, h) {
  const y = (f) => (h * f).toFixed(1);
  const x = (f) => (w * f).toFixed(1);
  return (
    `M ${x(-0.02)},${y(0.58)} ` +
    `C ${x(0.16)},${y(0.44)} ${x(0.3)},${y(0.68)} ${x(0.46)},${y(0.55)} ` +
    `C ${x(0.62)},${y(0.42)} ${x(0.78)},${y(0.66)} ${x(1.02)},${y(0.5)}`
  );
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function buildStrike(line) {
  const w = line.offsetWidth;
  const h = line.offsetHeight;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('aria-hidden', 'true');
  Object.assign(svg.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    overflow: 'visible',
    pointerEvents: 'none',
  });

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', strikePath(w, h));
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#e52c74');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-width', String(gsap.utils.clamp(5, 13, h * 0.16)));

  svg.appendChild(path);
  line.appendChild(svg);
  return path;
}

export default function initMyths({ reduced = false } = {}) {
  const section = document.querySelector('[data-myths]');
  if (!section || reduced) return;

  // judul masuk
  const title = section.querySelector('[data-myths-title]');
  if (title) {
    gsap.set(title, { y: 50, opacity: 0 });
    gsap.to(title, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: 'play none none reverse' },
    });
  }

  const rebuilds = [];

  gsap.utils.toArray('[data-myth]', section).forEach((item, idx) => {
    const text = item.querySelector('[data-myth-text]');
    const fact = item.querySelector('[data-myth-fact]');
    if (!text || !fact) return;

    // split per baris; tiap baris jadi kanvas coretannya sendiri
    const split = new SplitText(text, { type: 'lines' });
    const paths = split.lines.map((line) => {
      // inline-block: lebar baris menyusut ke teksnya (bukan selebar kolom),
      // jadi coretan tidak menjulur ke ruang kosong di kiri-kanan
      line.style.display = 'inline-block';
      line.style.position = 'relative';
      return buildStrike(line);
    });

    // ukuran baris berubah saat resize — gambar ulang path-nya
    rebuilds.push(() => {
      split.lines.forEach((line, i) => {
        const w = line.offsetWidth;
        const h = line.offsetHeight;
        const svg = line.querySelector('svg');
        svg?.setAttribute('viewBox', `0 0 ${w} ${h}`);
        paths[i]?.setAttribute('d', strikePath(w, h));
      });
    });

    // coretan tergambar baris demi baris, di-scrub
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: text,
        start: 'top 62%',
        end: 'top 34%',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
    paths.forEach((path) => {
      tl.fromTo(path, { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none', duration: 1 });
    });
    // mitos yang sudah dicoret ikut meredup
    tl.to(text, { opacity: 0.38, ease: 'none', duration: 0.6 }, '-=0.4');

    // fakta menghantam masuk ala stempel setelah coretan hampir selesai
    const restRotate = idx % 2 === 0 ? 2 : -2;
    gsap.set(fact, { scale: 1.7, opacity: 0, rotate: restRotate * 4 });
    gsap.to(fact, {
      scale: 1,
      opacity: 1,
      rotate: restRotate,
      duration: 0.35,
      ease: 'power3.in',
      scrollTrigger: {
        trigger: text,
        start: 'top 38%',
        toggleActions: 'play none none reverse',
      },
    });
  });

  ScrollTrigger.addEventListener('refreshInit', () => rebuilds.forEach((fn) => fn()));
}
