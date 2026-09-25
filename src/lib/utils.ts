import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const isMac =
	typeof navigator !== "undefined" &&
	/Mac|iPhone|iPad/.test(navigator.platform);
export const modKey = isMac ? "⌘" : "Ctrl+";
export const altKey = isMac ? "⌥" : "Alt+";
export const shiftKey = isMac ? "⇧" : "Shift+";

const rtf = new Intl.RelativeTimeFormat("en", {
	numeric: "auto",
	style: "narrow",
});
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	["year", 31_536_000_000],
	["month", 2_592_000_000],
	["week", 604_800_000],
	["day", 86_400_000],
	["hour", 3_600_000],
	["minute", 60_000],
];
export function timeAgo(ts: number, now = Date.now()) {
	const diff = ts - now;
	for (const [unit, ms] of UNITS) {
		if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
	}
	return "just now";
}

export function docTitle(title: string | undefined) {
	return title?.trim() || "Untitled";
}

export function wordStats(markdown: string) {
	const words = markdown.match(/[\p{L}\p{N}'’-]+/gu)?.length ?? 0;
	return {
		words,
		chars: markdown.length,
		minutes: Math.max(1, Math.round(words / 200)),
	};
}

export function slugify(title: string) {
	return (
		title
			.trim()
			.replace(/[\\/:*?"<>|]+/g, "")
			.replace(/\s+/g, "-")
			.slice(0, 80) || "untitled"
	);
}
