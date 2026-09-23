import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Fisika carousel mobile yang dipakai bersama section Varian dan Testimoni.
 *
 * Dipisah ke satu tempat supaya dua section itu tidak hanya mirip, tapi
 * IDENTIK: kalau rasa geraknya mau disetel, cukup di sini, dan keduanya ikut.
 *
 * Scroll-snap-nya sendiri murni CSS di markup masing-masing section; helper ini
 * hanya membaca posisi geser dan menerjemahkannya jadi "coverflow" ringan.
 * Tiap frame, jarak tiap kartu dari tengah rel dihitung dalam satuan lebar
 * kartu (d). Kartu di tengah (d≈0) tegak dan penuh; makin jauh ia makin kecil,
 * turun sedikit, dan miring kembali ke kemiringan dasarnya. Semuanya fungsi
 * dari scrollLeft, jadi gerakannya menempel di jari — bukan animasi yang
 * diputar sesudah jarinya lepas.
 *
 * Yang ditulis ke kartu hanya `rotate`, `transform`, dan (opsional) `opacity`,
 * langsung ke style, bukan lewat gsap: ini dipanggil tiap frame scroll dan
 * tidak ada yang perlu diinterpolasi. Nilai aslinya dicatat dan dikembalikan
 * saat destroy(), karena di desktop properti yang sama dipegang kelas CSS
 * atau tween gsap milik section itu.
 *
 * @param {object}        o
 * @param {HTMLElement}   o.stage     wadah yang menggulir mendatar
 * @param {HTMLElement[]} o.cards
 * @param {boolean}       o.motion    false = hanya lacak kartu aktif, tanpa efek
 * @param {number[]}      o.rotations kemiringan dasar tiap kartu (derajat)
 * @param {(HTMLElement|null)[]} [o.parallax] elemen di dalam kartu yang digeser
 *                                  berlawanan arah (parallax dalam kartu)
 * @param {number}        [o.dim]     seberapa redup kartu tetangga, 0–1
 * @param {(i:number)=>void} o.onActive
 */
export function createRail({ stage, cards, motion, rotations, parallax = [], dim = 0, onActive }) {
  const saved = cards.map((c) => ({
    rotate: c.style.rotate,
    transform: c.style.transform,
    opacity: c.style.opacity,
  }));

  // Posisi tengah tiap kartu di dalam rel, dari offsetLeft — yang mengabaikan
  // transform. Itu penting: getBoundingClientRect akan ikut membaca geseran
  // 40vw milik railEntrance() kalau pengukuran jatuh di tengah animasinya.
  //
  // SYARATNYA: `stage` harus ber-posisi (relative), supaya ia yang menjadi
  // offsetParent kartu. offsetLeft relatif ke offsetParent, dan untuk wadah
  // gulir nilainya tidak ikut berubah saat digeser.
  let centers = [];
  let width = 1;
  const measure = () => {
    centers = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
    width = cards[0]?.offsetWidth || 1;
  };

  let active = -1;
  let frame = 0;
  const render = () => {
    frame = 0;
    const mid = stage.scrollLeft + stage.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;

    cards.forEach((card, i) => {
      const d = (centers[i] - mid) / width;
      const a = Math.min(1, Math.abs(d));
      if (Math.abs(d) < best) {
        best = Math.abs(d);
        nearest = i;
      }
      if (!motion) return;

      // Kartu aktif tidak dibuat tegak 100%: sisa 20% kemiringannya menjaga
      // bahasa stiker brand tetap ada, bahkan di kartu yang sedang dilihat.
      card.style.rotate = `${(rotations[i] || 0) * (0.2 + 0.8 * a)}deg`;
      card.style.transform = `translateY(${a * 22}px) scale(${1 - a * 0.09})`;
      if (dim) card.style.opacity = String(1 - a * dim);
      const inner = parallax[i];
      if (inner) {
        const shift = Math.max(-1.2, Math.min(1.2, d)) * -12;
        inner.style.transform = `translateX(${shift}%)`;
      }
    });

    if (nearest !== active) {
      active = nearest;
      onActive(nearest);
    }
  };
  const queue = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };

  const goTo = (i) => {
    const target = Math.max(0, Math.min(cards.length - 1, i));
    stage.scrollTo({
      left: centers[target] - stage.clientWidth / 2,
      behavior: motion ? 'smooth' : 'auto',
    });
  };

  stage.addEventListener('scroll', queue, { passive: true });
  const ro = new ResizeObserver(() => {
    measure();
    queue();
  });
  ro.observe(stage);
  measure();
  render();

  return {
    goTo,
    get active() {
      return active;
    },
    destroy() {
      cancelAnimationFrame(frame);
      ro.disconnect();
      stage.removeEventListener('scroll', queue);
      stage.scrollLeft = 0;
      cards.forEach((card, i) => {
        card.style.rotate = saved[i].rotate;
        card.style.transform = saved[i].transform;
        card.style.opacity = saved[i].opacity;
        if (parallax[i]) parallax[i].style.transform = '';
      });
    },
  };
}

/**
 * Rel masuk dari kanan dengan back.out — ia sedikit KELEWATAN ke kiri lalu
 * kembali. Lewatan kecil itu yang mengajari "ini bisa digeser ke samping",
 * tanpa satu kata petunjuk pun, dan hanya terjadi sekali.
 *
 * `target` digeser lewat transform, jadi JANGAN berikan elemen yang kartunya
 * ditulis createRail() — berikan rel atau wadahnya. Mengembalikan fungsi
 * pembersih.
 */
export function railEntrance(target, trigger) {
  gsap.set(target, { x: '40vw', opacity: 0 });
  const st = ScrollTrigger.create({
    trigger,
    start: 'top 85%',
    once: true,
    onEnter: () =>
      gsap.to(target, { x: 0, opacity: 1, duration: 1.3, ease: 'back.out(1.6)', delay: 0.1 }),
  });
  return () => {
    st.kill();
    gsap.killTweensOf(target);
    gsap.set(target, { clearProps: 'x,opacity' });
  };
}
