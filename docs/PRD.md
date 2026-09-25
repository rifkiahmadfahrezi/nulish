# PRD — Markdown Editor Local-First

> Nama kerja: **Inkwell** (bisa diganti)
> Versi dokumen: 1.0 · Status: Draft

---

## 1. Ringkasan

Inkwell adalah markdown editor berbasis web dengan pengalaman menulis ala Notion (block-based, slash command, drag handle), tetapi **100% local-first**: semua data tersimpan di IndexedDB browser pengguna. Tidak ada login, tidak ada server, tidak ada akun. Buka → langsung menulis.

## 2. Latar Belakang & Masalah

- Notion dan sejenisnya butuh akun, online, dan data tersimpan di server pihak ketiga.
- Editor markdown lokal (Typora, Obsidian) butuh instalasi aplikasi desktop.
- Editor markdown web sederhana biasanya hanya split-view (raw + preview) dan tidak nyaman untuk menulis panjang.

**Peluang:** editor web yang instan, privat, nyaman seperti Notion, dan output-nya tetap markdown murni yang portabel.

## 3. Tujuan

| Tujuan | Ukuran keberhasilan |
|---|---|
| Menulis bisa dimulai dalam < 2 detik setelah halaman dibuka | Time-to-first-keystroke < 2s (cold load) |
| Data tidak pernah hilang | Autosave < 500ms setelah berhenti mengetik; 0 laporan data loss |
| Mengelola banyak dokumen dengan mudah | Buat, cari, rename, hapus dokumen tanpa lebih dari 2 klik |
| Portabel | Import/export `.md` round-trip tanpa kehilangan format dasar |

### Non-Goals (v1)
- Login, akun, sinkronisasi cloud, kolaborasi real-time
- Database/tabel ala Notion, relasi antar halaman
- Mobile app native (web responsive saja)
- Plugin system

## 4. Target Pengguna

1. **Penulis/pelajar** — mencatat cepat, tidak mau repot daftar akun.
2. **Developer** — menulis dokumentasi/README, butuh code block & export `.md`.
3. **Pengguna yang peduli privasi** — ingin data hanya ada di perangkat sendiri.

## 5. User Stories

| ID | Sebagai… | Saya ingin… | Supaya… |
|---|---|---|---|
| US-01 | pengguna baru | langsung bisa menulis tanpa daftar | tidak ada hambatan |
| US-02 | penulis | membuat lebih dari satu dokumen | memisahkan topik |
| US-03 | penulis | tulisan tersimpan otomatis | tidak takut kehilangan data |
| US-04 | penulis | mengetik `/` untuk memilih jenis block | format tanpa menghafal sintaks |
| US-05 | pengguna markdown | mengetik `# `, `- `, `> ` dan langsung jadi format | alur menulis tetap cepat |
| US-06 | pengguna | mencari dokumen berdasarkan judul/isi | cepat menemukan catatan lama |
| US-07 | pengguna | mengganti tema dark/light | nyaman di mata |
| US-08 | developer | export dokumen ke `.md` | dipakai di tempat lain |
| US-09 | pengguna | import file `.md` | memindahkan catatan lama |
| US-10 | pengguna | memulihkan dokumen yang terhapus | tidak menyesal salah hapus |
| US-11 | pengguna | backup semua data ke satu file | aman saat ganti browser/perangkat |

## 6. Fitur & Requirement

### 6.1 Manajemen Dokumen (P0)
- **FR-01** Membuat dokumen baru (dari menu floating button, command palette, atau shortcut `Ctrl/Cmd + Alt + N`).
- **FR-02** Daftar dokumen di panel **Pages** yang dibuka dari floating button, urut berdasarkan `updatedAt` terbaru (opsi sort: judul A–Z, dibuat).
- **FR-03** Judul dokumen = baris judul besar di atas editor (seperti Notion). Kosong → tampil "Untitled".
- **FR-04** Rename langsung dari judul atau menu konteks di panel Pages.
- **FR-05** Duplikat dokumen.
- **FR-06** Hapus → masuk **Trash** (soft delete). Trash bisa restore atau hapus permanen. Auto-purge setelah 30 hari.
- **FR-07** Pin/favorit dokumen (muncul di bagian atas panel Pages).
- **FR-08** Emoji/ikon opsional per dokumen.

