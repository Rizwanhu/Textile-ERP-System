import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CategoryOverviewPage } from "../CategoryOverviewPage";
import { isOverviewTab, parseExpenseTab } from "@/lib/expenseRoutes";

export default async function Page({ params }: { params: Promise<{ tab: string }> }) {
  const { tab: raw } = await params;

  if (raw === "local-buyer") {
    redirect("/expenses/suppliers");
  }

  if (!isOverviewTab(raw)) {
    redirect("/expenses/orders");
  }

  const tab = parseExpenseTab(raw);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CategoryOverviewPage tab={tab} />
    </Suspense>
  );
}
