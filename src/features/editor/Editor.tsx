import "@blocknote/shadcn/style.css";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import * as blockNoteLocales from "@blocknote/core/locales";
import {
	getDefaultReactSlashMenuItems,
	SuggestionMenuController,
	useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	dismissToast,
	registerFlush,
	saveStatus,
	toast,
	ui,
} from "#/app/state";
import { putAsset, resolveAssetUrl } from "#/db/assets";
import type { Doc } from "#/db/db";
import { saveDoc } from "#/db/documents";
import { useSetting } from "#/db/settings";
import { exportBackup, pickAndImport } from "#/features/io/io";
import { useResolvedTheme } from "#/features/settings/theme";
import { getLocale, t } from "#/lib/i18n";
import { docTitle } from "#/lib/utils";
import { IconPicker } from "./IconPicker";
import { MobileBar } from "./MobileBar";
import { calloutSlashItem, type Editor, schema } from "./schema";

const AUTOSAVE_MS = 400;

/** BlockNote ships many UI languages; use the current one if it has it, else English. */
const blockNoteDictionary = () =>
	// biome-ignore lint/performance/noDynamicNamespaceImportAccess: every BlockNote locale must stay available
	blockNoteLocales[getLocale() as keyof typeof blockNoteLocales] ??
	blockNoteLocales.en;
const CONFLICT_TOAST = "doc-conflict";

