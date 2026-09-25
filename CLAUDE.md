# CLAUDE.md — Inkwell

Local-first, Notion-like markdown editor for the web. No login, no server. All data in IndexedDB.

## Reference docs (read before working on a feature)
- `docs/PRD.md` — functional requirements (FR-xx), data model, edge cases, milestones
- `docs/screen-design.md` — design tokens, UI behavior, floating button spec
- `docs/design/` — Stitch / Claude Design exports (screenshots/HTML), if any
- `CHANGELOG.md` — what's done and what's still open, per FR

When working on a feature, mention the FR numbers in the commit message and summary.

## Stack (decided)
- Vite + React 19 + TypeScript (strict), pure SPA — no SSR
- Tailwind CSS v4 + shadcn/ui (components copied into `src/components/ui`)
- Editor: BlockNote (`@blocknote/react`, `@blocknote/shadcn`)
- IndexedDB: Dexie + `dexie-react-hooks` (`useLiveQuery`)
- Search: MiniSearch · Command palette: `cmdk` · Popovers/modals: native `popover` / `<dialog>`
- Animation: CSS (`tw-animate-css`) · PWA: `vite-plugin-pwa` (`injectManifest` mode)
- Tests: Vitest + Testing Library + `fake-indexeddb`; E2E: Playwright (system Chrome)
- Package manager: pnpm
- UI language: English

## Folder structure
```
src/
  app/            # root App, boot, global state, actions, simple routing (?doc=<id>)
  components/     # shared components (Dialog); shadcn goes in components/ui
  features/
    editor/       # BlockNote wrapper, slash menu, markdown conversion
    documents/    # Pages & Trash panels
    fab/          # draggable floating button + menu
    search/       # MiniSearch index + command palette
    settings/     # settings modal, theme
    io/           # .md import/export, zip backup
    pwa/          # SW registration, install prompt, update flow
  db/             # Dexie schema, migrations, repository functions
  lib/            # utils
  sw.ts           # service worker (injectManifest)
```

## Important rules
- **Zero chrome:** don't add a sidebar, top bar, header, footer, or any permanent button besides the FAB. All actions go through the FAB, `⌘K`, or shortcuts.
- **Data must never be lost:** all IndexedDB writes go through functions in `src/db/`; never access `db` directly from components. Autosave debounce 400ms, flush on `visibilitychange`/`pagehide`.
- **No network for content:** no fetch may carry document content. No analytics.
- **Colors only from CSS variable tokens** (`--bg`, `--surface`, `--text`, etc. in `screen-design.md`). Don't hardcode hex values in components.
- Every UI feature must be checked in **light & dark mode** and at **390px** width.
- Respect `prefers-reduced-motion`.
- Dexie schema migrations always go through `db.version(n).upgrade()`; never change old versions.

## Commands
- `pnpm dev` — dev server
- `pnpm build && pnpm preview` — check the build + service worker (SW is not active in dev)
- `pnpm test` — unit tests
- `pnpm test:e2e` — Playwright (make sure nothing else is serving on port 4173, or it reuses a stale build)
- `pnpm lint` · `pnpm typecheck`

Before declaring a task done: run `pnpm typecheck && pnpm lint && pnpm test`.
