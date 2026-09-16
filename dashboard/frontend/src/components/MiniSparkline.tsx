import { useMemo } from "react";

export function MiniSparkline({ data, width = 200, height = 32 }: { data: number[]; width?: number; height?: number }) {
	const path = useMemo(() => {
		if (data.length < 2) return "";
		const max = Math.max(...data, 1);
		const min = Math.min(...data, 0);
		const range = max - min || 1;
		const stepX = width / (data.length - 1);
		return data
			.map((val, i) => {
				const x = i * stepX;
				const y = height - ((val - min) / range) * height;
				return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
			})
			.join(" ");
	}, [data, width, height]);

	if (data.length < 2) {
		return <div className="h-8 w-full rounded-md bg-[var(--app-hairline)]/50" />;
	}

	return (
		<svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
			<path d={path} fill="none" stroke="var(--app-ink)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
		</svg>
	);
}
