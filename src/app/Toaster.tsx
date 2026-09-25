import { X } from "lucide-react";
import { useSetting } from "#/db/settings";
import { cn } from "#/lib/utils";
import { dismissToast, toasts } from "./state";

/** FR-59c: toasts sit on the side opposite the FAB. */
export function Toaster() {
	const list = toasts.use();
	const { side } = useSetting("fabPosition");

	return (
		<section
			aria-live="polite"
			aria-label="Notifications"
			className={cn(
				"pointer-events-none fixed bottom-5 z-[60] flex w-[min(360px,calc(100%-40px))] flex-col gap-2",
				side === "right" ? "left-5" : "right-5",
			)}
		>
			{list.map((t) => (
				<div
					key={t.id}
					role={t.variant === "error" ? "alert" : "status"}
					className={cn(
						"fade-in slide-in-from-bottom-2 animate-in pointer-events-auto flex items-center gap-3 rounded-lg border border-border bg-surface py-2.5 pr-2 pl-3.5 text-sm text-text shadow-float",
						t.variant === "error" && "border-danger/40",
					)}
				>
					{t.variant && t.variant !== "info" && (
						<span
							className={cn(
								"size-1.5 shrink-0 rounded-full",
								t.variant === "error" ? "bg-danger" : "bg-success",
							)}
						/>
					)}
					<p className="flex-1">{t.message}</p>
					{t.action && (
						<button
							type="button"
							onClick={() => {
								t.action?.run();
								dismissToast(t.id);
							}}
							className="shrink-0 rounded-sm px-2 py-1 font-medium text-primary hover:bg-surface-hover"
						>
							{t.action.label}
						</button>
					)}
					<button
						type="button"
						aria-label="Dismiss notification"
						onClick={() => dismissToast(t.id)}
						className="grid size-6 shrink-0 place-items-center rounded-sm text-faint hover:bg-surface-hover"
					>
						<X size={14} />
					</button>
				</div>
			))}
		</section>
	);
}
