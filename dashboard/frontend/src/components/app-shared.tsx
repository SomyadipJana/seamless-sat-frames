import type { ReactNode } from "react";
import { LayoutDashboard, BarChart3, Layers, Sparkles } from "lucide-react";

export type NavItem = {
	title: string;
	path: string;
	icon: ReactNode;
};

export type NavSection = {
	label: string;
	items: NavItem[];
};

export function getHash() {
	return window.location.hash.replace("#", "").replace(/^\/+/, "") || "home";
}

export function isActive(path: string) {
	const hash = getHash();
	const target = path.replace("#/", "");
	if (target === "home") return hash === "home" || hash === "dashboard";
	if (target === "details") return hash === "details" || hash === "analysis";
	if (target === "providers") return hash === "providers";
	if (target === "customize") return hash === "customize";
	if (target === "settings") return hash === "settings";
	if (target === "profile") return hash === "profile";
	return hash === target;
}

export const navSections: NavSection[] = [
	{
		label: "OVERVIEW",
		items: [{ title: "Dashboard", path: "#/home", icon: <LayoutDashboard className="size-[18px]" /> }],
	},
	{
		label: "ANALYSIS",
		items: [
			{ title: "Details", path: "#/details", icon: <BarChart3 className="size-[18px]" /> },
			{ title: "Providers", path: "#/providers", icon: <Layers className="size-[18px]" /> },
		],
	},
	{
		label: "PERSONAL",
		items: [
			{ title: "Customize", path: "#/customize", icon: <Sparkles className="size-[18px]" /> },
		],
	},
];
