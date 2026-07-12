import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import OrderDetailPage from "../OrderDetailPage";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OrderDetailPageWrapper params={params} />
    </Suspense>
  );
}

async function OrderDetailPageWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailPage orderId={id} />;
}
