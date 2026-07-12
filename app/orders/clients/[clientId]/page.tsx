import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ClientAccountPage from "../../ClientAccountPage";

export default function Page({ params }: { params: Promise<{ clientId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ClientAccountPageWrapper params={params} />
    </Suspense>
  );
}

async function ClientAccountPageWrapper({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  return <ClientAccountPage clientId={clientId} />;
}
