import { useSyncExternalStore } from "react";
import type { Viewport } from "./position";

function safeAreaBottom() {
	const probe = document.createElement("div");
	probe.style.cssText =
		"position:fixed;visibility:hidden;padding-bottom:env(safe-area-inset-bottom,0px)";
	document.body.append(probe);
	const v = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
	probe.remove();
	return v;
}

let cached: Viewport | null = null;
const read = () => {
	const w = document.documentElement.clientWidth;
	const h = innerHeight;
	if (!cached || cached.w !== w || cached.h !== h)
		cached = { w, h, bottom: safeAreaBottom() };
	return cached;
};
const subscribe = (cb: () => void) => {
	addEventListener("resize", cb);
	return () => removeEventListener("resize", cb);
};

export const useViewport = () => useSyncExternalStore(subscribe, read);

const coarse = matchMedia("(pointer: coarse)");
/** 48px desktop, 52px touch. */
export const useFabSize = () =>
	useSyncExternalStore(
		(cb) => {
			coarse.addEventListener("change", cb);
			return () => coarse.removeEventListener("change", cb);
		},
		() => (coarse.matches ? 52 : 48),
	);

const narrow = matchMedia("(max-width: 639px)");
/** FR-59b: menus become bottom sheets on phones. */
export const useIsMobile = () =>
	useSyncExternalStore(
		(cb) => {
			narrow.addEventListener("change", cb);
			return () => narrow.removeEventListener("change", cb);
		},
		() => narrow.matches,
	);
