import type en from "#/locales/en.json";
import { createStore } from "./store";

/**
 * Minimal i18n. Every `src/locales/<code>.json` is picked up automatically — see
 * src/locales/README.md for how to add a language. Missing keys fall back to English.
 */
type Messages = typeof en;
export type MessageKey = Exclude<keyof Messages, "_meta">;
type Plural = {
	zero?: string;
	one?: string;
	two?: string;
	few?: string;
	many?: string;
	other: string;
};
type Catalog = { _meta: { name: string } } & Partial<
	Record<MessageKey, string | Plural>
>;

const catalogs: Record<string, Catalog> = Object.fromEntries(
	Object.entries(
		import.meta.glob<Catalog>("../locales/*.json", {
			eager: true,
			import: "default",
		}),
	).map(([path, messages]) => [path.replace(/^.*\/|\.json$/g, ""), messages]),
);

export const FALLBACK = "en";

/** Languages available in Settings, as `{ code, name }` (name is written in that language). */
export const LOCALES = Object.entries(catalogs)
	.map(([code, c]) => ({ code, name: c._meta.name }))
	.sort((a, b) => a.name.localeCompare(b.name));

/** "auto" → first browser language we have a catalog for (matching by prefix: `id-ID` → `id`). */
export function resolveLocale(
	setting: string,
	preferred: readonly string[] = navigator.languages,
) {
	if (setting !== "auto" && catalogs[setting]) return setting;
	for (const lang of preferred) {
		const code = lang.toLowerCase();
		if (catalogs[code]) return code;
		const base = code.split("-")[0];
		if (catalogs[base]) return base;
	}
	return FALLBACK;
}

const current = createStore(FALLBACK);
export const getLocale = current.get;
/** Subscribe a component (App) to language changes; everything below re-renders with it. */
export const useLocale = current.use;

export function setLocale(code: string) {
	document.documentElement.lang = code;
	current.set(code);
}

/**
 * Translate `key`, replacing `{name}` placeholders from `vars`.
 * Plural messages (`{ "one": …, "other": … }`) are chosen with Intl.PluralRules on `vars.count`.
 */
export function t(
	key: MessageKey,
	vars: Record<string, string | number> = {},
): string {
	const locale = current.get();
	const msg = catalogs[locale]?.[key] ?? catalogs[FALLBACK][key] ?? key;
	const text =
		typeof msg === "string"
			? msg
			: (msg[new Intl.PluralRules(locale).select(Number(vars.count ?? 0))] ??
				msg.other);
	return text.replace(/\{(\w+)\}/g, (m, name: string) =>
		name in vars ? formatVar(vars[name], locale) : m,
	);
}

const formatVar = (v: string | number, locale: string) =>
	typeof v === "number" ? v.toLocaleString(locale) : v;

export const catalogsForTest = catalogs;
