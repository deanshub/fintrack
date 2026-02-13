"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface TrendData {
  month: string;
  income: number;
  expenses: number;
}

const chartConfig = {
  income: { label: "Income", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function MonthlyTrendChart({ data }: { data: TrendData[] }) {
  const formatted = data.map((d) => ({
    month: d.month.slice(5),
    income: d.income / 100,
    expenses: d.expenses / 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={formatted} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₪${v.toLocaleString()}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
