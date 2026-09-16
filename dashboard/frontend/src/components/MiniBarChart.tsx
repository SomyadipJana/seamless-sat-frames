export function MiniBarChart({ data, height = 120 }: { data: number[]; height?: number }) {
	if (data.length === 0) {
		return <div className="w-full rounded-md bg-[var(--app-hairline)]/50" style={{ height }} />;
	}

	const max = Math.max(...data, 1);

	return (
		<div className="w-full flex items-end justify-between" style={{ height }}>
			{data.map((val, i) => {
				const isZero = val === 0;
				const pct = isZero ? 0 : (val / max) * 100;
				const heightStyle = isZero ? "4px" : `${Math.max(4, pct)}%`;
				const barClass = isZero
					? "flex-1 max-w-[5px] bg-hairline rounded-t-[1px]"
					: "flex-1 max-w-[5px] bg-ink/80 rounded-t-[1px] transition-all hover:bg-ink";

				return (
					<div
						key={i}
						className={barClass}
						style={{ height: heightStyle }}
						title={val.toLocaleString()}
					/>
				);
			})}
		</div>
	);
}
