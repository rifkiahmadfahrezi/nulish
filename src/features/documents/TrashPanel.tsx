import { RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { openDoc } from "#/app/state";
import {
	deleteForever,
	emptyTrash,
	restoreDoc,
	useTrashedDocs,
} from "#/db/documents";
import { docTitle, timeAgo } from "#/lib/utils";
import { IconBtn, PanelHeader } from "./PagesPanel";

const ICON = { size: 16, strokeWidth: 1.5 } as const;

/** 5.10 / FR-06: soft-deleted docs; restore or delete forever. */
export function TrashPanel() {
	const docs = useTrashedDocs();
	const [filter, setFilter] = useState("");
	const q = filter.trim().toLowerCase();
	const list = (docs ?? []).filter(
		(d) => !q || docTitle(d.title).toLowerCase().includes(q),
	);

	return (
		<div className="flex min-h-0 flex-col">
			<PanelHeader title="Trash" />
			<div className="px-2 pb-2">
				<input
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					placeholder="Filter trash…"
					aria-label="Filter trash"
					className="h-8 w-full rounded-md border border-border bg-transparent px-2.5 outline-none placeholder:text-faint focus:border-primary"
				/>
			</div>
			<ul className="min-h-0 overflow-y-auto border-t border-border p-1.5">
				{docs && !docs.length && (
					<li className="px-2.5 py-6 text-center text-muted-foreground">
						Trash is empty.
					</li>
				)}
				{list.map((d) => (
					<li
						key={d.id}
						className="flex items-center gap-1 rounded-md px-2.5 py-1.5 hover:bg-surface-hover"
					>
						<span className="w-4 text-center">{d.icon ?? "📄"}</span>
						<div className="min-w-0 flex-1">
							<p className="truncate">{docTitle(d.title)}</p>
							<p className="text-xs text-faint">
								Deleted {timeAgo(d.deletedAt ?? 0)}
							</p>
						</div>
						<IconBtn
							label="Restore"
							icon={<RotateCcw {...ICON} />}
							onClick={() => restoreDoc(d.id).then(() => openDoc(d.id))}
						/>
						<IconBtn
							label="Delete forever"
							icon={<Trash2 {...ICON} />}
							className="hover:text-danger"
							onClick={() => {
								if (
									confirm(
										`Delete "${docTitle(d.title)}" forever? This cannot be undone.`,
									)
								)
									deleteForever([d.id]);
							}}
						/>
					</li>
				))}
			</ul>
			<div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-faint">
				<span>Deleted automatically after 30 days</span>
				{!!docs?.length && (
					<button
						type="button"
						className="text-danger hover:underline"
						onClick={() => {
							if (
								confirm(`Delete ${docs.length} document(s) in Trash forever?`)
							)
								emptyTrash();
						}}
					>
						Empty trash
					</button>
				)}
			</div>
		</div>
	);
}
