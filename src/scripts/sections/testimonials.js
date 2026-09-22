import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Testimoni — mengikuti TestimonialSection SPYLT.
 *
 * 1. Tiga baris judul raksasa saling bergeser horizontal mengikuti scroll
 *    (+70% / +25% / −50%, angka yang sama dipakai referensi). Karena arahnya
 *    berbeda-beda, kata-katanya terurai dan menyingkap kartu di baliknya.
 *
 * 2. Kartu terbang naik dari bawah (yPercent 150 → 0) dengan stagger.
 *
 * 3. Selama section ter-pin, seluruh isinya TETAP merayap naik pelan-pelan,
 *    tidak membeku. Di referensi efek ini muncul karena tween `marginTop`
 *    (0 → -190vh) masih berjalan pada section yang sudah `position: fixed`
 *    akibat pin — margin tetap menggeser elemen fixed. Di sini efeknya dibuat
 *    langsung: pembungkus isi digeser `y` selama pin. Lajunya disamakan dengan
 *    referensi, lihat CREEP_RATE.
 *
 * PERBAIKAN DARI REFERENSI: di sana pemicu kartu memakai `start: "-10% bottom"`
 * pada section — itu menyala saat section masih di BAWAH layar, sehingga
 * kartu-kartunya sudah muncul sebelum kata ketiga sempat terbaca. Di sini
 * pemicunya adalah baris ketiga itu sendiri, dengan `start: 'bottom 92%'`,
 * yaitu tepat setelah seluruh kata "MEREKA" masuk layar. Urutan bacanya jadi
 * benar: baca judulnya dulu, baru kartunya muncul.
 */
/** Panjang pin kartu, dalam kelipatan tinggi layar. */
const PIN_FRACTION = 0.65;

/**
 * Laju rayapan isi section selama pin, relatif terhadap jarak scroll.
 *
 * Angkanya diturunkan dari referensi, bukan dikira-kira: di sana marginTop
 * bergerak 0 → -190vh sepanjang rentang trigger 670vh (start "-200% bottom"
 * = 380vh + 100vh sebelum section, end "bottom top" = 190vh sesudahnya).
 * 190/670 ≈ 0.28. Jadi setiap 100px scroll, isinya naik 28px — jelas bergerak,
 * tapi jauh lebih lambat dari scroll biasa sehingga kartunya tetap terbaca.
 */
const CREEP_RATE = 0.28;

/**
 * Pergeseran kipas kartu dari TENGAH layar saat animasinya selesai, dalam
 * fraksi tinggi layar. 0 = benar-benar di tengah, negatif = naik.
 *
 * Dulunya ini `CARD_TOP_AT_REST = 0.38`, yaitu posisi puncak kipas dipatok di
 * 38% tinggi layar meniru referensi — di sana bagian bawah kartu memang
 * menembus tepi bawah layar. Masalahnya angka itu tetap sementara TINGGI KARTU
 * ikut lebar layar (md:w-96 dengan rasio 9:16 ≈ 73% tinggi layar di 934px, tapi
 * proporsinya berubah di layar lain). Patokan tetap berarti sisa ruang atas dan
 * bawah tidak pernah seimbang, dan di layar pendek kartunya terpotong parah.
 *
 * Sekarang sasarannya dihitung: (tinggi layar − tinggi kipas) ÷ 2. Berapa pun
 * tinggi kartunya, sisa ruang atas dan bawah selalu sama.
 */
const CARD_BIAS = 0;

