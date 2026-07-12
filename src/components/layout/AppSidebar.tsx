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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Orders", url: "/orders", icon: ClipboardList },
  { title: "Materials", url: "/materials", icon: Package },
  { title: "Inventory", url: "/inventory", icon: Boxes },
];

const expenseNav = [
  { title: "Local Buyer", url: "/expenses/local-buyer", icon: Wallet },
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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  const renderItem = (item: { title: string; url: string; icon: typeof LayoutDashboard }) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
        <NavLink
          to={item.url}
          end={item.url === "/"}
          className="relative flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeClassName="!bg-primary/10 !text-primary font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-r-full before:bg-primary"
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="truncate">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-16 border-b border-sidebar-border px-4">
        <div className={`flex h-full items-center gap-2.5 ${collapsed ? "justify-center" : "mr-8"}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary shadow-card">
            <Factory className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight text-foreground">TextileERP</span>
              <span className="text-[11px] text-muted-foreground">Production Suite</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 -ml-2">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="label-caption px-3">Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">{mainNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          {!collapsed && <SidebarGroupLabel className="label-caption px-3">Expenses</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">{expenseNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          {!collapsed && <SidebarGroupLabel className="label-caption px-3">Insights</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">{insightsNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}