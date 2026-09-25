import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { flushAll, openDoc, toast } from "#/app/state";
import { allAssets, putAssets } from "#/db/assets";
import type { Asset, Doc } from "#/db/db";
import { allDocs, createDoc, getDoc, putDocs } from "#/db/documents";
import { docTitle, slugify } from "#/lib/utils";

export function download(name: string, data: BlobPart, type: string) {
	const url = URL.createObjectURL(new Blob([data], { type }));
	const a = Object.assign(document.createElement("a"), {
		href: url,
		download: name,
	});
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function docToMarkdown(doc: Pick<Doc, "title" | "markdown">) {
	return doc.title.trim()
		? `# ${doc.title.trim()}\n\n${doc.markdown}`
		: doc.markdown;
}

/** Splits a leading `# Title` line off as the document title. */
export function parseMarkdownFile(text: string, fallbackTitle: string) {
	const body = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
	const m = body.match(/^#[ \t]+(.+)\n*/);
	return m
		? { title: m[1].trim(), markdown: body.slice(m[0].length) }
		: { title: fallbackTitle, markdown: body };
}

// ---- FR-40 / FR-43 ----
export async function exportDoc(id: string) {
	await flushAll();
	const doc = await getDoc(id);
	if (!doc) return;
	download(
		`${slugify(docTitle(doc.title))}.md`,
		docToMarkdown(doc),
		"text/markdown;charset=utf-8",
	);
}

export async function copyDocMarkdown(id: string) {
	await flushAll();
	const doc = await getDoc(id);
	if (!doc) return;
	await navigator.clipboard.writeText(docToMarkdown(doc));
	toast({ message: "Markdown copied", variant: "success" });
}

// ---- FR-41 ----
const MD_RE = /\.(md|markdown|mdown|txt)$/i;
const utf8 = new TextDecoder("utf-8", { fatal: true });
// BlockNote is lazy-loaded with the editor; keep it out of the shell bundle.
const markdownToBlocks = async (md: string) =>
	(await import("#/features/editor/schema")).markdownToBlocks(md);

export async function importFiles(files: File[]) {
	const md = files.filter((f) => MD_RE.test(f.name));
	const zips = files.filter((f) => /\.zip$/i.test(f.name));
	const rejected = files.length - md.length - zips.length;
	let lastId: string | null = null;
	let failed = 0;

	for (const file of md) {
		try {
			const text = utf8.decode(await file.arrayBuffer());
			const { title, markdown } = parseMarkdownFile(
				text,
				file.name.replace(MD_RE, ""),
			);
			lastId = await createDoc({
				title,
				markdown,
				content: await markdownToBlocks(markdown),
			});
		} catch {
			failed++;
		}
	}
	for (const zip of zips) await restoreBackup(zip);

	if (lastId) openDoc(lastId);
	const ok = md.length - failed;
	if (ok)
		toast({
			variant: "success",
			message: ok === 1 ? "1 document imported" : `${ok} documents imported`,
		});
	if (rejected || failed)
		toast({
			variant: "error",
			message: `${rejected + failed} file(s) skipped — only UTF-8 .md files can be imported.`,
		});
}

export function pickAndImport() {
	const input = Object.assign(document.createElement("input"), {
		type: "file",
		multiple: true,
		accept: ".md,.markdown,.txt,text/markdown,.zip",
	});
	input.onchange = () => input.files && importFiles([...input.files]);
	input.click();
}

// ---- FR-42 backup / restore ----
interface Manifest {
	app: "inkwell";
	version: 1;
	exportedAt: number;
	documents: (Omit<Doc, "markdown"> & { file: string })[];
	assets: (Omit<Asset, "blob"> & { file: string })[];
}

export async function exportBackup() {
	await flushAll();
	const [docs, assets] = await Promise.all([allDocs(), allAssets()]);
	const files: Record<string, Uint8Array> = {};
	const manifest: Manifest = {
		app: "inkwell",
		version: 1,
		exportedAt: Date.now(),
		documents: [],
		assets: [],
	};

	for (const { markdown, ...doc } of docs) {
		const file = `pages/${slugify(docTitle(doc.title))}-${doc.id.slice(0, 8)}.md`;
		files[file] = strToU8(docToMarkdown({ title: doc.title, markdown }));
		manifest.documents.push({ ...doc, file });
	}
	for (const { blob, ...asset } of assets) {
		const file = `assets/${asset.id}`;
		files[file] = new Uint8Array(await blob.arrayBuffer());
		manifest.assets.push({ ...asset, file });
	}
	files["manifest.json"] = strToU8(JSON.stringify(manifest, null, 2));

	const date = new Date().toISOString().slice(0, 10);
	download(
		`inkwell-backup-${date}.zip`,
		zipSync(files, { level: 6 }),
		"application/zip",
	);
}

/** Upserts by id; content JSON from the manifest wins, the .md file is the fallback. */
export async function restoreBackup(file: File) {
	try {
		const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
		const manifest = JSON.parse(strFromU8(files["manifest.json"])) as Manifest;
		if (manifest.app !== "inkwell") throw new Error("not an Inkwell backup");

		const docs: Doc[] = [];
		for (const { file: path, ...doc } of manifest.documents) {
			const md = files[path]
				? parseMarkdownFile(strFromU8(files[path]), doc.title).markdown
				: "";
			const content = doc.content?.length
				? doc.content
				: await markdownToBlocks(md);
			docs.push({ ...doc, content, markdown: md });
		}
		const assets: Asset[] = manifest.assets
			.filter((a) => files[a.file])
			.map(({ file: path, ...a }) => ({
				...a,
				blob: new Blob([files[path] as BlobPart], { type: a.mimeType }),
			}));

		await putDocs(docs);
		await putAssets(assets);
		toast({
			variant: "success",
			message: `Backup restored: ${docs.length} documents`,
		});
	} catch {
		toast({
			variant: "error",
			message: `"${file.name}" is not a valid Inkwell backup.`,
		});
	}
}

export function pickAndRestore() {
	const input = Object.assign(document.createElement("input"), {
		type: "file",
		accept: ".zip,application/zip",
	});
	input.onchange = () => input.files?.[0] && restoreBackup(input.files[0]);
	input.click();
}
