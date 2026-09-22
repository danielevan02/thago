import gsap from 'gsap';

/**
 * Preloader — serah-terima, bukan tirai yang pergi.
 *
 * Dua benda dioper utuh dari layar muat ke halaman, dan itulah yang membuatnya
 * terasa nyambung alih-alih seperti dua layar berbeda:
 *
 *  1. WORDMARK. Komponen <Logo> yang sama persis dengan yang di hero, warna
 *     sama, tanpa perubahan apa pun. Ia terbang ke posisi wordmark raksasa di
 *     hero lalu bertukar tempat dengannya. Karena keduanya identik dan
 *     sejajar piksel, pertukarannya tidak terlihat.
 *
 *     Sasarannya hero, BUKAN logo navbar: hero memajang nama brand dalam
 *     ukuran raksasa, jadi wordmark yang menyusut ke pojok navbar akan
 *     membuat THAGO raksasa itu muncul entah dari mana tepat di bawahnya.
 *     Logo navbar sendiri baru muncul setelah hero terlewat — lihat nav.js.
 *
 *  2. TIRAI. Turun (bukan naik) sampai hanya tudung gelombangnya yang tersisa,
 *     tepat menimpa tepi bergelombang di dasar hero — bentuk yang sama karena
 *     memakai komponen <Scallop> yang sama. Preloader lalu dibuang dan yang
 *     tertinggal adalah tepi hero yang memang sudah ada di sana.
 *
 * Selama menunggu, wordmark ITU SENDIRI yang jadi penunjuk progres: hurufnya
 * distempel masuk satu per satu sebagai bejana kosong, lalu indigo naik
 * mengisinya dari bawah mengikuti pemuatan yang sebenarnya, ditemani angka
 * 0–100%. Tidak ada bar terpisah — bar hanya akan mengulang informasi yang
 * sudah disampaikan isian itu.
 */

/** Stempel masuk tiap huruf. */
const STAMP = { duration: 0.55, stagger: 0.08 };

/**
 * Kapan angka mulai bergerak, dan durasi minimum hitungan 0→100 (detik).
 *
 * COUNT_MIN inilah lantai waktunya: pada kunjungan ber-cache, progres
 * sebenarnya melompat ke 100% dalam beberapa milidetik, dan tanpa lantai ini
 * angkanya cuma berkedip dari 0 ke 100 — penunjuk progres yang tidak pernah
 * terbaca sama sekali.
 */
const COUNT_START = 0.35;
const COUNT_MIN = 0.75;

/**
 * Atap waktu tunggu, detik. Mencegah koneksi lambat menyandera orang: setelah
 * ini hitungan dipaksa lari ke 100 apa pun keadaan pemuatan. Trafiknya dari
 * bio IG dan mayoritas HP, jadi lebih baik masuk dengan font yang belum
 * sempurna daripada menahan orang di layar ungu — `document.fonts.ready` di
 * main.js tetap memicu ScrollTrigger.refresh() setelahnya.
 */
const CEILING = 2.5;

/**
 * Jadwal keluar, detik relatif terhadap awal outro.
 *
 * Sapuan tirainya sengaja 0,85 dtk: itu gerakan terbesar di layar, dan kalau
 * lebih cepat dari itu ia terbaca sebagai potongan, bukan sapuan.
 */
const OUT = {
  count: 0,
  flight: 0.08,
  flightDur: 0.85,
  curtain: 0.14,
  curtainDur: 0.85,
  navItems: 0.55,
};

/**
 * @param {{ onReveal?: () => void }} opts
 *   onReveal dipanggil saat tirai mendarat — bukan saat seluruh intro selesai.
 *   Di situlah halaman sudah utuh terlihat, jadi di situ pula scroll harus
 *   dibuka. Menunggu intro hero rampung berarti mengunci scroll ~2 detik
 *   setelah halaman tampak siap, dan orang yang menggulir di jeda itu akan
 *   mengira webnya macet.
 */
