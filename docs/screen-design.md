# Screen Design — Inkwell (Markdown Editor Local-First)

> Versi 2 · Konsep: **zero chrome**. Tidak ada sidebar, tidak ada topbar. Layar hanya berisi tulisan. Semua navigasi dan aksi ada di **satu floating button (FAB) yang bisa di-drag**.
>
> Dokumen ini ditulis untuk dipakai sebagai prompt/brief di **Google Stitch** atau **Claude Design**. Mulai dari **Global Prompt**, lalu tambahkan prompt per layar.

---

## 0. Global Prompt (tempel pertama kali)

```
Design an ultra-minimal, distraction-free web app called "Inkwell" — a
local-first, Notion-like markdown editor. There is NO sidebar, NO top bar,
NO header, NO footer, NO login or avatars. The whole screen is just the
document on a plain background.

The only persistent UI is a single circular floating action button (FAB),
48px, that the user can drag anywhere; it snaps to the nearest screen edge.
Clicking it opens a compact floating menu next to it. All navigation
(page list, search, new page, theme, export, settings, trash) lives in that
menu and in floating panels that open from it.

Content: centered column, max-width 720px, generous top padding (15vh),
calm typography, lots of whitespace, subtle 1px borders on floating surfaces,
soft shadow only on floating elements, no gradients.

Provide BOTH light and dark mode for every screen.
Typography: Inter for UI, Inter or "Source Serif 4" for body text,
JetBrains Mono for code. Icons: Lucide, 16–18px, stroke 1.5.
Radius: FAB fully round, menus/panels 12px, controls 6px.
Accent: a single muted indigo used sparingly.
```

---

## 1. Prinsip Desain

1. **Layar = dokumen.** Tidak ada elemen UI permanen selain FAB.
2. **Satu pintu.** Semua aksi bisa dicapai dari FAB atau `⌘K`.
3. **UI mundur saat menulis.** Begitu pengguna mengetik, FAB meredup; muncul kembali saat mouse bergerak atau pointer mendekat.
4. **Pengguna yang memilih posisi.** FAB bisa dipindah agar tidak menutupi area yang sedang dibaca; posisi diingat.

---

## 2. Design Tokens

### Warna

| Token | Light | Dark | Pemakaian |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#191919` | Background layar |
| `--surface` | `#FFFFFF` | `#232323` | FAB, menu, panel |
| `--surface-hover` | `#F2F2F0` | `#2C2C2C` | Hover item |
| `--surface-active` | `#EAEAE8` | `#333333` | Item terpilih |
| `--border` | `#E6E6E3` | `#333333` | Garis tepi floating surface |
| `--text` | `#1F1F1E` | `#E6E6E4` | Teks utama |
| `--text-muted` | `#6B6B68` | `#9B9B98` | Teks sekunder, placeholder |
| `--text-faint` | `#A3A39F` | `#5E5E5B` | Hint, timestamp |
| `--accent` | `#5B5BD6` | `#8B8BF5` | Fokus, link, status |
| `--accent-subtle` | `#EEEEFB` | `#26264A` | Seleksi teks |
| `--danger` | `#D9534F` | `#F07470` | Hapus |
| `--shadow` | `0 4px 16px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06)` | `0 4px 16px rgba(0,0,0,.4), 0 1px 2px rgba(0,0,0,.3)` | Hanya floating surface |
| `--scrim` | `rgba(0,0,0,.20)` | `rgba(0,0,0,.50)` | Overlay modal |

### Tipografi

| Elemen | Ukuran / Line-height / Weight |
|---|---|
| Judul dokumen | 40 / 48 / 700 |
| Heading 1 / 2 / 3 | 30/38/600 · 24/32/600 · 20/28/600 |
| Body | 16 / 28 / 400 |
| UI (menu, panel) | 14 / 20 / 450 |
| Caption / meta | 12 / 16 / 400 |
| Code | 14 / 22 / JetBrains Mono |

### Spacing & ukuran
- Skala 4px: 4, 8, 12, 16, 24, 32, 48, 64.
- FAB: 48px (desktop), 52px (mobile). Margin dari tepi layar: 20px.
- Menu FAB: lebar 240px. Panel Pages: 320×min(560px, 70vh).

