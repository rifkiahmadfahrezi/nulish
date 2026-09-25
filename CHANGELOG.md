# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). FR numbers refer to `docs/PRD.md`.

## [Unreleased] — 2026-09-25

### Added
- **i18n with English and Bahasa Indonesia.** Strings live in `src/locales/<code>.json`, and new files are picked up automatically. The format supports `{placeholders}` and plurals via `Intl.PluralRules`. There is no i18n dependency (`src/lib/i18n.ts`).
- **Language setting** in Settings → Appearance: Automatic (browser language) or a specific language. The choice is stored in IndexedDB and syncs across tabs. It also updates `<html lang>` and date/number formatting, and switches the BlockNote editor menus to the same language when BlockNote has that translation.
- `src/locales/README.md`: a contributor guide for adding a language, plus a test that checks every locale for missing/unknown keys and mismatched placeholders.
- All P0 and most P1 features from the PRD — details below.
- Unit tests (Vitest + `fake-indexeddb`): FAB positioning, document/settings repository, search.
- E2E tests (Playwright, system Chrome, desktop + mobile): autosave, command palette, trash/restore, FAB drag, export/import, theme, offline, language switch.

### Changed
- **Renamed the app from Inkwell to Nulish** (UI, manifest, docs, backup file name). Internal storage ids (`inkwell` IndexedDB database, `inkwell:appearance` localStorage key, `inkwell-asset:` image URLs, backup `manifest.json` `app` field) are unchanged, so existing data and backups keep working.
- **All docs are now in English**; the UI defaults to the browser language (`docs/PRD.md`, `docs/screen-design.md`, `CLAUDE.md`, this changelog).
- Migrated from TanStack Start + Cloudflare Workers to a pure **Vite + React SPA** (no SSR). Package manager switched to pnpm.
- Replaced the template demo theme with the design tokens from `docs/screen-design.md` (CSS variables `--bg`, `--surface`, `--accent`, etc. via `light-dark()`).
- Fonts are bundled locally (`@fontsource-variable/*`) instead of loaded from Google Fonts.
- Animation uses CSS / `tw-animate-css`; the `motion` library is not used.

---

## PRD status

Legend: ✅ done · 🟡 partial / not fully tested · ❌ not done

### 6.1 Document Management
| FR | Status | Notes |
|---|---|---|
| FR-01 Create document | ✅ | From the FAB menu, command palette, `Ctrl/Cmd+Alt+N` |
| FR-02 Pages panel + sort | ✅ | Sort by last edited / created / title A–Z, filter |
| FR-03 "Untitled" title | ✅ | |
| FR-04 Rename | ✅ | From the title or the `⋯` menu in Pages |
| FR-05 Duplicate | ✅ | |
| FR-06 Trash + 30-day auto-purge | ✅ | Soft delete with an Undo toast, restore, delete forever, empty trash |
| FR-07 Pin | ✅ | "Pinned" group at the top |
| FR-08 Emoji icon | ✅ | Emoji picker + free input |

