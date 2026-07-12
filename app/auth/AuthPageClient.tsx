"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Factory, Loader2, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "signup";

export function AuthPageClient({ initial = "login" }: { initial?: Mode }) {
  const searchParams = useSearchParams();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>(initial);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const from = searchParams.get("from") ?? "/";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        toast({
          title: "Welcome back",
          description: `Signed in as ${form.email}`,
        });
      } else {
        const result = await signup(form.name, form.email, form.password);
        if (result.needsEmailConfirmation) {
          toast({
            title: "Confirm your email",
            description:
              "We sent a confirmation link. After confirming, sign in with your password.",
          });
          setMode("login");
          return;
        }
        toast({
          title: "Account created",
          description: `Welcome, ${form.name || form.email}`,
        });
      }

      // Full navigation so middleware picks up the new auth cookies reliably.
      window.location.assign(from);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({
        title: mode === "login" ? "Sign in failed" : "Sign up failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-violet/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.08),transparent_60%)]" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:grid-cols-[1.05fr_1fr]">
        <aside className="hidden flex-col justify-between border-r border-border bg-surface-1 p-10 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-card">
              <Factory className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-bold tracking-tight text-foreground">TextileERP</div>
              <div className="text-xs text-muted-foreground">Production Suite</div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold leading-tight text-foreground">
              Run your factory floor with one calm, focused dashboard.
            </h2>
            <p className="text-sm text-muted-foreground">
              Orders, materials, expenses and reports — every PKR tracked, every stage in view.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-muted-foreground">
              {[
                "Order pipeline & timelines",
                "Material sourcing & stock",
                "Cutting → Stitching → Finishing workflow",
                "Expenses & PDF reports",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-muted-foreground/80">© 2026 TextileERP</p>
        </aside>

        <section className="p-6 sm:p-10">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
              <Factory className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-foreground">TextileERP</div>
              <div className="text-[11px] text-muted-foreground">Production Suite</div>
            </div>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {mode === "login" ? "Sign in to your workspace" : "Create your workspace"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Welcome back. Sign in with your email and password."
              : "Start a new factory workspace in seconds."}
          </p>

          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="mt-6">
            <TabsList className="grid w-full grid-cols-2 bg-surface-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <TabsContent value="signup" className="m-0 space-y-4">
                <Field label="Full name" icon={<User className="h-4 w-4" />}>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Asad Khan"
                    autoComplete="name"
                    required={mode === "signup"}
                    className="bg-surface-3 border-border pl-9"
                  />
                </Field>
              </TabsContent>

              <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@factory.pk"
                  autoComplete="email"
                  required
                  className="bg-surface-3 border-border pl-9"
                />
              </Field>

              <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  className="bg-surface-3 border-border pl-9"
                />
              </Field>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary-hover"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "login" ? (
              <>
                New here?{" "}
                <button type="button" onClick={() => setMode("signup")} className="font-semibold text-primary hover:underline">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => setMode("login")} className="font-semibold text-primary hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="mt-4 text-center text-[11px] text-muted-foreground/70">
            Auth is stored in Supabase · user saved to <code className="text-[10px]">auth.users</code>
          </p>
        </section>
      </div>
    </main>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        {children}
      </div>
    </div>
  );
}
