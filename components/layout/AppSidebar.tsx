"use client";

import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Wallet,
  Scissors,
  Shirt,
  CheckCircle2,
  Receipt,
  Building2,
  Boxes,
  BarChart3,
  Settings,
  Factory,
  ListOrdered,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { usePathname, useSearchParams } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { parseExpenseTab } from "@/lib/expenseRoutes";

interface AppSidebarProps {
  open: boolean;
}

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Orders", url: "/orders", icon: ClipboardList },
  { title: "Materials", url: "/materials", icon: Package },
  { title: "Inventory", url: "/inventory", icon: Boxes },
];

const expenseNav = [
  { title: "Order Expenses", url: "/expenses/orders", icon: ListOrdered },
  { title: "Local Suppliers", url: "/expenses/suppliers", icon: Wallet },
  { title: "Cutting", url: "/expenses/cutting", icon: Scissors },
  { title: "Stitching", url: "/expenses/stitching", icon: Shirt },
  { title: "Finishing & QC", url: "/expenses/finishing", icon: CheckCircle2 },
  { title: "Fixed Expenses", url: "/expenses/fixed", icon: Building2 },
  { title: "Admin Expenses", url: "/expenses/admin", icon: Receipt },
];

const insightsNav = [
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar({ open }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawOrderTab = pathname.startsWith("/expenses/orders/")
    ? searchParams.get("tab")
    : null;

  const isActive = (url: string) => {
    if (url === "/") return pathname === "/";
    if (url === "/expenses/orders") {
      return (
        pathname === "/expenses/orders" ||
        (pathname.startsWith("/expenses/orders/") && (!rawOrderTab || rawOrderTab === "local-buyer"))
      );
    }
    if (url === "/expenses/suppliers") {
      return pathname === "/expenses/suppliers" || pathname.startsWith("/expenses/suppliers/");
    }
    // Keep Cutting / Stitching / … highlighted when drilling into that order sheet
    if (
      url.startsWith("/expenses/") &&
      pathname.startsWith("/expenses/orders/") &&
      rawOrderTab &&
      rawOrderTab !== "local-buyer"
    ) {
      return url === `/expenses/${parseExpenseTab(rawOrderTab)}`;
    }
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  const activeItemClass =
    "!bg-primary/10 !text-primary font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-r-full before:bg-primary";

  const renderItem = (item: { title: string; url: string; icon: typeof LayoutDashboard }) => {
    const active = isActive(item.url);
    return (
    <li key={item.url}>
      {open ? (
        <NavLink
          href={item.url}
          end={item.url === "/"}
          className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${active ? activeItemClass : ""}`}
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" />
          <span className="truncate">{item.title}</span>
        </NavLink>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              href={item.url}
              end={item.url === "/"}
              className={`relative flex items-center justify-center rounded-md p-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                active ? "bg-primary/10 text-primary before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-r-full before:bg-primary" : ""
              }`}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">{item.title}</TooltipContent>
        </Tooltip>
      )}
    </li>
    );
  };

  const SectionLabel = ({ label }: { label: string }) =>
    open ? (
      <p className="label-caption mb-1 px-3">{label}</p>
    ) : (
      <div className="my-1 mx-2 h-px bg-sidebar-border" />
    );

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        style={{
          width: open ? "16rem" : "3.5rem",
          minWidth: open ? "16rem" : "3.5rem",
          transition: "width 200ms ease, min-width 200ms ease",
        }}
        className="flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar"
      >
        {/* Logo header */}
        <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-3">
          <div className={`flex items-center gap-2.5 ${open ? "" : "justify-center w-full"}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary shadow-card">
              <Factory className="h-5 w-5 text-primary-foreground" />
            </div>
            {open && (
              <div className="flex flex-col leading-tight overflow-hidden">
                <span className="truncate text-sm font-bold tracking-tight text-foreground">TextileERP</span>
                <span className="truncate text-[11px] text-muted-foreground">Production Suite</span>
              </div>
            )}
          </div>
        </div>

        {/* Nav content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
          {/* Workspace */}
          <div className="mb-4">
            <SectionLabel label="WORKSPACE" />
            <ul className="flex flex-col gap-1">{mainNav.map(renderItem)}</ul>
          </div>

          {/* Expenses */}
          <div className="mb-4">
            <SectionLabel label="EXPENSES" />
            <ul className="flex flex-col gap-1">{expenseNav.map(renderItem)}</ul>
          </div>

          {/* Insights */}
          <div className="mb-4">
            <SectionLabel label="INSIGHTS" />
            <ul className="flex flex-col gap-1">{insightsNav.map(renderItem)}</ul>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}