import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => {
  return (
    <div className="mx-auto animate-fade-in p-4 lg:p-6" style={{ maxWidth: 1440 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-10 text-center shadow-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Construction className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">Module coming next</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          We're building this page step by step. The design system, navigation, and dashboard are live —
          this module will be implemented in the next iteration.
        </p>
      </div>
    </div>
  );
};

export default PlaceholderPage;