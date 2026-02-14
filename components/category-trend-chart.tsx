"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { Category } from "@/lib/types";

interface TrendPoint {
  month: string;
  categories: Record<string, number>;
}

export function CategoryTrendChart({
  data,
  categories,
  selectedIds,
}: {
  data: TrendPoint[];
  categories: Category[];
  selectedIds: string[];
}) {
  if (selectedIds.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-[300px] items-center justify-center text-muted-foreground">
          Select categories to compare
        </CardContent>
      </Card>
    );
  }

  const catMap = new Map(categories.map((c) => [c.id, c]));

  const chartConfig: ChartConfig = {};
  for (const id of selectedIds) {
    const cat = catMap.get(id);
    if (cat) {
      chartConfig[id] = { label: cat.name, color: cat.color };
    }
  }

  const formatted = data.map((d) => {
    const point: Record<string, string | number> = {
      month: d.month.slice(5),
    };
    for (const id of selectedIds) {
      point[id] = (d.categories[id] ?? 0) / 100;
    }
    return point;
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={formatted} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₪${v.toLocaleString()}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent className="flex-wrap gap-2" />} />
            {selectedIds.map((id) => (
              <Line
                key={id}
                type="monotone"
                dataKey={id}
                stroke={`var(--color-${id})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
