import {
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import { ui } from "#/app/state";
import { t } from "#/lib/i18n";
import { cn } from "#/lib/utils";
import { panelPlacement, type Viewport } from "./position";
import { useIsMobile } from "./viewport";

export const FAB_ID = "fab";

export function closePanel() {
	ui.set((s) => ({ ...s, panel: null }));
	document.getElementById(FAB_ID)?.focus();
}

/**
 * Container for the FAB menu / Pages / Trash: a popover beside the FAB on
 * desktop (FR-58), a bottom sheet on phones (FR-59b). Handles Esc, outside
 * click and ↑↓ navigation between `[data-item]` elements.
 */
export function FloatingPanel({
	fab,
	vp,
	width,
	view,
	children,
}: {
	fab: { x: number; y: number; size: number };
	/** Which content is shown; focus moves to its first item when it changes. */
	view: string;
	vp: Viewport;
	width: number;
	children: ReactNode;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const mobile = useIsMobile();

	useEffect(() => {
		const onDown = (e: PointerEvent) => {
			const t = e.target as Element;
			// Portaled popovers (menus inside the panel) render outside it.
			if (
				ref.current?.contains(t) ||
				t.closest(`#${FAB_ID}, [data-radix-popper-content-wrapper], [popover]`)
			)
				return;
			ui.set((s) => ({ ...s, panel: null }));
		};
		document.addEventListener("pointerdown", onDown);
		return () => document.removeEventListener("pointerdown", onDown);
	}, []);

	// Focus the first item (or [data-autofocus]) whenever the view changes.
	// biome-ignore lint/correctness/useExhaustiveDependencies: keyed on view on purpose
	useEffect(() => {
		const el = ref.current?.querySelector<HTMLElement>(
			"[data-autofocus], [data-item]",
		);
		el?.focus({ preventScroll: true });
	}, [view]);

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			e.stopPropagation();
			closePanel();
			return;
		}
		if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
		const items = [
			...(ref.current?.querySelectorAll<HTMLElement>(
				"[data-item]:not([disabled])",
			) ?? []),
		];
		if (!items.length) return;
		e.preventDefault();
		const i = items.indexOf(document.activeElement as HTMLElement);
		const next =
			e.key === "ArrowDown"
				? (i + 1) % items.length
				: i <= 0
					? items.length - 1
					: i - 1;
		items[next].focus();
		items[next].scrollIntoView({ block: "nearest" });
	};

	if (mobile)
		return (
			<BottomSheet panelRef={ref} onKeyDown={onKeyDown}>
				{children}
			</BottomSheet>
		);

	const p = panelPlacement(fab, vp);
	return (
		<div
			ref={ref}
			role="dialog"
			aria-label={t("common.menu")}
			onKeyDown={onKeyDown}
			style={{
				...p.horizontal,
				...p.vertical,
				width,
				maxHeight: Math.min(560, vp.h * 0.7, p.maxHeight),
				transformOrigin: p.origin,
			}}
			className="fade-in zoom-in-95 animate-in fixed z-50 flex flex-col overflow-hidden rounded-lg border border-border bg-surface text-sm text-text shadow-float duration-150"
		>
			{children}
		</div>
	);
}

function BottomSheet({
	panelRef,
	onKeyDown,
	children,
}: {
	panelRef: React.RefObject<HTMLDivElement | null>;
	onKeyDown: (e: KeyboardEvent) => void;
	children: ReactNode;
}) {
	const [dy, setDy] = useState(0);
	const startY = useRef<number | null>(null);

	return (
		<>
			<div className="fade-in animate-in fixed inset-0 z-40 bg-scrim" />
			<div
				ref={panelRef}
				role="dialog"
				aria-label={t("common.menu")}
				onKeyDown={onKeyDown}
				style={{ transform: dy ? `translateY(${dy}px)` : undefined }}
				className="slide-in-from-bottom animate-in fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] text-[15px] text-text shadow-float-lg duration-200"
			>
				{/* Drag handle: pull down to close. */}
				<div
					className="flex h-6 shrink-0 touch-none items-center justify-center"
					onPointerDown={(e) => {
						e.currentTarget.setPointerCapture(e.pointerId);
						startY.current = e.clientY;
					}}
					onPointerMove={(e) =>
						startY.current !== null &&
						setDy(Math.max(0, e.clientY - startY.current))
					}
					onPointerUp={() => {
						startY.current = null;
						if (dy > 80) closePanel();
						setDy(0);
					}}
				>
					<span className="h-1 w-10 rounded-full bg-border" />
				</div>
				{children}
			</div>
		</>
	);
}

/** Shared row style for menu-like lists. */
export const itemClass = cn(
	"flex h-[34px] w-full shrink-0 items-center gap-2.5 rounded-md px-2.5 text-left outline-none",
	"hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none",
	"disabled:opacity-50 pointer-coarse:h-11",
);
