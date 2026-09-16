import { useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useThemeStore } from "@/stores/themeStore";
import { WindowControls } from "./WindowControls";
import { UpdateBanner } from "./UpdateBanner";
import { OfflineBanner } from "./OfflineBanner";
import { useServerStatus } from "@/hooks/useServerStatus";

const ACCENT_GLOWS: Record<string, string> = {
	none: "from-transparent to-transparent opacity-0",
	ink: "from-neutral-500/[0.5] to-transparent dark:from-neutral-500/50 dark:to-transparent",
	rose: "from-rose-500/[0.5] to-transparent dark:from-rose-500/50 dark:to-transparent",
	sky: "from-sky-500/[0.5] to-transparent dark:from-sky-500/50 dark:to-transparent",
	emerald: "from-emerald-500/[0.5] to-transparent dark:from-emerald-500/50 dark:to-transparent",
	violet: "from-violet-500/[0.5] to-transparent dark:from-violet-500/50 dark:to-transparent",
	amber: "from-amber-500/[0.5] to-transparent dark:from-amber-500/50 dark:to-transparent",
	slate: "from-slate-500/[0.5] to-transparent dark:from-slate-500/50 dark:to-transparent",
	ocean: "from-cyan-500/[0.5] to-transparent dark:from-cyan-500/50 dark:to-transparent",
};

export function AppShell({ children }: { children: React.ReactNode }) {
	const initTheme = useThemeStore((s) => s.init);
	const accent = useThemeStore((s) => s.accent) || "ink";
	const gradientClass = ACCENT_GLOWS[accent] || ACCENT_GLOWS.ink;

	useEffect(() => {
		initTheme();
	}, [initTheme]);

	useServerStatus();

	return (
		<SidebarProvider className="bg-gray-50 dark:bg-[#060608] text-[var(--app-ink)] antialiased h-svh overflow-hidden">
			<AppSidebar />
			<SidebarInset className="apple-inset relative flex-1 flex flex-col min-h-0 no-scrollbar">
				{/* Ambient accent backdrop tone */}
				<div className={`absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t ${gradientClass} pointer-events-none z-0`} />

				{/* Fine noise texture overlay */}
				<div className="absolute inset-0 bg-noise opacity-[0.015] dark:opacity-[0.025] pointer-events-none z-0 mix-blend-overlay" />

				{/* Custom title bar — draggable region with window chrome */}
				<header
					id="app-headbar"
					className="app-headbar sticky top-0 z-30 flex h-12 items-center justify-between gap-2 bg-transparent px-3 sm:px-4"
					style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
				>
					<div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
						<SidebarTrigger className="text-[var(--app-muted)] hover:text-[var(--app-ink)] h-8 w-8 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-white/5" />
					</div>
					<div className="flex items-center gap-2.5" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
						<WindowControls />
					</div>
				</header>
				<UpdateBanner />
				<OfflineBanner />
				<div className="flex-1 min-h-0 relative z-10 overflow-hidden flex flex-col">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
