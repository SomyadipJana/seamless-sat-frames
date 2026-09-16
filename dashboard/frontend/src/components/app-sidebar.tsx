import { useState, useEffect, useRef, useMemo } from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { navSections, isActive } from "@/components/app-shared";
import { getStoredProfile } from "./OnboardingPage";
import { User, Settings, Cloud, UserCircle, HelpCircle, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { HelpCenterModal } from "./HelpCenterModal";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Re-render nav on hash navigation so the active item stays in sync. */
function useActiveTick() {
	const [, setTick] = useState(0);
	useEffect(() => {
		const onHash = () => setTick((t) => t + 1);
		window.addEventListener("hashchange", onHash);
		return () => window.removeEventListener("hashchange", onHash);
	}, []);
}

const profileMenuItems = [
	{ label: "Profile", href: "#/profile", icon: UserCircle },
	{ label: "Settings", href: "#/settings", icon: Settings },
	{ label: "Account", href: "#/account", icon: Cloud },
];

export function AppSidebar() {
	useActiveTick();
	const { isMobile, setOpenMobile, open: sidebarOpen } = useSidebar();
	const profile = useMemo(() => getStoredProfile(), []);

	const [menuOpen, setMenuOpen] = useState(false);
	const [helpOpen, setHelpOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		if (!menuOpen) return;
		const handler = (e: MouseEvent) => {
			if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [menuOpen]);

	return (
		<>
			<Sidebar
				collapsible="icon"
				className="border-r-0 border-transparent bg-transparent"
				style={{ "--sidebar-background": "transparent" } as React.CSSProperties}
			>
				<SidebarHeader className="py-6 px-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4">
					<div className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
						<img
							src={`${import.meta.env.BASE_URL}images/icon.png`}
							alt="Trace"
							className="size-9 group-data-[collapsible=icon]:size-8 object-contain rounded-xl shrink-0 invert dark:invert-0"
						/>
						<div className="flex flex-col leading-[1.1] group-data-[collapsible=icon]:hidden">
							<span className="text-lg font-semibold tracking-tight text-[var(--app-ink)]">Trace</span>
						</div>
					</div>
				</SidebarHeader>

				<SidebarContent className="px-4 group-data-[collapsible=icon]:px-2">
					<SidebarGroup className="p-0">
						<SidebarGroupContent>
							<SidebarMenu className="gap-1">
								{navSections.flatMap((section) => section.items).map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											render={<a href={item.path} onClick={() => isMobile && setOpenMobile(false)} />}
											isActive={isActive(item.path)}
											tooltip={item.title}
											className="rounded-xl text-[var(--app-muted)] hover:bg-[var(--app-soft)]/50 dark:hover:bg-white/5 hover:text-[var(--app-ink)] data-[active]:apple-active-item data-[active]:!text-[var(--app-ink)] data-[active]:font-semibold apple-sidebar-item transition-all duration-200 py-2.5 px-3"
										>
											{item.icon}
											<span className="font-medium tracking-tight group-data-[collapsible=icon]:hidden">{item.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter className="pb-6 px-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pb-4">
					<div ref={menuRef} className="relative">
						{/* Expandable popup menu */}
						<AnimatePresence>
							{menuOpen && sidebarOpen && (
								<motion.div
									key="profile-menu"
									initial={{ opacity: 0, y: 8, scale: 0.95 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: 8, scale: 0.95 }}
									transition={{ duration: 0.22, ease: EASE_OUT }}
									className="absolute bottom-full mb-2 left-0 right-0 z-50"
								>
									<div className="liquid-card-shell rounded-2xl p-[2px]">
										<div className="liquid-card-inner rounded-[14px] py-1.5 overflow-hidden">
											{profileMenuItems.map(({ label, href, icon: Icon }) => (
												<a
													key={label}
													href={href}
													onClick={() => { setMenuOpen(false); isMobile && setOpenMobile(false); }}
													className={cn(
														"flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
														isActive(href)
															? "text-[var(--app-ink)] bg-[var(--app-soft)]/60"
															: "text-[var(--app-muted)] hover:text-[var(--app-ink)] hover:bg-[var(--app-soft)]/40"
													)}
												>
													<Icon className="size-4 shrink-0" />
													{label}
												</a>
											))}

											{/* Divider */}
											<div className="border-t border-[var(--app-hairline)] my-1" />

											{/* Help Center */}
											<button
												onClick={() => { setMenuOpen(false); setHelpOpen(true); }}
												className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[var(--app-muted)] hover:text-[var(--app-ink)] hover:bg-[var(--app-soft)]/40 transition-colors"
											>
												<HelpCircle className="size-4 shrink-0" />
												Help Center
											</button>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>

						{/* Profile button */}
						<button
							onClick={() => setMenuOpen((v) => !v)}
							className={cn(
								"liquid-shell group flex items-center gap-3 rounded-xl p-2 transition-all w-full",
								"group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0",
								"group-data-[collapsible=icon]:!bg-none group-data-[collapsible=icon]:!shadow-none",
								"group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto",
								menuOpen && "opacity-90"
							)}
						>
							{/* Avatar */}
							<div className="size-9 group-data-[collapsible=icon]:size-8 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700/60 flex items-center justify-center shrink-0 overflow-hidden">
								{profile.avatar ? (
									<img src={profile.avatar} alt={profile.name} className="size-full object-cover" />
								) : (
									<User className="size-4.5 text-neutral-600 dark:text-neutral-300" />
								)}
							</div>

							{/* Name + email */}
							<div className="flex-1 min-w-0 text-left group-data-[collapsible=icon]:hidden">
								<p className="text-sm font-medium text-[var(--app-ink)] truncate">{profile.name || "Trace User"}</p>
								<p className="text-[11px] text-[var(--app-muted)] truncate">rikk4335@gmail.com</p>
							</div>

							{/* Chevron */}
							<motion.div
								animate={{ rotate: menuOpen ? 180 : 0 }}
								transition={{ duration: 0.2, ease: EASE_OUT }}
								className="shrink-0 group-data-[collapsible=icon]:hidden"
							>
								<ChevronUp className="size-4 text-[var(--app-muted)]" />
							</motion.div>
						</button>
					</div>
				</SidebarFooter>
			</Sidebar>

			{/* Help Center floating modal — rendered outside the sidebar so it overlays the full app */}
			<HelpCenterModal open={helpOpen} onClose={() => setHelpOpen(false)} />
		</>
	);
}
