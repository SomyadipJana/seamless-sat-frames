/// <reference types="vite/client" />
import type React from "react";

const B = import.meta.env.BASE_URL;

export const LogoIcon = (props: React.ComponentProps<"img">) => (
	<img
		src={`${B}images/icon.png`}
		alt="Trace"
		className="size-8 object-contain"
		{...props}
	/>
);

export const Logo = (props: React.ComponentProps<"img">) => (
	<img
		src={`${B}images/banner.png`}
		alt="Satellite"
		className="h-10 object-contain"
		{...props}
	/>
);
