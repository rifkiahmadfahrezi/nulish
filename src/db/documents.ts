import { useLiveQuery } from "dexie-react-hooks";
import { type Doc, db } from "./db";

export const TRASH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

let persistRequested = false;
/** FR-22: ask the browser not to evict our data. Best effort, once per session. */
function requestPersist() {
	if (persistRequested) return;
	persistRequested = true;
	navigator.storage?.persist?.().catch(() => {});
}

export async function createDoc(
	init: Partial<Pick<Doc, "title" | "icon" | "content" | "markdown">> = {},
) {
	const now = Date.now();
	const doc: Doc = {
		id: crypto.randomUUID(),
		title: "",
		content: [],
		markdown: "",
		pinned: false,
		createdAt: now,
		updatedAt: now,
		deletedAt: null,
		...init,
	};
	await db.documents.add(doc);
	requestPersist();
	return doc.id;
}

export function getDoc(id: string) {
	return db.documents.get(id);
}

/** Callers may pass updatedAt up front to recognise their own write when liveQuery echoes it back. */
export async function saveDoc(
	id: string,
	patch: Partial<Pick<Doc, "title" | "icon" | "content" | "markdown">>,
	updatedAt = Date.now(),
) {
	await db.documents.update(id, { ...patch, updatedAt });
}

export async function duplicateDoc(id: string) {
	const src = await db.documents.get(id);
	if (!src) return null;
	return createDoc({
		title: src.title ? `${src.title} (copy)` : "",
		icon: src.icon,
		content: src.content,
		markdown: src.markdown,
	});
}

export function togglePin(id: string, pinned: boolean) {
	return db.documents.update(id, { pinned });
}

export function trashDoc(id: string) {
	return db.documents.update(id, { deletedAt: Date.now() });
}

export function restoreDoc(id: string) {
	return db.documents.update(id, { deletedAt: null });
}

export function deleteForever(ids: string[]) {
	return db.transaction("rw", db.documents, db.assets, async () => {
		await db.documents.bulkDelete(ids);
		await db.assets.where("docId").anyOf(ids).delete();
	});
}

export async function emptyTrash() {
	const ids = (await db.documents
		.filter((d) => d.deletedAt !== null)
		.primaryKeys()) as string[];
	await deleteForever(ids);
}

/** FR-06: auto-purge trash older than 30 days. */
export async function purgeOldTrash(now = Date.now()) {
	const ids = (await db.documents
		.filter((d) => d.deletedAt !== null && now - d.deletedAt > TRASH_TTL_MS)
		.primaryKeys()) as string[];
	if (ids.length) await deleteForever(ids);
}

export function allDocs() {
	return db.documents.toArray();
}

/** Backup restore: upsert by id so restoring twice doesn't duplicate. */
export function putDocs(docs: Doc[]) {
	return db.documents.bulkPut(docs);
}

export function wipeAllData() {
	return db.transaction("rw", db.documents, db.assets, db.settings, () =>
		Promise.all([db.documents.clear(), db.assets.clear(), db.settings.clear()]),
	);
}

// ---- hooks ----
// ponytail: full-table scans (IndexedDB can't index null deletedAt); fine up to a few thousand docs.

/** undefined while loading, null when missing. */
export function useDoc(id: string | null) {
	return useLiveQuery(
		async () => (id ? ((await db.documents.get(id)) ?? null) : null),
		[id],
	);
}

export function useActiveDocs() {
	return useLiveQuery(() =>
		db.documents.filter((d) => d.deletedAt === null).toArray(),
	);
}

export function useTrashedDocs() {
	return useLiveQuery(() =>
		db.documents
			.filter((d) => d.deletedAt !== null)
			.reverse()
			.sortBy("deletedAt"),
	);
}
