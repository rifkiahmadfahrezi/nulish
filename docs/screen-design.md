# Screen Design — Nulish (Local-First Markdown Editor)

> Version 2 · Concept: **zero chrome**. No sidebar, no top bar. The screen contains only the writing. All navigation and actions live in **a single draggable floating button (FAB)**.
>
> This document is written to be used as a prompt/brief in **Google Stitch** or **Claude Design**. Start with the **Global Prompt**, then add the per-screen prompts.

---

## 0. Global Prompt (paste first)

```
Design an ultra-minimal, distraction-free web app called "Nulish" — a
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

## 1. Design Principles

1. **Screen = document.** No permanent UI elements other than the FAB.
2. **One door.** Every action is reachable from the FAB or `⌘K`.
3. **UI steps back while writing.** As soon as the user types, the FAB dims; it comes back when the mouse moves or the pointer approaches.
4. **The user picks the position.** The FAB can be moved so it doesn't cover what's being read; the position is remembered.

---

## 2. Design Tokens

### Colors

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#191919` | Screen background |
| `--surface` | `#FFFFFF` | `#232323` | FAB, menus, panels |
| `--surface-hover` | `#F2F2F0` | `#2C2C2C` | Item hover |
| `--surface-active` | `#EAEAE8` | `#333333` | Selected item |
| `--border` | `#E6E6E3` | `#333333` | Floating surface borders |
| `--text` | `#1F1F1E` | `#E6E6E4` | Primary text |
| `--text-muted` | `#6B6B68` | `#9B9B98` | Secondary text, placeholders |
| `--text-faint` | `#A3A39F` | `#5E5E5B` | Hints, timestamps |
| `--accent` | `#5B5BD6` | `#8B8BF5` | Focus, links, status |
| `--accent-subtle` | `#EEEEFB` | `#26264A` | Text selection |
| `--danger` | `#D9534F` | `#F07470` | Delete |
| `--shadow` | `0 4px 16px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06)` | `0 4px 16px rgba(0,0,0,.4), 0 1px 2px rgba(0,0,0,.3)` | Floating surfaces only |
| `--scrim` | `rgba(0,0,0,.20)` | `rgba(0,0,0,.50)` | Modal overlay |

### Typography

| Element | Size / Line-height / Weight |
|---|---|
| Document title | 40 / 48 / 700 |
| Heading 1 / 2 / 3 | 30/38/600 · 24/32/600 · 20/28/600 |
| Body | 16 / 28 / 400 |
| UI (menus, panels) | 14 / 20 / 450 |
| Caption / meta | 12 / 16 / 400 |
| Code | 14 / 22 / JetBrains Mono |

### Spacing & sizes
- 4px scale: 4, 8, 12, 16, 24, 32, 48, 64.
- FAB: 48px (desktop), 52px (mobile). Margin from screen edge: 20px.
- FAB menu: 240px wide. Pages panel: 320×min(560px, 70vh).

---

## 3. Floating Action Button (core component)

### Anatomy
```
   ╭──────╮
   │  ✦   │  ← app icon (or active document icon)
   ╰──────╯•  ← small status dot (6px) at the top-right corner
```
- Circle, `--surface`, 1px border, `--shadow`.
- Status dot: slowly pulsing gray = "Saving…", brief green/accent = "Saved", red = save failed.

### States

| State | Appearance |
|---|---|
| Idle | Opacity 100% |
| Typing | After 1 second of typing → opacity 25%, scale 0.9. Back to 100% when the mouse moves / pointer is within 120px |
| Hover | Background `--surface-hover`, cursor `grab` |
| Dragging | Scale 1.08, larger shadow, cursor `grabbing`, thin hint line on the nearest screen edge |
| Open | Icon turns into `×` (rotate 90°), menu appears |
| Focus (keyboard) | 2px `--accent` ring |

