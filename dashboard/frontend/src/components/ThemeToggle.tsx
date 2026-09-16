import { Sun, Moon, Monitor } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { cn } from "@/lib/utils";

const options = [
	{ id: "light" as const, icon: Sun, label: "Light" },
	{ id: "dark" as const, icon: Moon, label: "Dark" },
	{ id: "system" as const, icon: Monitor, label: "System" },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
	const { mode, setMode } = useThemeStore();

	if (compact) {
		const active = options.find((o) => o.id === mode) || options[2];
		const Icon = active.icon;
		return (
			<button
				onClick={() => {
					const idx = options.findIndex((o) => o.id === mode);
					setMode(options[(idx + 1) % options.length].id);
				}}
				className="liquid-shell inline-flex items-center justify-center rounded-full p-[2px] transition-opacity hover:opacity-90 active:opacity-75"
				aria-label="Toggle theme"
			>
				<span className="liquid-inner flex size-9 items-center justify-center rounded-full text-[var(--app-ink)]">
					<Icon className="size-4" />
				</span>
			</button>
		);
	}

	return (
		<div className="liquid-shell inline-flex items-center gap-1 rounded-full p-1">
			{options.map((option) => {
				const Icon = option.icon;
				const active = mode === option.id;
				return (
					<button
						key={option.id}
						onClick={() => setMode(option.id)}
						className={cn(
							"flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors",
							active
								? "liquid-inner text-[var(--app-ink)]"
								: "text-[var(--app-muted)] hover:text-[var(--app-ink)]"
						)}
					>
						<Icon className="size-3.5" />
						<span>{option.label}</span>
					</button>
				);
			})}
		</div>
	);
}
