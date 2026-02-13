"use client";

import { ArrowLeftRight, LayoutDashboard, Settings, Tag, Target } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: ArrowLeftRight, label: "Transactions", href: "/transactions" },
  { icon: Tag, label: "Categories", href: "/categories" },
  { icon: Target, label: "Budgets", href: "/budgets" },
  { icon: Settings, label: "Admin", href: "/admin" },
];

export function AppSidebar() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month");

  function buildHref(base: string) {
    if (!month) return base;
    return `${base}?month=${month}`;
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            ₪
          </div>
          <span className="font-semibold text-lg">Fintrack</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <Link href={buildHref(item.href)}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
