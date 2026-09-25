# PRD — Local-First Markdown Editor

> Product name: **Nulish**
> Document version: 1.0 · Status: Draft

---

## 1. Summary

Nulish is a web-based markdown editor with a Notion-like writing experience (block-based, slash commands, drag handles), but **100% local-first**: all data lives in the user's browser IndexedDB. No login, no server, no account. Open → start writing.

## 2. Background & Problem

- Notion and similar tools require an account, need to be online, and store data on third-party servers.
- Local markdown editors (Typora, Obsidian) require installing a desktop app.
- Simple web markdown editors are usually split-view only (raw + preview) and uncomfortable for long-form writing.

**Opportunity:** a web editor that is instant, private, as comfortable as Notion, and whose output is still plain, portable markdown.

## 3. Goals

| Goal | Success metric |
|---|---|
| Writing can start within < 2 seconds of opening the page | Time-to-first-keystroke < 2s (cold load) |
| Data is never lost | Autosave < 500ms after typing stops; 0 data-loss reports |
| Managing many documents is easy | Create, find, rename, delete a document in no more than 2 clicks |
| Portable | `.md` import/export round-trips without losing basic formatting |

### Non-Goals (v1)
- Login, accounts, cloud sync, real-time collaboration
- Notion-style databases/tables, relations between pages
- Native mobile app (responsive web only)
- Plugin system

## 4. Target Users

1. **Writers/students** — quick note-taking, don't want the hassle of signing up.
2. **Developers** — write documentation/READMEs, need code blocks & `.md` export.
3. **Privacy-conscious users** — want their data to exist only on their own device.

## 5. User Stories

| ID | As a… | I want… | So that… |
|---|---|---|---|
| US-01 | new user | to start writing without signing up | there is no friction |
| US-02 | writer | to create more than one document | I can separate topics |
| US-03 | writer | my writing saved automatically | I'm not afraid of losing data |
| US-04 | writer | to type `/` to pick a block type | I can format without memorizing syntax |
| US-05 | markdown user | typing `# `, `- `, `> ` to format immediately | my writing flow stays fast |
| US-06 | user | to search documents by title/content | I can find old notes quickly |
| US-07 | user | to switch between dark/light themes | it's easy on the eyes |
| US-08 | developer | to export a document to `.md` | I can use it elsewhere |
| US-09 | user | to import `.md` files | I can bring over old notes |
| US-10 | user | to recover deleted documents | I don't regret an accidental delete |
| US-11 | user | to back up all data to a single file | I'm safe when switching browsers/devices |

## 6. Features & Requirements

### 6.1 Document Management (P0)
- **FR-01** Create a new document (from the floating button menu, the command palette, or the `Ctrl/Cmd + Alt + N` shortcut).
- **FR-02** Document list in the **Pages** panel opened from the floating button, sorted by most recent `updatedAt` (sort options: title A–Z, created).
- **FR-03** Document title = the large title line above the editor (like Notion). Empty → shows "Untitled".
- **FR-04** Rename directly from the title or from the context menu in the Pages panel.
- **FR-05** Duplicate a document.
- **FR-06** Delete → moves to **Trash** (soft delete). Trash supports restore or permanent delete. Auto-purge after 30 days.
- **FR-07** Pin/favorite a document (appears at the top of the Pages panel).
- **FR-08** Optional emoji/icon per document.

