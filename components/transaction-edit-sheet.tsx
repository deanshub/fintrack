"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";

const EXCLUDED_RULE_CATEGORIES = new Set(["income", "other"]);

interface TransactionEditSheetProps {
  transaction: Transaction | null;
  categories: Category[];
  onClose: () => void;
}

export function TransactionEditSheet({
  transaction,
  categories,
  onClose,
}: TransactionEditSheetProps) {
  const { mutate } = useSWRConfig();
  const searchParams = useSearchParams();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ruleKeyword, setRuleKeyword] = useState("");
  const [savingRule, setSavingRule] = useState(false);

  const currentCategoryId = categoryId ?? transaction?.categoryId ?? "";
  const currentCat = currentCategoryId ? categories.find((c) => c.id === currentCategoryId) : null;
  const currentNote = note ?? transaction?.note ?? "";
  const month = searchParams.get("month");
  const catQs = month ? `?month=${month}` : "";
  const showAddRule = currentCategoryId && !EXCLUDED_RULE_CATEGORIES.has(currentCategoryId);

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    setRuleKeyword(transaction?.description ?? "");
  }

  async function handleSaveWithRule() {
    if (!transaction || !currentCategoryId || !ruleKeyword.trim()) return;
    setSavingRule(true);
    try {
      // 1. Save the transaction category
      await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: currentCategoryId,
          note: currentNote,
        }),
      });

      // 2. Add keyword to category rules
      const cat = categories.find((c) => c.id === currentCategoryId);
      if (cat) {
        const updatedRules = [...cat.rules, { keyword: ruleKeyword.trim() }];
        await fetch(`/api/categories/${currentCategoryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rules: updatedRules }),
        });
      }

      // 3. Re-categorize all transactions
      const res = await fetch("/api/transactions/categorize", { method: "POST" });
      const { updated } = await res.json();

      await mutate((key: string) => typeof key === "string" && key.startsWith("/api/"));
      toast.success(
        `Rule added — ${updated} transaction${updated === 1 ? "" : "s"} re-categorized`,
      );
      onClose();
    } finally {
      setSavingRule(false);
    }
  }

  async function handleSave() {
    if (!transaction) return;
    setSaving(true);
    try {
      await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: currentCategoryId || null,
          note: currentNote,
        }),
      });
      await mutate((key: string) => typeof key === "string" && key.startsWith("/api/"));
      toast.success("Transaction updated");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={!!transaction}
      onOpenChange={(open) => {
        if (!open) {
          setCategoryId(null);
          setNote(null);
          setRuleKeyword("");
          onClose();
        }
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Transaction</SheetTitle>
          <SheetDescription>Change the category for this transaction</SheetDescription>
        </SheetHeader>
        {transaction && (
          <div className="space-y-4 px-4">
            {currentCat && (
              <Link
                href={`/categories/${currentCat.id}${catQs}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Badge
                  variant="outline"
                  className="gap-1.5"
                  style={{ borderColor: currentCat.color, color: currentCat.color }}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: currentCat.color }}
                  />
                  {currentCat.name}
                </Badge>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(transaction.description)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-medium hover:underline"
              >
                {transaction.description}
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </a>
            </div>
            <div className="flex gap-4">
              <div>
                <Label className="text-muted-foreground">Date</Label>
                <p className="font-medium">{formatDate(transaction.date)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Amount</Label>
                <p className="font-medium">{formatCurrency(transaction.amount)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={currentCategoryId} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                placeholder="Add a personal note..."
                value={currentNote}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
            {showAddRule && (
              <div className="space-y-2">
                <Label>Add Rule</Label>
                <Input
                  value={ruleKeyword}
                  onChange={(e) => setRuleKeyword(e.target.value)}
                  placeholder="Keyword to match"
                />
                <Button
                  variant="secondary"
                  onClick={handleSaveWithRule}
                  disabled={savingRule || !ruleKeyword.trim()}
                  className="w-full"
                >
                  {savingRule ? "Saving..." : "Save & Add Rule"}
                </Button>
              </div>
            )}
            <Button onClick={handleSave} disabled={saving || savingRule} className="w-full">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