### 6.2 Editor
| FR | Status | Notes |
|---|---|---|
| FR-10 Block-based | ✅ | BlockNote |
| FR-11 Slash menu | ✅ | All BlockNote built-in blocks + a custom **Callout** block; Table available |
| FR-12 Markdown shortcuts | ✅ | BlockNote built-in. `` ```lang `` + space creates a code block |
| FR-13 Floating toolbar | 🟡 | BlockNote built-in toolbar; not yet tailored exactly to spec 5.7 |
| FR-14 Drag handle + block menu | 🟡 | BlockNote built-in; "Copy as markdown" block menu item missing |
| FR-15 Code block | 🟡 | Syntax highlighting (Shiki) + language picker present; copy button not verified |
| FR-16 Undo/redo | ✅ | |
| FR-17 Placeholder | ✅ | "Ketik '/' untuk perintah…" |
| FR-18 Paste markdown/HTML | 🟡 | BlockNote built-in, not tested |

### 6.3 Storage
| FR | Status | Notes |
|---|---|---|
| FR-20 IndexedDB | ✅ | Dexie, all writes go through `src/db/` |
| FR-21 Autosave + indicator | ✅ | 400ms debounce, flush on `visibilitychange`/`pagehide`; dot on the FAB, text in the menu, `aria-live` |
| FR-22 `storage.persist()` | ✅ | When the first document is created |
| FR-23 Cross-tab sync | ✅ | `liveQuery` + "This document was changed in another tab · Reload" toast |
| FR-24 Offline | ✅ | Covered by E2E |

### 6.4 Search
| FR | Status | Notes |
|---|---|---|
| FR-30 Command palette | ✅ | MiniSearch (title + content), actions, `Ctrl/Cmd+K` |
| FR-31 Snippet + highlight | ✅ | |

### 6.5 Import / Export
| FR | Status | Notes |
|---|---|---|
| FR-40 Export `.md` | ✅ | |
| FR-41 Import `.md` | ✅ | Button + drag & drop onto the window; non-`.md`/non-UTF-8 files rejected |
| FR-42 Backup/restore `.zip` | ✅ | `.md` + `manifest.json` (+ local images in `assets/`) |
| FR-43 Copy as markdown | ✅ | From Pages `⋯` and the command palette |

### 6.6 Theme & Appearance
| FR | Status | Notes |
|---|---|---|
| FR-50 Light/Dark/System | ✅ | |
| FR-51 No flash | ✅ | Inline script in `index.html` + a `localStorage` mirror; IndexedDB stays the source of truth |
| FR-52 Zero chrome + `document.title` | ✅ | |
| FR-53 Content width | ✅ | Normal / full width |

### 6.6a Floating Button
| FR | Status | Notes |
|---|---|---|
| FR-55 FAB + menu | ✅ | |
| FR-56 Drag + snap | ✅ | 5px threshold, snap to edges / 4 corners, 20px clamp |
| FR-57 Relative position + reset | ✅ | |
| FR-58 Adaptive opening direction | ✅ | |
| FR-59 Auto-fade | ✅ | Also fully transparent when the caret is under the FAB |
| FR-59a `Ctrl/Cmd+.` & `Alt+arrow` | ✅ | |
| FR-59b Mobile bottom sheet + format bar | 🟡 | Bottom sheet tested in emulation; format bar above the keyboard not tested on a real device |
| FR-59c Toasts on the opposite side | ✅ | |

### 6.7 Document Info
| FR | Status | Notes |
|---|---|---|
| FR-60 Words, characters, reading time | ✅ | In the FAB menu footer |
| FR-61 Created/edited dates | ✅ | |

### 6.8 PWA & Offline
| FR | Status | Notes |
|---|---|---|
| FR-70 Manifest | 🟡 | `theme-color` meta follows the theme; manifest `theme_color`/`background_color` are static white |
| FR-71 Icons | ✅ | 192, 512, maskable, monochrome, apple-touch 180, favicon SVG |
| FR-72 Install button + iOS hint | ✅ | |
| FR-73 Standalone stays zero chrome | ✅ | |
| FR-74 Manifest shortcuts | ✅ | `?action=new`, `?action=search` |
| FR-75 Precache | ✅ | Includes fonts and Shiki grammars (~6 MB) |
| FR-76 Caching strategy | 🟡 | External images: stale-while-revalidate, max 100 entries; no 50MB cap yet (only `purgeOnQuotaError`) |
| FR-77 Core features offline | ✅ | |
| FR-78 Offline status line | ✅ | |
| FR-79 Offline placeholder for external images | ❌ | Not built |
| FR-80 No automatic `skipWaiting` | 🟡 | Implemented, not tested |
| FR-81 Dot + "Update available" item + toast | 🟡 | Implemented, not tested across two builds |
| FR-82 Flush autosave before update | 🟡 | Implemented, not tested |
| FR-83 Cross-tab schema migration | 🟡 | `versionchange`/`blocked` handlers exist; no real migration to test yet |
| FR-84 `file_handlers` | 🟡 | Implemented, not tested |
| FR-85 `share_target` (P2) | 🟡 | Implemented, not tested |
| FR-86 `launch_handler` | ✅ | |

### Edge cases (PRD §10)
| Case | Status |
|---|---|
| `QuotaExceededError` → toast + export backup | ✅ |
| Onboarding suggesting periodic backups | 🟡 Only a note in Settings → Data |
| Two tabs editing the same document | ✅ |
| Importing non-`.md` / odd encoding | ✅ |
| SW update with unsaved changes | 🟡 Not tested |
| iOS: separate PWA storage | ✅ Explained in the install hint |
| All documents deleted → empty state | ✅ |
| Safari private mode → warning | ❌ Only a toast when IndexedDB fails to open |

### Non-functional (PRD §9)
| Item | Status |
|---|---|
| Shell < 200KB JS gzip, lazy-loaded editor | ✅ ~156 KB |
| Lag-free typing up to 50,000 words | ❌ Not measured |
| Lighthouse PWA/Best Practices ≥ 90 | ❌ Not measured |
| WCAG AA contrast in both themes | ❌ Not audited |
| `prefers-reduced-motion` | ✅ |
| Keyboard navigation | 🟡 Menus/panels/palette support ↑↓/Enter/Esc; not fully audited |

### Missing from screen-design
- Ghost of the starting position while dragging the FAB (optional).
- FAB position preview diagram in Settings → Floating button.

## Known issues
- In Bahasa Indonesia, the BlockNote menus (slash menu, formatting toolbar, block menu) stay in English because BlockNote has no Indonesian translation yet.
- Typing `` ```const `` + space throws "Language const is not supported" (BlockNote's input rule treats `const` as a language name). `` ```ts `` + space works.
- Code highlight colors didn't show in a dark-mode screenshot; check whether Shiki just loads late.
- Testing Library is installed but unused (no component tests yet).
