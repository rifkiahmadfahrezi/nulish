import {
	ChevronLeft,
	Clipboard,
	Copy,
	Download,
	MoreHorizontal,
	Pencil,
	Pin,
	PinOff,
	Plus,
	Trash2,
} from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { newDoc, trashWithUndo } from "#/app/actions";
import { currentDoc, openDoc, openPanel } from "#/app/state";
import type { Doc, Settings } from "#/db/db";
import {
	duplicateDoc,
	saveDoc,
	togglePin,
	useActiveDocs,
} from "#/db/documents";
import { setSetting, useSetting } from "#/db/settings";
import { itemClass } from "#/features/fab/FloatingPanel";
import { copyDocMarkdown, exportDoc } from "#/features/io/io";
import { getLocale, t } from "#/lib/i18n";
import { cn, docTitle, timeAgo } from "#/lib/utils";

const ICON = { size: 16, strokeWidth: 1.5 } as const;
const coarse = matchMedia("(pointer: coarse)").matches;

export function sortDocs(docs: Doc[], sortBy: Settings["sortBy"]) {
	const sorted = [...docs];
	if (sortBy === "title")
		sorted.sort((a, b) =>
			docTitle(a.title).localeCompare(docTitle(b.title), getLocale()),
		);
	else if (sortBy === "created")
		sorted.sort((a, b) => b.createdAt - a.createdAt);
	else sorted.sort((a, b) => b.updatedAt - a.updatedAt);
	return sorted;
}

/** 5.4 / FR-02: document list inside the FAB popover. */
export function PagesPanel() {
	const docs = useActiveDocs();
	const sortBy = useSetting("sortBy");
	const active = currentDoc.use();
	const [filter, setFilter] = useState("");

	const { pinned, rest } = useMemo(() => {
		const q = filter.trim().toLowerCase();
		const list = sortDocs(docs ?? [], sortBy).filter(
			(d) => !q || docTitle(d.title).toLowerCase().includes(q),
		);
		return {
			pinned: list.filter((d) => d.pinned),
			rest: list.filter((d) => !d.pinned),
		};
	}, [docs, sortBy, filter]);

	return (
		<div className="flex min-h-0 flex-col">
			<PanelHeader
				title={t("common.pages")}
				action={
					<IconBtn
						label={t("common.newPage")}
						onClick={newDoc}
						icon={<Plus {...ICON} />}
					/>
				}
			/>
			<div className="space-y-1.5 px-2 pb-2">
				<input
					data-autofocus={coarse ? undefined : true}
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					placeholder={t("pages.filter")}
					aria-label={t("pages.filter")}
					className="h-8 w-full rounded-md border border-border bg-transparent px-2.5 outline-none placeholder:text-faint focus:border-primary"
				/>
				<label className="flex items-center gap-1 text-xs text-muted-foreground">
					{t("pages.sort")}
					<select
						value={sortBy}
						onChange={(e) =>
							setSetting("sortBy", e.target.value as Settings["sortBy"])
						}
						className="bg-transparent text-text outline-none"
					>
						<option value="updated">{t("pages.sortUpdated")}</option>
						<option value="created">{t("pages.sortCreated")}</option>
						<option value="title">{t("pages.sortTitle")}</option>
					</select>
				</label>
			</div>
			<div
				role="listbox"
				aria-label={t("common.pages")}
				className="min-h-0 overflow-y-auto border-t border-border p-1.5"
			>
				{docs && !docs.length && (
					<div className="px-2.5 py-6 text-center text-muted-foreground">
						<p>{t("pages.empty")}</p>
						<button
							type="button"
							onClick={newDoc}
							className="mt-2 text-primary hover:underline"
						>
							{t("common.createDocument")}
						</button>
					</div>
				)}
				{docs && docs.length > 0 && !pinned.length && !rest.length && (
					<p className="px-2.5 py-6 text-center text-muted-foreground">
						{t("pages.noMatches")}
					</p>
				)}
				{pinned.length > 0 && (
					<Group label={t("pages.pinned")} docs={pinned} active={active} />
				)}
				{rest.length > 0 && (
					<Group
						label={pinned.length ? t("pages.all") : null}
						docs={rest}
						active={active}
					/>
				)}
			</div>
		</div>
	);
}

function Group({
	label,
	docs,
	active,
}: {
	label: string | null;
	docs: Doc[];
	active: string | null;
}) {
	return (
		<>
			{label && (
				<p className="px-2.5 pt-2 pb-1 text-[11px] font-medium tracking-wide text-faint uppercase">
					{label}
				</p>
			)}
			{docs.map((d) => (
				<Row key={d.id} doc={d} active={d.id === active} />
			))}
		</>
	);
}

