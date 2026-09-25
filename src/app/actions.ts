import type { Settings } from "#/db/db";
import { createDoc, restoreDoc, trashDoc } from "#/db/documents";
import { getAllSettings, getSetting, setSetting } from "#/db/settings";
import { exportDoc } from "#/features/io/io";
import { applyAppearance, THEME_CYCLE } from "#/features/settings/theme";
import { t } from "#/lib/i18n";
import { currentDoc, openDoc, toast } from "./state";

/** Shared by the FAB menu, command palette and keyboard shortcuts. */

export async function newDoc() {
	openDoc(await createDoc());
}

export async function setAppearance<
	K extends "theme" | "bodyFont" | "contentWidth",
>(key: K, value: Settings[K]) {
	await setSetting(key, value);
	applyAppearance(await getAllSettings(), key === "theme");
}

export async function cycleTheme() {
	const theme = await getSetting("theme");
	await setAppearance(
		"theme",
		THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length],
	);
}

export function exportCurrent() {
	const id = currentDoc.get();
	if (id) exportDoc(id);
}

/** Move to trash with Undo (5.12 toast variant). */
export async function trashWithUndo(id: string) {
	await trashDoc(id);
	if (currentDoc.get() === id) openDoc(null, { replace: true });
	toast({
		message: t("toast.movedToTrash"),
		action: {
			label: t("common.undo"),
			run: () => restoreDoc(id).then(() => openDoc(id)),
		},
	});
}