### 6.2 Editor Notion-like (P0)
- **FR-10** Block-based: setiap paragraf/heading/list adalah block.
- **FR-11** Slash command `/` membuka menu block: Text, Heading 1–3, Bullet list, Numbered list, To-do, Quote, Code block, Divider, Callout, Image (URL/upload lokal), Table (P1).
- **FR-12** Markdown shortcut saat mengetik: `#`, `##`, `###`, `-`/`*`, `1.`, `[]`, `>`, ```` ``` ````, `---`, `**bold**`, `*italic*`, `` `code` ``, `~~strike~~`.
- **FR-13** Floating toolbar saat teks diseleksi: Bold, Italic, Strike, Code, Link, Turn into…
- **FR-14** Drag handle (⋮⋮) di kiri block saat hover untuk memindahkan block; klik membuka menu block (hapus, duplikat, turn into).
- **FR-15** Code block dengan syntax highlighting + pilih bahasa + tombol copy.
- **FR-16** Undo/redo (`Ctrl/Cmd + Z` / `Shift + Z`).
- **FR-17** Placeholder "Ketik '/' untuk perintah…" pada block kosong.
- **FR-18** Paste markdown/HTML otomatis dikonversi menjadi block.

### 6.3 Penyimpanan Local-First (P0)
- **FR-20** Semua data disimpan di IndexedDB.
- **FR-21** Autosave dengan debounce 300–500ms; indikator status berupa dot kecil di floating button (+ teks "Saved / Saving…" di dalam menu, dan `aria-live` untuk screen reader).
- **FR-22** Request `navigator.storage.persist()` saat pertama kali membuat dokumen agar data tidak dihapus browser saat storage penuh.
- **FR-23** Sinkron antar-tab: perubahan di satu tab tercermin di tab lain (BroadcastChannel / liveQuery).
- **FR-24** Aplikasi berjalan penuh tanpa internet — detail di **6.8 PWA & Offline Support**.

### 6.4 Pencarian (P0)
- **FR-30** Command palette `Ctrl/Cmd + K`: cari dokumen (judul + isi), buat dokumen baru, ganti tema.
- **FR-31** Hasil pencarian menampilkan potongan teks yang cocok dengan highlight.

### 6.5 Import / Export (P0–P1)
- **FR-40** Export dokumen aktif ke `.md` (P0).
- **FR-41** Import satu/banyak file `.md` (drag & drop ke window atau tombol) (P0).
- **FR-42** Backup semua data ke `.zip` (berisi `.md` + `manifest.json`) dan restore dari file tersebut (P1).
- **FR-43** Copy dokumen sebagai markdown ke clipboard (P1).

### 6.6 Tema & Tampilan (P0)
- **FR-50** Tiga opsi tema: Light, Dark, System (default System).
- **FR-51** Preferensi tersimpan di IndexedDB (tabel `settings`), diterapkan sebelum render pertama untuk mencegah flash.
- **FR-52** **Zero chrome:** tidak ada sidebar, topbar, header, maupun footer. Layar hanya berisi dokumen; judul dokumen dipakai sebagai `document.title` tab browser.
- **FR-53** Mode lebar konten: normal (≈720px) / full width.

### 6.6a Floating Button (P0)
- **FR-55** Satu floating button (FAB) bulat 48px (52px mobile) sebagai satu-satunya UI permanen. Klik membuka menu: Search, Pages, New page, Export, Import, Theme, Trash, Settings, dan meta dokumen.
- **FR-56** FAB bisa di-drag (mouse & touch). Gerakan < 5px dianggap klik. Saat dilepas, FAB snap ke tepi kiri/kanan terdekat (opsi: 4 sudut). Tidak bisa keluar layar; clamp 20px dari tepi.
- **FR-57** Posisi FAB disimpan relatif (`{ side, y: 0–1 }`) di `settings.fabPosition` dan tetap benar saat resize. Default kanan bawah. Ada tombol "Reset posisi" di Settings.
- **FR-58** Arah buka menu/panel menyesuaikan posisi FAB agar selalu di dalam viewport.
- **FR-59** Auto-fade: 1 detik setelah mulai mengetik, FAB meredup (opacity 25%); kembali penuh saat mouse bergerak, pointer mendekat, atau FAB difokus. Bisa dimatikan di Settings.
- **FR-59a** Aksesibel tanpa drag: `Ctrl/Cmd + .` membuka menu; `Alt + panah` memindahkan FAB saat fokus.
- **FR-59b** Mobile: menu & panel tampil sebagai bottom sheet; saat keyboard terbuka FAB disembunyikan dan diganti bar format di atas keyboard.
- **FR-59c** Toast muncul di sisi berlawanan dari FAB agar tidak bertumpuk.

### 6.7 Info Dokumen (P1)
- **FR-60** Jumlah kata, karakter, estimasi waktu baca ditampilkan di bagian bawah menu FAB.
- **FR-61** Tanggal dibuat & terakhir diubah.

### 6.8 PWA & Offline Support (P0)

Karena semua data sudah ada di IndexedDB, satu-satunya yang perlu internet adalah **mengunduh aplikasinya**. Setelah kunjungan pertama, aplikasi harus bisa dibuka dan dipakai 100% tanpa koneksi.

**Installable**
- **FR-70** Web App Manifest: `name`, `short_name`, `start_url: "/"`, `scope: "/"`, `display: "standalone"` (fallback `minimal-ui`), `theme_color` & `background_color` mengikuti tema (light `#FFFFFF`, dark `#191919`), `id` tetap.
- **FR-71** Ikon lengkap: 192, 512, **maskable** 512, ikon monokrom, `apple-touch-icon` 180, favicon SVG.
- **FR-72** Tombol **"Install app"** di menu FAB, hanya muncul bila event `beforeinstallprompt` tersedia dan app belum terpasang. Di iOS Safari tampilkan petunjuk "Share → Add to Home Screen".
- **FR-73** Saat berjalan standalone, tidak ada UI tambahan — konsep zero chrome tetap berlaku (FAB tetap satu-satunya UI).
- **FR-74** Manifest `shortcuts`: "New page" dan "Search" (long-press ikon app di Android / klik kanan di taskbar desktop).

