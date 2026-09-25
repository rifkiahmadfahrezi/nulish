import { useSyncExternalStore } from "react";
import type { Settings } from "#/db/db";
import { useSetting } from "#/db/settings";

const dark = matchMedia("(prefers-color-scheme: dark)");
const useSystemDark = () =>
	useSyncExternalStore(
		(cb) => {
			dark.addEventListener("change", cb);
			return () => dark.removeEventListener("change", cb);
		},
		() => dark.matches,
	);

export function resolveTheme(
	theme: Settings["theme"],
	systemDark = dark.matches,
) {
	return theme === "system" ? (systemDark ? "dark" : "light") : theme;
}

/** Resolved light/dark from the setting + OS preference. */
export function useResolvedTheme() {
	return resolveTheme(useSetting("theme"), useSystemDark());
}

/**
 * Applies appearance settings to <html>. FR-51: index.html applies the localStorage mirror
 * before first paint; IndexedDB stays the source of truth.
 */
export function applyAppearance(
	s: Pick<Settings, "theme" | "bodyFont" | "contentWidth">,
	animate = false,
) {
	const root = document.documentElement;
	if (animate) {
		root.classList.add("theme-transition");
		setTimeout(() => root.classList.remove("theme-transition"), 200);
	}
	const resolved = resolveTheme(s.theme);
	root.dataset.theme = resolved;
	root.dataset.font = s.bodyFont;
	root.dataset.width = s.contentWidth;
	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute("content", resolved === "dark" ? "#191919" : "#ffffff");
	try {
		localStorage.setItem("inkwell:appearance", JSON.stringify(s));
	} catch {}
}

export const THEME_CYCLE: Settings["theme"][] = ["light", "dark", "system"];
