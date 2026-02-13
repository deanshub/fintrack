"use client";

import { Database, RefreshCw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [recategorizing, setRecategorizing] = useState(false);

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed");
      } else {
        const parts = [`${data.source}: ${data.added} added, ${data.skipped} skipped`];
        if (data.warnings?.length) {
          parts.push(`${data.warnings.length} warning(s)`);
        }
        toast.success(parts.join(" | "));
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Seeding failed");
      } else {
        toast.success(
          `Seeded ${data.seeded.transactions} transactions across ${data.seeded.months} months`,
        );
      }
    } catch {
      toast.error("Seeding failed");
    } finally {
      setSeeding(false);
    }
  }

  async function handleRecategorize() {
    setRecategorizing(true);
    try {
      const res = await fetch("/api/transactions/categorize", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Re-categorization failed");
      } else {
        toast.success(`Re-categorized ${data.updated} transactions`);
      }
    } catch {
      toast.error("Re-categorization failed");
    } finally {
      setRecategorizing(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Transactions
          </CardTitle>
          <CardDescription>
            Upload a bank statement PDF (Isracard or Bank Hapoalim) to import transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Input ref={fileInputRef} type="file" accept=".pdf" className="max-w-xs" />
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Seed Mock Data
            </CardTitle>
            <CardDescription>
              Replace all data with randomly generated mock transactions, categories, and budgets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleSeed} disabled={seeding}>
              {seeding ? "Seeding..." : "Seed Mock Data"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Re-categorize All
            </CardTitle>
            <CardDescription>
              Re-run auto-categorization rules on all transactions that aren't manually categorized.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleRecategorize} disabled={recategorizing}>
              {recategorizing ? "Re-categorizing..." : "Re-categorize All"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
