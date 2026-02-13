"use client";

import { Badge } from "@/components/ui/badge";
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

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
  onRowClick?: (transaction: Transaction) => void;
}

export function TransactionTable({ transactions, categories, onRowClick }: TransactionTableProps) {
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No transactions
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => {
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
                      <Badge variant="secondary">{cat.name}</Badge>
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