export default function initTestimonials() {
  const section = document.querySelector('[data-testimonials]');
  if (!section) return;

  const inner = section.querySelector('[data-testi-inner]');
  const cardsBox = section.querySelector('[data-testi-cards]');
  const lines = gsap.utils.toArray('[data-testi-line]', section);
  const cards = gsap.utils.toArray('[data-testi-card]', section);

  // --- 1. judul terurai horizontal ---
  if (lines.length) {
    const drift = [70, 25, -50];
    gsap
      .timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
      .to(lines, { xPercent: (i) => drift[i] ?? 0, ease: 'none' }, 0);
  }

  // --- 2. kartu terbang naik, SETELAH baris ketiga terbaca ---
  if (cards.length) {
    const lastLine = lines[lines.length - 1] ?? section;

    /**
     * Titik scroll saat pin kartu mulai. Dua syarat harus TERPENUHI SEMUA,
     * jadi nilainya = yang paling belakangan di antara keduanya:
     *
     *  1. baris "MEREKA" sudah nyaman terbaca (bottom-nya di 62% layar).
     *     Di referensi pemicunya section dengan `start: "-10% bottom"`, yang
     *     menyala saat section masih di BAWAH layar — itu bug yang bikin kartu
     *     muncul sebelum kata ketiga sempat terbaca.
     *
     *  2. section sudah selesai menimpa video, yaitu top-nya sudah menyentuh
     *     atas layar. Tanpa syarat ini, di layar sempit (judul hanya ~270px,
     *     bukan ~990px seperti desktop) syarat 1 terpenuhi jauh lebih awal —
     *     kartunya terbang sementara video masih mengintip di atas, dan dua
     *     pin saling tumpang.
     *
     * Di desktop syarat 1 yang menang, di mobile syarat 2.
     */
    const pinStart = () => {
      const lineY =
        lastLine.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * 0.62;
      const coverY = section.getBoundingClientRect().top + window.scrollY;
      return Math.max(lineY, coverY);
    };

    /**
     * Posisikan kipas kartu supaya framing-nya benar SAAT ANIMASINYA SELESAI.
     *
     * Tidak bisa pakai nilai `bottom` statis: posisi section saat ter-pin
     * ditentukan oleh pinStart() di atas, yang di desktop bergantung pada
     * tinggi judul — dan judulnya 20.5vw, jadi ikut lebar layar. Antara 1440px
     * dan 1920px selisihnya ~240px, cukup untuk membuat kipasnya melayang di
     * tengah atau terpotong habis.
     *
     * Jadi dihitung mundur dari sasaran: puncak kipas di titik yang membuatnya
     * terpusat vertikal, setelah rayapan CREEP_RATE ikut diperhitungkan.
     */
    const frameCards = () => {
      if (!cardsBox) return;
      const vh = window.innerHeight;
      // posisi atas section di layar selama pin (negatif = sudah lewat atas)
      const sectionTopOnScreen = section.getBoundingClientRect().top + window.scrollY - pinStart();
      const creep = vh * PIN_FRACTION * CREEP_RATE;

      // Sasaran: puncak kipas di layar. Dihitung dari tinggi kipas yang
      // sebenarnya, jadi sisa ruang atas dan bawah selalu sama berapa pun
      // ukuran kartunya. offsetHeight aman dipakai di sini — rotate/translate
      // tiap kartu itu transform, dan transform tidak mengubah offsetHeight.
      const target = (vh - cardsBox.offsetHeight) / 2 + CARD_BIAS * vh;

      const bottom =
        sectionTopOnScreen + section.offsetHeight - cardsBox.offsetHeight - creep - target;
      cardsBox.style.bottom = `${Math.round(bottom)}px`;
    };

    // refreshInit = sebelum ScrollTrigger mengukur ulang, jadi posisi baru ini
    // sudah terpakai saat trigger dihitung. Pin juga sudah dilepas di titik ini,
    // sehingga getBoundingClientRect membaca layout asli.
    ScrollTrigger.addEventListener('refreshInit', frameCards);
    frameCards();

    // rotate/translate tiap kartu ditulis di markup lewat properti `rotate` &
    // `translate` (bukan `transform`), jadi tween yPercent di sini tidak
    // menimpanya — GSAP menulis ke `transform` yang terpisah.
    gsap.set(cards, { yPercent: 150 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: pinStart,
        // Pin-nya WAJIB ada. Tanpa pin, stagger 0.2 merentang sepanjang jarak
        // scroll nyata sehingga kartu terakhir baru sampai setelah section
        // hampir habis — separuh kartu tidak pernah terlihat naik. Dengan pin,
        // scroll halaman berhenti sebentar sehingga seluruh stagger selesai di
        // tempat. Isinya sendiri TIDAK ikut berhenti — lihat tween rayapan
        // di bawah, yang membuat judulnya terus naik pelan-pelan.
        pin: section,
        end: () => `+=${Math.round(window.innerHeight * PIN_FRACTION)}`,
        scrub: 1.5,
        anticipatePin: 0,
        invalidateOnRefresh: true,
      },
    });

    // stagger 0.2 × 6 kartu + durasi 0.5 → timeline berakhir di 1.5
    const SPAN = 1.5;

    tl.to(cards, { yPercent: 0, ease: 'power1.inOut', stagger: 0.2, duration: 0.5 }, 0)
      // Rayapan naik sepanjang SELURUH pin, jadi tidak ada satu momen pun di
      // mana isi section terlihat diam. Digeser di pembungkus, bukan di kartu,
      // supaya tidak bertengkar dengan tween yPercent di atas.
      .to(
        inner,
        {
          y: () => -window.innerHeight * PIN_FRACTION * CREEP_RATE,
          ease: 'none',
          duration: SPAN,
        },
        0
      );
  }

  /* --- 3. hover: kartu tegak, yang lain menyingkir, videonya main --- */

  // Hanya untuk penunjuk yang benar-benar bisa hover. Di layar sentuh,
  // `mouseenter` tetap terpicu sekali saat disentuh lalu tidak pernah ada
  // `mouseleave` — kartunya akan tersangkut tegak selamanya.
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (canHover && cards.length) {
    /**
     * Kartu ditumpuk kiri ke kanan: yang lebih kanan digambar DI ATAS yang
     * lebih kiri. Konsekuensinya, kartu yang di-hover hanya tertutup oleh SATU
     * kartu — tetangga kanannya. Kartu kanan berikutnya sudah bergeser sejauh
     * `step` (208px di desktop), lebih dari lebar kartu, jadi tidak menyentuhnya.
     *
     * Karena itu kartu di kanan harus menyingkir sejauh lebar tumpangannya,
     * bukan sekadar sedikit — kalau kurang, kartu yang di-hover tetap tertutup.
     *
     * Diukur dari layout, bukan ditulis tetap: tumpangan desktop (176px dari
     * `-ml-44`) berbeda dari mobile, dan lebar kartunya sendiri ikut vw.
     */
    const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 0;
    const overlap = Math.max(0, cards[0].offsetWidth - step);

    // Sejauh apa tetangga kanan HARUS menyingkir supaya kartu yang di-hover
    // benar-benar terbuka: selebar tumpangannya, plus sedikit celah.
    const NEED_RIGHT = Math.round(overlap + 24);

    /**
     * Berapa banyak kipas boleh melebar sebelum kartu tepinya keluar layar.
     *
     * Versi sebelumnya memakai OPEN_RIGHT tetap untuk semua kartu di kanan,
     * jadi kipasnya selalu melebar sebesar OPEN_LEFT + OPEN_RIGHT (±288px di
     * desktop) tanpa peduli masih ada ruang atau tidak. Di layar yang kipasnya
     * sudah hampir selebar viewport, kartu paling kanan terpotong.
     *
     * Sekarang jatah geser diukur dari ruang kosong yang benar-benar tersisa di
     * kiri dan kanan kipas. getBoundingClientRect dipakai karena tiap kartu
     * dimiringkan — sudut kartu yang berotasi menjulur lebih jauh daripada
     * kotak layout-nya, dan itu yang sebenarnya terlihat terpotong.
     */
    const EDGE = 8;

    /** Jatah geser ke kanan PER KARTU. Diisi measureOpen(). */
    let openRight = [];
    let OPEN_LEFT = Math.round(overlap * 0.5);
    /** Seberapa jauh kartu yang di-hover ikut mundur, per indeks. */
    let pullHovered = [];

    const measureOpen = () => {
      const rects = cards.map((c) => c.getBoundingClientRect());
      const slackLeft = Math.max(0, rects[0].left - EDGE);

      // Batasnya PER KARTU, bukan satu angka untuk semua. Kartu di tengah
      // kipas masih tertutup tetangga kanannya, jadi ia bebas bergeser penuh;
      // yang benar-benar berisiko keluar layar hanya kartu paling kanan.
      // Inilah bedanya dengan versi lama yang memakai satu OPEN_RIGHT untuk
      // semua — di sana seluruh kipas melebar, dan tepinya yang jadi korban.
      openRight = rects.map((r) =>
        Math.round(Math.min(NEED_RIGHT, Math.max(0, window.innerWidth - EDGE - r.right)))
      );

      // Kalau tetangga kanan tidak bisa menyingkir penuh (terjadi saat yang
      // di-hover kartu kedua dari kanan), kekurangannya diambil dari kiri:
      // kartu itu sendiri yang mundur. Jarak bukaannya tetap utuh.
      pullHovered = cards.map((_, i) => {
        const neighbour = openRight[i + 1];
        if (neighbour === undefined) return 0;
        return Math.round(Math.min(NEED_RIGHT - neighbour, slackLeft));
      });

      OPEN_LEFT = Math.round(Math.min(overlap * 0.5 + Math.max(...pullHovered), slackLeft));
    };

    // Diukur ulang tiap refresh: lebar kartu ikut vw, dan jumlah ruang kosong
    // berubah drastis antara 1280px dan 1920px.
    ScrollTrigger.addEventListener('refreshInit', measureOpen);
    measureOpen();

    /**
     * Suara berlaku untuk SELURUH kartu, bukan per kartu.
     *
     * Sekali pengunjung menyalakannya, hover berikutnya ikut bersuara —
     * mematikannya lagi di tiap kartu cuma akan menyebalkan. Dan secara teknis
     * klik pertama itulah yang membuka kunci autoplay bersuara di Chrome dan
     * Safari, jadi memang tidak masuk akal menyimpannya per kartu.
     */
    let soundOn = false;
    const soundButtons = gsap.utils.toArray('[data-testi-sound]', section);

    const syncSoundButtons = () => {
      soundButtons.forEach((btn) => {
        btn.setAttribute('aria-pressed', String(soundOn));
        btn.setAttribute('aria-label', soundOn ? 'Matikan suara' : 'Nyalakan suara');
        btn.querySelector('[data-icon-off]')?.classList.toggle('hidden', soundOn);
        btn.querySelector('[data-icon-on]')?.classList.toggle('hidden', !soundOn);
      });
    };

    /**
     * Putar dengan menghormati pilihan suara, DENGAN jaring pengaman.
     *
     * Meski soundOn baru bisa true setelah ada klik, autoplay bersuara masih
     * bisa ditolak — misalnya kalau pengunjung mematikan autoplay media di
     * setelan browser. Kalau itu terjadi, lebih baik videonya tetap jalan
     * tanpa suara daripada diam sama sekali.
     */
    const playCard = (video) => {
      if (!video) return;
      video.muted = !soundOn;
      video.play?.().catch(() => {
        video.muted = true;
        video.play?.().catch(() => {});
      });
    };

    cards.forEach((card, i) => {
      const base = Number(card.dataset.rot) || 0;
      const video = card.querySelector('video');

      card.querySelector('[data-testi-sound]')?.addEventListener('click', (e) => {
        // Kartunya sendiri tidak punya handler klik, tapi tombol ini duduk di
        // atas video — tanpa ini, klik bisa ikut diteruskan ke kontrol bawaan.
        e.stopPropagation();
        soundOn = !soundOn;
        syncSoundButtons();
        // Diterapkan ke video kartu ini SEKARANG, di dalam handler klik:
        // di titik inilah gestur penggunanya masih berlaku.
        if (video) {
          video.muted = !soundOn;
          if (video.paused) playCard(video);
        }
      });

      card.addEventListener('mouseenter', () => {
        // SENGAJA tidak menyentuh zIndex. Menaikkannya membuat kartu melompat
        // ke depan menembus kartu yang seharusnya menimpanya — urutan
        // tumpukan kipasnya jadi kacau. Kartu ini terlihat karena tetangga
        // kanannya MINGGIR, bukan karena dipaksa naik ke depan.
        gsap.to(card, {
          rotation: 0,
          scale: 1.06,
          // Ikut mundur HANYA kalau tetangga kanannya tidak bisa menyingkir
          // penuh. Nilainya 0 untuk hampir semua kartu — memindahkan kartu
          // yang sedang jadi fokus itu mengganggu, jadi ini jalan terakhir.
          x: -pullHovered[i],
          duration: 0.45,
          ease: 'power3.out',
          // 'auto' hanya membatalkan properti yang bentrok (rotation/scale/x),
          // bukan yPercent milik timeline reveal — jadi kartu yang sedang
          // terbang naik tidak berhenti di tengah jalan kalau tersenggol kursor.
          overwrite: 'auto',
        });

        // yang lain menyingkir ke kiri/kanan sesuai posisinya terhadap kartu
        // ini. Digeser lewat `x`, bukan `yPercent` — yPercent milik reveal.
        cards.forEach((other, j) => {
          if (j === i) return;
          gsap.to(other, {
            x: j < i ? -OPEN_LEFT : openRight[j],
            duration: 0.45,
            ease: 'power3.out',
            overwrite: 'auto',
          });
        });

        playCard(video);
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotation: base,
          scale: 1,
          x: 0,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: 'auto',
        });

        cards.forEach((other, j) => {
          if (j === i) return;
          gsap.to(other, { x: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
        });

        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      });
    });
  }
}
