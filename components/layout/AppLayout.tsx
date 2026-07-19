"use client";

import { Bell, Search, Plus, LogOut, User as UserIcon, Settings as SettingsIcon, PanelLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials, useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    toast({ title: "Signed out", description: "See you next shift." });
    await logout();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar — real flex item, never overlaps */}
      <Suspense fallback={<aside className="h-full shrink-0 border-r border-sidebar-border bg-sidebar" style={{ width: sidebarOpen ? "16rem" : "3.5rem" }} />}>
        <AppSidebar open={sidebarOpen} />
      </Suspense>

      {/* Main content column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-surface-1/80 px-3 backdrop-blur sm:gap-3 sm:px-4 lg:px-6">
          {/* Sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-transform hover:scale-105 active:scale-95"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>

          <div className="relative hidden min-w-0 flex-1 max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders, SKUs, suppliers…"
              className="h-9 border-border bg-surface-2 pl-9 text-sm placeholder:text-muted-foreground/70 focus-visible:ring-primary/40"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => router.push("/orders?new=1")}
              className="hidden gap-1.5 bg-primary text-primary-foreground hover:bg-primary-hover sm:inline-flex transition-transform hover:scale-105 active:scale-95 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Order
            </Button>
            <Button
              size="icon"
              onClick={() => router.push("/orders?new=1")}
              className="bg-primary text-primary-foreground hover:bg-primary-hover sm:hidden transition-transform hover:scale-105 active:scale-95 shadow-sm"
              aria-label="New order"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="relative text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-transform hover:scale-105 active:scale-95">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-warning" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account menu"
                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground ring-offset-background transition-all hover:shadow-card hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {getInitials(user?.name ?? "User")}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-border bg-card">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold text-foreground">{user?.name ?? "Guest"}</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">{user?.email ?? "—"}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => router.push("/settings")} className="gap-2">
                  <UserIcon className="h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")} className="gap-2">
                  <SettingsIcon className="h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-danger focus:text-danger">
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}