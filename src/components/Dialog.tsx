import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "#/lib/utils";

/** Native modal <dialog>: focus trap, Esc, top layer and inert background for free. */
export function Dialog({
	open,
	onClose,
	label,
	className,
	children,
}: {
	open: boolean;
	onClose: () => void;
	label: string;
	className?: string;
	children: ReactNode;
}) {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const d = ref.current;
		if (!d) return;
		if (open && !d.open) {
			d.showModal();
			// React's autoFocus runs before showModal, which then steals focus; refocus the first field.
			d.querySelector<HTMLElement>("input, [data-autofocus]")?.focus();
		}
		if (!open && d.open) d.close();
	}, [open]);

	return (
		<dialog
			ref={ref}
			aria-label={label}
			onClose={onClose}
			onCancel={(e) => {
				e.preventDefault();
				onClose();
			}}
			// Click on the backdrop (the dialog element itself, outside its content box) closes it.
			onPointerDown={(e) => e.target === e.currentTarget && onClose()}
			className={cn(
				"fixed m-auto max-h-[85dvh] w-[calc(100%-32px)] overflow-hidden rounded-lg border border-border bg-surface p-0 text-sm text-text shadow-float-lg backdrop:bg-scrim",
				"open:fade-in open:slide-in-from-bottom-2 open:animate-in open:backdrop:fade-in open:backdrop:animate-in",
				className,
			)}
		>
			{open && children}
		</dialog>
	);
}