---

## 3. Floating Action Button (komponen inti)

### Anatomi
```
   ╭──────╮
   │  ✦   │  ← ikon app (atau ikon dokumen aktif)
   ╰──────╯•  ← dot status kecil (6px) di pojok kanan atas
```
- Bentuk lingkaran, `--surface`, border 1px, `--shadow`.
- Dot status: abu-abu berkedip pelan = "Saving…", hijau/accent sesaat = "Saved", merah = gagal simpan.

### State

| State | Tampilan |
|---|---|
| Idle | Opacity 100% |
| Typing | Setelah 1 detik mengetik → opacity 25%, scale 0.9. Kembali 100% saat mouse bergerak/pointer dalam radius 120px |
| Hover | Background `--surface-hover`, cursor `grab` |
| Dragging | Scale 1.08, shadow lebih besar, cursor `grabbing`, tampil garis hint tipis di tepi layar terdekat |
| Open | Ikon berubah jadi `×` (rotate 90°), menu muncul |
| Focus (keyboard) | Ring 2px `--accent` |

### Perilaku drag
- **Klik vs drag:** gerakan < 5px = klik (buka menu); ≥ 5px = drag.
- **Mobile:** drag langsung dengan satu jari; tap = buka menu.
- **Snap ke tepi:** saat dilepas, FAB meluncur (spring 250ms) ke tepi kiri atau kanan terdekat, dengan posisi vertikal bebas (clamp 20px dari atas/bawah). Opsi: snap ke 4 sudut saja (setting).
- **Posisi disimpan** di IndexedDB (`settings.fabPosition = { side: 'left'|'right', y: 0–1 }`) — disimpan relatif (persen tinggi) agar tetap benar saat window di-resize.
- **Default:** kanan bawah.
- **Arah buka menu mengikuti posisi:** FAB di kanan → menu terbuka ke kiri; FAB di bagian bawah layar → menu terbuka ke atas. Menu tidak pernah keluar layar.
- **Tidak menutupi kursor:** bila caret ketikan berada di bawah FAB, FAB otomatis bergeser sedikit menjauh (atau jadi transparan penuh).
- Keyboard: `⌘.` fokus ke FAB & buka menu; saat FAB fokus, `Alt + ←/→/↑/↓` memindahkan posisinya.

---

## 4. Daftar Layar

1. Canvas Editor (state default)
2. Canvas saat menulis (FAB meredup)
3. FAB Menu terbuka
4. Panel Pages (daftar dokumen)
5. Dragging FAB
6. Slash Command Menu
7. Floating Format Toolbar & Block Menu
8. Command Palette / Search
9. Empty State (pertama kali buka)
10. Trash panel
11. Settings modal
12. Import overlay & toast
13. Mobile

---

## 5. Layar

