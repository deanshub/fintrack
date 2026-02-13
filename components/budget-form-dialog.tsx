"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BudgetFormDialogProps {
  open: boolean;
  onClose: () => void;
  month: string;
  label: string;
  categoryId?: string;
  currentLimit: number | null;
}

export function BudgetFormDialog({
  open,
  onClose,
  month,
  label,
  categoryId,
  currentLimit,
}: BudgetFormDialogProps) {
  const { mutate } = useSWRConfig();
  const [amount, setAmount] = useState(currentLimit != null ? String(currentLimit / 100) : "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/budgets?month=${month}`);
      const existing = await res.json();

      const budget = existing ?? {
        month,
        globalLimit: null,
        categoryLimits: {},
      };

      const limitAgorot = amount ? Math.round(Number.parseFloat(amount) * 100) : null;

      if (categoryId) {
        if (limitAgorot != null) {
          budget.categoryLimits[categoryId] = limitAgorot;
        } else {
          delete budget.categoryLimits[categoryId];
        }
      } else {
        budget.globalLimit = limitAgorot;
      }

      await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budget),
      });

      await mutate((key: string) => typeof key === "string" && key.startsWith("/api/"));
      toast.success("Budget updated");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Budget — {label}</DialogTitle>
          <DialogDescription>
            Enter the monthly limit in shekels. Leave empty to remove.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Monthly Limit (₪)</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2000"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