function Row({ doc, active }: { doc: Doc; active: boolean }) {
	const [renaming, setRenaming] = useState(false);

	if (renaming)
		return (
			<input
				// biome-ignore lint/a11y/noAutofocus: rename was explicitly requested
				autoFocus
				defaultValue={doc.title}
				aria-label={t("pages.rename")}
				onFocus={(e) => e.currentTarget.select()}
				onBlur={(e) => {
					saveDoc(doc.id, { title: e.currentTarget.value.trim() });
					setRenaming(false);
				}}
				onKeyDown={(e) => {
					e.stopPropagation();
					if (e.key === "Enter") e.currentTarget.blur();
					if (e.key === "Escape") setRenaming(false);
				}}
				className="h-[34px] w-full rounded-md border border-primary bg-transparent px-2.5 outline-none"
			/>
		);

	return (
		<div
			className={cn(
				"group/row relative flex items-center rounded-md",
				active && "bg-surface-active",
			)}
		>
			<button
				type="button"
				role="option"
				aria-selected={active}
				data-item
				onClick={() => openDoc(doc.id)}
				className={cn(itemClass, "pr-9")}
			>
				<span className="w-4 text-center">
					{doc.icon ?? (doc.pinned ? "📌" : "📄")}
				</span>
				<span
					className={cn(
						"flex-1 truncate",
						!doc.title.trim() && "text-muted-foreground",
					)}
				>
					{docTitle(doc.title)}
				</span>
				{active && <span className="size-1.5 rounded-full bg-primary" />}
				<span className="text-xs text-faint group-focus-within/row:opacity-0 group-hover/row:opacity-0">
					{timeAgo(doc.updatedAt)}
				</span>
			</button>
			<RowMenu doc={doc} onRename={() => setRenaming(true)} />
		</div>
	);
}

function RowMenu({ doc, onRename }: { doc: Doc; onRename: () => void }) {
	const id = useId();
	const pop = useRef<HTMLDivElement>(null);
	const btn = useRef<HTMLButtonElement>(null);
	const run = (fn: () => unknown) => () => {
		pop.current?.hidePopover();
		fn();
	};
	const items = [
		{
			label: doc.pinned ? t("pages.unpin") : t("pages.pin"),
			icon: doc.pinned ? PinOff : Pin,
			run: () => togglePin(doc.id, !doc.pinned),
		},
		{ label: t("pages.rename"), icon: Pencil, run: onRename },
		{
			label: t("pages.duplicate"),
			icon: Copy,
			run: () =>
				duplicateDoc(doc.id, (title) => t("pages.copyTitle", { title })),
		},
		{
			label: t("common.exportMd"),
			icon: Download,
			run: () => exportDoc(doc.id),
		},
		{
			label: t("common.copyAsMarkdown"),
			icon: Clipboard,
			run: () => copyDocMarkdown(doc.id),
		},
		{
			label: t("pages.moveToTrash"),
			icon: Trash2,
			run: () => trashWithUndo(doc.id),
			danger: true,
		},
	];

	return (
		<>
			<button
				ref={btn}
				type="button"
				popoverTarget={id}
				aria-label={t("pages.options", { title: docTitle(doc.title) })}
				className="absolute right-1 grid size-7 place-items-center rounded-sm text-muted-foreground opacity-0 hover:bg-surface-active focus-visible:opacity-100 group-focus-within/row:opacity-100 group-hover/row:opacity-100 pointer-coarse:opacity-100"
			>
				<MoreHorizontal {...ICON} />
			</button>
			<div
				ref={pop}
				id={id}
				popover="auto"
				role="menu"
				onToggle={(e) => {
					if (e.newState !== "open" || !btn.current || !pop.current) return;
					const r = btn.current.getBoundingClientRect();
					const h = pop.current.offsetHeight;
					pop.current.style.top = `${r.bottom + h + 8 > innerHeight ? r.top - h - 4 : r.bottom + 4}px`;
					pop.current.style.left = `${Math.max(8, r.right - 200)}px`;
					pop.current.querySelector<HTMLElement>("button")?.focus();
				}}
				onKeyDown={(e) => {
					// Keep ↑↓/Esc inside this menu instead of the surrounding panel.
					e.stopPropagation();
					if (e.key === "Escape") return btn.current?.focus();
					if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
					e.preventDefault();
					const list = [...e.currentTarget.querySelectorAll("button")];
					const i = list.indexOf(document.activeElement as HTMLButtonElement);
					list[
						(i + (e.key === "ArrowDown" ? 1 : list.length - 1)) % list.length
					]?.focus();
				}}
				className="fixed m-0 w-[200px] rounded-lg border border-border bg-surface p-1 text-sm text-text shadow-float"
			>
				{items.map(({ label, icon: Icon, run: fn, danger }) => (
					<button
						key={label}
						type="button"
						role="menuitem"
						onClick={run(fn)}
						className={cn(itemClass, danger && "text-danger")}
					>
						<Icon {...ICON} />
						{label}
					</button>
				))}
			</div>
		</>
	);
}

export function PanelHeader({
	title,
	action,
}: {
	title: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex h-11 shrink-0 items-center gap-1 px-2">
			<IconBtn
				label={t("common.back")}
				onClick={() => openPanel("menu")}
				icon={<ChevronLeft {...ICON} />}
			/>
			<h2 className="flex-1 font-medium">{title}</h2>
			{action}
		</div>
	);
}

export function IconBtn({
	label,
	icon,
	onClick,
	className,
}: {
	label: string;
	icon: React.ReactNode;
	onClick: () => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			onClick={onClick}
			className={cn(
				"grid size-7 place-items-center rounded-sm text-muted-foreground hover:bg-surface-hover hover:text-text",
				className,
			)}
		>
			{icon}
		</button>
	);
}
