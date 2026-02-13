"use client";

import { addMonths, format, parse } from "date-fns";
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
    const date = parse(month, "yyyy-MM", new Date());
    const next = format(addMonths(date, delta), "yyyy-MM");
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
