# CLAUDE.md — Inkwell

Markdown editor web, local-first, Notion-like. Tanpa login, tanpa server. Semua data di IndexedDB.

## Dokumen acuan (baca dulu sebelum mengerjakan fitur)
- `docs/prd.md` — requirement fungsional (FR-xx), model data, edge cases, milestone
- `docs/screen-design.md` — design tokens, perilaku UI, spesifikasi floating button
- `docs/design/` — hasil export Stitch / Claude Design (screenshot/HTML) bila ada

Saat mengerjakan fitur, sebutkan nomor FR yang dikerjakan di commit message dan ringkasan.

## Stack (sudah diputuskan)
- Vite + React 19 + TypeScript (strict), SPA murni — tanpa SSR
- Tailwind CSS v4 + shadcn/ui (komponen di-copy ke `src/components/ui`)
- Editor: BlockNote (`@blocknote/react`, `@blocknote/shadcn`)
- IndexedDB: Dexie + `dexie-react-hooks` (`useLiveQuery`)
- Search: MiniSearch · Command palette: `cmdk` · Popover: Radix / Floating UI
- Animasi: `motion` · PWA: `vite-plugin-pwa` (mode `injectManifest`)
- Test: Vitest + Testing Library + `fake-indexeddb`; E2E: Playwright
- Package manager: pnpm

## Struktur folder
```
src/
  app/            # root App, providers, routing sederhana (?doc=<id>)
  components/ui/  # shadcn
  features/
    editor/       # BlockNote wrapper, slash menu, konversi markdown
    documents/    # CRUD, trash, pin, panel Pages
    fab/          # floating button draggable + menu
    search/       # MiniSearch index + command palette
    settings/     # modal settings, tema
    io/           # import/export .md, backup zip
    pwa/          # registrasi SW, install prompt, update flow
  db/             # schema Dexie, migrasi, repository functions
  lib/            # utils
  sw.ts           # service worker (injectManifest)
```

## Aturan penting
- **Zero chrome:** jangan menambahkan sidebar, topbar, header, footer, atau tombol permanen selain FAB. Semua aksi lewat FAB, `⌘K`, atau shortcut.
- **Data tidak boleh hilang:** semua tulis ke IndexedDB lewat fungsi di `src/db/`, jangan akses `db` langsung dari komponen. Autosave debounce 400ms, flush saat `visibilitychange`/`pagehide`.
- **Tanpa network untuk konten:** tidak ada fetch yang membawa isi dokumen. Tidak ada analytics.
- **Warna hanya dari token CSS variables** (`--bg`, `--surface`, `--text`, dll. di `screen-design.md`). Jangan hardcode hex di komponen.
- Setiap fitur UI harus dicek di **light & dark mode** dan di lebar **390px**.
- Hormati `prefers-reduced-motion`.
- Migrasi skema Dexie selalu lewat `db.version(n).upgrade()`; jangan ubah versi lama.

## Perintah
- `pnpm dev` — dev server
- `pnpm build && pnpm preview` — cek build + service worker (SW tidak aktif di dev)
- `pnpm test` — unit test
- `pnpm test:e2e` — Playwright
- `pnpm lint` · `pnpm typecheck`

Sebelum menyatakan tugas selesai: jalankan `pnpm typecheck && pnpm lint && pnpm test`.