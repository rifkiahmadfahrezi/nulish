import { Monitor, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { setAppearance } from "#/app/actions";
import { openDoc, type SettingsTab, ui } from "#/app/state";
import { Dialog } from "#/components/Dialog";
import { wipeAllData } from "#/db/documents";
import { DEFAULT_SETTINGS, setSetting, useSetting } from "#/db/settings";
import { exportBackup, pickAndRestore } from "#/features/io/io";
import { cn } from "#/lib/utils";

const TABS: { id: SettingsTab; label: string }[] = [
	{ id: "appearance", label: "Appearance" },
	{ id: "fab", label: "Floating button" },
	{ id: "editor", label: "Editor" },
	{ id: "data", label: "Data" },
	{ id: "about", label: "About" },
];

/** 5.11: Settings. */
export function SettingsModal() {
	const { settings: tab } = ui.use();
	const close = () => ui.set((s) => ({ ...s, settings: null }));
	const setTab = (t: SettingsTab) => ui.set((s) => ({ ...s, settings: t }));

	return (
		<Dialog
			open={tab !== null}
			onClose={close}
			label="Settings"
			className="max-w-[640px] sm:h-[480px]"
		>
			<div className="flex h-full flex-col sm:flex-row">
				<nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border p-2 sm:w-44 sm:flex-col sm:border-r sm:border-b-0">
					{TABS.map((t) => (
						<button
							key={t.id}
							type="button"
							aria-current={tab === t.id ? "page" : undefined}
							onClick={() => setTab(t.id)}
							className={cn(
								"h-8 shrink-0 rounded-md px-2.5 text-left whitespace-nowrap text-muted-foreground hover:bg-surface-hover",
								tab === t.id && "bg-surface-active text-text",
							)}
						>
							{t.label}
						</button>
					))}
				</nav>
				<div className="relative min-h-0 flex-1 overflow-y-auto p-5">
					<button
						type="button"
						aria-label="Close"
						onClick={close}
						className="absolute top-3 right-3 grid size-7 place-items-center rounded-sm text-muted-foreground hover:bg-surface-hover"
					>
						<X size={16} strokeWidth={1.5} />
					</button>
					{tab === "appearance" && <Appearance />}
					{tab === "fab" && <FabSettings />}
					{tab === "editor" && <EditorSettings />}
					{tab === "data" && <DataSettings />}
					{tab === "about" && <About />}
				</div>
			</div>
		</Dialog>
	);
}

function Appearance() {
	const theme = useSetting("theme");
	const font = useSetting("bodyFont");
	const width = useSetting("contentWidth");
	return (
		<div className="space-y-6">
			<Field label="Theme">
				<div className="grid grid-cols-3 gap-2">
					{(
						[
							["light", "Light", Sun],
							["dark", "Dark", Moon],
							["system", "System", Monitor],
						] as const
					).map(([value, label, Icon]) => (
						<button
							key={value}
							type="button"
							aria-pressed={theme === value}
							onClick={() => setAppearance("theme", value)}
							className={cn(
								"flex flex-col items-center gap-2 rounded-lg border border-border py-4 hover:bg-surface-hover",
								theme === value && "border-primary ring-1 ring-primary",
							)}
						>
							<Icon size={18} strokeWidth={1.5} />
							{label}
						</button>
					))}
				</div>
			</Field>
			<Field label="Body font">
				<Segmented
					value={font}
					onChange={(v) => setAppearance("bodyFont", v)}
					options={[
						["sans", "Sans"],
						["serif", "Serif"],
						["mono", "Mono"],
					]}
				/>
			</Field>
			<Field label="Content width">
				<Segmented
					value={width}
					onChange={(v) => setAppearance("contentWidth", v)}
					options={[
						["normal", "Normal"],
						["full", "Full width"],
					]}
				/>
			</Field>
		</div>
	);
}

function FabSettings() {
	const mode = useSetting("fabSnapMode");
	const fade = useSetting("fabAutoFade");
	return (
		<div className="space-y-6">
			<Field label="Snap to">
				<Segmented
					value={mode}
					onChange={(v) => setSetting("fabSnapMode", v)}
					options={[
						["edges", "Free edges"],
						["corners", "4 corners"],
					]}
				/>
			</Field>
			<Toggle
				label="Fade while typing"
				checked={fade}
				onChange={(v) => setSetting("fabAutoFade", v)}
			/>
			<button
				type="button"
				onClick={() => setSetting("fabPosition", DEFAULT_SETTINGS.fabPosition)}
				className="text-primary hover:underline"
			>
				Reset posisi
			</button>
			<p className="text-xs text-muted-foreground">
				Tip: focus the button and press Alt + arrow keys to move it.
			</p>
		</div>
	);
}

function EditorSettings() {
	const spell = useSetting("spellcheck");
	const count = useSetting("showWordCount");
	return (
		<div className="space-y-4">
			<Toggle
				label="Spell check"
				checked={spell}
				onChange={(v) => setSetting("spellcheck", v)}
			/>
			<Toggle
				label="Show word count in the menu"
				checked={count}
				onChange={(v) => setSetting("showWordCount", v)}
			/>
		</div>
	);
}

function DataSettings() {
	const [usage, setUsage] = useState<{ used: number; quota: number } | null>(
		null,
	);
	const [persisted, setPersisted] = useState<boolean | null>(null);

	useEffect(() => {
		navigator.storage
			?.estimate?.()
			.then((e) => setUsage({ used: e.usage ?? 0, quota: e.quota ?? 0 }));
		navigator.storage?.persisted?.().then(setPersisted);
	}, []);

	const mb = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;
	return (
		<div className="space-y-6">
			<Field label="Storage">
				{usage && (
					<>
						<div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
							<div
								className="h-full bg-primary"
								style={{
									width: `${Math.max(1, (usage.used / (usage.quota || 1)) * 100)}%`,
								}}
							/>
						</div>
						<p className="mt-1.5 text-xs text-muted-foreground">
							{mb(usage.used)} of {mb(usage.quota)} used
						</p>
					</>
				)}
				<p className="mt-1 text-xs text-muted-foreground">
					Persistent storage:{" "}
					{persisted === null
						? "…"
						: persisted
							? "On"
							: "Off — the browser may delete data when storage is full"}
				</p>
			</Field>
			<Field label="Backup">
				<div className="flex gap-2">
					<Button onClick={exportBackup}>Backup (.zip)</Button>
					<Button onClick={pickAndRestore}>Restore…</Button>
				</div>
				<p className="mt-1.5 text-xs text-muted-foreground">
					Your data only exists in this browser. Back up regularly, especially
					before clearing site data or switching devices.
				</p>
			</Field>
			<Field label="Danger zone">
				<Button
					className="border-danger text-danger"
					onClick={async () => {
						if (
							!confirm(
								"Delete ALL documents, images and settings? This cannot be undone.",
							)
						)
							return;
						await wipeAllData();
						openDoc(null, { replace: true });
						location.reload();
					}}
				>
					Delete all data
				</Button>
			</Field>
		</div>
	);
}

function About() {
	return (
		<div className="space-y-3 text-muted-foreground">
			<h3 className="text-base font-medium text-text">Inkwell</h3>
			<p>
				Local-first markdown editor. All documents are stored in this browser
				(IndexedDB) — no account, no server, no analytics.
			</p>
			<p>After the first visit, Inkwell works fully offline.</p>
			<button
				type="button"
				className="text-primary hover:underline"
				onClick={() =>
					ui.set((s) => ({ ...s, settings: null, shortcuts: true }))
				}
			>
				View keyboard shortcuts
			</button>
		</div>
	);
}

// ---- small controls ----

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<section>
			<h3 className="mb-2 text-xs font-medium text-muted-foreground">
				{label}
			</h3>
			{children}
		</section>
	);
}

function Segmented<T extends string>({
	value,
	onChange,
	options,
}: {
	value: T;
	onChange: (v: T) => void;
	options: [T, string][];
}) {
	return (
		<fieldset className="inline-flex rounded-md bg-surface-hover p-0.5">
			{options.map(([v, label]) => (
				<button
					key={v}
					type="button"
					aria-pressed={value === v}
					onClick={() => onChange(v)}
					className={cn(
						"h-7 rounded-sm px-3 text-muted-foreground",
						value === v && "bg-surface text-text shadow-sm",
					)}
				>
					{label}
				</button>
			))}
		</fieldset>
	);
}

function Toggle({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<label className="flex cursor-pointer items-center justify-between gap-4">
			{label}
			<input
				type="checkbox"
				role="switch"
				aria-checked={checked}
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				className="peer sr-only"
			/>
			<span
				aria-hidden
				className="relative h-5 w-9 shrink-0 rounded-full bg-surface-active transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-primary after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-surface after:shadow-sm after:transition-transform peer-checked:after:translate-x-4"
			/>
		</label>
	);
}

function Button({
	className,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="button"
			{...props}
			className={cn(
				"h-8 rounded-md border border-border px-3 hover:bg-surface-hover",
				className,
			)}
		/>
	);
}