**Offline**
- **FR-75** Service worker melakukan **precache** app shell dan seluruh aset build (HTML, JS, CSS, font, ikon, bahasa syntax highlighting yang dipakai) saat instalasi.
- **FR-76** Strategi cache:

  | Resource | Strategi |
  |---|---|
  | App shell & aset build (hashed) | Precache, cache-first |
  | Navigasi (HTML) | Cache-first ke `index.html` (SPA), fallback ke shell yang di-cache |
  | Font lokal / Google Fonts | Cache-first, expire 1 tahun |
  | Gambar dari URL eksternal di dokumen | Stale-while-revalidate, maks 100 entri / 50MB |
  | Gambar upload lokal | Tidak lewat network — dibaca dari tabel `assets` IndexedDB sebagai `blob:` URL |

- **FR-77** Semua fitur inti (buat/edit/hapus dokumen, search, import/export `.md`, backup zip, ganti tema) wajib berfungsi offline. **Tidak ada fitur yang butuh internet.**
- **FR-78** Tidak ada halaman "You're offline". Status offline hanya ditampilkan sebagai satu baris kecil di menu FAB ("Offline — semua tetap tersimpan di perangkat") agar tidak mengganggu.
- **FR-79** Gambar eksternal yang gagal dimuat saat offline → tampil placeholder dengan URL dan ikon, bukan gambar rusak.

