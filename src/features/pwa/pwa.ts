import { registerSW } from "virtual:pwa-register";
import { flushAll, pwa, toast } from "#/app/state";
import { db } from "#/db/db";
import { t } from "#/lib/i18n";

let updateSW: ((reload?: boolean) => Promise<void>) | undefined;

export function initPwa() {
	// FR-81: new version waits; show dot + menu item + one non-blocking toast.
	updateSW = registerSW({
		onNeedRefresh() {
			pwa.set((s) => ({ ...s, updateReady: true }));
			toast({
				message: t("pwa.updateReady"),
				action: { label: t("common.reload"), run: applyUpdate },
				duration: 8000,
			});
		},
	});

	addEventListener("beforeinstallprompt", (e) => {
		e.preventDefault();
		pwa.set((s) => ({
			...s,
			installPrompt: e as Event & { prompt: () => Promise<void> },
		}));
	});
	addEventListener("appinstalled", () =>
		pwa.set((s) => ({ ...s, installPrompt: null, installed: true })),
	);
	addEventListener("online", () => pwa.set((s) => ({ ...s, offline: false })));
	addEventListener("offline", () => pwa.set((s) => ({ ...s, offline: true })));

	// FR-83: schema upgrades across tabs.
	db.on("versionchange", () => {
		flushAll().finally(() => db.close());
		toast({
			id: "db-version",
			message: t("pwa.updatedElsewhere"),
			action: { label: t("common.reload"), run: () => location.reload() },
			duration: 0,
		});
		return false;
	});
	db.on("blocked", () => {
		toast({
			id: "db-blocked",
			message: t("pwa.closeOtherTabs"),
			duration: 0,
		});
	});
}

/** FR-82: flush the autosave queue first, then activate the waiting SW and reload. */
export async function applyUpdate() {
	await flushAll();
	await updateSW?.(true);
}

/** FR-72 */
export async function promptInstall() {
	const prompt = pwa.get().installPrompt;
	if (prompt) {
		await prompt.prompt();
		pwa.set((s) => ({ ...s, installPrompt: null }));
		return;
	}
	toast({
		message: t("pwa.iosHint"),
		duration: 10000,
	});
}
