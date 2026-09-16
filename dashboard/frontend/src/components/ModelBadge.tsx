import { useState } from "react";
import { getModelArt, modelMonogram } from "@/lib/modelArt";
import { extractModelName } from "@/lib/modelName";

interface ModelBadgeProps {
	model: string | null | undefined;
	source?: string | null;
	size?: "sm" | "md" | "lg";
	/** Show the model name next to the badge. */
	showLabel?: boolean;
	className?: string;
}

const sizeMap = {
	sm: { box: "size-6", pad: "p-1", text: "text-[8px]" },
	md: { box: "size-8", pad: "p-1.5", text: "text-[10px]" },
	lg: { box: "size-10", pad: "p-2", text: "text-xs" },
};

/** A bordered, rounded brand-art badge shown in front of a model name. */
export function ModelBadge({ model, source, size = "md", showLabel = false, className }: ModelBadgeProps) {
	const [failed, setFailed] = useState(false);
	const art = getModelArt(model, source);
	const s = sizeMap[size];
	const name = extractModelName(model);

	const badge =
		art.src && !failed ? (
			<img
				src={art.src}
				alt={art.family}
				className={`${s.box} rounded-md object-cover shrink-0`}
				onError={() => setFailed(true)}
				loading="lazy"
			/>
		) : (
			<span
				className={`${s.box} ${s.text} shrink-0 inline-flex items-center justify-center rounded-md font-semibold text-[#fffbf7] uppercase`}
				style={{ backgroundColor: art.accent }}
			>
				{modelMonogram(model)}
			</span>
		);

	if (!showLabel) return <span className={className}>{badge}</span>;

	return (
		<span className={`inline-flex items-center gap-2 min-w-0 ${className ?? ""}`}>
			{badge}
			<span className="truncate font-medium text-[var(--app-ink)]">{name}</span>
		</span>
	);
}
