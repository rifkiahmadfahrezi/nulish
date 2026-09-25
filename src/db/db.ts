import Dexie, { type EntityTable } from "dexie";

// docs/prd.md §7. Named `Doc` to avoid clashing with the DOM `Document` type.
export interface Doc {
	id: string;
	title: string;
	icon?: string;
	/** BlockNote blocks (source of truth). */
	content: unknown[];
	/** Markdown cache for search & export. */
	markdown: string;
	pinned: boolean;
	createdAt: number;
	updatedAt: number;
	/** null = active, epoch ms = in trash. */
	deletedAt: number | null;
}

export interface Settings {
	theme: "light" | "dark" | "system";
	fabPosition: { side: "left" | "right"; y: number };
	fabSnapMode: "edges" | "corners";
	fabAutoFade: boolean;
	contentWidth: "normal" | "full";
	bodyFont: "sans" | "serif" | "mono";
	sortBy: "updated" | "title" | "created";
	lastOpenedId: string | null;
	spellcheck: boolean;
	showWordCount: boolean;
	onboarded: boolean;
	/** "auto" (browser language) or a locale code from src/locales. */
	language: string;
}

export type SettingKey = keyof Settings;

export interface SettingRow<K extends SettingKey = SettingKey> {
	key: K;
	value: Settings[K];
}

export interface Asset {
	id: string;
	docId: string;
	blob: Blob;
	mimeType: string;
	createdAt: number;
}

export const db = new Dexie("inkwell") as Dexie & {
	documents: EntityTable<Doc, "id">;
	settings: EntityTable<SettingRow, "key">;
	assets: EntityTable<Asset, "id">;
};

// Never edit a released version — add db.version(n + 1).stores(...).upgrade(...) instead.
db.version(1).stores({
	documents: "id, updatedAt, deletedAt, pinned, title",
	settings: "key",
	assets: "id, docId",
});
