"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";

export type SortKey = "date" | "description" | "category" | "amount";
export type SortDir = "asc" | "desc";

export const DEFAULT_SORT_KEY: SortKey = "date";
export const DEFAULT_SORT_DIR: SortDir = "asc";

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
  onRowClick?: (transaction: Transaction) => void;
  sortKey?: SortKey;
  sortDir?: SortDir;
  onSortChange?: (key: SortKey, dir: SortDir) => void;
}

export function TransactionTable({
  transactions,
  categories,
  onRowClick,
  sortKey: controlledKey,
  sortDir: controlledDir,
  onSortChange,
}: TransactionTableProps) {
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const [internalKey, setInternalKey] = useState<SortKey>(DEFAULT_SORT_KEY);
  const [internalDir, setInternalDir] = useState<SortDir>(DEFAULT_SORT_DIR);

  const sortKey = controlledKey ?? internalKey;
  const sortDir = controlledDir ?? internalDir;

  function handleSort(key: SortKey) {
    let nextDir: SortDir;
    if (sortKey === key) {
      nextDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      nextDir = key === "amount" ? "desc" : "asc";
    }
    if (onSortChange) {
      onSortChange(key, nextDir);
    } else {
      setInternalKey(key);
      setInternalDir(nextDir);
    }
  }

  const sorted = useMemo(() => {
    const copy = [...transactions];
    const dir = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      switch (sortKey) {
        case "date":
          return dir * a.date.localeCompare(b.date);
        case "description":
          return dir * a.description.localeCompare(b.description);
        case "category": {
          const catA = (a.categoryId ? catMap.get(a.categoryId)?.name : "") ?? "";
          const catB = (b.categoryId ? catMap.get(b.categoryId)?.name : "") ?? "";
          return dir * catA.localeCompare(catB);
        }
        case "amount":
          return dir * (a.amount - b.amount);
        default:
          return 0;
      }
    });
    return copy;
  }, [transactions, sortKey, sortDir, catMap]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (tx.type === "income") income += tx.amount;
      else expense += tx.amount;
    }
    return { income, expense, net: income - expense, count: transactions.length };
  }, [transactions]);

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {(
              [
                { key: "date", label: "", align: "" },
                { key: "description", label: "Description", align: "" },
                { key: "category", label: "Category", align: "" },
                { key: "amount", label: "Amount", align: "text-right" },
              ] as const
            ).map((col) => (
              <TableHead key={col.key} className={col.align}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <SortIcon column={col.key} />
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No transactions
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((tx) => {
              const cat = tx.categoryId ? catMap.get(tx.categoryId) : null;
              return (
                <TableRow
                  key={tx.id}
                  className={onRowClick ? "cursor-pointer" : undefined}
                  onClick={() => onRowClick?.(tx)}
                >
                  <TableCell className="whitespace-nowrap">{formatDateShort(tx.date)}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate" title={tx.description}>
                        {tx.description}
                      </span>
                      {tx.note && (
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    {cat ? (
                      <Badge
                        variant="outline"
                        className="gap-1.5"
                        style={{
                          borderColor: cat.color,
                          color: cat.color,
                        }}
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium whitespace-nowrap ${tx.type === "income" ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
        {sorted.length > 0 && (
          <tfoot>
            <TableRow className="border-t-2 font-semibold">
              <TableCell colSpan={3}>Total ({totals.count} transactions)</TableCell>
              <TableCell
                className={`text-right whitespace-nowrap ${totals.net >= 0 ? "text-emerald-600" : "text-red-600"}`}
              >
                {totals.net >= 0 ? "+" : "-"}
                {formatCurrency(Math.abs(totals.net))}
              </TableCell>
            </TableRow>
          </tfoot>
        )}
      </Table>
    </div>
  );
}
