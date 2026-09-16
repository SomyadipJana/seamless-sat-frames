import { useMemo } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useMetrics, useTrends, useModels, useSessions, useProjects, useProviders } from "@/hooks/useMetrics";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { extractModelName } from "@/lib/modelName";
import { ProviderLogo } from "./ProviderLogo";
import { ModelBadge } from "./ModelBadge";
import { getProviderColor } from "@/lib/colors";
import { LiquidCard } from "@/components/ui/LiquidCard";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export function DetailedAnalysisPage() {
	const { timeRange, setTimeRange, showCost } = useDashboardStore();
	const { data: metrics } = useMetrics(timeRange);
	const { data: trends } = useTrends(timeRange, showCost);
	const { data: models } = useModels(timeRange);
	const { data: sessions } = useSessions(timeRange, "sessions");
	const { data: projects } = useProjects(timeRange);
	const { data: providers } = useProviders();

	const sources = Array.from(new Set(trends?.map((t) => t.source) || []));

	const chartData = useMemo(() => {
		if (!trends) return [];
		const sourcesList = Array.from(new Set(trends.map((t) => t.source)));
		return trends.reduce(
			(acc, point) => {
				let existing = acc.find((d) => d.bucket === point.bucket);
				if (!existing) {
					existing = { bucket: point.bucket };
					sourcesList.forEach((s) => {
						existing![s] = 0;
					});
					acc.push(existing);
				}
				existing[point.source] = showCost ? point.cost : point.input_tokens + point.output_tokens;
				return acc;
			},
			[] as Record<string, string | number>[]
		);
	}, [trends, showCost]);

	const providerById = (id: string) => providers?.find((p) => p.id === id);

	return (
		<div className="h-full overflow-y-auto no-scrollbar apple-scroll-fade p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
			<div className="mb-6">
				<h1 className="text-xl sm:text-2xl font-semibold text-[var(--app-ink)]">Detailed Analysis</h1>
				<p className="text-sm text-[var(--app-muted)] mt-1">Deep dive into your usage patterns</p>
			</div>

			<div className="liquid-shell flex gap-1 mb-6 lg:mb-8 p-1 rounded-full w-fit overflow-x-auto relative">
				{"today week month all".split(" ").map((range) => (
					<button
						key={range}
						onClick={() => setTimeRange(range as any)}
						className="relative px-4 py-1.5 text-sm rounded-full font-medium transition-colors whitespace-nowrap focus:outline-none"
					>
						{timeRange === range && (
							<motion.div
								layoutId="active-range-detailed"
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

			{/* Summary blocks */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4 mb-6 lg:mb-8">
				<SummaryBlock label="Cost" value={`$${metrics?.total_cost?.toFixed(2) || "0.00"}`} />
				<SummaryBlock label="Messages" value={(metrics?.total_requests || 0).toLocaleString()} />
				<SummaryBlock label="Input Tokens" value={(metrics?.input_tokens || 0).toLocaleString()} />
				<SummaryBlock label="Output Tokens" value={(metrics?.output_tokens || 0).toLocaleString()} />
				<SummaryBlock label="Cache Miss" value={(metrics?.cache_write_tokens || 0).toLocaleString()} />
				<SummaryBlock label="Cache Hit" value={(metrics?.cache_read_tokens || 0).toLocaleString()} />
				<SummaryBlock label="Cache Hit Rate" value={`${metrics?.cache_hit_rate?.toFixed(0) || 0}%`} />
			</div>

			<div className="mb-6 lg:mb-8">
				<LiquidCard className="p-4 sm:p-6" height="h-fit">
					<h2 className="text-base sm:text-lg font-semibold text-[var(--app-ink)] mb-4">Usage Trends</h2>
					<div className="h-56 sm:h-64">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData}>
								<defs>
									{sources.map((source, i) => {
										const color = getProviderColor(source, i);
										return (
											<linearGradient key={source} id={`grad-detailed-${source}`} x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor={color} stopOpacity={0.15} />
												<stop offset="95%" stopColor={color} stopOpacity={0} />
											</linearGradient>
										);
									})}
								</defs>
								<CartesianGrid stroke="var(--app-hairline)" vertical={false} />
								<XAxis dataKey="bucket" stroke="#6b6b6b" fontSize={12} tickLine={false} axisLine={false} />
								<YAxis stroke="#6b6b6b" fontSize={12} tickLine={false} axisLine={false} />
								<Tooltip
									contentStyle={{
										backgroundColor: "var(--app-canvas)",
										border: "1px solid var(--app-hairline)",
										borderRadius: "8px",
									}}
									itemStyle={{
										color: "var(--app-ink)",
										fontSize: "13px",
									}}
									labelStyle={{
										color: "var(--app-muted)",
										fontSize: "12px",
										marginBottom: "4px",
									}}
								/>
								{sources.map((source, i) => (
									<Area
										key={source}
										type="monotone"
										dataKey={source}
										stroke={getProviderColor(source, i)}
										fill={`url(#grad-detailed-${source})`}
										strokeWidth={2}
										dot={false}
									/>
								))}
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</LiquidCard>
			</div>

			<TableSection title="Model Breakdown" minWidth="700px">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="text-[var(--app-muted)]">Model</TableHead>
							<TableHead className="text-[var(--app-muted)]">Provider</TableHead>
							<TableHead className="text-right text-[var(--app-muted)]">Requests</TableHead>
							<TableHead className="text-right text-[var(--app-muted)]">Tokens</TableHead>
							<TableHead className="text-right text-[var(--app-muted)]">Cost</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{models?.map((m) => {
							const provider = providerById(m.source);
							return (
								<TableRow key={`${m.source}-${extractModelName(m.model)}`}>
									<TableCell className="font-medium text-[var(--app-ink)]">
										<ModelBadge model={m.model} source={m.source} size="sm" showLabel />
									</TableCell>
									<TableCell className="capitalize text-[var(--app-muted)]">
										<div className="flex items-center gap-2">
											{provider && <ProviderLogo provider={provider} size="sm" />}
											<span>{m.source}</span>
										</div>
									</TableCell>
									<TableCell className="text-right text-[var(--app-ink)]">{m.request_count.toLocaleString()}</TableCell>
									<TableCell className="text-right text-[var(--app-ink)]">{(m.input_tokens + m.output_tokens).toLocaleString()}</TableCell>
									<TableCell className="text-right text-[var(--app-ink)]">${m.cost.toFixed(2)}</TableCell>
								</TableRow>
							);
						})}
						{(!models || models.length === 0) && (
							<TableRow>
								<TableCell colSpan={5} className="text-center text-[var(--app-muted)] py-8">
									No model data for this range.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableSection>

			<TableSection title="Branch Usage" minWidth="1000px">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="text-[var(--app-muted)]">Branch</TableHead>
							<TableHead className="text-[var(--app-muted)]">Project</TableHead>
							<TableHead className="text-[var(--app-muted)]">Provider</TableHead>
							<TableHead className="text-right text-[var(--app-muted)] ">Cost</TableHead>
							<TableHead className="text-right text-[var(--app-muted)]">Input</TableHead>
							<TableHead className="text-right text-[var(--app-muted)]">Output</TableHead>
							<TableHead className="text-right text-[var(--app-muted)]">Cache Miss</TableHead>
							<TableHead className="text-right text-[var(--app-muted)]">Cache Hit</TableHead>
							<TableHead className="text-right text-[var(--app-muted)]">Messages</TableHead>
							<TableHead className="text-right text-[var(--app-muted)]">Sessions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{projects?.map((p) => {
							const provider = providerById(p.source);
							return (
								<TableRow key={`${p.source}-${p.project}-${p.branch}`}>
									<TableCell className="font-medium text-[var(--app-ink)]">{p.branch}</TableCell>
									<TableCell className="text-[var(--app-muted)]">{p.project}</TableCell>
									<TableCell className="capitalize text-[var(--app-muted)]">
										<div className="flex items-center gap-1">
											{provider && <ProviderLogo provider={provider} size="sm" />}
											<span>{p.source}</span>
										</div>
									</TableCell>
									<TableCell className="text-right text-[var(--app-ink)]">${p.cost.toFixed(2)}</TableCell>
									<TableCell className="text-right text-[var(--app-ink)]">{p.input_tokens.toLocaleString()}</TableCell>
									<TableCell className="text-right text-[var(--app-ink)]">{p.output_tokens.toLocaleString()}</TableCell>
									<TableCell className="text-right text-[var(--app-ink)]">{p.cache_write_tokens.toLocaleString()}</TableCell>
									<TableCell className="text-right text-[var(--app-ink)]">{p.cache_read_tokens.toLocaleString()}</TableCell>
									<TableCell className="text-right text-[var(--app-ink)]">{p.request_count.toLocaleString()}</TableCell>
									<TableCell className="text-right text-[var(--app-ink)]">{p.session_count.toLocaleString()}</TableCell>
								</TableRow>
							);
						})}
						{(!projects || projects.length === 0) && (
							<TableRow>
								<TableCell colSpan={10} className="text-center text-[var(--app-muted)] py-8">
									No project data for this range.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableSection>

			<TableSection title="Sessions" minWidth="500px">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="text-[var(--app-muted)]">Session</TableHead>
							<TableHead className="text-[var(--app-muted)]">Provider</TableHead>
							<TableHead className="text-right text-[var(--app-muted)]">Requests</TableHead>
							<TableHead className="text-right text-[var(--app-muted)]">Cost</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sessions?.slice(0, 20).map((s) => {
							const provider = providerById(s.source);
							return (
								<TableRow key={s.session_id}>
									<TableCell className="font-medium text-[var(--app-ink)] truncate max-w-[200px]">{s.session_id}</TableCell>
									<TableCell className="capitalize text-[var(--app-muted)]">
										<div className="flex items-center gap-2">
											{provider && <ProviderLogo provider={provider} size="sm" />}
											<span>{s.source}</span>
										</div>
									</TableCell>
									<TableCell className="text-right text-[var(--app-ink)]">{s.request_count.toLocaleString()}</TableCell>
									<TableCell className="text-right text-[var(--app-ink)]">${s.cost.toFixed(2)}</TableCell>
								</TableRow>
							);
						})}
						{(!sessions || sessions.length === 0) && (
							<TableRow>
								<TableCell colSpan={4} className="text-center text-[var(--app-muted)] py-8">
									No sessions for this range.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableSection>
		</div>
	);
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
	return (
		<LiquidCard className="p-3 sm:p-4">
			<p className="text-[9px] sm:text-[10px] font-medium text-[var(--app-muted)] uppercase tracking-wide truncate">{label}</p>
			<p className="text-lg sm:text-xl font-semibold text-[var(--app-ink)] mt-1.5 truncate">{value}</p>
		</LiquidCard>
	);
}

function TableSection({
	title,
	minWidth,
	children,
}: {
	title: string;
	minWidth: string;
	children: React.ReactNode;
}) {
	return (
		<div className="mb-6 lg:mb-8 last:mb-0">
			<LiquidCard className="p-4 sm:p-6" height="h-fit">
				<h2 className="text-base sm:text-lg font-semibold text-[var(--app-ink)] mb-4">{title}</h2>
				<div className="overflow-x-auto -mx-4 sm:mx-0">
					<div className="px-4 sm:px-0" style={{ minWidth }}>
						<div className="rounded-[10px] overflow-hidden">
							{children}
						</div>
					</div>
				</div>
			</LiquidCard>
		</div>
	);
}
