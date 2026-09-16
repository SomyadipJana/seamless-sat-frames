"use client";

import { Zap } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
import { getProviderColor } from "@/lib/colors";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import type { SessionSummary } from "@/types/metrics";

interface ProviderBarChartProps {
	sessions: SessionSummary[] | undefined;
}

export function ProviderBarChart({ sessions }: ProviderBarChartProps) {
	const data =
		sessions?.map((s) => ({
			name: s.source.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
			source: s.source,
			tokens: s.input_tokens + s.output_tokens,
			cost: s.cost,
		})) || [];

	const chartConfig = {
		tokens: {
			label: "Tokens",
			color: "var(--app-ink)",
		},
	} satisfies ChartConfig;

	if (data.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-40 text-[var(--app-muted)]">
				<Zap className="size-8 mb-2 text-[var(--app-hairline)]" />
				<p className="text-sm">No provider data for this range</p>
			</div>
		);
	}

	return (
		<ChartContainer config={chartConfig} className="h-48 w-full">
			<BarChart
				accessibilityLayer
				data={data}
				layout="vertical"
				margin={{ left: 0, right: 24 }}
			>
				<XAxis type="number" dataKey="tokens" hide />
				<YAxis
					dataKey="name"
					type="category"
					tickLine={false}
					tickMargin={8}
					axisLine={false}
					width={100}
					tick={{ fill: "var(--app-muted)", fontSize: 12 }}
				/>
				<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
				<Bar dataKey="tokens" radius={4} barSize={24}>
					{data.map((entry, index) => (
						<Cell key={`cell-${index}`} fill={getProviderColor(entry.source, index)} />
					))}
				</Bar>
			</BarChart>
		</ChartContainer>
	);
}
