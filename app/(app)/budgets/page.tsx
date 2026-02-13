"use client";

import { Pencil } from "lucide-react";
import { Suspense, useState } from "react";
import useSWR from "swr";
import { BudgetFormDialog } from "@/components/budget-form-dialog";
import { MonthSelector } from "@/components/month-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getCurrentMonth } from "@/lib/format";
import type { Budget, Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface EditTarget {
  label: string;
  categoryId?: string;
  currentLimit: number | null;
}

function BudgetContent({ month }: { month: string }) {
  const { data: budget } = useSWR<Budget | null>(`/api/budgets?month=${month}`);
  const { data: summary } = useSWR<{
    expenses: number;
    byCategory: Record<string, number>;
  }>(`/api/stats/summary?month=${month}`);
  const { data: categories } = useSWR<Category[]>("/api/categories");
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  if (!summary || !categories) return null;

  const globalLimit = budget?.globalLimit ?? null;
  const globalPct = globalLimit ? Math.min((summary.expenses / globalLimit) * 100, 100) : 0;

  const categoryBudgets = categories
    .filter((c) => c.id !== "income")
    .map((cat) => {
      const limit = budget?.categoryLimits[cat.id] ?? null;
      const spent = summary.byCategory[cat.id] ?? 0;
      const pct = limit ? Math.min((spent / limit) * 100, 100) : 0;
      return { cat, limit, spent, pct };
    });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Overall Budget</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditTarget({ label: "Overall", currentLimit: globalLimit })}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {globalLimit != null ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Spent: {formatCurrency(summary.expenses)}</span>
                <span>Limit: {formatCurrency(globalLimit)}</span>
              </div>
              <Progress
                value={globalPct}
                className={cn(
                  "[&>div]:transition-all",
                  globalPct >= 90
                    ? "[&>div]:bg-red-500"
                    : globalPct >= 70
                      ? "[&>div]:bg-yellow-500"
                      : "[&>div]:bg-emerald-500",
                )}
              />
            </div>
          ) : (
            <p className="text-muted-foreground">No global limit set</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Category Budgets</h2>
        {categoryBudgets.map(({ cat, limit, spent, pct }) => (
          <Card key={cat.id}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(spent)}
                    {limit != null ? ` / ${formatCurrency(limit)}` : ""}
                  </span>
                </div>
                {limit != null ? (
                  <Progress
                    value={pct}
                    className={cn(
                      "[&>div]:transition-all",
                      pct >= 90
                        ? "[&>div]:bg-red-500"
                        : pct >= 70
                          ? "[&>div]:bg-yellow-500"
                          : "[&>div]:bg-emerald-500",
                    )}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">No limit set</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setEditTarget({
                    label: cat.name,
                    categoryId: cat.id,
                    currentLimit: limit,
                  })
                }
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {editTarget && (
        <BudgetFormDialog
          open
          onClose={() => setEditTarget(null)}
          month={month}
          label={editTarget.label}
          categoryId={editTarget.categoryId}
          currentLimit={editTarget.currentLimit}
        />
      )}
    </>
  );
}

export default function BudgetsPage() {
  const [month, setMonth] = useState(getCurrentMonth);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <MonthSelector month={month} onChange={setMonth} />
      </div>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-32" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`skeleton-${i}`} className="h-20" />
            ))}
          </div>
        }
      >
        <BudgetContent month={month} />
      </Suspense>
    </div>
  );
}
