import { useEffect, useState } from "react";
import { Minus, X, Plus } from "lucide-react";

/**
 * Custom window controls for the frameless main window. Designed like Apple's
 * macOS traffic lights (ordered Green, Yellow, Red from left to right as requested).
 * Icons appear dynamically when hovering over the window controls group.
 */
export function WindowControls() {
	const api = typeof window !== "undefined" ? window.electronAPI : undefined;
	const [maximized, setMaximized] = useState(false);

	useEffect(() => {
		if (!api?.onWindowMaximizedChange) return;
		api.isWindowMaximized?.().then(setMaximized).catch(() => {});
		return api.onWindowMaximizedChange(setMaximized);
	}, [api]);

	// Allow rendering in the browser for visual preview during development
	const isBrowser = !api?.closeWindow;

	return (
		<div 
			className="group/traffic flex items-center gap-1.5 ml-1 mr-0.5" 
			style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
		>
			{/* Maximize / Zoom (Green) - Leftmost to match screenshot */}
			<button
				type="button"
				aria-label={maximized ? "Restore" : "Maximize"}
				disabled={isBrowser}
				onClick={() => api?.toggleMaximizeWindow()}
				className="w-3 h-3 rounded-full flex items-center justify-center transition-all active:scale-90 bg-[#28c740] dark:bg-[#28c740]/90 border border-[#20a133]/20 cursor-default shrink-0"
			>
				<Plus 
					className="size-2 text-emerald-950 font-bold opacity-0 group-hover/traffic:opacity-80 transition-opacity duration-150" 
					strokeWidth={3} 
				/>
			</button>

			{/* Minimize (Yellow) - Middle */}
			<button
				type="button"
				aria-label="Minimize"
				disabled={isBrowser}
				onClick={() => api?.minimizeWindow()}
				className="w-3 h-3 rounded-full flex items-center justify-center transition-all active:scale-90 bg-[#febc2e] dark:bg-[#febc2e]/90 border border-[#d29b22]/20 cursor-default shrink-0"
			>
				<Minus 
					className="size-2 text-amber-950 font-bold opacity-0 group-hover/traffic:opacity-80 transition-opacity duration-150" 
					strokeWidth={3} 
				/>
			</button>

			{/* Close (Red) - Rightmost */}
			<button
				type="button"
				aria-label="Close"
				disabled={isBrowser}
				onClick={() => api?.closeWindow()}
				className="w-3 h-3 rounded-full flex items-center justify-center transition-all active:scale-90 bg-[#ff5f57] dark:bg-[#ff5f57]/90 border border-[#d24e47]/20 cursor-default shrink-0"
			>
				<X 
					className="size-2 text-red-950 font-bold opacity-0 group-hover/traffic:opacity-80 transition-opacity duration-150" 
					strokeWidth={3} 
				/>
			</button>
		</div>
	);
}

