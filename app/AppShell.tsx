"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/auth")) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}