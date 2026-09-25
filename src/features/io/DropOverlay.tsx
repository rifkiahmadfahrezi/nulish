import { useEffect, useState } from "react";
import { importFiles } from "./io";

const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files");

/** 5.12: drop .md files anywhere on the window to import (FR-41). */
export function DropOverlay() {
	const [active, setActive] = useState(false);

	useEffect(() => {
		let depth = 0;
		const enter = (e: DragEvent) => {
			if (!hasFiles(e)) return;
			depth++;
			setActive(true);
		};
		const leave = (e: DragEvent) => {
			if (!hasFiles(e)) return;
			depth = Math.max(0, depth - 1);
			if (!depth) setActive(false);
		};
		const over = (e: DragEvent) => {
			if (hasFiles(e)) e.preventDefault();
		};
		const drop = (e: DragEvent) => {
			if (!hasFiles(e)) return;
			// Let images dropped into the editor go to BlockNote's own upload handling.
			const inEditor = (e.target as Element | null)?.closest?.(".bn-editor");
			const files = [...(e.dataTransfer?.files ?? [])];
			depth = 0;
			setActive(false);
			if (inEditor && files.every((f) => f.type.startsWith("image/"))) return;
			e.preventDefault();
			e.stopPropagation();
			importFiles(files);
		};
		window.addEventListener("dragenter", enter);
		window.addEventListener("dragleave", leave);
		window.addEventListener("dragover", over);
		window.addEventListener("drop", drop, true);
		return () => {
			window.removeEventListener("dragenter", enter);
			window.removeEventListener("dragleave", leave);
			window.removeEventListener("dragover", over);
			window.removeEventListener("drop", drop, true);
		};
	}, []);

	if (!active) return null;
	return (
		<div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-background/90">
			<div className="rounded-lg border-2 border-dashed border-primary px-10 py-8 text-muted-foreground">
				Drop .md files to import
			</div>
		</div>
	);
}
