import { useLiveQuery } from "dexie-react-hooks";
import { db, type SettingKey, type SettingRow, type Settings } from "./db";

export const DEFAULT_SETTINGS: Settings = {
	theme: "system",
	fabPosition: { side: "right", y: 1 },
	fabSnapMode: "edges",
	fabAutoFade: true,
	contentWidth: "normal",
	bodyFont: "sans",
	sortBy: "updated",
	lastOpenedId: null,
	spellcheck: true,
	showWordCount: true,
	onboarded: false,
	language: "auto",
};

export async function getSetting<K extends SettingKey>(
	key: K,
): Promise<Settings[K]> {
	const row = (await db.settings.get(key)) as SettingRow<K> | undefined;
	return row ? row.value : DEFAULT_SETTINGS[key];
}

export function setSetting<K extends SettingKey>(key: K, value: Settings[K]) {
	snapshot = { ...snapshot, [key]: value };
	return db.settings.put({ key, value } as SettingRow);
}

export async function getAllSettings(): Promise<Settings> {
	const rows = await db.settings.toArray();
	return {
		...DEFAULT_SETTINGS,
		...Object.fromEntries(rows.map((r) => [r.key, r.value])),
	};
}

/** Loaded once before first render so the UI never flashes defaults (theme, FAB position). */
let snapshot = DEFAULT_SETTINGS;
export async function preloadSettings() {
	snapshot = await getAllSettings();
	return snapshot;
}

export function useSetting<K extends SettingKey>(key: K): Settings[K] {
	return useLiveQuery(() => getSetting(key), [key]) ?? snapshot[key];
}
