import { allDocs, createDoc, getDoc, purgeOldTrash } from "#/db/documents";
import { preloadSettings } from "#/db/settings";
import { importFiles } from "#/features/io/io";
import { initPwa } from "#/features/pwa/pwa";
import { applyAppearance } from "#/features/settings/theme";
import { currentDoc, openDoc, openPalette, toast } from "./state";

/** Runs before first render: settings, trash purge, PWA, launch params, initial document. */
export async function boot() {
	try {
		const settings = await preloadSettings();
		applyAppearance(settings);
		purgeOldTrash();
		initPwa();

		const params = new URLSearchParams(location.search);
		const action = params.get("action");
		const shared = [
			params.get("share_title"),
			params.get("share_text"),
			params.get("share_url"),
		].filter(Boolean);
		const clean = new URL(location.href);
		for (const key of ["action", "share_title", "share_text", "share_url"])
			clean.searchParams.delete(key);
		history.replaceState(null, "", clean);

		// FR-85: share target → new document.
		if (shared.length) {
			const [title, ...rest] = shared as string[];
			const markdown = rest.join("\n\n");
			const { markdownToBlocks } = await import("#/features/editor/schema");
			return openDoc(
				await createDoc({
					title,
					markdown,
					content: markdownToBlocks(markdown),
				}),
				{ replace: true },
			);
		}
		// FR-74 shortcuts.
		if (action === "new") return openDoc(await createDoc(), { replace: true });
		if (action === "search") openPalette();
		// FR-84: files opened from the OS file manager.
		if (action === "open-file" && "launchQueue" in window) {
			(window as unknown as LaunchQueueWindow).launchQueue.setConsumer(
				async ({ files }) => {
					importFiles(await Promise.all(files.map((f) => f.getFile())));
				},
			);
		}

		const requested = currentDoc.get();
		const valid = async (id: string | null) =>
			id ? (await getDoc(id))?.deletedAt === null : false;
		if (await valid(requested)) return openDoc(requested, { replace: true });
		if (await valid(settings.lastOpenedId))
			return openDoc(settings.lastOpenedId, { replace: true });

		const docs = await allDocs();
		const recent = docs
			.filter((d) => d.deletedAt === null)
			.sort((a, b) => b.updatedAt - a.updatedAt)[0];
		if (recent) return openDoc(recent.id, { replace: true });
		// US-01: first run starts on a blank page. Everything trashed → empty state instead.
		if (!docs.length) return openDoc(await createDoc(), { replace: true });
		openDoc(null, { replace: true });
	} catch (e) {
		// Private mode / blocked storage: still render, but say so.
		console.error(e);
		toast({
			variant: "error",
			duration: 0,
			message:
				"Browser storage is unavailable (private mode?). Your writing will not be saved.",
		});
	}
}

interface LaunchQueueWindow {
	launchQueue: {
		setConsumer(cb: (p: { files: FileSystemFileHandle[] }) => void): void;
	};
}
