"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { type Budget, type Category, IGNORE_CATEGORY_ID } from "@/lib/types";

const EXCLUDED_IDS = new Set(["income", IGNORE_CATEGORY_ID, "other"]);

interface OverspendAlertsProps {
  budget: Budget | null;
  spending: Record<string, number>;
  totalExpenses: number;
  categories: Category[];
}

interface Overspend {
  key: string;
  label: string;
  spent: number;
  limit: number;
}

export function OverspendAlerts({
  budget,
  spending,
  totalExpenses,
  categories,
}: OverspendAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!budget) return null;

  const overspends: Overspend[] = [];

  if (budget.globalLimit != null && totalExpenses > budget.globalLimit) {
    overspends.push({
      key: "__global",
      label: "Overall budget",
      spent: totalExpenses,
      limit: budget.globalLimit,
    });
  }

  for (const cat of categories) {
    if (EXCLUDED_IDS.has(cat.id)) continue;
    const limit = budget.categoryLimits[cat.id];
    if (limit == null) continue;
    const spent = spending[cat.id] ?? 0;
    if (spent > limit) {
      overspends.push({ key: cat.id, label: cat.name, spent, limit });
    }
  }

  const visible = overspends.filter((o) => !dismissed.has(o.key));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((o) => {
        const overPct = Math.round(((o.spent - o.limit) / o.limit) * 100);
        return (
          <Alert key={o.key} variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              {o.label} is over budget
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 -mr-1"
                onClick={() => setDismissed((prev) => new Set(prev).add(o.key))}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </AlertTitle>
            <AlertDescription>
              {formatCurrency(o.spent)} spent of {formatCurrency(o.limit)} limit ({overPct}% over)
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
