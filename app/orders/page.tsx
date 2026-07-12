import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import OrdersPage from "./OrdersPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OrdersPage />
    </Suspense>
  );
}
