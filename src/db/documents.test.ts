import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import {
	createDoc,
	deleteForever,
	duplicateDoc,
	getDoc,
	purgeOldTrash,
	restoreDoc,
	saveDoc,
	TRASH_TTL_MS,
	trashDoc,
} from "./documents";
import { getSetting, setSetting } from "./settings";

beforeEach(() =>
	Promise.all([db.documents.clear(), db.assets.clear(), db.settings.clear()]),
);

describe("documents repository", () => {
	it("creates, saves and duplicates", async () => {
		const id = await createDoc({ title: "A" });
		await saveDoc(id, { markdown: "hello" }, 123);
		expect(await getDoc(id)).toMatchObject({
			title: "A",
			markdown: "hello",
			updatedAt: 123,
			deletedAt: null,
		});

		const copy = await duplicateDoc(id);
		expect(copy).not.toBe(id);
		expect(await getDoc(copy as string)).toMatchObject({
			title: "A (copy)",
			markdown: "hello",
		});
	});

	it("soft-deletes, restores and purges trash after 30 days (FR-06)", async () => {
		const keep = await createDoc();
		const old = await createDoc();
		await trashDoc(keep);
		await trashDoc(old);
		await restoreDoc(keep);
		expect((await getDoc(keep))?.deletedAt).toBeNull();

		await purgeOldTrash(Date.now() + TRASH_TTL_MS + 1);
		expect(await getDoc(old)).toBeUndefined();
		expect(await getDoc(keep)).toBeDefined();
	});

	it("deleting forever also removes the doc's assets", async () => {
		const id = await createDoc();
		await db.assets.add({
			id: "a1",
			docId: id,
			blob: new Blob(["x"]),
			mimeType: "text/plain",
			createdAt: 0,
		});
		await deleteForever([id]);
		expect(await db.assets.count()).toBe(0);
	});

	it("settings fall back to defaults", async () => {
		expect(await getSetting("theme")).toBe("system");
		await setSetting("theme", "dark");
		expect(await getSetting("theme")).toBe("dark");
	});
});
