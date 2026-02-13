"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { Category } from "@/lib/types";

interface CategorySpend {
  byCategory: Record<string, number>;
  categories: Category[];
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function CategoryPieChart({ data }: { data: CategorySpend }) {
  const entries = Object.entries(data.byCategory)
    .filter(([id]) => id !== "uncategorized")
    .map(([id, amount]) => {
      const cat = data.categories.find((c) => c.id === id);
      return {
        name: cat?.name ?? id,
        value: amount / 100,
        color: cat?.color ?? "var(--muted)",
      };
    })
    .sort((a, b) => b.value - a.value);

  const chartConfig: ChartConfig = {};
  for (const entry of entries) {
    chartConfig[entry.name] = { label: entry.name, color: entry.color };
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-muted-foreground">
          No expense data
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px] w-full">
          <PieChart accessibilityLayer>
            <ChartTooltip
              content={
                <ChartTooltipContent formatter={(value) => `₪${Number(value).toLocaleString()}`} />
              }
            />
            <Pie
              data={entries}
              dataKey="value"
              nameKey="name"
              innerRadius="40%"
              outerRadius="75%"
              paddingAngle={2}
            >
              {entries.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
          {entries.map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
