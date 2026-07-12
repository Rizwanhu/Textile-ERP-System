import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import OrderExpensesRoute from "./OrderExpensesRoute";

export default function Page({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OrderExpensesPageWrapper params={params} />
    </Suspense>
  );
}

async function OrderExpensesPageWrapper({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <OrderExpensesRoute orderId={orderId} />;
}