export default function initPreloader({ onReveal } = {}) {
  const root = document.querySelector('[data-preloader]');

  // Tanpa preloader (mis. sudah dibuang), kembalikan timeline yang langsung
  // jalan supaya Hero yang menempel padanya tetap teranimasikan.
  if (!root) {
    onReveal?.();
    return gsap.timeline();
  }

  const curtain = root.querySelector('[data-preloader-curtain]');
  const logo = root.querySelector('[data-preloader-logo]');
  const fill = root.querySelector('[data-preloader-fill]');
  const wave = root.querySelector('[data-preloader-wave]');
  const count = root.querySelector('[data-preloader-count]');
  const countValue = root.querySelector('[data-preloader-count-value]');
  const heroWordmark = document.querySelector('[data-hero-wordmark]');
  const navItems = document.querySelectorAll('[data-nav-item]');
  const heroScallop = document.querySelector('[data-hero-scallop]');

  // Tanpa sasaran mendarat, serah-terimanya tidak punya arti — jangan sampai
  // wordmark terbang ke koordinat kosong.
  if (!heroWordmark) {
    onReveal?.();
    root.remove();
    return gsap.timeline();
  }

  // Wordmark hero disembunyikan sampai yang terbang mendarat menimpanya.
  gsap.set(heroWordmark, { opacity: 0 });
  gsap.set(navItems, { opacity: 0, y: -8 });

  /* ---------------- masuk: huruf distempel ---------------- */

  // Dua lapis logo yang setumpuk. Huruf ke-i di keduanya HARUS bergerak
  // identik — kalau tidak, saat isian mulai naik, lapis atas dan bawah tidak
  // sejajar dan hurufnya terlihat berbayang.
  const outlineLetters = root.querySelectorAll('[data-preloader-logo] > svg [data-logo-letter]');
  const fillLetters = fill.querySelectorAll('[data-logo-letter]');

  // set()+to(), bukan from(): global.css sudah menyembunyikan huruf ini supaya
  // tidak berkedip sebelum JS jalan, dan from() akan membaca opasitas 0 itu
  // sebagai nilai AKHIR — hurufnya tidak akan pernah muncul.
  [outlineLetters, fillLetters].forEach((set) => {
    gsap.set(set, { scale: 1.55, opacity: 0, rotate: -10, transformOrigin: '50% 50%' });
    gsap.to(set, {
      scale: 1,
      opacity: 1,
      rotate: 0,
      duration: STAMP.duration,
      stagger: STAMP.stagger,
      ease: 'expo.out',
    });
  });

  gsap.from(count, { opacity: 0, y: 8, duration: 0.4, delay: 0.3, ease: 'power2.out' });

  /**
   * Nafas pelan selama menunggu.
   *
   * Kalau pemuatan tersendat, hitungan ikut berhenti — dan wordmark yang
   * benar-benar diam terbaca seperti halaman hang. Amplitudonya cuma 3%:
   * cukup untuk menandakan "masih hidup", belum sampai terbaca sebagai
   * animasi.
   *
   * WAJIB tween terpisah, bukan bagian timeline mana pun: tween `repeat: -1`
   * membuat durasi timeline induknya jadi Infinity.
   */
  const idle = gsap.to(logo, {
    scale: 1.025,
    duration: 1.5,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    paused: true,
    delay: STAMP.duration + STAMP.stagger * 4,
  });

  /* ---------------- progres asli ---------------- */

  const images = Array.from(document.images);
  const total = images.length + 2; // + font + window.load
  let done = 0;

  images.forEach((img) => {
    if (img.complete) {
      done += 1;
      return;
    }
    const step = () => {
      done += 1;
    };
    img.addEventListener('load', step, { once: true });
    img.addEventListener('error', step, { once: true });
  });

  if (document.fonts) document.fonts.ready.then(() => (done += 1));
  else done += 1;

  if (document.readyState === 'complete') done += 1;
  else window.addEventListener('load', () => (done += 1), { once: true });

  const master = gsap.timeline({ paused: true });

  const started = performance.now();
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    idle.kill();
    master.play();
  };

  // Setelah atap terlewat, hitungan dipaksa lari ke 100 apa pun keadaan
  // pemuatan — lewat jalur yang SAMA, bukan dengan melompati animasinya.
  // Kalau outro dipicu langsung, wordmark terbang ke navbar dalam keadaan
  // setengah terisi dan mendarat sebagai logo yang salah.
  let forced = null;
  gsap.delayedCall(CEILING, () => {
    forced = { at: (performance.now() - started) / 1000, from: shown };
  });

  const render = (v, elapsed = 0) => {
    countValue.textContent = Math.round(v * 100);
    // Permukaan cairan naik dari bawah: translate 1 = kosong, 0 = penuh.
    // Goyangan mendatarnya kecil saja (±0,015 lebar wordmark) — cukup untuk
    // membuat permukaannya hidup, belum sampai terbaca sebagai animasi
    // tersendiri yang mencuri perhatian dari angkanya.
    const sway = Math.sin(elapsed * 2.4) * 0.015;
    // Overshoot 0,08 di ujung atas: permukaan gelombang berayun di sekitar
    // garisnya, jadi kalau v=1 dipetakan tepat ke 0, palung riaknya menyisakan
    // pucuk huruf tak terisi — dan yang terbang ke navbar harus logo utuh.
    const level = (1 - v) * 1.08 - 0.08;
    wave.setAttribute('transform', `translate(${sway.toFixed(4)} ${level.toFixed(4)})`);
  };
  render(0);

  /**
   * Pemulusan dipasang HANYA pada progres asli, bukan pada nilai tampilnya.
   *
   * Progres asli bergerak melompat — satu font selesai, angkanya langsung
   * naik sepertiga — jadi ia perlu diperhalus. Tapi `pace` sudah mulus dari
   * sananya (ramp linear terhadap waktu), dan kalau hasil min() keduanya
   * dihaluskan lagi, ekor eksponensialnya menyeret: terukur hitungan baru
   * menyentuh 100% di 1,66 dtk padahal lajunya dirancang selesai 1,1 dtk,
   * dengan angka mandek di "99%" hampir setengah detik.
   */
  let smoothedReal = 0;
  let shown = 0;

  const tick = () => {
    const elapsed = (performance.now() - started) / 1000;
    smoothedReal += (done / total - smoothedReal) * 0.12;

    // laju minimum: angkanya tidak boleh sampai 100 sebelum COUNT_MIN lewat
    const pace = gsap.utils.clamp(0, 1, (elapsed - COUNT_START) / COUNT_MIN);

    if (forced) {
      // Dari nilai saat atap terlewat, lari ke 100 dalam 0,5 dtk — bukan
      // melompat. Kalau pemuatan tersendat di 40%, lompatan 40→100 terbaca
      // sebagai angka yang berbohong; sprint pendek terbaca sebagai menyerah
      // dengan sopan.
      const t = gsap.utils.clamp(0, 1, (elapsed - forced.at) / 0.5);
      shown = forced.from + (1 - forced.from) * t;
    } else {
      shown = Math.min(smoothedReal, pace);
    }

    if (shown >= 0.995) {
      gsap.ticker.remove(tick);
      render(1, elapsed);
      release();
      return;
    }
    render(shown, elapsed);
  };
  gsap.ticker.add(tick);

  /* ---------------- keluar: serah-terima ---------------- */

  /**
   * Sasaran terbang dihitung saat tween MULAI, dari keadaan wordmark SAAT ITU
   * JUGA — bukan dari kotak yang diukur waktu init.
   *
   * Dua hal bisa berubah di antara kedua saat itu. Pertama, nafas tunggu
   * meninggalkan sisa skala pada wordmark (kill tidak mengembalikannya), jadi
   * acuan dari init akan meleset beberapa persen. Kedua, kotak init hanya
   * benar kalau gaya sudah terpasang saat skrip jalan — patokan yang tidak
   * perlu dipertaruhkan padahal bisa diukur ulang.
   *
   * Karena x/y/scale GSAP itu absolut terhadap posisi tanpa transform, nilai
   * yang sedang berlaku harus ditambahkan kembali, bukan diabaikan.
   */
  const flightTo = () => {
    const now = logo.getBoundingClientRect();
    const to = heroWordmark.getBoundingClientRect();
    const curScale = Number(gsap.getProperty(logo, 'scale')) || 1;
    const curX = Number(gsap.getProperty(logo, 'x')) || 0;
    const curY = Number(gsap.getProperty(logo, 'y')) || 0;
    return {
      scale: curScale * (to.width / now.width),
      x: curX + (to.left + to.width / 2 - (now.left + now.width / 2)),
      y: curY + (to.top + to.height / 2 - (now.top + now.height / 2)),
    };
  };

  const landing = OUT.flight + OUT.flightDur;

  master
    .to(count, { opacity: 0, y: 10, duration: 0.3, ease: 'power2.in' }, OUT.count)
    .to(
      logo,
      {
        x: () => flightTo().x,
        y: () => flightTo().y,
        scale: () => flightTo().scale,
        duration: OUT.flightDur,
        ease: 'power3.inOut',
      },
      OUT.flight
    )
    .to(
      curtain,
      {
        // Berhenti tepat di tepi gelombang hero. Diukur dari elemennya
        // langsung, bukan dari window.innerHeight: di HP, `100svh` milik hero
        // lebih pendek daripada innerHeight saat bilah URL terlihat, dan
        // selisih itu akan menyisakan garis ungu menggantung.
        y: () => (heroScallop ? heroScallop.getBoundingClientRect().bottom : window.innerHeight),
        duration: OUT.curtainDur,
        ease: 'power4.inOut',
      },
      OUT.curtain
    )
    // tukar tempat: keduanya sejajar piksel, jadi tidak ada yang terlihat
    .set(heroWordmark, { opacity: 1 }, landing)
    .set(logo, { opacity: 0 }, landing)
    .to(navItems, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.1 }, OUT.navItems)
    .add(() => {
      root.remove();
      onReveal?.();
    }, OUT.curtain + OUT.curtainDur);

  /**
   * Titik masuk Hero, ditandai di sini karena jadwalnya milik preloader.
   *
   * Hero harus SUDAH bergerak sebelum tirai melewatinya. Kalau ia menunggu
   * tirai selesai, yang tersingkap adalah krem kosong dulu selama beberapa
   * ratus milidetik, lalu isinya baru menyusul — dan kesan "menyambung" itu
   * hilang justru di momen yang paling menentukan.
   */
  master.addLabel('reveal', OUT.curtain + 0.2);

  return master;
}
