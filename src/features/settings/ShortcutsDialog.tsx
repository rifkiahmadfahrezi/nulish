import { ui } from "#/app/state";
import { Dialog } from "#/components/Dialog";
import { type MessageKey, t } from "#/lib/i18n";
import { altKey, modKey, shiftKey } from "#/lib/utils";

// PRD §11.
const SHORTCUTS: [MessageKey, string][] = [
	["shortcuts.palette", `${modKey}K`],
	["shortcuts.newDoc", `${modKey}${altKey}N`],
	["shortcuts.openMenu", `${modKey}.`],
	["shortcuts.moveFab", "Alt + ← → ↑ ↓"],
	["shortcuts.toggleTheme", `${modKey}${shiftKey}L`],
	["shortcuts.export", `${modKey}${shiftKey}E`],
	["shortcuts.format", `${modKey}B / I / E`],
	["shortcuts.undo", `${modKey}Z / ${modKey}${shiftKey}Z`],
	["shortcuts.blockCommands", "/"],
];

export function ShortcutsDialog() {
	const { shortcuts } = ui.use();
	return (
		<Dialog
			open={shortcuts}
			onClose={() => ui.set((s) => ({ ...s, shortcuts: false }))}
			label={t("common.keyboardShortcuts")}
			className="max-w-[440px]"
		>
			<div className="p-5">
				<h2 className="mb-3 font-medium">{t("common.keyboardShortcuts")}</h2>
				<dl className="divide-y divide-border">
					{SHORTCUTS.map(([label, keys]) => (
						<div key={label} className="flex justify-between gap-4 py-2">
							<dt className="text-muted-foreground">{t(label)}</dt>
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