### 5.1 Canvas Editor (default)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│            📝                                             │
│            Catatan Rapat Sprint 12                        │
│                                                          │
│            Paragraf teks body…                           │
│       ⋮⋮ + Keputusan                                      │
│            • Poin satu                                   │
│            ☐ To-do item                                  │
│            ┌ code block ─────────────── copy ┐            │
│            └─────────────────────────────────┘            │
│                                                          │
│                                                     (✦)• │
└──────────────────────────────────────────────────────────┘
```
- Seluruh layar `--bg`. Tidak ada garis, header, atau label apa pun.
- Konten 720px di tengah, padding atas 15vh.
- Judul besar dengan placeholder "Untitled"; "Add icon" hanya muncul saat hover di atas judul.
- Hover block → `+` dan `⋮⋮` di kiri, warna `--text-faint`.
- FAB di kanan bawah dengan dot status.
- Judul dokumen juga dipakai sebagai `document.title` tab browser — ini satu-satunya "breadcrumb".

```
Screen: Distraction-free editor canvas, 1440×900. No sidebar, no top bar,
nothing but the document on a plain background. Centered 720px column with
15vh top padding: emoji icon, big title "Catatan Rapat Sprint 12",
a paragraph, an H2 "Keputusan", a bullet list, a to-do list with one checked
item, and a code block with language label and copy button. One block shows
hover affordances ("+" and "⋮⋮") in faint gray to its left.
Bottom-right corner: a single 48px round floating button with a subtle border
and soft shadow, containing a small sparkle/feather icon, with a tiny status
dot at its top-right. Light mode and dark mode.
```

---

### 5.2 Canvas saat menulis

- Sama dengan 5.1, tetapi FAB opacity 25% dan sedikit mengecil.
- Tampilkan kursor ketik aktif di tengah paragraf.

```
Screen: Same editor canvas while the user is actively typing — a text caret
in the middle of a paragraph. The floating button in the corner is faded to
about 25% opacity and slightly smaller, almost invisible. Nothing else on
screen. Light and dark mode.
```

---

### 5.3 FAB Menu terbuka

Menu vertikal 240px, muncul di samping FAB (arah menyesuaikan posisi FAB).

```
╭──────────────────────────────╮
│ 🔍  Search…            ⌘K    │  ← baris input palsu, klik = palette
│──────────────────────────────│
│ 📄  Pages               ›    │  ← buka panel Pages
│ ＋  New page          ⌘⌥N    │
│──────────────────────────────│
│ ⤓   Export .md        ⇧⌘E    │
│ ⤒   Import .md               │
│──────────────────────────────│
│ ☾   Dark mode        [ ◐ ]   │  ← toggle langsung (Light/Dark/System)
│ 🗑   Trash               3   │
│ ⚙   Settings              │
│──────────────────────────────│
│ Saved · 1.204 kata · 5 mnt   │  ← meta dokumen, caption faint
╰──────────────────────────────╯
                          (×)
