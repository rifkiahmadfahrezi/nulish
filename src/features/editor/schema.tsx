import { codeBlockOptions } from "@blocknote/code-block";
import {
	BlockNoteEditor,
	BlockNoteSchema,
	createCodeBlockSpec,
	defaultBlockSpecs,
} from "@blocknote/core";
import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import {
	createReactBlockSpec,
	type DefaultReactSuggestionItem,
} from "@blocknote/react";
import { Lightbulb } from "lucide-react";

// FR-11: Callout — emoji + inline text on a tinted surface. Exports to markdown as a quote.
const createCallout = createReactBlockSpec(
	{
		type: "callout",
		propSchema: { emoji: { default: "💡" } },
		content: "inline",
	},
	{
		render: ({ block, contentRef }) => (
			<div className="my-1 flex w-full gap-3 rounded-md bg-surface-hover px-4 py-3">
				<span contentEditable={false} className="select-none">
					{block.props.emoji}
				</span>
				<div ref={contentRef} className="min-w-0 flex-1" />
			</div>
		),
		toExternalHTML: ({ block, contentRef }) => (
			<blockquote>
				{block.props.emoji} <span ref={contentRef} />
			</blockquote>
		),
	},
);

export const schema = BlockNoteSchema.create({
	blockSpecs: {
		...defaultBlockSpecs,
		// FR-15: syntax highlighting + language picker (Shiki, languages lazy-loaded).
		codeBlock: createCodeBlockSpec(codeBlockOptions),
		callout: createCallout(),
	},
});

export type Editor = BlockNoteEditor<
	typeof schema.blockSchema,
	typeof schema.inlineContentSchema,
	typeof schema.styleSchema
>;

export const calloutSlashItem = (
	editor: Editor,
): DefaultReactSuggestionItem => ({
	title: "Callout",
	subtext: "Highlighted box with an emoji",
	aliases: ["callout", "note", "info", "tip"],
	group: "Basic blocks",
	icon: <Lightbulb size={18} />,
	onItemClick: () =>
		insertOrUpdateBlockForSlashMenu(editor, { type: "callout" }),
});

// Headless editor for markdown ⇄ blocks outside the mounted editor (import, backup, export).
let converter: Editor | undefined;
function getConverter() {
	converter ??= BlockNoteEditor.create({ schema }) as unknown as Editor;
	return converter;
}

export function markdownToBlocks(markdown: string) {
	return getConverter().tryParseMarkdownToBlocks(markdown);
}

export function blocksToMarkdown(blocks: unknown[]) {
	return getConverter().blocksToMarkdownLossy(
		blocks as Parameters<Editor["blocksToMarkdownLossy"]>[0],
	);
}
