import { useMemo } from "react";
import { useCountUp } from "@/hooks/useCountUp";
import { useMetrics, useProviders, useActiveSessions, useModels, useTrends, useQuota } from "@/hooks/useMetrics";
import { MessageSquare, Cpu, TrendingUp, Zap } from "lucide-react";
import { QuotaSection } from "./QuotaSection";
import { StreakChart } from "./StreakChart";
import { getStoredProfile } from "./OnboardingPage";
import { MiniSparkline } from "./MiniSparkline";
import { ProviderLogo } from "./ProviderLogo";
import { ModelBadge } from "./ModelBadge";
import { LiquidCard } from "@/components/ui/LiquidCard";
import { Skeleton } from "@/components/ui/skeleton";
import { extractModelName } from "@/lib/modelName";
import { useServerStore } from "@/stores/serverStore";
import { RefreshButton } from "./RefreshButton";

function greetingFor(hour: number): string {
	if (hour < 12) return "Good morning";
	if (hour < 18) return "Good afternoon";
	return "Good evening";
}

export function HomePage() {
	const { data: metrics, isLoading: metricsLoading } = useMetrics("today");
	const { data: providers, isLoading: providersLoading } = useProviders();
	const { data: activeSessions } = useActiveSessions();
	const { data: models, isLoading: modelsLoading } = useModels("today");
	const { data: trends } = useTrends("today", false);
	const { data: quotas } = useQuota();
	const serverStatus = useServerStore((s) => s.status);

	const showSkeleton = serverStatus !== 'online' || metricsLoading;
	const showModelSkeleton = serverStatus !== 'online' || modelsLoading;
	const showProviderSkeleton = serverStatus !== 'online' || providersLoading;

	const profile = useMemo(() => getStoredProfile(), []);
	const hasQuotas = quotas && quotas.length > 0;
	const now = new Date();
	const detectedProviders = providers?.filter((p) => p.installed) || [];
	const topModel = models?.[0];
	const topModels = (models || []).slice(0, 5);

	const firstName = profile.name ? profile.name.split(" ")[0] : "there";
	const maxModelCost = Math.max(...topModels.map((m) => m.cost), 0.0001);

	const { totalTokenSparkline, costSparkline } = useMemo(() => {
		if (!trends) {
			return { totalTokenSparkline: [], costSparkline: [] };
		}

		// 1. Generate buckets based on "today" (24 hourly buckets)
		const buckets = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

		// 2. Aggregate trends by bucket
		const tokenMap: Record<string, number> = {};
		const costMap: Record<string, number> = {};

		trends.forEach((t) => {
			const b = t.bucket;
			tokenMap[b] = (tokenMap[b] || 0) + t.input_tokens + t.output_tokens;
			costMap[b] = (costMap[b] || 0) + t.cost;
		});

		// 3. Map buckets to aggregated values
		return {
			totalTokenSparkline: buckets.map((b) => tokenMap[b] || 0),
			costSparkline: buckets.map((b) => costMap[b] || 0),
		};
	}, [trends]);

	return (
		<div className="h-full flex flex-col min-h-0 w-full p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
			{/* Greeting section (mockup-style row) - fixed header */}
			<div className="flex items-center justify-between gap-4 pb-4  shrink-0">
				<div className="flex items-center gap-3.5">
					<div className="size-10 rounded-full border border-neutral-200 dark:border-neutral-800  flex items-center justify-center shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-900">
						{profile.avatar ? (
							<img src={profile.avatar} alt={profile.name} className="size-full object-cover" />
						) : (
							<svg className="size-6 text-sky-500 dark:text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
								<circle cx="12" cy="12" r="10" />
								<path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
							</svg>
						)}
					</div>
					<h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--app-ink)]">
						{greetingFor(now.getHours())}, {firstName}
					</h1>
				</div>

				<div className="flex items-center gap-2">
					<RefreshButton />
				</div>
			</div>

			{/* Scrollable Cards Area */}
			<div className="flex-1 overflow-y-auto no-scrollbar apple-scroll-fade py-4 sm:py-6 flex flex-col gap-4 sm:gap-6 pb-12 sm:pb-16 lg:pb-20">
				{/* Activity overview */}
				<div>
					<div className="mb-2">
						<p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">Activity Overview</p>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
						<AnalyticsBlock
							index={0}
							numericValue={showSkeleton ? null : (metrics?.total_requests ?? 0)}
							format={(n) => Math.round(n).toLocaleString()}
							label="Total Requests"
							icon={<MessageSquare className="size-4 text-[var(--app-ink)]" />}
							subtitle={activeSessions && activeSessions.length > 0 ? `${activeSessions.length} active` : "No active sessions"}
							sparkline={totalTokenSparkline}
						/>
						<AnalyticsBlock
							index={1}
							numericValue={showSkeleton ? null : (metrics ? (metrics.input_tokens + metrics.output_tokens) / 1000 : 0)}
							format={(n) => `${n.toFixed(1)}k`}
							label="Total Tokens"
							icon={<Cpu className="size-4 text-[var(--app-ink)]" />}
							subtitle="Input + output combined"
							sparkline={totalTokenSparkline}
						/>
						<AnalyticsBlock
							index={2}
							numericValue={showSkeleton ? null : (metrics?.total_cost ?? 0)}
							format={(n) => `$${n.toFixed(2)}`}
							label="Estimated Cost"
							icon={<TrendingUp className="size-4 text-[var(--app-ink)]" />}
							subtitle="Based on model pricing"
							sparkline={costSparkline}
						/>
						<AnalyticsBlock
							index={3}
							numericValue={showProviderSkeleton ? null : detectedProviders.length}
							format={(n) => Math.round(n).toString()}
							label="Active Providers"
							icon={<Zap className="size-4 text-[var(--app-ink)]" />}
							subtitle={topModel ? `Top: ${extractModelName(topModel.model)}` : "No model data"}
							sparkline={[]}
						/>
					</div>
				</div>

				{/* Top Models + Provider Usage */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
					{/* Top Models */}
					<LiquidCard index={4} className="p-4 sm:p-6">
						<div className="flex items-center justify-between mb-4 sm:mb-5">
							<h2 className="text-base sm:text-lg font-semibold text-[var(--app-ink)]">Top Models</h2>
							<span className="text-[10px] sm:text-xs font-medium text-[var(--app-muted)] uppercase tracking-wide">By cost</span>
						</div>
						<div className="flex flex-col gap-2">
							{showModelSkeleton ? (
								Array.from({ length: 3 }).map((_, i) => (
									<div key={i} className="flex items-center gap-3 p-2.5 rounded-lg liquid-row">
										<Skeleton className="size-8 rounded-md" />
										<div className="flex-1 space-y-1.5">
											<Skeleton className="h-4 w-28" />
											<Skeleton className="h-2 w-full rounded-full" />
										</div>
									</div>
								))
							) : (models || []).length === 0 ? (
								<p className="text-sm text-[var(--app-muted)]">No model usage recorded today.</p>
							) : (
								topModels.map((model) => (
									<div
										key={model.model}
										className="flex items-center gap-3 rounded-lg liquid-row p-2.5"
									>
										<div className="size-8 rounded-md bg-[var(--app-soft)] flex items-center justify-center shrink-0 border border-[var(--app-hairline)]">
											<ModelBadge model={model.model} size="sm" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium text-[var(--app-ink)] truncate">{extractModelName(model.model)}</span>
												<span className="text-xs font-semibold text-[var(--app-ink)] shrink-0">${model.cost.toFixed(2)}</span>
											</div>
											<div className="flex items-center justify-between text-[10px] text-[var(--app-muted)] mb-1">
												<span>{model.request_count} requests</span>
												<span>{((model.cost / maxModelCost) * 100).toFixed(0)}% max cost</span>
											</div>
											<div className="h-1.5 bg-[var(--app-hairline)] rounded-full overflow-hidden">
												<div
													className="h-full bg-[var(--app-ink)] rounded-full transition-all"
													style={{ width: `${(model.cost / maxModelCost) * 100}%` }}
												/>
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</LiquidCard>

					{/* Provider Usage */}
					<LiquidCard index={5} className="p-4 sm:p-6">
						<div className="flex items-center justify-between mb-4 sm:mb-5">
							<h2 className="text-base sm:text-lg font-semibold text-[var(--app-ink)]">Provider Usage</h2>
							<span className="text-[10px] sm:text-xs font-medium text-[var(--app-muted)] uppercase tracking-wide">
								{showProviderSkeleton ? "0 detected" : `${detectedProviders.length} detected`}
							</span>
						</div>
						<div className="flex flex-col gap-2">
							{showProviderSkeleton ? (
								Array.from({ length: 3 }).map((_, i) => (
									<div key={i} className="flex items-center gap-3 p-2.5 rounded-lg liquid-row">
										<Skeleton className="size-8 rounded-md" />
										<div className="flex-1 space-y-1.5">
											<Skeleton className="h-4 w-24" />
											<Skeleton className="h-1.5 w-full rounded-full" />
										</div>
									</div>
								))
							) : detectedProviders.length === 0 ? (
								<p className="text-sm text-[var(--app-muted)]">No providers detected yet.</p>
							) : (
								detectedProviders.map((provider, i) => (
									<div
										key={provider.id}
										className="flex items-center gap-3 rounded-lg liquid-row p-2.5"
									>
										<ProviderLogo provider={provider} size="md" />
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium text-[var(--app-ink)] capitalize truncate">{provider.name}</span>
												<span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--app-ink)] text-[var(--app-canvas)] shrink-0">Connected</span>
											</div>
											<div className="h-1.5 bg-[var(--app-hairline)] rounded-full overflow-hidden">
												<div
													className="h-full bg-[var(--app-ink)] rounded-full transition-all"
													style={{ width: `${100 - i * 15}%` }}
												/>
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</LiquidCard>
				</div>

				{/* Insights grid */}
				<div>
					<div className="mb-2">
						<p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">Insights</p>
					</div>
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
						{hasQuotas && (
							<div className="lg:col-span-2">
								<QuotaSection />
							</div>
						)}

						<LiquidCard index={7} className={`p-4 sm:p-6 ${hasQuotas ? "lg:col-span-1" : "lg:col-span-3"}`}>
							<StreakChart />
						</LiquidCard>
					</div>
				</div>
			</div>
		</div>
	);
}

function AnalyticsBlock({
	numericValue,
	format,
	label,
	icon,
	subtitle,
	index,
	sparkline,
}: {
	numericValue: number | null;
	format: (n: number) => string;
	label: string;
	icon: React.ReactNode;
	subtitle: string;
	index: number;
	sparkline: number[];
}) {
	const animated = useCountUp(numericValue, 1.1, index * 0.06);

	return (
		<LiquidCard index={index} className="p-4 sm:p-5 flex flex-col">
			<div className="flex items-center justify-between mb-3">
				<span className="text-[10px] sm:text-xs font-medium text-[var(--app-muted)] uppercase tracking-wide">{label}</span>
				<span className="inline-flex items-center justify-center size-7">
					{icon}
				</span>
			</div>
			{animated === null ? (
				<Skeleton className="h-8 w-20 mt-1" />
			) : (
				<div className="text-2xl sm:text-3xl font-semibold text-[var(--app-ink)] tracking-tight tabular-nums">
					{format(animated)}
				</div>
			)}
			<p className="text-[10px] sm:text-xs text-[var(--app-muted)] mt-1 truncate">{subtitle}</p>
			{sparkline.length > 1 && (
				<div className="mt-3 pt-3 border-t border-[var(--app-hairline)]">
					<MiniSparkline data={sparkline} />
				</div>
			)}
		</LiquidCard>
	);
}
