"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";

type SortKey = "date" | "description" | "category" | "amount";
type SortDir = "asc" | "desc";

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
  onRowClick?: (transaction: Transaction) => void;
}

export function TransactionTable({ transactions, categories, onRowClick }: TransactionTableProps) {
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "amount" ? "desc" : "asc");
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
                { key: "date", label: "Date", align: "" },
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
                  <TableCell className="whitespace-nowrap">{formatDate(tx.date)}</TableCell>
                  <TableCell>{tx.description}</TableCell>
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
      </Table>
    </div>
  );
}