### 6.2 Notion-like Editor (P0)
- **FR-10** Block-based: every paragraph/heading/list is a block.
- **FR-11** Slash command `/` opens the block menu: Text, Heading 1–3, Bullet list, Numbered list, To-do, Quote, Code block, Divider, Callout, Image (URL/local upload), Table (P1).
- **FR-12** Markdown shortcuts while typing: `#`, `##`, `###`, `-`/`*`, `1.`, `[]`, `>`, ```` ``` ````, `---`, `**bold**`, `*italic*`, `` `code` ``, `~~strike~~`.
- **FR-13** Floating toolbar when text is selected: Bold, Italic, Strike, Code, Link, Turn into…
- **FR-14** Drag handle (⋮⋮) to the left of a block on hover to move the block; clicking it opens the block menu (delete, duplicate, turn into).
- **FR-15** Code block with syntax highlighting + language picker + copy button.
- **FR-16** Undo/redo (`Ctrl/Cmd + Z` / `Shift + Z`).
- **FR-17** Placeholder "Type '/' for commands…" on empty blocks.
- **FR-18** Pasted markdown/HTML is automatically converted into blocks.

### 6.3 Local-First Storage (P0)
- **FR-20** All data is stored in IndexedDB.
- **FR-21** Autosave with a 300–500ms debounce; status indicator as a small dot on the floating button (+ "Saved / Saving…" text inside the menu, and `aria-live` for screen readers).
- **FR-22** Request `navigator.storage.persist()` when the first document is created so the browser doesn't evict data when storage is full.
- **FR-23** Cross-tab sync: changes in one tab are reflected in other tabs (BroadcastChannel / liveQuery).
- **FR-24** The app works fully without internet — details in **6.8 PWA & Offline Support**.

### 6.4 Search (P0)
- **FR-30** Command palette `Ctrl/Cmd + K`: search documents (title + content), create a new document, switch theme.
- **FR-31** Search results show a snippet of the matching text with highlighting.

### 6.5 Import / Export (P0–P1)
- **FR-40** Export the active document to `.md` (P0).
- **FR-41** Import one or many `.md` files (drag & drop onto the window, or a button) (P0).
- **FR-42** Back up all data to a `.zip` (containing `.md` files + `manifest.json`) and restore from that file (P1).
- **FR-43** Copy a document as markdown to the clipboard (P1).

### 6.6 Theme & Appearance (P0)
- **FR-50** Three theme options: Light, Dark, System (default System).
- **FR-51** Preference is stored in IndexedDB (`settings` table) and applied before first render to prevent a flash.
- **FR-52** **Zero chrome:** no sidebar, top bar, header, or footer. The screen contains only the document; the document title is used as the browser tab's `document.title`.
- **FR-53** Content width mode: normal (≈720px) / full width.

### 6.6a Floating Button (P0)
- **FR-55** A single round floating button (FAB), 48px (52px on mobile), as the only permanent UI. Clicking opens a menu: Search, Pages, New page, Export, Import, Theme, Trash, Settings, and document meta.
- **FR-56** The FAB can be dragged (mouse & touch). Movement < 5px counts as a click. On release, the FAB snaps to the nearest left/right edge (option: 4 corners). It cannot leave the screen; clamped 20px from the edges.
- **FR-57** FAB position is stored relatively (`{ side, y: 0–1 }`) in `settings.fabPosition` and stays correct on resize. Default bottom-right. A "Reset position" button in Settings.
- **FR-58** Menu/panel opening direction adapts to the FAB position so it always stays inside the viewport.
- **FR-59** Auto-fade: 1 second after typing starts, the FAB dims (opacity 25%); it returns to full when the mouse moves, the pointer approaches, or the FAB is focused. Can be disabled in Settings.
- **FR-59a** Accessible without dragging: `Ctrl/Cmd + .` opens the menu; `Alt + arrow` moves the FAB while focused.
- **FR-59b** Mobile: menus & panels appear as bottom sheets; when the keyboard is open the FAB is hidden and replaced by a format bar above the keyboard.
- **FR-59c** Toasts appear on the side opposite the FAB so they don't overlap.

### 6.7 Document Info (P1)
- **FR-60** Word count, character count, and estimated reading time shown at the bottom of the FAB menu.
- **FR-61** Created & last-modified dates.

### 6.8 PWA & Offline Support (P0)

Since all data already lives in IndexedDB, the only thing that needs internet is **downloading the app**. After the first visit, the app must open and work 100% without a connection.

**Installable**
- **FR-70** Web App Manifest: `name`, `short_name`, `start_url: "/"`, `scope: "/"`, `display: "standalone"` (fallback `minimal-ui`), `theme_color` & `background_color` follow the theme (light `#FFFFFF`, dark `#191919`), fixed `id`.
- **FR-71** Complete icons: 192, 512, **maskable** 512, monochrome icon, `apple-touch-icon` 180, SVG favicon.
- **FR-72** **"Install app"** button in the FAB menu, shown only when the `beforeinstallprompt` event is available and the app isn't installed yet. On iOS Safari, show the hint "Share → Add to Home Screen".
- **FR-73** When running standalone there is no extra UI — the zero-chrome concept still applies (the FAB remains the only UI).
- **FR-74** Manifest `shortcuts`: "New page" and "Search" (long-press the app icon on Android / right-click in the desktop taskbar).

