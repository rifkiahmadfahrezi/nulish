import { lazy, Suspense, useEffect } from "react";
import { useDoc } from "#/db/documents";
import { useSetting } from "#/db/settings";
import { Fab } from "#/features/fab/Fab";
import { DropOverlay } from "#/features/io/DropOverlay";
import { pickAndImport } from "#/features/io/io";
import { CommandPalette } from "#/features/search/CommandPalette";
import { SettingsModal } from "#/features/settings/SettingsModal";
import { ShortcutsDialog } from "#/features/settings/ShortcutsDialog";
import { applyAppearance } from "#/features/settings/theme";
import { newDoc } from "./actions";
import { currentDoc } from "./state";
import { Toaster } from "./Toaster";
import { useGlobalShortcuts } from "./useGlobalShortcuts";

// The editor (BlockNote + Shiki) is the heavy part; keep it out of the shell bundle.
const DocEditor = lazy(() =>
	import("#/features/editor/Editor").then((m) => ({ default: m.DocEditor })),
);

export function App() {
	const id = currentDoc.use();
	const doc = useDoc(id);
	useGlobalShortcuts();
	useAppearanceSync();

	return (
		<>
			<main>
				{doc && doc.deletedAt === null ? (
					<Suspense>
						<DocEditor key={doc.id} doc={doc} />
					</Suspense>
				) : (
					(!id || doc === null || doc?.deletedAt) && <EmptyState />
				)}
			</main>
			<Fab />
			<CommandPalette />
			<SettingsModal />
			<ShortcutsDialog />
			<DropOverlay />
			<Toaster />
		</>
	);
}

/** Keeps <html> in sync with settings changed here, in another tab, or by the OS theme. */
function useAppearanceSync() {
	const theme = useSetting("theme");
	const bodyFont = useSetting("bodyFont");
	const contentWidth = useSetting("contentWidth");
	useEffect(() => {
		applyAppearance({ theme, bodyFont, contentWidth });
		if (theme !== "system") return;
		const mq = matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyAppearance({ theme, bodyFont, contentWidth });
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [theme, bodyFont, contentWidth]);
}

/** PRD §10: no active documents. */
function EmptyState() {
	useEffect(() => {
		document.title = "Inkwell";
	}, []);
	return (
		<div className="grid min-h-dvh place-items-center px-5 text-center">
			<div className="space-y-3">
				<p className="text-muted-foreground">No documents yet.</p>
				<button
					type="button"
					onClick={newDoc}
					className="h-9 rounded-md bg-primary px-4 font-medium text-primary-foreground hover:opacity-90"
				>
					Create document
				</button>
				<p>
					<button
						type="button"
						onClick={pickAndImport}
						className="text-sm text-muted-foreground hover:underline"
					>
						Import .md
					</button>
				</p>
			</div>
		</div>
	);
}
