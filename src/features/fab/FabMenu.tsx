import {
	ChevronRight,
	Download,
	FileText,
	Monitor,
	Moon,
	Plus,
	RefreshCw,
	Search,
	Settings as SettingsIcon,
	Smartphone,
	Sun,
	Trash2,
	Upload,
} from "lucide-react";
import {
	cycleTheme,
	exportCurrent,
	newDoc,
	setAppearance,
} from "#/app/actions";
import {
	currentDoc,
	openPalette,
	openPanel,
	openSettings,
	pwa,
	saveStatus,
	ui,
} from "#/app/state";
import { useDoc, useTrashedDocs } from "#/db/documents";
import { useSetting } from "#/db/settings";
import { pickAndImport } from "#/features/io/io";
import { applyUpdate, promptInstall } from "#/features/pwa/pwa";
import { getLocale, t } from "#/lib/i18n";
import { altKey, cn, modKey, shiftKey, wordStats } from "#/lib/utils";
import { itemClass } from "./FloatingPanel";

const ICON = { size: 16, strokeWidth: 1.5 } as const;

/** 5.3: FAB menu. Every app action is reachable from here (FR-55). */
export function FabMenu() {
	const trash = useTrashedDocs();
	const docId = currentDoc.use();
	const { installPrompt, installed, updateReady, offline } = pwa.use();
	const ios = /iPhone|iPad/.test(navigator.userAgent) && !installed;

	return (
		<div
			role="menu"
			aria-label={t("common.menu")}
			className="flex min-h-0 flex-col"
		>
			<div className="overflow-y-auto p-1.5">
				<button
					type="button"
					role="menuitem"
					data-item
					onClick={openPalette}
					className={cn(
						itemClass,
						"mb-1 border border-border text-muted-foreground",
					)}
				>
					<Search {...ICON} />
					<span className="flex-1">{t("menu.search")}</span>
					<Kbd>{modKey}K</Kbd>
				</button>
				<Item
					icon={<FileText {...ICON} />}
					onClick={() => openPanel("pages")}
					right={<ChevronRight {...ICON} />}
				>
					{t("common.pages")}
				</Item>
				<Item
					icon={<Plus {...ICON} />}
					onClick={newDoc}
					right={
						<Kbd>
							{modKey}
							{altKey}N
						</Kbd>
					}
				>
					{t("common.newPage")}
				</Item>
				<Sep />
				<Item
					icon={<Download {...ICON} />}
					onClick={exportCurrent}
					disabled={!docId}
					right={
						<Kbd>
							{modKey}
							{shiftKey}E
						</Kbd>
					}
				>
					{t("common.exportMd")}
				</Item>
				<Item icon={<Upload {...ICON} />} onClick={pickAndImport}>
					{t("common.importMd")}
				</Item>
				<Sep />
				<ThemeRow />
				<Item
					icon={<Trash2 {...ICON} />}
					onClick={() => openPanel("trash")}
					right={
						trash?.length ? (
							<span className="text-xs text-faint">{trash.length}</span>
						) : null
					}
				>
					{t("common.trash")}
				</Item>
				<Item icon={<SettingsIcon {...ICON} />} onClick={() => openSettings()}>
					{t("common.settings")}
				</Item>
				{(installPrompt || ios) && (
					<Item icon={<Smartphone {...ICON} />} onClick={promptInstall}>
						{t("menu.installApp")}
					</Item>
				)}
				{updateReady && (
					<Item
						icon={<RefreshCw {...ICON} className="text-primary" />}
						onClick={applyUpdate}
					>
						{t("menu.updateAvailable")}
					</Item>
				)}
			</div>
			<MetaFooter docId={docId} offline={offline} />
		</div>
	);
}

function ThemeRow() {
	const theme = useSetting("theme");
	const options = [
		{ value: "light", label: t("common.light"), icon: Sun },
		{ value: "dark", label: t("common.dark"), icon: Moon },
		{ value: "system", label: t("common.system"), icon: Monitor },
	] as const;
	const Current = options.find((o) => o.value === theme)?.icon ?? Monitor;
	return (
		<div className={cn(itemClass, "hover:bg-transparent")}>
			<button
				type="button"
				data-item
				role="menuitem"
				onClick={cycleTheme}
				className="flex flex-1 items-center gap-2.5 outline-none focus-visible:underline"
			>
				<Current {...ICON} />
				{t("common.theme")}
			</button>
			<fieldset
				aria-label={t("common.theme")}
				className="flex rounded-md bg-surface-hover p-0.5"
			>
				{options.map(({ value, label, icon: Icon }) => (
					<button
						key={value}
						type="button"
						aria-pressed={theme === value}
						aria-label={label}
						title={label}
						onClick={() => setAppearance("theme", value)}
						className={cn(
							"grid size-6 place-items-center rounded-sm text-muted-foreground",
							theme === value && "bg-surface text-text shadow-sm",
						)}
					>
						<Icon size={14} strokeWidth={1.5} />
					</button>
				))}
			</fieldset>
		</div>
	);
}

/** FR-21 / FR-60 / FR-61 / FR-78: status + document info, since there's no footer. */
function MetaFooter({
	docId,
	offline,
}: {
	docId: string | null;
	offline: boolean;
}) {
	const doc = useDoc(docId);
	const status = saveStatus.use();
	const showCount = useSetting("showWordCount");
	const stats = doc ? wordStats(doc.markdown) : null;
	const statusText = {
		idle: t("status.saved"),
		saved: t("status.saved"),
		saving: t("status.saving"),
		error: t("status.failed"),
	}[status];
	const fmt = (ts: number) =>
		new Date(ts).toLocaleString(getLocale(), {
			dateStyle: "medium",
			timeStyle: "short",
		});

	return (
		<div className="border-t border-border px-3 py-2 text-xs text-faint">
			<p aria-live="polite" className={cn(status === "error" && "text-danger")}>
				{statusText}
				{stats && showCount && (
					<>
						{" · "}
						{t("menu.words", { count: stats.words })} ·{" "}
						{t("menu.minutes", { count: stats.minutes })}
					</>
				)}
			</p>
			{doc && showCount && (
				<p
					className="mt-0.5"
					title={t("menu.created", { date: fmt(doc.createdAt) })}
				>
					{t("menu.characters", { count: stats?.chars ?? 0 })} ·{" "}
					{t("menu.edited", { date: fmt(doc.updatedAt) })}
				</p>
			)}
			{offline && <p className="mt-0.5">{t("menu.offline")}</p>}
		</div>
	);
}

function Item({
	icon,
	children,
	right,
	onClick,
	disabled,
}: {
	icon: React.ReactNode;
	children: React.ReactNode;
	right?: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			role="menuitem"
			data-item
			disabled={disabled}
			onClick={() => {
				// Close first; items that open another panel set it again.
				ui.set((s) => ({ ...s, panel: null }));
				onClick();
			}}
			className={itemClass}
		>
			<span className="text-muted-foreground">{icon}</span>
			<span className="flex-1 truncate">{children}</span>
			{right && <span className="text-faint">{right}</span>}
		</button>
	);
}

const Sep = () => <hr className="-mx-1.5 my-1.5 border-border" />;

export const Kbd = ({ children }: { children: React.ReactNode }) => (
	<kbd className="font-sans text-xs text-faint pointer-coarse:hidden">
		{children}
	</kbd>
);