```
- Surface `--surface`, border, radius 12px, shadow.
- Item tinggi 34px, ikon kiri, shortcut kanan (faint).
- Klik di luar / `Esc` → tutup.
- Meta dokumen (status simpan, jumlah kata) pindah ke sini karena tidak ada footer.

```
Screen: Editor canvas with the floating button (bottom-right) opened; the
button icon turned into "×". A compact 240px floating menu appears above-left
of it with 12px radius, subtle border and soft shadow. Items: a search row
"Search… ⌘K", "Pages ›", "New page ⌘⌥N", divider, "Export .md", "Import .md",
divider, "Theme" with a 3-state segmented control (sun / moon / monitor),
"Trash" with a small count badge "3", "Settings", divider, and a muted footer
line "Saved · 1.204 kata · 5 mnt". Light and dark mode.
```

---

### 5.4 Panel Pages

Dibuka dari "Pages ›". Menggantikan menu di posisi yang sama (menu bergeser ke panel dengan transisi slide), bukan sidebar.

```
╭────────────────────────────────────╮
│ ‹  Pages                     ＋    │
│ [ Filter pages…                ]   │
│ Sort: Terakhir diubah ▾            │
│────────────────────────────────────│
│ PINNED                             │
│ 📌 Roadmap                  2j     │
│ ALL                                │
│ 📝 Catatan Rapat Sprint 12  ●  5m  │ ← aktif
│ 📄 Ide blog                    1h  │
│ 📄 README proyek               3h  │
│ 📄 Resep sambal                1mg │
│ …                                  │
╰────────────────────────────────────╯
```
- 320px lebar, tinggi maks 70vh, list scroll.
- Hover item → ikon `⋯` (Pin, Rename, Duplicate, Export, Move to Trash).
- `↑↓` + `Enter` untuk berpindah dokumen; pilih dokumen → panel tertutup otomatis.

```
Screen: Floating "Pages" panel (320px, max 70vh) opened from the floating
button in the bottom-right, anchored next to it. Header with back chevron,
title "Pages", and a "+" button. Filter input, a "Sort: Last edited ▾"
control, then a "Pinned" group with 1 page and an "All" group with 7 pages
(emoji, title, relative time on the right). The active page is highlighted.
One hovered row shows a "⋯" button with its context menu open: Pin, Rename,
Duplicate, Export .md, Move to Trash (red). The document canvas stays visible
behind. Light and dark mode.
```

---

### 5.5 Dragging FAB

- FAB membesar sedikit, shadow lebih dalam.
- Garis vertikal tipis `--accent` (2px, 40% opacity) di tepi layar terdekat sebagai hint snap.
- Tampilkan jejak/ghost posisi awal samar (opsional).

```
Screen: Editor canvas while the user drags the floating button across the
screen. The button is mid-screen on the left half, slightly enlarged with a
deeper shadow and a "grabbing" cursor. A thin vertical accent line glows on
the left screen edge indicating where it will snap. Light and dark mode.
```

---

### 5.6 Slash Command Menu

Tidak berubah dari versi sebelumnya: popover 320px di bawah kursor, grup "Basic blocks / Media / Advanced", tiap item ikon 40×40 + nama + deskripsi.

```
Screen: Distraction-free editor with a slash command popover open under the
cursor where the user typed "/". Popover 320px wide, 12px radius, grouped
sections "Basic blocks", "Media", "Advanced". Each row: a 40×40 bordered icon
tile, a title and a one-line muted description. Second row keyboard-highlighted.
The faded floating button visible in the corner. Light and dark mode.
```

---

### 5.7 Floating Toolbar & Block Menu

- Floating toolbar di atas seleksi: `Text ▾` | B I S `<>` 🔗 | warna ▾.
- Block menu dari `⋮⋮`: Delete, Duplicate, Turn into ›, Copy as markdown.

```
Screen: Editor with a sentence selected (accent-subtle highlight) and a
floating formatting pill above it: "Text ▾", Bold, Italic, Strikethrough,
Inline code, Link, divider, color dropdown. No other UI on screen except the
faded floating button. Light and dark mode.
```

---

### 5.8 Command Palette / Search

Jalan pintas utama selain FAB. Modal 560px di 15vh dari atas, scrim tipis.

- Input "Cari dokumen atau perintah…".
- Grup **Pages** (judul + snippet ber-highlight + waktu), **Actions** (New page, Toggle theme, Export, Import, Settings, Trash).
- Footer: `↑↓ navigasi · ↵ buka · esc tutup`.

```
Screen: Command palette modal near the top over a lightly dimmed editor.
Large search input with the query "rapat". Results grouped under "Pages"
(3 results with emoji, title, snippet with "rapat" highlighted, relative time)
and "Actions" (New page, Toggle theme, Export markdown, Import, Settings,
Trash) with shortcut hints. Footer navigation hints. Light and dark mode.
```

---

### 5.9 Empty State

- Kanvas kosong; di tengah: judul placeholder "Untitled" dan baris muted "Mulai menulis, atau ketik '/' untuk perintah".
- Di bawahnya, 2 link teks kecil: **Import .md** · **Lihat shortcut**.
- Satu baris caption faint: "Tersimpan di browser ini. Tanpa akun, tanpa server."
- FAB tampil dengan tooltip satu kali: "Menu ada di sini — geser untuk memindahkan."

```
Screen: First-run empty state. Plain blank canvas with a large placeholder
title "Untitled" in faint gray and a muted line
"Mulai menulis, atau ketik '/' untuk perintah". Below, two small text links
"Import .md" and "Lihat shortcut", and a faint caption
"Tersimpan di browser ini. Tanpa akun, tanpa server."
The floating button in the bottom-right shows a small one-time tooltip bubble:
"Menu ada di sini — geser untuk memindahkan". Light and dark mode.
```

---

### 5.10 Trash Panel

Sama polanya dengan Panel Pages (floating dari FAB, 320–400px): filter, daftar dokumen terhapus + "Dihapus 3 hari lalu", tombol Restore (↺) dan Delete forever (danger), footer "Dihapus otomatis setelah 30 hari" + "Kosongkan trash".

---

### 5.11 Settings Modal

Modal 640×480 di tengah dengan scrim, nav kiri (Appearance, Editor, Data, About).

- **Appearance:** Tema (kartu Light / Dark / System), Font body (Sans / Serif / Mono), Lebar konten (Normal / Full).
- **Floating button:** Posisi snap (Tepi bebas / 4 sudut), Auto-fade saat mengetik (toggle), Reset posisi.
- **Editor:** Spell check, tampilkan word count di menu.
- **Data:** Bar penggunaan storage, status "Persistent storage: On", Backup (.zip), Restore, Danger zone "Hapus semua data".

```
Screen: Settings modal 640×480 centered over a dimmed canvas. Left nav:
Appearance, Floating button, Editor, Data, About. Show the "Floating button"
tab: a segmented control "Snap to: Edges / Corners", a toggle "Fade while
typing" (on), a small preview diagram of a screen with the button position,
and a "Reset position" text button. Also show the Appearance tab with 3 theme
cards (Light, Dark, System). Light and dark mode.
```

---

### 5.12 Import Overlay & Toast

- Drag file ke window → overlay `--bg` 90%, kotak dashed accent di tengah: "Lepaskan file .md untuk mengimpor".
- Toast muncul **di sisi berlawanan dari FAB** agar tidak bertumpuk (FAB kanan → toast kiri bawah). Varian: sukses, info + Undo, error + tombol aksi.
- Konflik antar-tab: toast persisten "Dokumen ini diubah di tab lain · Muat ulang".

---

### 5.13 Mobile (390×844)

- Kanvas penuh, padding samping 20px, judul 32px, padding atas 12vh.
- FAB 52px, bisa di-drag, default kanan bawah di atas safe area.
- Menu FAB & panel Pages menjadi **bottom sheet** (tarik ke bawah untuk menutup), bukan popover.
- Saat keyboard terbuka: FAB disembunyikan; muncul bar format di atas keyboard (`/`, H, B, I, list, checkbox, undo, dan ikon ✦ untuk membuka menu).

```
Screen: Mobile 390×844, three frames.
1) Clean canvas with only the document and a 52px floating button at the
bottom-right above the safe area.
2) The menu opened as a bottom sheet with a drag handle, same items as desktop
(Search, Pages, New page, Export, Import, Theme toggle, Trash, Settings).
3) Typing with the on-screen keyboard: the floating button is hidden and a
slim formatting bar is docked above the keyboard (/, H, B, I, list, checkbox,
undo, and a sparkle icon to open the menu). Light and dark mode.
```

---

## 6. Interaksi & Motion

| Elemen | Perilaku |
|---|---|
| FAB snap | Spring ke tepi terdekat, ±250ms |
| FAB fade saat mengetik | 300ms ease, delay 1 detik setelah ketikan pertama |
| Menu FAB buka | Scale 0.95→1 dari titik asal FAB + fade, 140ms |
| Menu → Panel Pages | Slide horizontal 180ms di dalam container yang sama |
| Modal | Scrim fade 150ms, konten naik 8px |
| Ganti tema | Transisi warna 150ms (non-aktif bila reduced motion) |
| Drag block | Block 50% opacity, garis indikator accent 2px |

Semua animasi dimatikan/disederhanakan saat `prefers-reduced-motion`.

## 7. Aksesibilitas

- FAB: `role="button"`, `aria-haspopup="menu"`, `aria-expanded`, label "Buka menu". Drag bukan satu-satunya cara memindahkan (ada `Alt + panah` dan reset di Settings).
- Menu & panel: pola ARIA menu/listbox, navigasi ↑↓/Enter/Esc, fokus kembali ke FAB saat ditutup.
- Status simpan diumumkan via `aria-live="polite"` (karena indikatornya hanya dot).
- Kontras teks muted ≥ 4.5:1 di kedua tema; FAB saat redup tetap bisa difokus dan kembali 100% saat fokus.

## 8. Checklist Hand-off

- [ ] Semua layar versi light & dark
- [ ] FAB: idle, faded, hover, dragging, open, focus, status saving/saved/error
- [ ] Menu FAB di 4 kuadran layar (arah buka berbeda)
- [ ] Empty states: first run, pages kosong, trash kosong, search tanpa hasil
- [ ] Mobile: bottom sheet & bar format di atas keyboard
- [ ] Token warna diekspor sebagai CSS variables