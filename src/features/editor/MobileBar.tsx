import { SuggestionMenu } from "@blocknote/core/extensions";
import {
	Bold,
	Heading,
	Italic,
	List,
	ListChecks,
	Slash,
	Sparkles,
	Undo2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { keyboardOpen, openPanel } from "#/app/state";
import { t } from "#/lib/i18n";
import type { Editor } from "./schema";

/** FR-59b: formatting bar docked above the on-screen keyboard; replaces the FAB while typing on mobile. */
export function MobileBar({ editor }: { editor: Editor }) {
	const open = keyboardOpen.use();
	const [bottom, setBottom] = useState(0);

	useEffect(() => {
		const vv = window.visualViewport;
		if (!vv || !matchMedia("(pointer: coarse)").matches) return;
		const update = () => {
			const hidden = innerHeight - vv.height - vv.offsetTop;
			keyboardOpen.set(hidden > 120);
			setBottom(Math.max(0, hidden));
		};
		vv.addEventListener("resize", update);
		vv.addEventListener("scroll", update);
		return () => {
			vv.removeEventListener("resize", update);
			vv.removeEventListener("scroll", update);
			keyboardOpen.set(false);
		};
	}, []);

	if (!open) return null;

	const block = () => editor.getTextCursorPosition().block;
	const toggleType = (type: "heading" | "bulletListItem" | "checkListItem") =>
		editor.updateBlock(block(), {
			type: block().type === type ? "paragraph" : type,
		} as never);

	const actions = [
		{
			label: t("mobile.commands"),
			icon: Slash,
			run: () => editor.getExtension(SuggestionMenu)?.openSuggestionMenu("/"),
		},
		{
			label: t("mobile.heading"),
			icon: Heading,
			run: () => toggleType("heading"),
		},
		{
			label: t("mobile.bold"),
			icon: Bold,
			run: () => editor.toggleStyles({ bold: true }),
		},
		{
			label: t("mobile.italic"),
			icon: Italic,
			run: () => editor.toggleStyles({ italic: true }),
		},
		{
			label: t("mobile.bulletList"),
			icon: List,
			run: () => toggleType("bulletListItem"),
		},
		{
			label: t("mobile.todo"),
			icon: ListChecks,
			run: () => toggleType("checkListItem"),
		},
		{ label: t("common.undo"), icon: Undo2, run: () => editor.undo() },
		{ label: t("fab.open"), icon: Sparkles, run: () => openPanel("menu") },
	];

	return (
		<div
			role="toolbar"
			aria-label={t("mobile.formatting")}
			style={{ bottom }}
			className="fixed inset-x-0 z-40 flex h-11 items-center justify-around border-t border-border bg-surface px-1"
		>
			{actions.map(({ label, icon: Icon, run }) => (
				<button
					key={label}
					type="button"
					aria-label={label}
					// Keep the editor focused (and the keyboard up).
					onPointerDown={(e) => e.preventDefault()}
					onClick={run}
					className="grid size-10 place-items-center rounded-sm text-muted-foreground active:bg-surface-hover"
				>
					<Icon size={18} strokeWidth={1.5} />
				</button>
			))}
		</div>
	);
}
