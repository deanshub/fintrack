"use client";

import { Suspense, useState } from "react";
import useSWR from "swr";
import { BudgetProgress } from "@/components/budget-progress";
import { CategoryPieChart } from "@/components/category-pie-chart";
import { MonthSelector } from "@/components/month-selector";
import { MonthlyTrendChart } from "@/components/monthly-trend-chart";
import { SummaryCards } from "@/components/summary-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentMonth } from "@/lib/format";
import type { Budget, Category } from "@/lib/types";

function DashboardContent({ month }: { month: string }) {
  const { data: summary } = useSWR<{
    income: number;
    expenses: number;
    net: number;
    byCategory: Record<string, number>;
  }>(`/api/stats/summary?month=${month}`);
  const { data: trend } = useSWR<{ month: string; income: number; expenses: number }[]>(
    "/api/stats/trend?months=6",
  );
  const { data: categories } = useSWR<Category[]>("/api/categories");
  const { data: budget } = useSWR<Budget | null>(`/api/budgets?month=${month}`);

  if (!summary || !trend || !categories) return null;

  return (
    <div className="space-y-6">
      <SummaryCards data={summary} />
      <MonthlyTrendChart data={trend} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryPieChart data={{ byCategory: summary.byCategory, categories }} />
        <BudgetProgress
          budget={budget ?? null}
          spending={summary.byCategory}
          totalExpenses={summary.expenses}
          categories={categories}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [month, setMonth] = useState(getCurrentMonth);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <MonthSelector month={month} onChange={setMonth} />
      </div>
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-80" />
          </div>
        }
      >
        <DashboardContent month={month} />
      </Suspense>
    </div>
  );
}
