"use client";

import { TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import type { ModelUsage } from "@/hooks/useMetrics";
import { extractModelName } from "@/lib/modelName";

interface CostPieChartProps {
	models: ModelUsage[] | undefined;
}

const PIE_COLORS = [
	"hsl(0 0% 35%)",
	"hsl(0 0% 47%)",
	"hsl(0 0% 58%)",
	"hsl(0 0% 70%)",
	"hsl(0 0% 82%)",
];

export function CostPieChart({ models }: CostPieChartProps) {
	const data =
		models?.map((m, i) => ({
			model: extractModelName(m.model),
			cost: m.cost,
			fill: PIE_COLORS[i % PIE_COLORS.length],
		})) || [];

	const chartConfig = {
		cost: {
			label: "Cost",
		},
	} satisfies ChartConfig;

	if (data.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-48 text-[#6b6560]">
				<TrendingUp className="size-8 mb-2 text-[#c8c0b6]" />
				<p className="text-sm">No cost data for this range</p>
			</div>
		);
	}

	return (
		<ChartContainer
			config={chartConfig}
			className="mx-auto aspect-square max-h-[220px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
		>
			<PieChart>
				<ChartTooltip content={<ChartTooltipContent hideLabel />} />
				<Pie
					data={data}
					dataKey="cost"
					nameKey="model"
					label
					labelLine={false}
				/>
			</PieChart>
		</ChartContainer>
	);
}
