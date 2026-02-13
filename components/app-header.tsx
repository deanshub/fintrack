"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Fragment } from "react";
import useSWR from "swr";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { Category } from "@/lib/types";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/categories": "Categories",
  "/budgets": "Budgets",
  "/admin": "Admin",
};

export function AppHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: categories } = useSWR<Category[]>("/api/categories");

  const month = searchParams.get("month");
  const qs = month ? `?month=${month}` : "";

  const segments = pathname.split("/").filter(Boolean);

  const crumbs: { label: string; href?: string }[] = [];

  if (pathname === "/") {
    crumbs.push({ label: "Dashboard" });
  } else {
    crumbs.push({ label: "Dashboard", href: `/${qs}` });

    let accumulated = "";
    for (let i = 0; i < segments.length; i++) {
      accumulated += `/${segments[i]}`;
      const isLast = i === segments.length - 1;

      const knownTitle = PAGE_TITLES[accumulated];
      if (knownTitle) {
        crumbs.push(isLast ? { label: knownTitle } : { label: knownTitle, href: accumulated + qs });
      } else {
        // Dynamic segment — try to resolve a name
        const parentPath = accumulated.slice(0, accumulated.lastIndexOf("/"));
        let label = segments[i];

        if (parentPath === "/categories" && categories) {
          const cat = categories.find((c) => c.id === segments[i]);
          if (cat) label = cat.name;
        }

        crumbs.push(isLast ? { label } : { label, href: accumulated + qs });
      }
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <Fragment key={crumb.href ?? crumb.label}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.href ? (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
