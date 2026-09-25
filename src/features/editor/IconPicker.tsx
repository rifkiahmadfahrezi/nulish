import { SmilePlus } from "lucide-react";
import { useId, useRef } from "react";

// FR-08. ponytail: fixed emoji set; paste any emoji into the input for others.
const EMOJI =
	"📝 📄 📌 💡 ✅ 📚 🧠 🎯 🚀 🔥 ⭐ ❤️ 🌱 🌊 ☕ 🍳 🎨 🎵 🎮 📷 ✈️ 🏠 💼 💰 📈 🛠️ 🧪 🐛 🔒 📦 🗂️ 📅 ✍️ 🗒️ 💬 🤝 🎉 🧭 🌙 ☀️".split(
		" ",
	);

export function IconPicker({
	icon,
	onChange,
}: {
	icon?: string;
	onChange: (icon: string | undefined) => void;
}) {
	const id = useId();
	const popRef = useRef<HTMLDivElement>(null);
	const btnRef = useRef<HTMLButtonElement>(null);

	const choose = (value: string | undefined) => {
		onChange(value);
		popRef.current?.hidePopover();
	};

	return (
		<>
			<button
				ref={btnRef}
				type="button"
				popoverTarget={id}
				aria-label={icon ? "Change icon" : "Add icon"}
				className={
					icon
						? "mb-2 -ml-1 rounded-md px-1 text-[56px] leading-none hover:bg-surface-hover"
						: "mb-2 flex h-7 items-center gap-1.5 rounded-sm px-1.5 text-sm text-faint opacity-0 transition-opacity hover:bg-surface-hover hover:text-muted-foreground focus-visible:opacity-100 group-hover/title:opacity-100 pointer-coarse:opacity-100"
				}
			>
				{icon ?? (
					<>
						<SmilePlus size={16} strokeWidth={1.5} /> Add icon
					</>
				)}
			</button>
			<div
				ref={popRef}
				id={id}
				popover="auto"
				onToggle={(e) => {
					if (e.newState !== "open" || !btnRef.current || !popRef.current)
						return;
					const r = btnRef.current.getBoundingClientRect();
					popRef.current.style.top = `${r.bottom + 6}px`;
					popRef.current.style.left = `${Math.min(r.left, innerWidth - 300)}px`;
				}}
				className="fixed m-0 w-72 rounded-lg border border-border bg-surface p-2 text-text shadow-float"
			>
				<div className="grid grid-cols-8 gap-0.5">
					{EMOJI.map((e) => (
						<button
							key={e}
							type="button"
							onClick={() => choose(e)}
							className="rounded-sm p-1 text-xl hover:bg-surface-hover"
						>
							{e}
						</button>
					))}
				</div>
				<div className="mt-2 flex gap-2 border-t border-border pt-2">
					<input
						placeholder="Other emoji…"
						maxLength={8}
						className="h-8 min-w-0 flex-1 rounded-sm border border-border bg-transparent px-2 text-sm outline-none focus:border-primary"
						onKeyDown={(e) => {
							if (e.key === "Enter" && e.currentTarget.value.trim())
								choose(e.currentTarget.value.trim());
						}}
					/>
					{icon && (
						<button
							type="button"
							onClick={() => choose(undefined)}
							className="rounded-sm px-2 text-sm text-danger hover:bg-surface-hover"
						>
							Remove
						</button>
					)}
				</div>
			</div>
		</>
	);
}
