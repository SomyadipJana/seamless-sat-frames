import { useState } from "react";
import type { ProviderInfo } from "@/hooks/useMetrics";

interface ProviderLogoProps {
	provider: ProviderInfo;
	size?: "sm" | "md" | "lg";
}

const sizeClasses = {
	sm: { box: "size-6 text-[8px]", pad: "" },
	md: { box: "size-8 text-[10px]", pad: "" },
	lg: { box: "size-10 text-xs", pad: "" },
};

function resolveLogoUrl(url: string | null): string | null {
	if (!url) return null;
	// Server returns app-relative paths like /logos/foo.png — rebase them so
	// they resolve correctly under Electron's file:// origin.
	if (url.startsWith("/")) return `${import.meta.env.BASE_URL}${url.slice(1)}`;
	return url;
}

export function ProviderLogo({ provider, size = "md" }: ProviderLogoProps) {
	const [failed, setFailed] = useState(false);
	const s = sizeClasses[size];
	const logoSrc = resolveLogoUrl(provider.logo_url);

	if (logoSrc && !failed) {
		return (
			<img
				src={logoSrc}
				alt={provider.name}
				className={`${s.box} rounded-md object-cover shrink-0`}
				onError={() => setFailed(true)}
				loading="lazy"
			/>
		);
	}

	return (
		<div
			className={`${s.box} shrink-0 rounded-md bg-[#171717] flex items-center justify-center font-semibold text-[#fffbf7] uppercase`}
		>
			{provider.name.slice(0, 2)}
		</div>
	);
}
