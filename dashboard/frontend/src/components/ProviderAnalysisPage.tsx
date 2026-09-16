import { useDashboardStore } from "@/stores/dashboardStore";
import { useMetrics, useProviders, useSessions, useTrends } from "@/hooks/useMetrics";
import { cn } from "@/lib/utils";
import { ProviderLogo } from "./ProviderLogo";
import { motion } from "motion/react";
import { ProviderBarChart } from "./ProviderBarChart";
import { RefreshButton } from "./RefreshButton";
import { LiquidCard } from "@/components/ui/LiquidCard";
import { getProviderColor } from "@/lib/colors";

export function ProviderAnalysisPage() {
	const { timeRange, setTimeRange } = useDashboardStore();
	const { data: metrics } = useMetrics(timeRange);
	const { data: providers } = useProviders();
	const { data: providerSessions } = useSessions(timeRange, "providers");
	const { data: trends } = useTrends(timeRange, false);

	const detectedProviders = providers?.filter((p) => p.installed) || [];

	const chartData =
		providerSessions?.map((s) => ({
			name: s.source.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
			source: s.source,
			tokens: s.input_tokens + s.output_tokens,
			cost: s.cost,
			requests: s.request_count,
		})) || [];

	const trendsBySource =
		trends?.reduce((acc, point) => {
			if (!acc[point.source]) acc[point.source] = [];
			acc[point.source].push(point);
			return acc;
		}, {} as Record<string, typeof trends>) || {};

	const providerById = (id: string) => providers?.find((p) => p.id === id);
	const maxTokens = Math.max(...chartData.map((d) => d.tokens), 1);

	return (
		<div className="h-full overflow-y-auto no-scrollbar apple-scroll-fade p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
				<div>
					<h1 className="text-xl sm:text-2xl font-semibold text-[var(--app-ink)]">Provider Analysis</h1>
					<p className="text-sm text-[var(--app-muted)] mt-1">Usage breakdown per provider</p>
				</div>
				<RefreshButton />
			</div>

			{/* Range tabs */}
			<div className="liquid-shell flex gap-1 mb-6 lg:mb-8 p-1 rounded-full w-fit overflow-x-auto relative">
				{"today week month all".split(" ").map((range) => (
					<button
						key={range}
						onClick={() => setTimeRange(range as any)}
						className="relative px-4 py-1.5 text-sm rounded-full font-medium transition-colors focus:outline-none"
					>
						{timeRange === range && (
							<motion.div
								layoutId="active-range-provider"
								className="absolute inset-0 liquid-inner rounded-full"
								transition={{ type: "spring", stiffness: 380, damping: 30 }}
							/>
						)}
						<span
							className={cn(
								"relative z-10 transition-colors duration-200",
								timeRange === range ? "text-[var(--app-ink)]" : "text-[var(--app-muted)] hover:text-[var(--app-ink)]"
							)}
						>
							{range === "today" && "Today"}
							{range === "week" && "Week"}
							{range === "month" && "Month"}
							{range === "all" && "All Time"}
						</span>
					</button>
				))}
			</div>

			{/* Summary */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 lg:mb-8">
				{[
					{ label: "Providers", value: `${detectedProviders.length}` },
					{ label: "Messages", value: `${metrics?.total_requests || 0}` },
					{ label: "Input Tokens", value: (metrics?.input_tokens || 0).toLocaleString() },
					{ label: "Output Tokens", value: (metrics?.output_tokens || 0).toLocaleString() },
					{ label: "Cache Hit Rate", value: `${metrics?.cache_hit_rate?.toFixed(0) || 0}%` },
				].map((stat) => (
					<LiquidCard key={stat.label} className="p-4 sm:p-5">
						<p className="text-[10px] sm:text-xs font-medium text-[var(--app-muted)] uppercase tracking-wide">{stat.label}</p>
						<p className="text-xl sm:text-2xl font-semibold text-[var(--app-ink)] mt-2">{stat.value}</p>
					</LiquidCard>
				))}
			</div>

			{/* Provider Bar Chart */}
			<div className="mb-6 lg:mb-8">
			<LiquidCard className="p-4 sm:p-6">
				<h2 className="text-base sm:text-lg font-semibold text-[var(--app-ink)] mb-4">Tokens by Provider</h2>
				<ProviderBarChart sessions={providerSessions} />
			</LiquidCard>
			</div>

			{/* Provider list with logos */}
			<div className="mb-6 lg:mb-8">
			<LiquidCard className="p-4 sm:p-6">
				<h2 className="text-base sm:text-lg font-semibold text-[var(--app-ink)] mb-4">Provider Breakdown</h2>
				<div className="space-y-4">
					{providerSessions
						?.sort((a, b) => b.input_tokens + b.output_tokens - (a.input_tokens + a.output_tokens))
						.map((s) => {
							const provider = providerById(s.source);
							const pct = ((s.input_tokens + s.output_tokens) / maxTokens) * 100;
							return (
								<div key={s.source} className="flex items-center gap-3 sm:gap-4">
									{provider && <ProviderLogo provider={provider} size="md" />}
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between mb-1.5">
											<span className="text-sm font-medium text-[var(--app-ink)] capitalize truncate">{s.source}</span>
											<span className="text-xs text-[var(--app-muted)] whitespace-nowrap">
												{((s.input_tokens + s.output_tokens) / 1000).toFixed(1)}k tokens
											</span>
										</div>
										<div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
											<div
												className="h-full rounded-full transition-all"
												style={{ width: `${pct}%`, backgroundColor: getProviderColor(s.source) }}
											/>
										</div>
									</div>
								</div>
							);
						})}
					{(!providerSessions || providerSessions.length === 0) && (
						<p className="text-sm text-[var(--app-muted)]">No provider data for this range.</p>
					)}
				</div>
			</LiquidCard>
			</div>

			{/* Per-provider cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
				{providerSessions
					?.sort((a, b) => b.input_tokens + b.output_tokens - (a.input_tokens + a.output_tokens))
					.map((s) => {
						const providerTrends = trendsBySource[s.source] || [];
						const latest = providerTrends[providerTrends.length - 1];
						const provider = providerById(s.source);
						return (
							<LiquidCard key={s.source} className="p-4 sm:p-5">
								<div className="flex items-center justify-between mb-4">
									<div className="flex items-center gap-3">
										{provider && <ProviderLogo provider={provider} size="md" />}
										<h3 className="text-base font-semibold text-[var(--app-ink)] capitalize">{s.source}</h3>
									</div>
									<span className="text-xs text-[var(--app-muted)]">{latest?.bucket || ""}</span>
								</div>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm text-[var(--app-muted)]">Messages</span>
										<span className="text-sm font-medium text-[var(--app-ink)]">{s.request_count.toLocaleString()}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm text-[var(--app-muted)]">Tokens</span>
										<span className="text-sm font-medium text-[var(--app-ink)]">
											{((s.input_tokens + s.output_tokens) / 1000).toFixed(1)}k
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm text-[var(--app-muted)]">Cost</span>
										<span className="text-sm font-medium text-[var(--app-ink)]">${s.cost.toFixed(2)}</span>
									</div>
								</div>
							</LiquidCard>
						);
					})}
			</div>
		</div>
	);
}
