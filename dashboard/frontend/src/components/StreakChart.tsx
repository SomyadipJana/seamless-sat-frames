import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useStreak } from "@/hooks/useMetrics";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getLevel(count: number, max: number): number {
	if (count === 0) return 0;
	if (max === 0) return 1;
	const ratio = count / max;
	if (ratio <= 0.25) return 1;
	if (ratio <= 0.5) return 2;
	if (ratio <= 0.75) return 3;
	return 4;
}

function formatDateLabel(dateStr: string): string {
	const d = new Date(dateStr + "T00:00:00");
	return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

export function StreakChart() {
	const [months, setMonths] = useState(12);
	const { data, isLoading } = useStreak(months);

	const { weeks, monthLabels, totalWeeks, maxCount, streak } = useMemo(() => {
		if (!data) {
			return { weeks: [], monthLabels: [], totalWeeks: 0, maxCount: 1, streak: { current: 0, longest: 0 } };
		}

		const days = data.days;
		const startDate = new Date(days[0].date + "T00:00:00");
		const startWeekday = startDate.getDay();
		const totalCells = days.length + startWeekday;
		const totalWeeks = Math.ceil(totalCells / 7);

		const weeks: { date: string; count: number }[][] = [];
		let dayIndex = 0;
		for (let w = 0; w < totalWeeks; w++) {
			const week: { date: string; count: number }[] = [];
			for (let d = 0; d < 7; d++) {
				if (w === 0 && d < startWeekday) {
					week.push({ date: "", count: -1 });
				} else if (dayIndex < days.length) {
					week.push(days[dayIndex]);
					dayIndex++;
				} else {
					week.push({ date: "", count: -1 });
				}
			}
			weeks.push(week);
		}

		const monthLabels: { week: number; label: string }[] = [];
		let lastMonth = -1;
		weeks.forEach((week, idx) => {
			const firstDay = week.find((c) => c.count >= 0);
			if (firstDay) {
				const d = new Date(firstDay.date + "T00:00:00");
				if (d.getMonth() !== lastMonth) {
					monthLabels.push({ week: idx, label: MONTH_NAMES[d.getMonth()] });
					lastMonth = d.getMonth();
				}
			}
		});

		let current = 0;
		let longest = 0;
		let running = 0;
		const reversed = [...days].reverse();
		for (let i = 0; i < reversed.length; i++) {
			if (reversed[i].count > 0) {
				running++;
				if (i === current) current++;
			} else {
				longest = Math.max(longest, running);
				running = 0;
				if (i === 0) break;
			}
		}
		longest = Math.max(longest, running);

		return { weeks, monthLabels, totalWeeks, maxCount: data.max_count, streak: { current, longest } };
	}, [data]);

	if (isLoading) {
		return (
			<div className="bg-[var(--app-soft)] rounded-[14px] p-4 sm:p-6">
				<p className="text-sm text-[var(--app-muted)]">Loading streak data...</p>
			</div>
		);
	}

	const levelClasses = [
		"bg-hairline",
		"bg-ink/20",
		"bg-ink/40",
		"bg-ink/65",
		"bg-ink",
	];

	return (
		<div>
			<div className="flex items-start justify-between mb-4 sm:mb-6">
				<div>
					<h2 className="text-base sm:text-lg font-semibold text-[var(--app-ink)]">
						{streak.current > 0 ? `${streak.current} day streak` : "No active streak"}
					</h2>
					<p className="text-xs sm:text-sm text-[var(--app-muted)] mt-0.5">
						Longest streak: {streak.longest} day{streak.longest !== 1 ? "s" : ""}
					</p>
				</div>
				<div className="flex items-center gap-0.5 sm:gap-1">
					<button
						onClick={() => setMonths((m) => Math.max(1, m - 1))}
						className="p-1 rounded-md hover:bg-[var(--app-hairline)] text-[var(--app-ink)] transition-colors"
					>
						<ChevronLeft className="size-4" />
					</button>
					<span className="text-xs font-medium text-[var(--app-muted)] w-10 text-center">{months}m</span>
					<button
						onClick={() => setMonths((m) => Math.min(12, m + 1))}
						className="p-1 rounded-md hover:bg-[var(--app-hairline)] text-[var(--app-ink)] transition-colors"
					>
						<ChevronRight className="size-4" />
					</button>
				</div>
			</div>

			{/* Scrollable calendar wrapper to prevent overflow */}
			<div className="overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
				<div className="min-w-max">
					{/* Month labels - proportional flex */}
					<div className="flex gap-0.5 sm:gap-1 mb-1 pl-5 sm:pl-6">
						{monthLabels.map((m, i) => {
							const nextWeek = monthLabels[i + 1]?.week ?? totalWeeks;
							const span = Math.max(1, nextWeek - m.week);
							return (
								<div
									key={i}
									className="text-[8px] sm:text-[10px] font-medium text-[var(--app-muted)] uppercase tracking-wide truncate"
									style={{ flex: span }}
								>
									{m.label}
								</div>
							);
						})}
					</div>

					{/* Calendar grid */}
					<div className="flex gap-0.5 sm:gap-1">
						{/* Day labels */}
						<div className="flex flex-col gap-0.5 sm:gap-1 mr-1 sm:mr-2">
							{DAY_NAMES.map((d) => (
								<div key={d} className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 flex items-center justify-center">
									<span className="text-[7px] sm:text-[8px] text-[var(--app-muted)]">{d.slice(0, 1)}</span>
								</div>
							))}
						</div>

						{/* Weeks */}
						<div className="flex gap-0.5 sm:gap-1">
							{weeks.map((week, wi) => (
								<div key={wi} className="flex flex-col gap-0.5 sm:gap-1">
									{week.map((cell, di) => {
										if (cell.count < 0) {
											return <div key={di} className="size-2 sm:size-2.5 md:size-3 rounded-[2px] sm:rounded-[3px]" />;
										}
										return (
											<div
												key={di}
												title={`${formatDateLabel(cell.date)} · ${cell.count} requests`}
												className={`size-2 sm:size-2.5 md:size-3 rounded-[2px] sm:rounded-[3px] ${levelClasses[getLevel(cell.count, maxCount)]} transition-colors`}
											/>
										);
									})}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Legend */}
			<div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 justify-end">
				<span className="text-[8px] sm:text-[10px] text-[var(--app-muted)]">Less</span>
				{levelClasses.map((cls, i) => (
					<div key={i} className={`size-2 sm:size-2.5 md:size-3 rounded-[2px] sm:rounded-[3px] ${cls}`} />
				))}
				<span className="text-[8px] sm:text-[10px] text-[var(--app-muted)]">More</span>
			</div>
		</div>
	);
}
