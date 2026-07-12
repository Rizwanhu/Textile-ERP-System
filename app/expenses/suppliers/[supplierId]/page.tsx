import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import SupplierAccountPage from "../SupplierAccountPage";

async function SupplierAccountPageWrapper({ params }: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await params;
  return <SupplierAccountPage supplierId={supplierId} />;
}

export default function Page({ params }: { params: Promise<{ supplierId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SupplierAccountPageWrapper params={params} />
    </Suspense>
  );
}