**Update aplikasi**
- **FR-80** Service worker baru **tidak** langsung mengambil alih (`skipWaiting` tidak otomatis) agar tidak mengganggu sesi menulis.
- **FR-81** Saat versi baru siap, tampilkan dot kecil di FAB + item "Update tersedia — Muat ulang" di menu. Toast satu kali yang non-blocking.
- **FR-82** Update diterapkan otomatis saat semua tab ditutup, atau segera bila pengguna memilih "Muat ulang" — **setelah** autosave terakhir selesai (flush antrean tulis ke IndexedDB dulu).
- **FR-83** Migrasi skema IndexedDB (Dexie `version().upgrade()`) harus kompatibel mundur; bila tab lama masih terbuka dengan versi skema lama, tampilkan banner "Tutup tab lain untuk menyelesaikan update" (event `versionchange` / `blocked`).

**Integrasi OS (P1–P2)**
- **FR-84** `file_handlers` di manifest: membuka file `.md` langsung dengan Inkwell dari file manager (Chromium desktop) — P1.
- **FR-85** `share_target`: menerima teks/URL yang dibagikan dari aplikasi lain dan membuatnya sebagai dokumen baru — P2.
- **FR-86** `launch_handler: { client_mode: "focus-existing" }` agar membuka app tidak membuat jendela duplikat — P1.

## 7. Model Data (IndexedDB)

Database: `inkwell` · Versi skema: 1

```ts
// table: documents
interface Document {
  id: string;            // nanoid / uuid
  title: string;
  icon?: string;         // emoji
  content: JSONContent;  // state editor (ProseMirror/BlockNote JSON)
  markdown: string;      // cache markdown untuk search & export
  pinned: boolean;
  createdAt: number;     // epoch ms
  updatedAt: number;
  deletedAt: number | null; // null = aktif, angka = di trash
}

// table: settings (key-value)
interface Setting {
  key: 'theme' | 'fabPosition' | 'fabSnapMode' | 'fabAutoFade' | 'contentWidth' | 'sortBy' | 'lastOpenedId';
  value: unknown;
}

// table: assets (gambar yang di-upload lokal)
interface Asset {
  id: string;
  docId: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}
```

Index: `documents: id, updatedAt, deletedAt, pinned, title`

Konten disimpan sebagai JSON editor (sumber kebenaran) + cache markdown. Alasan: JSON menjaga fidelitas block (callout, dll.), markdown dipakai untuk pencarian dan export.

## 8. Rekomendasi Teknis

| Lapisan | Pilihan | Catatan |
|---|---|---|
| Framework | Next.js (static export) atau Vite + React | Tidak butuh server; bisa deploy ke Vercel/Netlify/GitHub Pages |
| Styling | Tailwind CSS + shadcn/ui | Token warna via CSS variables untuk dark/light |
| Editor | **BlockNote** (paling cepat untuk Notion-like) atau **Tiptap** (lebih fleksibel) | Keduanya berbasis ProseMirror, mendukung slash menu & drag handle |
| Markdown | `remark` / converter bawaan editor | Untuk import/export |
| Syntax highlight | Shiki atau lowlight | |
| IndexedDB | **Dexie.js** + `dexie-react-hooks` (`useLiveQuery`) | liveQuery otomatis sinkron antar-tab |
| Search | MiniSearch / FlexSearch (in-memory, dibangun dari cache markdown) | |
| Command palette | `cmdk` | |
| Draggable FAB | Pointer Events manual, atau `@use-gesture/react` + `motion` (spring snap) | Hindari library drag berat; cukup pointerdown/move/up |
| Popover/menu | Radix Popover / Floating UI (`flip`, `shift`) | Otomatis menyesuaikan arah buka terhadap posisi FAB |
| Theme | `next-themes` atau script inline di `<head>` | Cegah flash of wrong theme |
| Backup zip | `fflate` / `jszip` | |
| PWA | **Serwist** (`@serwist/next`) untuk Next.js, atau `vite-plugin-pwa` (Workbox) untuk Vite | Mode `injectManifest` agar strategi cache & alur update bisa dikontrol; Next.js wajib `output: 'export'` |