**Offline**
- **FR-75** The service worker **precaches** the app shell and all build assets (HTML, JS, CSS, fonts, icons, syntax-highlighting languages in use) on install.
- **FR-76** Caching strategy:

  | Resource | Strategy |
  |---|---|
  | App shell & build assets (hashed) | Precache, cache-first |
  | Navigation (HTML) | Cache-first to `index.html` (SPA), fall back to the cached shell |
  | Local fonts / Google Fonts | Cache-first, 1-year expiry |
  | External image URLs in documents | Stale-while-revalidate, max 100 entries / 50MB |
  | Locally uploaded images | No network — read from the `assets` IndexedDB table as `blob:` URLs |

- **FR-77** All core features (create/edit/delete documents, search, `.md` import/export, zip backup, theme switching) must work offline. **No feature requires internet.**
- **FR-78** No "You're offline" page. Offline status is shown only as a small line in the FAB menu ("Offline — everything is still saved on this device") to stay unobtrusive.
- **FR-79** External images that fail to load while offline → show a placeholder with the URL and an icon, not a broken image.

**App updates**
- **FR-80** A new service worker does **not** take over immediately (no automatic `skipWaiting`) so writing sessions aren't disrupted.
- **FR-81** When a new version is ready, show a small dot on the FAB + a "Update available — Reload" item in the menu. A one-time, non-blocking toast.
- **FR-82** The update is applied automatically when all tabs are closed, or immediately if the user chooses "Reload" — **after** the last autosave finishes (flush the IndexedDB write queue first).
- **FR-83** IndexedDB schema migrations (Dexie `version().upgrade()`) must be backward compatible; if an old tab is still open with the old schema version, show a banner "Close other tabs to finish the update" (`versionchange` / `blocked` events).

**OS integration (P1–P2)**
- **FR-84** `file_handlers` in the manifest: open `.md` files directly in Nulish from the file manager (Chromium desktop) — P1.
- **FR-85** `share_target`: receive text/URLs shared from other apps and create a new document from them — P2.
- **FR-86** `launch_handler: { client_mode: "focus-existing" }` so opening the app doesn't create duplicate windows — P1.

## 7. Data Model (IndexedDB)

Database: `inkwell` (internal name kept from the working title so existing data survives) · Schema version: 1

```ts
// table: documents
interface Document {
  id: string;            // nanoid / uuid
  title: string;
  icon?: string;         // emoji
  content: JSONContent;  // editor state (ProseMirror/BlockNote JSON)
  markdown: string;      // markdown cache for search & export
  pinned: boolean;
  createdAt: number;     // epoch ms
  updatedAt: number;
  deletedAt: number | null; // null = active, number = in trash
}

// table: settings (key-value)
interface Setting {
  key: 'theme' | 'fabPosition' | 'fabSnapMode' | 'fabAutoFade' | 'contentWidth' | 'sortBy' | 'lastOpenedId';
  value: unknown;
}

// table: assets (locally uploaded images)
interface Asset {
  id: string;
  docId: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}
```

Index: `documents: id, updatedAt, deletedAt, pinned, title`

Content is stored as editor JSON (source of truth) + a markdown cache. Rationale: JSON preserves block fidelity (callouts, etc.); markdown is used for search and export.

