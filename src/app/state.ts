import { setSetting } from "#/db/settings";
import { createStore } from "#/lib/store";

// ---- current document: ?doc=<id> ----
function docFromUrl() {
	return new URLSearchParams(location.search).get("doc");
}

export const currentDoc = createStore<string | null>(docFromUrl());

export function openDoc(id: string | null, { replace = false } = {}) {
	if (id === currentDoc.get()) return;
	const url = new URL(location.href);
	if (id) url.searchParams.set("doc", id);
	else url.searchParams.delete("doc");
	history[replace ? "replaceState" : "pushState"](null, "", url);
	currentDoc.set(id);
	if (id) setSetting("lastOpenedId", id);
	ui.set((s) => ({ ...s, panel: null }));
}

window.addEventListener("popstate", () => currentDoc.set(docFromUrl()));

// ---- floating UI ----
export type Panel = "menu" | "pages" | "trash" | null;
export type SettingsTab = "appearance" | "fab" | "editor" | "data" | "about";

export const ui = createStore<{
	panel: Panel;
	palette: boolean;
	settings: SettingsTab | null;
	shortcuts: boolean;
}>({ panel: null, palette: false, settings: null, shortcuts: false });

export const closeAll = () =>
	ui.set({ panel: null, palette: false, settings: null, shortcuts: false });
export const openPanel = (panel: Panel) =>
	ui.set((s) => ({ ...s, panel, palette: false }));
export const openPalette = () =>
	ui.set((s) => ({ ...s, panel: null, palette: true }));
export const openSettings = (tab: SettingsTab = "appearance") =>
	ui.set((s) => ({ ...s, panel: null, palette: false, settings: tab }));

// ---- save status (FR-21) ----
export type SaveStatus = "idle" | "saving" | "saved" | "error";
export const saveStatus = createStore<SaveStatus>("idle");

/** Pending-write flushers, so SW update / page hide can wait for the last autosave (FR-82). */
const flushers = new Set<() => Promise<void>>();
export function registerFlush(fn: () => Promise<void>) {
	flushers.add(fn);
	return () => void flushers.delete(fn);
}
export const flushAll = () => Promise.all([...flushers].map((f) => f()));

/** True once the user has typed for 1s, until the pointer moves; drives FAB auto-fade (FR-59). */
export const typing = createStore(false);

/** Mobile on-screen keyboard visible (FR-59b). */
export const keyboardOpen = createStore(false);

// ---- toasts (FR-59c) ----
export interface Toast {
	id: string;
	message: string;
	variant?: "info" | "success" | "error";
	action?: { label: string; run: () => void };
	/** ms; 0 = stays until dismissed. */
	duration?: number;
}
export const toasts = createStore<Toast[]>([]);

export function toast(t: Omit<Toast, "id"> & { id?: string }) {
	const id = t.id ?? crypto.randomUUID();
	toasts.set((list) => [...list.filter((x) => x.id !== id), { ...t, id }]);
	const duration = t.duration ?? (t.action ? 6000 : 3000);
	if (duration) setTimeout(() => dismissToast(id), duration);
	return id;
}
export const dismissToast = (id: string) =>
	toasts.set((list) => list.filter((x) => x.id !== id));

// ---- PWA ----
export const pwa = createStore<{
	updateReady: boolean;
	installPrompt: (Event & { prompt: () => Promise<void> }) | null;
	installed: boolean;
	offline: boolean;
}>({
	updateReady: false,
	installPrompt: null,
	installed: matchMedia("(display-mode: standalone)").matches,
	offline: !navigator.onLine,
});
