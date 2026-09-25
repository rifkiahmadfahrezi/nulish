import type { Settings } from "#/db/db";

export type FabPosition = Settings["fabPosition"];
export interface Viewport {
	w: number;
	h: number;
	/** Extra bottom inset (safe area). */
	bottom?: number;
}

export const MARGIN = 20;
export const DRAG_THRESHOLD = 5;

/** Top-left pixel coords of the FAB for a stored relative position (FR-57). */
export function toPixels(pos: FabPosition, vp: Viewport, size: number) {
	const travel = Math.max(0, vp.h - size - 2 * MARGIN - (vp.bottom ?? 0));
	return {
		x: pos.side === "left" ? MARGIN : vp.w - size - MARGIN,
		y: MARGIN + clamp01(pos.y) * travel,
	};
}

/** Keeps a free-dragging FAB inside the viewport. */
export function clampPixels(x: number, y: number, vp: Viewport, size: number) {
	return {
		x: clamp(x, MARGIN, vp.w - size - MARGIN),
		y: clamp(y, MARGIN, vp.h - size - MARGIN - (vp.bottom ?? 0)),
	};
}

/** FR-56: snap a drop point to the nearest side (or corner). */
export function snap(
	x: number,
	y: number,
	vp: Viewport,
	size: number,
	mode: Settings["fabSnapMode"],
): FabPosition {
	const side = x + size / 2 < vp.w / 2 ? "left" : "right";
	const travel = Math.max(1, vp.h - size - 2 * MARGIN - (vp.bottom ?? 0));
	const rel = clamp01((y - MARGIN) / travel);
	return { side, y: mode === "corners" ? Math.round(rel) : round3(rel) };
}

/** FR-59a: Alt+arrow moves the FAB without dragging. */
export function nudge(
	pos: FabPosition,
	key: string,
	mode: Settings["fabSnapMode"],
): FabPosition {
	const step = mode === "corners" ? 1 : 0.1;
	switch (key) {
		case "ArrowLeft":
			return { ...pos, side: "left" };
		case "ArrowRight":
			return { ...pos, side: "right" };
		case "ArrowUp":
			return { ...pos, y: round3(clamp01(pos.y - step)) };
		case "ArrowDown":
			return { ...pos, y: round3(clamp01(pos.y + step)) };
		default:
			return pos;
	}
}

/**
 * FR-58: panels open beside the FAB, toward the screen centre, growing away
 * from the nearer vertical edge — so they always stay inside the viewport.
 */
export function panelPlacement(
	fab: { x: number; y: number; size: number },
	vp: Viewport,
) {
	const gap = 8;
	const right = fab.x + fab.size / 2 > vp.w / 2;
	const lower = fab.y + fab.size / 2 > vp.h / 2;
	return {
		horizontal: right
			? { right: vp.w - fab.x + gap }
			: { left: fab.x + fab.size + gap },
		vertical: lower ? { bottom: vp.h - fab.y - fab.size } : { top: fab.y },
		maxHeight: (lower ? fab.y + fab.size : vp.h - fab.y) - MARGIN,
		origin: `${lower ? "bottom" : "top"} ${right ? "right" : "left"}`,
	};
}

const clamp = (v: number, min: number, max: number) =>
	Math.min(Math.max(v, min), Math.max(min, max));
const clamp01 = (v: number) => clamp(v, 0, 1);
const round3 = (v: number) => Math.round(v * 1000) / 1000;
