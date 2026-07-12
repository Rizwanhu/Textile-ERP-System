import { Outlet, useNavigate } from "react-router-dom";
import { Bell, Search, Plus, LogOut, User as UserIcon, Settings as SettingsIcon } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, getInitials } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

export function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const handleLogout = () => {
    logout();
    toast({ title: "Signed out", description: "See you next shift." });
    navigate("/auth", { replace: true });
  };
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-surface-1/80 px-3 backdrop-blur sm:gap-3 sm:px-4 lg:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

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
                onClick={() => navigate("/orders?new=1")}
                className="hidden gap-1.5 bg-primary text-primary-foreground hover:bg-primary-hover sm:inline-flex"
              >
                <Plus className="h-4 w-4" />
                New Order
              </Button>
              <Button
                size="icon"
                onClick={() => navigate("/orders?new=1")}
                className="bg-primary text-primary-foreground hover:bg-primary-hover sm:hidden"
                aria-label="New order"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="relative text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-warning" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Account menu"
                    className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground ring-offset-background transition-shadow hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2">
                    <UserIcon className="h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2">
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

          <main className="flex-1 min-w-0 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}