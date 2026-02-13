"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonth } from "@/lib/format";

export function MonthSelector({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  function shift(delta: number) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    onChange(next);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => shift(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[160px] text-center font-medium">{formatMonth(month)}</span>
      <Button variant="outline" size="icon" onClick={() => shift(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
