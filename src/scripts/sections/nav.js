import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Navigasi: tombol dua strip di tengah atas, membuka menu selayar penuh.
 *
 * Tirainya sengaja memakai motif yang sama dengan preloader — ungu bertepi
 * gelombang — hanya arahnya kebalikan: tirai preloader turun untuk PERGI,
 * tirai ini turun untuk DATANG. Bentuknya dari komponen <Scallop> yang sama,
 * jadi keduanya mustahil berbeda.
 *
 * @param {{ lenis?: object, reduced?: boolean }} opts
 *   reduced: tanpa animasi, menu langsung tampil/hilang. Wajib tetap
 *   dipanggil pada mode ini — sejak semua tautan pindah ke dalam menu,
 *   melewatkan initNav berarti situsnya tidak punya navigasi sama sekali.
 */
export default function initNav({ lenis, reduced = false } = {}) {
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-nav-menu]');
  if (!toggle || !menu) return;

  const curtain = menu.querySelector('[data-nav-curtain]');
  const bars = toggle.querySelectorAll('[data-nav-bar]');
  const barsBox = toggle.querySelector('[data-nav-bars]');
  const linkRows = menu.querySelectorAll('[data-nav-link]');
  const reveals = menu.querySelectorAll('[data-nav-reveal]');
  const doodlePaths = menu.querySelectorAll('[data-nav-doodle] path');

  let open = false;

  /* ---------------- keadaan tampak/sembunyi ---------------- */

  /**
   * Keadaan tombol diumumkan SEKETIKA saat ditekan, terpisah dari animasinya.
   *
   * Kalau `aria-expanded` ikut menunggu animasi tutup selesai (~1,26 dtk pada
   * easing sekarang), pembaca layar mengumumkan keadaan yang sudah basi —
   * pengguna menekan "Tutup menu" lalu mendengar menunya masih terbuka.
   */
  const announce = () => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  };

  // Tampak/sembunyinya menu sendiri memang mengikuti animasi: selama menutup
  // ia masih terlihat, jadi belum boleh disembunyikan dari pembaca layar.
  const showMenu = () => {
    menu.classList.remove('invisible');
    menu.setAttribute('aria-hidden', 'false');
  };

  const hideMenu = () => {
    menu.classList.add('invisible');
    menu.setAttribute('aria-hidden', 'true');
  };

  hideMenu();
  announce();

  if (reduced) {
    // Tanpa animasi: buka-tutup seketika, tetap bisa dipakai sepenuhnya.
    const flip = () => {
      open = !open;
      announce();
      if (open) showMenu();
      else hideMenu();
    };
    toggle.addEventListener('click', flip);
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a[href^="#"]') && open) flip();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && open) flip();
    });
    return;
  }

  /* ---------------- animasi ---------------- */

  // Jarak tempuh tiap strip ke tengah kotaknya dihitung dari DOM, bukan
  // ditulis tetap: tinggi strip dan tinggi kotaknya diatur CSS dan bisa
  // berubah tanpa file ini ikut disunting.
  const barShift = () => (barsBox.offsetHeight - bars[0].offsetHeight) / 2;

  /**
   * Warna strip: ink di atas latar terang, krem di atas latar gelap, dan
   * selalu krem selagi menu terbuka (tirainya ungu).
   *
   * SEMUA section ditandai terang/gelap, dan yang menang adalah yang PALING
   * BELAKANG di urutan DOM di antara yang sedang aktif.
   *
   * Bukan sekadar "ada section gelap yang aktif": section Testimoni sengaja
   * ditarik naik menimpa VideoPin (margin −100vh, demi serah-terima kipas
   * kartunya), jadi selama satu layar penuh keduanya aktif bersamaan padahal
   * yang tercat di layar hanya Testimoni. Urutan DOM adalah urutan tumpukan
   * di sini, jadi yang belakangan memang yang terlihat.
   *
   * Warnanya diset langsung, TIDAK ditween di dalam timeline buka-tutup:
   * tween merekam warna awalnya saat pertama dijalankan lalu mengembalikan
   * warna basi itu setiap kali dibalik, padahal warna dasarnya berubah
   * mengikuti section yang sedang dilewati.
   */
  const themed = [...document.querySelectorAll('[data-nav-theme]')];
  const active = new Set();

  const currentTheme = () => {
    for (let i = themed.length - 1; i >= 0; i -= 1) {
      if (active.has(themed[i])) return themed[i].dataset.navTheme;
    }
    return 'light';
  };

  const paintBars = () =>
    gsap.to(bars, {
      backgroundColor: open || currentTheme() === 'dark' ? '#faf5e9' : '#241463',
      duration: 0.25,
      ease: 'power2.out',
    });

  themed.forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      // dinilai terhadap posisi tombol, bukan tengah layar
      start: 'top 8%',
      end: 'bottom 8%',
      /**
       * WAJIB refresh paling belakangan.
       *
       * initNav berjalan sebelum section yang memakai pin (Varian, VideoPin,
       * Testimoni), dan ScrollTrigger menyegarkan menurut urutan pembuatan.
       * Tanpa ini, posisi tiap section diukur sebelum pin-spacer terpasang —
       * terukur Nutrition menyala di scroll 4500 padahal seharusnya 9000,
       * sehingga strip krem melayang di atas section krem (kontras nol)
       * sepanjang empat layar.
       */
      refreshPriority: -10,
      onToggle: (self) => {
        if (self.isActive) active.add(sec);
        else active.delete(sec);
        paintBars();
      },
    });
  });

  const tl = gsap.timeline({
    paused: true,
    onReverseComplete: hideMenu,
  });

  tl.set(menu, { onComplete: showMenu })
    .fromTo(
      curtain,
      {
        // Mulai tepat di atas layar, tinggi tepi gelombang ikut diperhitungkan
        // (lebar/12) supaya gelombangnya pun belum mengintip saat tertutup.
        y: () => -(window.innerHeight + window.innerWidth / 12),
      },
      {
        y: 0,
        duration: 0.8,
        /**
         * Tirai mulai merayap pelan lalu terus memburu sampai layar tertutup.
         *
         * Perlu diketahui kalau nanti terasa mengganjal: `in` berarti
         * kecepatannya MAKSIMUM tepat di akhir, jadi gelombangnya melesat
         * keluar tepi bawah lalu berhenti mendadak — tidak ada perlambatan
         * mendarat sama sekali. Ganti ke `power3.out` kalau yang dicari
         * justru pendaratan yang meluncur.
         *
         * Saat ditutup timeline ini dibalik, sehingga easing-nya otomatis
         * jadi `power3.out`.
         */
        ease: 'power3.in',
      },
      0
    )
    .to(bars[0], { y: () => barShift(), rotate: 45, duration: 0.45, ease: 'power3.inOut' }, 0.04)
    .to(bars[1], { y: () => -barShift(), rotate: -45, duration: 0.45, ease: 'power3.inOut' }, 0.04)
    /**
     * Isinya WAJIB mundur jauh, konsekuensi langsung dari easing `in`.
     *
     * Kurva itu hampir tidak bergerak di awal: pada 0,24 dtk tirai baru
     * menutup 3% layar, jadi tautan yang muncul di situ akan melayang di atas
     * halaman yang masih terlihat. Pada 0,68 dtk barulah tertutup ~61%, cukup
     * untuk menampung blok tautan yang berpusat di tengah.
     */
    .fromTo(
      linkRows,
      { yPercent: 115 },
      { yPercent: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07 },
      0.68
    )
    .fromTo(
      reveals,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.1 },
      0.74
    )
    /**
     * Coretannya DIGAMBAR, bukan sekadar muncul.
     *
     * Sebelumnya ketiganya tidak dianimasikan sama sekali: begitu kelas
     * `invisible` dilepas di detik nol, mereka langsung nongol utuh — padahal
     * tirainya masih di atas layar, jadi selama ~0,7 detik ketiganya melayang
     * di atas halaman yang belum tertutup.
     *
     * Mulai di 0,76 dtk: pada easing `in`, di situlah tirai sudah menutup 86%
     * layar. Perlu setinggi itu karena sparkle-nya ada di 26% dari bawah —
     * kalau lebih awal, dia tergambar di luar tirai.
     */
    .fromTo(
      doodlePaths,
      { drawSVG: '0%' },
      // Stagger-nya per PATH, bukan per doodle — sparkle punya empat garis,
      // dan menggambarnya satu per satu justru yang membuatnya terbaca
      // berkelip. Dirapatkan ke 0,04 supaya ekornya tidak berlarut: dengan
      // 0,07 path terakhir baru selesai di ~1,6 dtk.
      { drawSVG: '100%', duration: 0.45, ease: 'power2.out', stagger: 0.04 },
      0.76
    );

  const setOpen = (next) => {
    if (next === open) return;
    open = next;
    announce();
    paintBars();
    if (open) {
      showMenu();
      lenis?.stop();
      tl.play();
    } else {
      lenis?.start();
      tl.reverse();
    }
  };

  toggle.addEventListener('click', () => setOpen(!open));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setOpen(false);
  });

  /**
   * Klik tautan menutup menu — dipasang di FASE TANGKAP pada pembungkusnya,
   * bukan pada tautannya.
   *
   * main.js sudah memasang penangan scroll halus di tiap `a[href^="#"]`, dan
   * itu terpasang lebih dulu. Kalau penutup ini juga dipasang di elemen yang
   * sama, ia berjalan BELAKANGAN — artinya lenis masih dalam keadaan stop saat
   * scrollTo dipanggil, dan halamannya tidak bergerak ke mana-mana. Fase
   * tangkap pada induk selalu mendahului penangan di sasarannya.
   */
  menu.addEventListener(
    'click',
    (e) => {
      if (e.target.closest('a[href^="#"]')) setOpen(false);
    },
    true
  );
}
