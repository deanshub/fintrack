"use client";

import { format, parse } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();

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
      fullMonth: d.month,
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
          <LineChart
            data={formatted}
            accessibilityLayer
            className="cursor-pointer"
            onMouseLeave={() => setActiveId(null)}
            onClick={(state) => {
              if (!state?.activePayload?.length) return;
              const point = state.activePayload[0].payload as Record<string, string | number>;
              const fullMonth = point.fullMonth;
              const categoryId = activeId ?? selectedIds[0];
              if (fullMonth) {
                router.push(`/transactions?month=${fullMonth}&category=${categoryId}`);
              }
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₪${v.toLocaleString()}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => format(parse(label, "MM", new Date()), "MMMM")}
                  formatter={(value, name) => {
                    const cat = catMap.get(name as string);
                    const isActive = activeId === name;
                    return (
                      <div
                        className={`flex w-full items-center justify-between gap-4 ${isActive ? "font-semibold" : "text-muted-foreground"}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: cat?.color }}
                          />
                          <span>{cat?.name ?? name}</span>
                        </div>
                        <span className="font-mono tabular-nums">
                          ₪{Number(value).toLocaleString()}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent className="flex-wrap gap-2" />} />
            {selectedIds.map((id) => (
              <Line
                key={id}
                type="monotone"
                dataKey={id}
                stroke={`var(--color-${id})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
                onMouseEnter={() => setActiveId(id)}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
