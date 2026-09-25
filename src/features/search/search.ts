import MiniSearch from "minisearch";
import type { Doc } from "#/db/db";

export interface Hit {
	doc: Doc;
	snippet: { text: string; match: boolean; at: number }[];
}

/** FR-30: in-memory full-text index over title + markdown cache. */
export function buildIndex(docs: Doc[]) {
	const index = new MiniSearch<Doc>({
		fields: ["title", "markdown"],
		storeFields: [],
		searchOptions: {
			boost: { title: 3 },
			prefix: true,
			fuzzy: 0.2,
			combineWith: "AND",
		},
	});
	index.addAll(docs);
	const byId = new Map(docs.map((d) => [d.id, d]));

	return (query: string, limit = 8): Hit[] =>
		index
			.search(query)
			.slice(0, limit)
			.flatMap((r) => {
				const doc = byId.get(r.id);
				return doc
					? [{ doc, snippet: snippet(plain(doc.markdown), r.terms) }]
					: [];
			});
}

/** Strip markdown punctuation so snippets read like prose. */
export function plain(md: string) {
	return md
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/^[\s>#*+-]*(\[[ xX]\]\s*)?|\d+\.\s/gm, "")
		.replace(/[*_~`]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

/** FR-31: ~120 chars around the first matched term, split into highlight segments. */
export function snippet(text: string, terms: string[], radius = 60) {
	if (!terms.length || !text)
		return [{ text: text.slice(0, radius * 2), match: false, at: 0 }];
	const re = new RegExp(`(${terms.map(escapeRe).join("|")})`, "gi");
	const first = text.search(re);
	const start = Math.max(0, first - radius);
	const slice =
		(start > 0 ? "…" : "") +
		text.slice(start, start + radius * 2) +
		(start + radius * 2 < text.length ? "…" : "");
	let at = 0;
	return slice
		.split(re)
		.filter(Boolean)
		.map((part) => {
			at += part.length;
			return {
				text: part,
				match: terms.some((t) => t.toLowerCase() === part.toLowerCase()),
				at: at - part.length,
			};
		});
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