## 9. Requirement Non-Fungsional

- **Performa:** load awal < 200KB JS gzip untuk shell (editor di-lazy load); mengetik tanpa lag hingga dokumen 50.000 kata. Kunjungan berikutnya (dari cache service worker) tampil < 1 detik, termasuk saat offline.
- **PWA:** lolos kriteria installability Chrome; skor Lighthouse PWA/Best Practices ≥ 90; app shell tetap berfungsi dalam mode pesawat.
- **Privasi:** tidak ada network request membawa isi dokumen. Tidak ada analytics yang membaca konten.
- **Aksesibilitas:** navigasi keyboard penuh, kontras WCAG AA di kedua tema, `prefers-reduced-motion` dihormati.
- **Browser:** Chrome, Edge, Firefox, Safari 2 versi terakhir. Safari mode private: tampilkan peringatan bahwa data tidak persisten.
- **Keandalan:** tulis ke IndexedDB dalam transaksi; bila gagal (quota penuh) tampilkan toast error + saran export.

## 10. Edge Cases

- Storage penuh (`QuotaExceededError`) → toast + tombol export backup.
- Browser menghapus data (non-persisted) → onboarding ringan menyarankan backup berkala.
- Dua tab mengedit dokumen yang sama → last-write-wins per dokumen + banner "Dokumen diubah di tab lain".
- Import file bukan `.md` / encoding aneh → tolak dengan pesan jelas.
- Offline saat pertama kali membuka (belum pernah dikunjungi) → tidak bisa dicegah; dokumentasikan bahwa kunjungan pertama butuh internet.
- Update service worker ketika ada perubahan yang belum tersimpan → tunda aktivasi sampai autosave selesai.
- Pengguna menghapus cache/data situs dari pengaturan browser → service worker & IndexedDB ikut terhapus; ingatkan backup berkala di menu Data.
- iOS: PWA yang terpasang di Home Screen punya storage terpisah dari tab Safari → jelaskan di onboarding install bahwa dokumen tidak otomatis berpindah; sarankan export/import backup.
- Judul duplikat → diperbolehkan (id unik).
- Semua dokumen dihapus → tampil empty state + tombol "Buat dokumen".

## 11. Keyboard Shortcuts

| Aksi | Shortcut |
|---|---|
| Command palette / cari | `Ctrl/Cmd + K` |
| Dokumen baru | `Ctrl/Cmd + Alt + N` |
| Buka menu floating button | `Ctrl/Cmd + .` |
| Pindahkan floating button (saat fokus) | `Alt + ← → ↑ ↓` |
| Toggle tema | `Ctrl/Cmd + Shift + L` |
| Export markdown | `Ctrl/Cmd + Shift + E` |
| Bold / Italic / Code | `Ctrl/Cmd + B / I / E` |
| Link | `Ctrl/Cmd + Shift + K`… atau paste URL di atas seleksi |

## 12. Milestone

| Fase | Cakupan | Estimasi |
|---|---|---|
| M1 — Fondasi | Setup proyek (static export), Dexie schema, canvas editor, floating button draggable + menu, tema dark/light, manifest + service worker dasar (precache shell) | 1 minggu |
| M2 — Editor | BlockNote/Tiptap, slash menu, shortcut markdown, autosave | 1–2 minggu |
| M3 — Manajemen | Multi-dokumen, rename, pin, trash, command palette + search | 1 minggu |
| M4 — Portabilitas | Import/export `.md`, backup/restore zip | 1 minggu |
| M5 — PWA & Polish | Strategi cache lengkap, alur update (dot di FAB + reload aman), tombol install, file handlers, uji mode pesawat, empty states, aksesibilitas, performa | 1–1,5 minggu |

## 13. Pertanyaan Terbuka

- Nama produk final?
- Pilih BlockNote (cepat jadi) atau Tiptap (kontrol penuh)?
- Perlu nested pages (dokumen di dalam dokumen) di v2?
- Perlu opsi sinkronisasi opsional (mis. ke folder lokal via File System Access API) di masa depan?