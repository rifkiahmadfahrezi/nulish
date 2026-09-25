import { describe, expect, it } from "vitest";
import { MARGIN, nudge, panelPlacement, snap, toPixels } from "./position";

const vp = { w: 1000, h: 800 };
const size = 48;

describe("fab position", () => {
	it("round-trips pixels ⇄ relative position", () => {
		const pos = { side: "right" as const, y: 0.25 };
		const { x, y } = toPixels(pos, vp, size);
		expect(x).toBe(1000 - 48 - MARGIN);
		expect(snap(x, y, vp, size, "edges")).toEqual(pos);
	});

	it("snaps to nearest side and clamps inside the viewport", () => {
		expect(snap(100, -500, vp, size, "edges")).toEqual({ side: "left", y: 0 });
		expect(snap(900, 5000, vp, size, "edges")).toEqual({ side: "right", y: 1 });
	});

	it("corners mode snaps y to 0 or 1", () => {
		expect(snap(10, 500, vp, size, "corners").y).toBe(1);
		expect(snap(10, 200, vp, size, "corners").y).toBe(0);
	});

	it("stays correct after resize (relative y)", () => {
		const pos = { side: "left" as const, y: 1 };
		expect(toPixels(pos, { w: 390, h: 844 }, 52).y).toBe(844 - 52 - MARGIN);
	});

	it("nudges with arrows and clamps", () => {
		expect(nudge({ side: "right", y: 0.95 }, "ArrowDown", "edges")).toEqual({
			side: "right",
			y: 1,
		});
		expect(nudge({ side: "right", y: 0.5 }, "ArrowLeft", "edges").side).toBe(
			"left",
		);
	});

	it("opens panels toward the centre", () => {
		const p = panelPlacement({ x: 932, y: 732, size }, vp);
		expect(p.horizontal).toEqual({ right: 1000 - 932 + 8 });
		expect(p.vertical).toEqual({ bottom: 800 - 732 - 48 });
		const q = panelPlacement({ x: 20, y: 20, size }, vp);
		expect(q.horizontal).toEqual({ left: 20 + 48 + 8 });
		expect(q.vertical).toEqual({ top: 20 });
	});
});
