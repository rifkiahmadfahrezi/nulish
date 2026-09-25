import { Command } from "cmdk";
import {
	Archive,
	Clipboard,
	Download,
	FileText,
	Keyboard,
	Maximize2,
	Moon,
	Plus,
	Settings,
	Trash2,
	Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	cycleTheme,
	exportCurrent,
	newDoc,
	setAppearance,
} from "#/app/actions";
import {
	closeAll,
	currentDoc,
	openDoc,
	openPanel,
	openSettings,
	ui,
} from "#/app/state";
import { Dialog } from "#/components/Dialog";
import { useActiveDocs } from "#/db/documents";
import { getSetting } from "#/db/settings";
import { copyDocMarkdown, exportBackup, pickAndImport } from "#/features/io/io";
import { t } from "#/lib/i18n";
import { altKey, docTitle, modKey, shiftKey, timeAgo } from "#/lib/utils";
import { buildIndex, plain } from "./search";

const ICON = { size: 16, strokeWidth: 1.5 } as const;

/** 5.8 / FR-30: ⌘K — search pages and run commands. */
export function CommandPalette() {
	const { palette } = ui.use();
	return (
		<Dialog
			open={palette}
			onClose={() => ui.set((s) => ({ ...s, palette: false }))}
			label={t("palette.label")}
			className="mt-[15vh] mb-auto max-w-[560px]"
		>
			<Palette />
		</Dialog>
	);
}

function Palette() {
	const docs = useActiveDocs();
	const [query, setQuery] = useState("");
	const search = useMemo(() => buildIndex(docs ?? []), [docs]);
	const q = query.trim();

	const pages = q
		? search(q)
		: [...(docs ?? [])]
				.sort((a, b) => b.updatedAt - a.updatedAt)
				.slice(0, 5)
				.map((doc) => ({
					doc,
					snippet: [
						{ text: plain(doc.markdown).slice(0, 100), match: false, at: 0 },
					],
				}));

	const run = (fn: () => unknown) => () => {
		closeAll();
		fn();
	};
	const docId = currentDoc.get();
	const actions = [
		{
			label: t("common.newPage"),
			icon: Plus,
			hint: `${modKey}${altKey}N`,
			run: newDoc,
		},
		{
			label: t("palette.toggleTheme"),
			icon: Moon,
			hint: `${modKey}${shiftKey}L`,
			run: cycleTheme,
		},
		...(docId
			? [
					{
						label: t("palette.exportMarkdown"),
						icon: Download,
						hint: `${modKey}${shiftKey}E`,
						run: exportCurrent,
					},
					{
						label: t("common.copyAsMarkdown"),
						icon: Clipboard,
						run: () => copyDocMarkdown(docId),
					},
				]
			: []),
		{ label: t("common.importMd"), icon: Upload, run: pickAndImport },
		{ label: t("palette.backupAll"), icon: Archive, run: exportBackup },
		{ label: t("common.pages"), icon: FileText, run: () => openPanel("pages") },
		{ label: t("common.trash"), icon: Trash2, run: () => openPanel("trash") },
		{ label: t("common.settings"), icon: Settings, run: () => openSettings() },
		{
			label: t("palette.toggleWidth"),
			icon: Maximize2,
			run: async () =>
				setAppearance(
					"contentWidth",
					(await getSetting("contentWidth")) === "full" ? "normal" : "full",
				),
		},
		{
			label: t("common.keyboardShortcuts"),
			icon: Keyboard,
			run: () => ui.set((s) => ({ ...s, shortcuts: true })),
		},
	].filter((a) => !q || a.label.toLowerCase().includes(q.toLowerCase()));

	return (
		<Command shouldFilter={false} loop className="flex max-h-[70dvh] flex-col">
			<Command.Input
				value={query}
				onValueChange={setQuery}
				placeholder={t("palette.placeholder")}
				className="h-12 shrink-0 border-b border-border bg-transparent px-4 text-base outline-none placeholder:text-faint"
			/>
			<Command.List className="min-h-0 overflow-y-auto p-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-faint [&_[cmdk-group-heading]]:uppercase">
				<Command.Empty className="px-4 py-8 text-center text-muted-foreground">
					{t("palette.noResults", { query: q })}
				</Command.Empty>
				{pages.length > 0 && (
					<Command.Group heading={t("common.pages")}>
						{pages.map(({ doc, snippet }) => (
							<Command.Item
								key={doc.id}
								value={`page-${doc.id}`}
								onSelect={run(() => openDoc(doc.id))}
								className="flex cursor-pointer gap-2.5 rounded-md px-2.5 py-2 data-[selected=true]:bg-surface-hover"
							>
								<span className="w-4 text-center">{doc.icon ?? "📄"}</span>
								<div className="min-w-0 flex-1">
									<div className="flex gap-2">
										<span className="flex-1 truncate font-medium">
											{docTitle(doc.title)}
										</span>
										<span className="text-xs text-faint">
											{timeAgo(doc.updatedAt)}
										</span>
									</div>
									{snippet.some((s) => s.text) && (
										<p className="line-clamp-2 text-xs text-muted-foreground">
											{snippet.map((s) =>
												s.match ? (
													<mark
														key={s.at}
														className="rounded-sm bg-selection text-text"
													>
														{s.text}
													</mark>
												) : (
													s.text
												),
											)}
										</p>
									)}
								</div>
							</Command.Item>
						))}
					</Command.Group>
				)}
				{actions.length > 0 && (
					<Command.Group heading={t("palette.actions")}>
						{actions.map(({ label, icon: Icon, hint, run: fn }) => (
							<Command.Item
								key={label}
								value={label}
								onSelect={run(fn)}
								className="flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 data-[selected=true]:bg-surface-hover"
							>
								<Icon {...ICON} className="text-muted-foreground" />
								<span className="flex-1">{label}</span>
								{hint && (
									<kbd className="font-sans text-xs text-faint">{hint}</kbd>
								)}
							</Command.Item>
						))}
					</Command.Group>
				)}
			</Command.List>
			<div className="hidden shrink-0 gap-3 border-t border-border px-4 py-2 text-xs text-faint sm:flex">
				<span>{t("palette.navigate")}</span>
				<span>{t("palette.open")}</span>
				<span>{t("palette.close")}</span>
			</div>
		</Command>
	);
}
