import { Sparkles, X } from "lucide-react";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import {
	keyboardOpen,
	openPanel,
	pwa,
	saveStatus,
	typing,
	ui,
} from "#/app/state";
import { setSetting, useSetting } from "#/db/settings";
import { PagesPanel } from "#/features/documents/PagesPanel";
import { TrashPanel } from "#/features/documents/TrashPanel";
import { t } from "#/lib/i18n";
import { cn } from "#/lib/utils";
import { FabMenu } from "./FabMenu";
import { FAB_ID, FloatingPanel } from "./FloatingPanel";
import {
	clampPixels,
	DRAG_THRESHOLD,
	type FabPosition,
	nudge,
	snap,
	toPixels,
} from "./position";
import { useFabSize, useViewport } from "./viewport";

/** FR-55..59: the only permanent UI. Drag to move, click to open the menu. */
export function Fab() {
	const stored = useSetting("fabPosition");
	const mode = useSetting("fabSnapMode");
	const autoFade = useSetting("fabAutoFade");
	const onboarded = useSetting("onboarded");
	const { panel } = ui.use();
	const isTyping = typing.use();
	const kbOpen = keyboardOpen.use();
	const vp = useViewport();
	const size = useFabSize();

	const [optimistic, setOptimistic] = useState<FabPosition | null>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: drop the optimistic value once IndexedDB echoes the write
	useEffect(() => setOptimistic(null), [stored]);
	const pos = optimistic ?? stored;

	const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
	const start = useRef<{
		px: number;
		py: number;
		ox: number;
		oy: number;
	} | null>(null);
	const dragged = useRef(false);
	const [focused, setFocused] = useState(false);
	const [caretUnder, setCaretUnder] = useState(false);
	const btnRef = useRef<HTMLButtonElement>(null);

	const px = drag ?? toPixels(pos, vp, size);
	const open = panel !== null;

	const move = (next: FabPosition) => {
		setOptimistic(next);
		setSetting("fabPosition", next);
		if (!onboarded) setSetting("onboarded", true);
	};

	// ---- drag (FR-56): < 5px is a click ----
	const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
		if (e.button !== 0) return;
		e.currentTarget.setPointerCapture(e.pointerId);
		start.current = { px: e.clientX, py: e.clientY, ox: px.x, oy: px.y };
		dragged.current = false;
	};
	const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
		const s = start.current;
		if (!s) return;
		const dx = e.clientX - s.px;
		const dy = e.clientY - s.py;
		if (!dragged.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
		if (!dragged.current && open) ui.set((u) => ({ ...u, panel: null }));
		dragged.current = true;
		setDrag(clampPixels(s.ox + dx, s.oy + dy, vp, size));
	};
	const onPointerUp = () => {
		start.current = null;
		if (drag) move(snap(drag.x, drag.y, vp, size, mode));
		setDrag(null);
	};

	// One-time hint (5.9): gone after the first interaction or 8s.
	useEffect(() => {
		if (onboarded) return;
		const t = setTimeout(() => setSetting("onboarded", true), 8000);
		return () => clearTimeout(t);
	}, [onboarded]);

	// ---- auto-fade (FR-59) ----
	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | undefined;
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement;
			if (
				e.metaKey ||
				e.ctrlKey ||
				!(t.isContentEditable || t.tagName === "TEXTAREA")
			)
				return;
			timer ??= setTimeout(() => typing.set(true), 1000);
		};
		const onMouse = () => {
			clearTimeout(timer);
			timer = undefined;
			if (typing.get()) typing.set(false);
			setCaretUnder(false);
		};
		document.addEventListener("keydown", onKey, true);
		document.addEventListener("mousemove", onMouse);
		return () => {
			clearTimeout(timer);
			document.removeEventListener("keydown", onKey, true);
			document.removeEventListener("mousemove", onMouse);
		};
	}, []);

	// Don't cover the caret: go fully transparent when typing under the FAB.
	useEffect(() => {
		if (!isTyping) return;
		const onKeyUp = () => {
			const sel = getSelection();
			const r = sel?.rangeCount
				? sel.getRangeAt(0).getBoundingClientRect()
				: null;
			const b = btnRef.current?.getBoundingClientRect();
			if (!r || !b) return;
			const pad = 16;
			setCaretUnder(
				r.right > b.left - pad &&
					r.left < b.right + pad &&
					r.bottom > b.top - pad &&
					r.top < b.bottom + pad,
			);
		};
		document.addEventListener("keyup", onKeyUp);
		return () => document.removeEventListener("keyup", onKeyUp);
	}, [isTyping]);

	const faded = autoFade && isTyping && !open && !focused && !drag;
	const nearLeft = drag ? drag.x + size / 2 < vp.w / 2 : false;

	return (
		<>
			{drag && (
				<div
					aria-hidden
					className={cn(
						"fixed inset-y-0 z-40 w-0.5 bg-primary/40",
						nearLeft ? "left-0" : "right-0",
					)}
				/>
			)}
			<button
				ref={btnRef}
				id={FAB_ID}
				type="button"
				aria-label={open ? t("fab.close") : t("fab.open")}
				aria-haspopup="menu"
				aria-expanded={open}
				hidden={kbOpen}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerUp}
				onClick={() => {
					if (dragged.current) {
						dragged.current = false;
						return;
					}
					if (!onboarded) setSetting("onboarded", true);
					openPanel(open ? null : "menu");
				}}
				onKeyDown={(e) => {
					if (e.altKey && e.key.startsWith("Arrow")) {
						e.preventDefault();
						move(nudge(pos, e.key, mode));
					}
				}}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				style={{
					width: size,
					height: size,
					transform: `translate(${px.x}px, ${px.y}px) scale(${drag ? 1.08 : faded ? 0.9 : 1})`,
					opacity: caretUnder && faded ? 0 : faded ? 0.25 : 1,
				}}
				className={cn(
					"fixed top-0 left-0 z-50 grid touch-none select-none place-items-center rounded-full border border-border bg-surface text-muted-foreground",
					"transition-[transform,opacity,background-color,box-shadow] duration-300 ease-[cubic-bezier(.34,1.4,.64,1)] motion-reduce:transition-none",
					"hover:bg-surface-hover hover:text-text focus-visible:outline-offset-2",
					drag
						? "cursor-grabbing shadow-float-lg duration-0"
						: "cursor-grab shadow-float",
				)}
			>
				<span
					className={cn(
						"transition-transform duration-150",
						open && "rotate-90",
					)}
				>
					{open ? (
						<X size={18} strokeWidth={1.5} />
					) : (
						<Sparkles size={18} strokeWidth={1.5} />
					)}
				</span>
				<StatusDot />
			</button>

			{!onboarded && !open && !drag && !kbOpen && (
				<div
					style={{
						top: px.y + size / 2,
						...(pos.side === "right"
							? { right: vp.w - px.x + 10 }
							: { left: px.x + size + 10 }),
					}}
					className="fade-in animate-in fixed z-50 max-w-56 -translate-y-1/2 rounded-md bg-foreground px-3 py-2 text-xs text-background shadow-float"
				>
					{t("fab.hint")}
				</div>
			)}

			{open && (
				<FloatingPanel
					fab={{ ...px, size }}
					vp={vp}
					view={panel}
					width={panel === "menu" ? 240 : 340}
				>
					{panel === "menu" && <FabMenu />}
					{panel === "pages" && <PagesPanel />}
					{panel === "trash" && <TrashPanel />}
				</FloatingPanel>
			)}
		</>
	);
}

/** 3. Anatomy: 6px dot — saving (pulse), saved (brief), error, update ready (FR-81). */
function StatusDot() {
	const status = saveStatus.use();
	const { updateReady } = pwa.use();
	const [showSaved, setShowSaved] = useState(false);

	useEffect(() => {
		if (status !== "saved") return;
		setShowSaved(true);
		const t = setTimeout(() => setShowSaved(false), 1500);
		return () => clearTimeout(t);
	}, [status]);

	const cls =
		status === "error"
			? "bg-danger"
			: status === "saving"
				? "bg-faint animate-pulse"
				: updateReady || showSaved
					? "bg-primary"
					: null;

	return (
		<>
			{cls && (
				<span
					aria-hidden
					className={cn(
						"absolute top-0.5 right-0.5 size-1.5 rounded-full",
						cls,
					)}
				/>
			)}
			<span className="sr-only" aria-live="polite">
				{status === "saving"
					? t("status.saving")
					: status === "saved"
						? t("status.saved")
						: status === "error"
							? t("status.failed")
							: ""}
			</span>
		</>
	);
}
