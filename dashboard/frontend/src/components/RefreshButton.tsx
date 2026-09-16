import { RefreshCw } from "lucide-react";
import { useRefresh } from "@/hooks/useMetrics";
import { cn } from "@/lib/utils";

export function RefreshButton({
	className,
}: {
	className?: string;
	/** Retained for call-site compatibility; styling is now liquid glass. */
	variant?: "dark" | "light" | "outline";
}) {
	const { mutate, isPending } = useRefresh();

	return (
		<button
			onClick={() => mutate()}
			disabled={isPending}
			aria-label="Refresh"
			className={cn(
				"liquid-shell inline-flex items-center justify-center rounded-full p-[2px] transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed",
				className,
			)}
		>
			<span className="liquid-inner flex size-9 items-center justify-center rounded-full text-[var(--app-ink)]">
				<RefreshCw className={cn("size-4", isPending && "animate-spin")} />
			</span>
		</button>
	);
}
