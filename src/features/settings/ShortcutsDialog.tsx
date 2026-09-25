import { ui } from "#/app/state";
import { Dialog } from "#/components/Dialog";
import { altKey, modKey, shiftKey } from "#/lib/utils";

// PRD §11.
const SHORTCUTS: [string, string][] = [
	["Command palette / search", `${modKey}K`],
	["New document", `${modKey}${altKey}N`],
	["Open floating button menu", `${modKey}.`],
	["Move floating button (when focused)", "Alt + ← → ↑ ↓"],
	["Toggle theme", `${modKey}${shiftKey}L`],
	["Export markdown", `${modKey}${shiftKey}E`],
	["Bold / Italic / Code", `${modKey}B / I / E`],
	["Undo / Redo", `${modKey}Z / ${modKey}${shiftKey}Z`],
	["Block commands", "/"],
];

export function ShortcutsDialog() {
	const { shortcuts } = ui.use();
	return (
		<Dialog
			open={shortcuts}
			onClose={() => ui.set((s) => ({ ...s, shortcuts: false }))}
			label="Keyboard shortcuts"
			className="max-w-[440px]"
		>
			<div className="p-5">
				<h2 className="mb-3 font-medium">Keyboard shortcuts</h2>
				<dl className="divide-y divide-border">
					{SHORTCUTS.map(([label, keys]) => (
						<div key={label} className="flex justify-between gap-4 py-2">
							<dt className="text-muted-foreground">{label}</dt>
							<dd>
								<kbd className="font-sans">{keys}</kbd>
							</dd>
						</div>
					))}
				</dl>
			</div>
		</Dialog>
	);
}