### Drag behavior
- **Click vs drag:** movement < 5px = click (open menu); ≥ 5px = drag.
- **Mobile:** drag directly with one finger; tap = open menu.
- **Edge snap:** on release, the FAB glides (250ms spring) to the nearest left or right edge, with free vertical position (clamped 20px from top/bottom). Option: snap to the 4 corners only (setting).
- **Position is saved** in IndexedDB (`settings.fabPosition = { side: 'left'|'right', y: 0–1 }`) — stored relatively (percentage of height) so it stays correct when the window is resized.
- **Default:** bottom-right.
- **Menu direction follows position:** FAB on the right → menu opens to the left; FAB in the lower part of the screen → menu opens upward. The menu never leaves the screen.
- **Doesn't cover the caret:** if the typing caret is under the FAB, the FAB automatically shifts slightly away (or becomes fully transparent).
- Keyboard: `⌘.` focuses the FAB & opens the menu; while the FAB is focused, `Alt + ←/→/↑/↓` moves it.

---

## 4. Screen List

1. Editor canvas (default state)
2. Canvas while writing (FAB dimmed)
3. FAB menu open
4. Pages panel (document list)
5. Dragging the FAB
6. Slash command menu
7. Floating format toolbar & block menu
8. Command palette / search
9. Empty state (first open)
10. Trash panel
11. Settings modal
12. Import overlay & toast
13. Mobile

---

## 5. Screens

### 5.1 Editor Canvas (default)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│            📝                                             │
│            Sprint 12 Meeting Notes                        │
│                                                          │
│            Body paragraph text…                          │
│       ⋮⋮ + Decisions                                      │
│            • Point one                                   │
│            ☐ To-do item                                  │
│            ┌ code block ─────────────── copy ┐            │
│            └─────────────────────────────────┘            │
│                                                          │
│                                                     (✦)• │
└──────────────────────────────────────────────────────────┘
```
- The whole screen is `--bg`. No lines, headers, or labels of any kind.
- 720px content centered, 15vh top padding.
- Large title with placeholder "Untitled"; "Add icon" only appears when hovering above the title.
- Block hover → `+` and `⋮⋮` on the left, in `--text-faint`.
- FAB at the bottom-right with a status dot.
- The document title is also used as the browser tab's `document.title` — this is the only "breadcrumb".

```
Screen: Distraction-free editor canvas, 1440×900. No sidebar, no top bar,
nothing but the document on a plain background. Centered 720px column with
15vh top padding: emoji icon, big title "Sprint 12 Meeting Notes",
a paragraph, an H2 "Decisions", a bullet list, a to-do list with one checked
item, and a code block with language label and copy button. One block shows
hover affordances ("+" and "⋮⋮") in faint gray to its left.
Bottom-right corner: a single 48px round floating button with a subtle border
and soft shadow, containing a small sparkle/feather icon, with a tiny status
dot at its top-right. Light mode and dark mode.
```

---

### 5.2 Canvas while writing

- Same as 5.1, but the FAB is at 25% opacity and slightly smaller.
- Show an active text caret in the middle of a paragraph.

```
Screen: Same editor canvas while the user is actively typing — a text caret
in the middle of a paragraph. The floating button in the corner is faded to
about 25% opacity and slightly smaller, almost invisible. Nothing else on
screen. Light and dark mode.
```

---

### 5.3 FAB menu open

A 240px vertical menu appears beside the FAB (direction adapts to the FAB position).

```
╭──────────────────────────────╮
│ 🔍  Search…            ⌘K    │  ← fake input row, click = palette
│──────────────────────────────│
│ 📄  Pages               ›    │  ← opens the Pages panel
│ ＋  New page          ⌘⌥N    │
│──────────────────────────────│
│ ⤓   Export .md        ⇧⌘E    │
│ ⤒   Import .md               │
│──────────────────────────────│
│ ☾   Dark mode        [ ◐ ]   │  ← direct toggle (Light/Dark/System)
│ 🗑   Trash               3   │
│ ⚙   Settings              │
│──────────────────────────────│
│ Saved · 1,204 words · 5 min  │  ← document meta, faint caption
╰──────────────────────────────╯
                          (×)