## 8. Technical Recommendations

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (static export) or Vite + React | No server needed; deployable to Vercel/Netlify/GitHub Pages |
| Styling | Tailwind CSS + shadcn/ui | Color tokens via CSS variables for dark/light |
| Editor | **BlockNote** (fastest to Notion-like) or **Tiptap** (more flexible) | Both are ProseMirror-based and support slash menus & drag handles |
| Markdown | `remark` / the editor's built-in converter | For import/export |
| Syntax highlight | Shiki or lowlight | |
| IndexedDB | **Dexie.js** + `dexie-react-hooks` (`useLiveQuery`) | liveQuery syncs across tabs automatically |
| Search | MiniSearch / FlexSearch (in-memory, built from the markdown cache) | |
| Command palette | `cmdk` | |
| Draggable FAB | Manual Pointer Events, or `@use-gesture/react` + `motion` (spring snap) | Avoid heavy drag libraries; pointerdown/move/up is enough |
| Popover/menu | Radix Popover / Floating UI (`flip`, `shift`) | Automatically adjusts opening direction relative to the FAB position |
| Theme | `next-themes` or an inline script in `<head>` | Prevents a flash of the wrong theme |
| Zip backup | `fflate` / `jszip` | |
| PWA | **Serwist** (`@serwist/next`) for Next.js, or `vite-plugin-pwa` (Workbox) for Vite | `injectManifest` mode so caching strategy & update flow are controllable; Next.js requires `output: 'export'` |

## 9. Non-Functional Requirements

- **Performance:** initial load < 200KB JS gzip for the shell (editor lazy-loaded); typing without lag up to a 50,000-word document. Subsequent visits (from the service worker cache) render in < 1 second, including offline.
- **PWA:** passes Chrome installability criteria; Lighthouse PWA/Best Practices score ≥ 90; the app shell keeps working in airplane mode.
- **Privacy:** no network request carries document content. No analytics that read content.
- **Accessibility:** full keyboard navigation, WCAG AA contrast in both themes, `prefers-reduced-motion` respected.
- **Browsers:** last 2 versions of Chrome, Edge, Firefox, Safari. Safari private mode: show a warning that data isn't persistent.
- **Reliability:** IndexedDB writes happen in transactions; on failure (quota full) show an error toast + suggest exporting.

## 10. Edge Cases

- Storage full (`QuotaExceededError`) → toast + export backup button.
- Browser evicts data (non-persisted) → light onboarding suggesting periodic backups.
- Two tabs editing the same document → last-write-wins per document + banner "Document changed in another tab".
- Importing a non-`.md` file / odd encoding → reject with a clear message.
- Offline on the very first visit (never visited before) → can't be prevented; document that the first visit needs internet.
- Service worker update while there are unsaved changes → delay activation until autosave finishes.
- User clears site cache/data from browser settings → service worker & IndexedDB are wiped too; remind about periodic backups in the Data menu.
- iOS: a PWA installed on the Home Screen has storage separate from Safari tabs → explain in the install onboarding that documents don't move automatically; suggest backup export/import.
- Duplicate titles → allowed (ids are unique).
- All documents deleted → show an empty state + a "Create document" button.

## 11. Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Command palette / search | `Ctrl/Cmd + K` |
| New document | `Ctrl/Cmd + Alt + N` |
| Open floating button menu | `Ctrl/Cmd + .` |
| Move floating button (when focused) | `Alt + ← → ↑ ↓` |
| Toggle theme | `Ctrl/Cmd + Shift + L` |
| Export markdown | `Ctrl/Cmd + Shift + E` |
| Bold / Italic / Code | `Ctrl/Cmd + B / I / E` |
| Link | `Ctrl/Cmd + Shift + K`… or paste a URL over a selection |

## 12. Milestones

| Phase | Scope | Estimate |
|---|---|---|
| M1 — Foundation | Project setup (static export), Dexie schema, editor canvas, draggable floating button + menu, dark/light theme, manifest + basic service worker (shell precache) | 1 week |
| M2 — Editor | BlockNote/Tiptap, slash menu, markdown shortcuts, autosave | 1–2 weeks |
| M3 — Management | Multiple documents, rename, pin, trash, command palette + search | 1 week |
| M4 — Portability | `.md` import/export, zip backup/restore | 1 week |
| M5 — PWA & Polish | Full caching strategy, update flow (FAB dot + safe reload), install button, file handlers, airplane-mode testing, empty states, accessibility, performance | 1–1.5 weeks |

## 13. Open Questions

- BlockNote (fast to build) or Tiptap (full control)?
- Nested pages (documents inside documents) in v2?
- Optional sync in the future (e.g., to a local folder via the File System Access API)?
