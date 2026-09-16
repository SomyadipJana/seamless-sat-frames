import { useMemo } from "react";
import { Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { useQuota, type QuotaLimit } from "@/hooks/useMetrics";
import { LiquidCard } from "@/components/ui/LiquidCard";

function formatTimeUntil(isoDate: string): string {
	try {
		const target = new Date(isoDate);
		const now = new Date();
		const diffMs = target.getTime() - now.getTime();
		if (diffMs <= 0) return "Resets soon";

		const minutes = Math.floor(diffMs / (1000 * 60));
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);
		const remainingHours = hours % 24;
		const remainingMinutes = minutes % 60;

		if (days > 0) {
			if (remainingHours > 0) return `Resets in ${days}d ${remainingHours}h`;
			return `Resets in ${days}d`;
		}
		if (hours > 0) {
			if (remainingMinutes > 0) return `Resets in ${hours}h ${remainingMinutes}m`;
			return `Resets in ${hours}h`;
		}
		return `Resets in ${remainingMinutes}m`;
	} catch {
		return "Resets soon";
	}
}

function QuotaCard({ limit }: { limit: QuotaLimit }) {
	const utilization = Math.min(Math.max(limit.utilization, 0), 100);
	return (
		<div className="flex-1 min-w-[200px] sm:min-w-[240px] liquid-row rounded-[10px] p-4 sm:p-5">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-xs sm:text-sm font-medium text-[var(--app-ink)]">{limit.label}</h3>
				<span className="text-xs sm:text-sm font-semibold text-[var(--app-ink)]">{utilization}% used</span>
			</div>
			<div className="h-2 bg-[var(--app-hairline)] rounded-full overflow-hidden mb-2">
				<div
					className="h-full bg-[var(--app-ink)] rounded-full transition-all"
					style={{ width: `${utilization}%` }}
				/>
			</div>
			<p className="text-[10px] sm:text-xs text-[var(--app-muted)]">{formatTimeUntil(limit.resets_at)}</p>
		</div>
	);
}

export function QuotaSection() {
	const { data: quotas, isLoading } = useQuota();

	const sorted = useMemo(() => {
		if (!quotas) return [];
		return quotas
			.map((q) => ({
				...q,
				limits: [...q.limits].sort((a, b) => b.utilization - a.utilization),
			}))
			.sort((a, b) => {
				const aMax = a.limits[0]?.utilization ?? 0;
				const bMax = b.limits[0]?.utilization ?? 0;
				return bMax - aMax;
			});
	}, [quotas]);

	const lastUpdated = useMemo(() => {
		const raw = quotas?.[0]?.last_updated;
		if (!raw) return null;
		try {
			const date = new Date(raw);
			const diffMs = Date.now() - date.getTime();
			const minutes = Math.floor(diffMs / (1000 * 60));
			if (minutes < 1) return "less than a minute ago";
			if (minutes < 60) return `${minutes}m ago`;
			const hours = Math.floor(minutes / 60);
			return `${hours}h ago`;
		} catch {
			return null;
		}
	}, [quotas]);

	if (isLoading) {
		return (
			<div className="bg-[var(--app-soft)] rounded-[14px] border border-[var(--app-hairline)] p-4 sm:p-6">
				<p className="text-sm text-[var(--app-muted)]">Loading quota data...</p>
			</div>
		);
	}

	if (sorted.length === 0) {
		return null;
	}

	const isStale = sorted.some((q) => q.stale);

	return (
		<LiquidCard index={6} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
				<div className="flex items-center gap-2.5">
					<h2 className="text-base sm:text-lg font-semibold text-[var(--app-ink)]">Provider Limits</h2>
					{isStale && (
						<span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
							<AlertTriangle className="size-3" />
						
						</span>
					)}
				</div>
				{lastUpdated && (
					<div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[var(--app-muted)]">
						<Clock className="size-3.5" />
						<span>Updated {lastUpdated}</span>
						<RefreshCw className="size-3.5" />
					</div>
				)}
			</div>

			<div className="space-y-4 sm:space-y-5">
				{sorted.map((quota) => {
					const providerName = quota.provider.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
					return (
						<div key={quota.provider} className="space-y-2 sm:space-y-3">
							<h3 className="text-xs sm:text-sm font-medium text-[var(--app-muted)]">{providerName}</h3>
							<div className="flex flex-wrap gap-3 sm:gap-4">
								{quota.limits.map((limit) => (
									<QuotaCard key={`${quota.provider}-${limit.id}`} limit={limit} />
								))}
							</div>
						</div>
					);
				})}
			</div>
		</LiquidCard>
	);
}