```
- Surface `--surface`, border, 12px radius, shadow.
- Items 34px tall, icon on the left, shortcut on the right (faint).
- Click outside / `Esc` → close.
- Document meta (save status, word count) moves here since there's no footer.

```
Screen: Editor canvas with the floating button (bottom-right) opened; the
button icon turned into "×". A compact 240px floating menu appears above-left
of it with 12px radius, subtle border and soft shadow. Items: a search row
"Search… ⌘K", "Pages ›", "New page ⌘⌥N", divider, "Export .md", "Import .md",
divider, "Theme" with a 3-state segmented control (sun / moon / monitor),
"Trash" with a small count badge "3", "Settings", divider, and a muted footer
line "Saved · 1,204 words · 5 min". Light and dark mode.
```

---

### 5.4 Pages panel

Opened from "Pages ›". It replaces the menu in the same position (the menu slides to the panel), not a sidebar.

```
╭────────────────────────────────────╮
│ ‹  Pages                     ＋    │
│ [ Filter pages…                ]   │
│ Sort: Last edited ▾                │
│────────────────────────────────────│
│ PINNED                             │
│ 📌 Roadmap                  2h     │
│ ALL                                │
│ 📝 Sprint 12 Meeting Notes  ●  5m  │ ← active
│ 📄 Blog ideas                  1h  │
│ 📄 Project README              3h  │
│ 📄 Chili sauce recipe          1w  │
│ …                                  │
╰────────────────────────────────────╯
```
- 320px wide, max height 70vh, scrolling list.
- Item hover → `⋯` icon (Pin, Rename, Duplicate, Export, Move to Trash).
- `↑↓` + `Enter` to switch documents; choosing a document closes the panel automatically.

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

### 5.5 Dragging the FAB

- The FAB grows slightly, with a deeper shadow.
- A thin vertical `--accent` line (2px, 40% opacity) on the nearest screen edge as a snap hint.
- Optionally show a faint trail/ghost of the starting position.

```
Screen: Editor canvas while the user drags the floating button across the
screen. The button is mid-screen on the left half, slightly enlarged with a
deeper shadow and a "grabbing" cursor. A thin vertical accent line glows on
the left screen edge indicating where it will snap. Light and dark mode.
```

---

### 5.6 Slash Command Menu

Unchanged from the previous version: a 320px popover below the cursor, grouped "Basic blocks / Media / Advanced", each item a 40×40 icon + name + description.

```
Screen: Distraction-free editor with a slash command popover open under the
cursor where the user typed "/". Popover 320px wide, 12px radius, grouped
sections "Basic blocks", "Media", "Advanced". Each row: a 40×40 bordered icon
tile, a title and a one-line muted description. Second row keyboard-highlighted.
The faded floating button visible in the corner. Light and dark mode.
```

---

### 5.7 Floating Toolbar & Block Menu

- Floating toolbar above the selection: `Text ▾` | B I S `<>` 🔗 | color ▾.
- Block menu from `⋮⋮`: Delete, Duplicate, Turn into ›, Copy as markdown.

```
Screen: Editor with a sentence selected (accent-subtle highlight) and a
floating formatting pill above it: "Text ▾", Bold, Italic, Strikethrough,
Inline code, Link, divider, color dropdown. No other UI on screen except the
faded floating button. Light and dark mode.
```

---

### 5.8 Command Palette / Search

The main shortcut besides the FAB. A 560px modal at 15vh from the top, light scrim.

- Input "Search pages or commands…".
- **Pages** group (title + highlighted snippet + time), **Actions** group (New page, Toggle theme, Export, Import, Settings, Trash).
- Footer: `↑↓ navigate · ↵ open · esc close`.

```
Screen: Command palette modal near the top over a lightly dimmed editor.
Large search input with the query "meeting". Results grouped under "Pages"
(3 results with emoji, title, snippet with "meeting" highlighted, relative time)
and "Actions" (New page, Toggle theme, Export markdown, Import, Settings,
Trash) with shortcut hints. Footer navigation hints. Light and dark mode.
```

---

### 5.9 Empty State

- Empty canvas; in the middle: placeholder title "Untitled" and a muted line "Start writing, or type '/' for commands".
- Below it, 2 small text links: **Import .md** · **View shortcuts**.
- One faint caption line: "Stored in this browser. No account, no server."
- The FAB shows a one-time tooltip: "The menu lives here — drag to move it."

```
Screen: First-run empty state. Plain blank canvas with a large placeholder
title "Untitled" in faint gray and a muted line
"Start writing, or type '/' for commands". Below, two small text links
"Import .md" and "View shortcuts", and a faint caption
"Stored in this browser. No account, no server."
The floating button in the bottom-right shows a small one-time tooltip bubble:
"The menu lives here — drag to move it". Light and dark mode.
```

---

### 5.10 Trash Panel

Same pattern as the Pages panel (floating from the FAB, 320–400px): filter, list of deleted documents + "Deleted 3 days ago", Restore (↺) and Delete forever (danger) buttons, footer "Automatically deleted after 30 days" + "Empty trash".

---

### 5.11 Settings Modal

A centered 640×480 modal with scrim, left nav (Appearance, Editor, Data, About).

- **Appearance:** Theme (Light / Dark / System cards), Body font (Sans / Serif / Mono), Content width (Normal / Full).
- **Floating button:** Snap position (Free edges / 4 corners), Auto-fade while typing (toggle), Reset position.
- **Editor:** Spell check, show word count in the menu.
- **Data:** Storage usage bar, "Persistent storage: On" status, Backup (.zip), Restore, Danger zone "Delete all data".

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

- Dragging a file onto the window → `--bg` overlay at 90%, a dashed accent box in the middle: "Drop .md files to import".
- Toasts appear **on the side opposite the FAB** so they don't overlap (FAB on the right → toast bottom-left). Variants: success, info + Undo, error + action button.
- Cross-tab conflict: persistent toast "This document was changed in another tab · Reload".

---

### 5.13 Mobile (390×844)

- Full canvas, 20px side padding, 32px title, 12vh top padding.
- 52px FAB, draggable, default bottom-right above the safe area.
- The FAB menu & Pages panel become a **bottom sheet** (pull down to close), not a popover.
- When the keyboard is open: the FAB is hidden; a format bar appears above the keyboard (`/`, H, B, I, list, checkbox, undo, and a ✦ icon to open the menu).

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

## 6. Interaction & Motion

| Element | Behavior |
|---|---|
| FAB snap | Spring to the nearest edge, ±250ms |
| FAB fade while typing | 300ms ease, 1 second delay after the first keystroke |
| FAB menu open | Scale 0.95→1 from the FAB origin + fade, 140ms |
| Menu → Pages panel | 180ms horizontal slide within the same container |
| Modal | Scrim fade 150ms, content rises 8px |
| Theme switch | 150ms color transition (disabled with reduced motion) |
| Block drag | Block at 50% opacity, 2px accent indicator line |

All animations are disabled/simplified under `prefers-reduced-motion`.

## 7. Accessibility

- FAB: `role="button"`, `aria-haspopup="menu"`, `aria-expanded`, label "Open menu". Dragging is not the only way to move it (there's `Alt + arrow` and a reset in Settings).
- Menus & panels: ARIA menu/listbox pattern, ↑↓/Enter/Esc navigation, focus returns to the FAB when closed.
- Save status is announced via `aria-live="polite"` (since the indicator is only a dot).
- Muted text contrast ≥ 4.5:1 in both themes; the dimmed FAB is still focusable and returns to 100% on focus.

## 8. Hand-off Checklist

- [ ] Every screen in light & dark
- [ ] FAB: idle, faded, hover, dragging, open, focus, saving/saved/error status
- [ ] FAB menu in all 4 screen quadrants (different opening directions)
- [ ] Empty states: first run, empty pages, empty trash, no search results
- [ ] Mobile: bottom sheet & format bar above the keyboard
- [ ] Color tokens exported as CSS variables
