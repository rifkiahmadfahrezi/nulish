import { useEffect } from "react";
import { FAB_ID } from "#/features/fab/FloatingPanel";
import { cycleTheme, exportCurrent, newDoc } from "./actions";
import { openPanel, ui } from "./state";

/** PRD §11. `e.code` so ⌥ on macOS (which changes e.key) still matches. */
export function useGlobalShortcuts() {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const mod = e.metaKey || e.ctrlKey;
			if (!mod) return;
			const run = (fn: () => unknown) => {
				e.preventDefault();
				e.stopPropagation();
				fn();
			};
			if (e.code === "KeyK" && !e.shiftKey && !e.altKey)
				return run(() =>
					ui.set((s) => ({ ...s, panel: null, palette: !s.palette })),
				);
			if (e.code === "KeyN" && e.altKey) return run(newDoc);
			if (e.code === "Period")
				return run(() => {
					document.getElementById(FAB_ID)?.focus();
					openPanel(ui.get().panel ? null : "menu");
				});
			if (e.code === "KeyL" && e.shiftKey) return run(cycleTheme);
			if (e.code === "KeyE" && e.shiftKey) return run(exportCurrent);
		};
		window.addEventListener("keydown", onKey, true);
		return () => window.removeEventListener("keydown", onKey, true);
	}, []);
}
