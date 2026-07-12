import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ExpensesPage } from "../ExpensesPage";

export default async function Page({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ExpensesPage pathTab={tab} />
    </Suspense>
  );
}