/** Mounted once per document (keyed by id). `doc` is the live row; only its first value seeds the editor. */
export function DocEditor({ doc }: { doc: Doc }) {
	const theme = useResolvedTheme();
	const spellcheck = useSetting("spellcheck");
	const [title, setTitle] = useState(doc.title);
	const [empty, setEmpty] = useState(isEmptyDoc(doc));
	const titleRef = useRef<HTMLTextAreaElement>(null);

	const editor = useCreateBlockNote({
		schema,
		initialContent: doc.content.length ? (doc.content as never) : undefined,
		uploadFile: (file) => putAsset(doc.id, file),
		resolveFileUrl: resolveAssetUrl,
		// Read once: App remounts the editor when the language changes.
		dictionary: {
			...blockNoteDictionary(),
			placeholders: {
				...blockNoteDictionary().placeholders,
				default: t("editor.placeholder"),
				emptyDocument: t("editor.emptyPlaceholder"),
			},
		},
	}) as unknown as Editor;

	// ---- autosave (FR-21): debounce, flush on hide/unmount ----
	const pending = useRef<{ title?: string; content?: true }>({});
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const lastOwnWrite = useRef(doc.updatedAt);
	const lastContent = useRef(JSON.stringify(doc.content));

	const flush = useCallback(async () => {
		clearTimeout(timer.current);
		const p = pending.current;
		if (p.title === undefined && !p.content) return;
		pending.current = {};
		const patch: Parameters<typeof saveDoc>[1] = {};
		if (p.title !== undefined) patch.title = p.title;
		if (p.content) {
			patch.content = editor.document;
			patch.markdown = editor.blocksToMarkdownLossy(editor.document);
			lastContent.current = JSON.stringify(patch.content);
		}
		const ts = Date.now();
		lastOwnWrite.current = ts;
		try {
			await saveDoc(doc.id, patch, ts);
			saveStatus.set("saved");
		} catch (e) {
			// Keep the edits queued so the next attempt retries them.
			pending.current = { ...p, ...pending.current };
			saveStatus.set("error");
			const quota = e instanceof Error && /quota/i.test(e.name + e.message);
			toast({
				id: "save-error",
				variant: "error",
				message: quota ? t("editor.quotaFull") : t("editor.saveFailed"),
				action: quota
					? { label: t("editor.exportBackup"), run: exportBackup }
					: { label: t("common.retry"), run: flush },
				duration: 0,
			});
		}
	}, [doc.id, editor]);

	const schedule = useCallback(
		(patch: { title?: string; content?: true }) => {
			Object.assign(pending.current, patch);
			saveStatus.set("saving");
			clearTimeout(timer.current);
			timer.current = setTimeout(flush, AUTOSAVE_MS);
		},
		[flush],
	);

	useEffect(() => {
		const onHide = () => {
			if (document.visibilityState === "hidden") flush();
		};
		document.addEventListener("visibilitychange", onHide);
		window.addEventListener("pagehide", flush);
		const unregister = registerFlush(flush);
		return () => {
			document.removeEventListener("visibilitychange", onHide);
			window.removeEventListener("pagehide", flush);
			unregister();
			flush();
		};
	}, [flush]);

	// ---- other tab changed this doc (FR-23, PRD §10: last-write-wins + notice) ----
	useEffect(() => {
		if (doc.updatedAt <= lastOwnWrite.current) return;
		lastOwnWrite.current = doc.updatedAt;
		if (doc.title !== title && pending.current.title === undefined)
			setTitle(doc.title);
		if (JSON.stringify(doc.content) === lastContent.current) return;
		toast({
			id: CONFLICT_TOAST,
			message: t("editor.conflict"),
			duration: 0,
			action: {
				label: t("common.reload"),
				run: () => {
					lastContent.current = JSON.stringify(doc.content);
					pending.current = {};
					editor.replaceBlocks(editor.document, doc.content as never);
					setTitle(doc.title);
					dismissToast(CONFLICT_TOAST);
				},
			},
		});
	}, [doc, editor, title]);
	useEffect(() => () => dismissToast(CONFLICT_TOAST), []);

	// FR-52: title doubles as the tab title.
	useEffect(() => {
		document.title = `${docTitle(title)} — Inkwell`;
	}, [title]);

	// New/empty doc: start in the title.
	// biome-ignore lint/correctness/useExhaustiveDependencies: mount only
	useEffect(() => {
		if (!doc.title && isEmptyDoc(doc)) titleRef.current?.focus();
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the title text changes
	useEffect(() => autoGrow(titleRef.current), [title]);

	return (
		<article className="mx-auto w-full max-w-(--content-width) px-5 pt-[12vh] pb-[40vh] sm:px-6 sm:pt-[15vh]">
			<div className="group/title sm:px-[54px]">
				<IconPicker
					icon={doc.icon}
					onChange={(icon) =>
						saveDoc(doc.id, { icon }).catch(() => saveStatus.set("error"))
					}
				/>
				<textarea
					ref={titleRef}
					rows={1}
					value={title}
					placeholder={t("common.untitled")}
					aria-label={t("editor.titleLabel")}
					spellCheck={spellcheck}
					onChange={(e) => {
						setTitle(e.target.value.replace(/\n/g, ""));
						schedule({ title: e.target.value.replace(/\n/g, "") });
					}}
					onKeyDown={(e) => {
						if (
							e.key === "Enter" ||
							(e.key === "ArrowDown" && isCaretAtEnd(e.currentTarget))
						) {
							e.preventDefault();
							editor.setTextCursorPosition(editor.document[0], "start");
							editor.focus();
						}
					}}
					className="block w-full resize-none overflow-hidden bg-transparent font-bold text-[32px] leading-[40px] text-text outline-none placeholder:text-faint sm:text-[40px] sm:leading-[48px]"
				/>
			</div>
			<div className="mt-4" spellCheck={spellcheck}>
				<BlockNoteView
					editor={editor}
					theme={theme}
					slashMenu={false}
					onChange={() => {
						setEmpty(
							editor.document.length <= 1 && !hasContent(editor.document[0]),
						);
						schedule({ content: true });
					}}
				>
					<SuggestionMenuController
						triggerCharacter="/"
						getItems={async (query) =>
							filterSuggestionItems(
								[
									...getDefaultReactSlashMenuItems(editor),
									calloutSlashItem(editor),
								],
								query,
							)
						}
					/>
				</BlockNoteView>
			</div>
			{empty && !title && <EmptyHints />}
			<MobileBar editor={editor} />
		</article>
	);
}

// 5.9 Empty state hints under an empty document.
function EmptyHints() {
	return (
		<div className="mt-8 space-y-3 text-sm sm:px-[54px]">
			<div className="flex gap-3 text-muted-foreground">
				<button
					type="button"
					className="underline-offset-4 hover:underline"
					onClick={() => pickAndImport()}
				>
					{t("common.importMd")}
				</button>
				<span className="text-faint">·</span>
				<button
					type="button"
					className="underline-offset-4 hover:underline"
					onClick={() => ui.set((s) => ({ ...s, shortcuts: true }))}
				>
					{t("common.viewShortcuts")}
				</button>
			</div>
			<p className="text-xs text-faint">{t("editor.storedLocally")}</p>
		</div>
	);
}

function hasContent(block: unknown) {
	const b = block as { type?: string; content?: unknown[] } | undefined;
	if (!b) return false;
	return (
		b.type !== "paragraph" || (Array.isArray(b.content) && b.content.length > 0)
	);
}

function isEmptyDoc(doc: Doc) {
	return doc.content.length <= 1 && !hasContent(doc.content[0]);
}

function autoGrow(el: HTMLTextAreaElement | null) {
	if (!el) return;
	el.style.height = "auto";
	el.style.height = `${el.scrollHeight}px`;
}

function isCaretAtEnd(el: HTMLTextAreaElement) {
	return el.selectionStart === el.value.length;
}
