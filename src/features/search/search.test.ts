import { describe, expect, it } from "vitest";
import type { Doc } from "#/db/db";
import { buildIndex, plain } from "./search";

const doc = (id: string, title: string, markdown: string): Doc => ({
	id,
	title,
	markdown,
	content: [],
	pinned: false,
	createdAt: 0,
	updatedAt: 0,
	deletedAt: null,
});

describe("search", () => {
	it("finds by body with a highlighted snippet (FR-31)", () => {
		const search = buildIndex([
			doc("1", "Recipe", "Spicy **shrimp** paste."),
			doc("2", "Other", "Not relevant."),
		]);
		const [hit, ...rest] = search("shri");
		expect(rest).toHaveLength(0);
		expect(hit.doc.id).toBe("1");
		expect(hit.snippet.filter((s) => s.match).map((s) => s.text)).toEqual([
			"shrimp",
		]);
	});

	it("ranks title matches first", () => {
		const search = buildIndex([
			doc("1", "Notes", "meeting"),
			doc("2", "Meeting", "body"),
		]);
		expect(search("meeting")[0].doc.id).toBe("2");
	});

	it("strips markdown syntax for snippets", () => {
		expect(plain("# Title\n- [ ] task *italic* [link](http://x)")).toBe(
			"Title task italic link",
		);
	});
});
