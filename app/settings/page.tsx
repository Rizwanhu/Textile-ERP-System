"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings as SettingsIcon, Building2, Users, Sliders, FileText, Plus, Save, Trash2, Mail, LogOut, User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/currency";
import { toast } from "@/hooks/use-toast";
import { FIXED_EXPENSES, type FixedExpenseRow } from "@/data/expenses";
import { useAuth, getInitials } from "@/context/AuthContext";

type User = { id: string; name: string; email: string; role: "Owner" | "Manager" | "Operator" | "Viewer"; status: "active" | "invited" };

const INITIAL_USERS: User[] = [
  { id: "u1", name: "Asad Khan",     email: "asad@textileerp.pk",     role: "Owner",    status: "active" },
  { id: "u2", name: "Saima Riaz",    email: "saima@textileerp.pk",    role: "Manager",  status: "active" },
  { id: "u3", name: "Imran Qureshi", email: "imran@textileerp.pk",    role: "Operator", status: "active" },
  { id: "u4", name: "Naseem Akhtar", email: "naseem@textileerp.pk",   role: "Operator", status: "invited" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [workspace, setWorkspace] = useState({
    name: "TextileERP — Demo Factory",
    legal: "Demo Apparel Pvt. Ltd.",
    address: "Plot 22, MIDC Industrial Area, Faisalabad",
    currency: "PKR",
    fiscalStart: "07",
    timezone: "Asia/Karachi",
  });
  const [prefs, setPrefs] = useState({
    darkMode: true,
    compactTables: false,
    notifyOverdue: true,
    notifyLowStock: true,
    autoAllocateFixed: true,
  });
  const [templates, setTemplates] = useState<FixedExpenseRow[]>(FIXED_EXPENSES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [newTemplate, setNewTemplate] = useState({ category: "", monthly: "", allocated: "" });
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Operator" as User["role"] });

  const addTemplate = () => {
    if (!newTemplate.category) { toast({ title: "Category required", variant: "destructive" }); return; }
    setTemplates((p) => [...p, {
      id: `fx_${Date.now()}`,
      category: newTemplate.category,
      monthly: Number(newTemplate.monthly) || 0,
      allocated: Number(newTemplate.allocated) || 0,
    }]);
    setNewTemplate({ category: "", monthly: "", allocated: "" });
    toast({ title: "Template added" });
  };
  const removeTemplate = (id: string) => setTemplates((p) => p.filter((t) => t.id !== id));

  const inviteUser = () => {
    if (!newUser.name || !newUser.email) { toast({ title: "Name & email required", variant: "destructive" }); return; }
    setUsers((p) => [...p, { ...newUser, id: `u_${Date.now()}`, status: "invited" }]);
    toast({ title: "Invitation sent", description: `${newUser.email} invited as ${newUser.role}.` });
    setNewUser({ name: "", email: "", role: "Operator" });
  };
  const removeUser = (id: string) => setUsers((p) => p.filter((u) => u.id !== id));

  const handleSignOut = () => {
    logout();
    toast({ title: "Signed out" });
    router.replace("/auth");
  };

  return (
    <div className="mx-auto animate-fade-in space-y-6 p-4 lg:p-6" style={{ maxWidth: 1440 }}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage workspace, fixed expense templates, users &amp; preferences.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" className="gap-2 border-border bg-card text-danger hover:bg-danger/10 hover:text-danger" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
          <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" onClick={() => toast({ title: "Settings saved" })}>
            <Save className="h-4 w-4" /> Save changes
          </Button>
        </div>
      </div>

      {/* Account session card */}
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
              {getInitials(user?.name ?? "User")}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{user?.name ?? "Guest"}</span>
                <Badge variant="secondary" className="border-0 bg-primary/15 text-[10px] uppercase text-primary">{user?.role ?? "Owner"}</Badge>
              </div>
              <div className="truncate text-xs text-muted-foreground">{user?.email ?? "—"} · Signed in to this device</div>
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-2 border-border bg-card text-danger hover:bg-danger/10 hover:text-danger" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </section>

      <Tabs defaultValue="workspace" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="workspace" className="gap-2"><Building2 className="h-4 w-4" />Workspace</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><FileText className="h-4 w-4" />Fixed Templates</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />Users</TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2"><Sliders className="h-4 w-4" />Preferences</TabsTrigger>
        </TabsList>

        {/* Workspace */}
        <TabsContent value="workspace">
          <Card title="Workspace details" subtitle="Your factory profile across the app and PDFs.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display name"><Input value={workspace.name} onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })} className="bg-surface-3 border-border" /></Field>
              <Field label="Legal entity"><Input value={workspace.legal} onChange={(e) => setWorkspace({ ...workspace, legal: e.target.value })} className="bg-surface-3 border-border" /></Field>
              <div className="sm:col-span-2">
                <Field label="Address"><Textarea rows={2} value={workspace.address} onChange={(e) => setWorkspace({ ...workspace, address: e.target.value })} className="bg-surface-3 border-border" /></Field>
              </div>
              <Field label="Currency">
                <Select value={workspace.currency} onValueChange={(v) => setWorkspace({ ...workspace, currency: v })}>
                  <SelectTrigger className="bg-surface-3 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PKR">Pakistani Rupee (Rs)</SelectItem>
                    <SelectItem value="USD">US Dollar (US$)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Fiscal year starts (month)">
                <Select value={workspace.fiscalStart} onValueChange={(v) => setWorkspace({ ...workspace, fiscalStart: v })}>
                  <SelectTrigger className="bg-surface-3 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m) => (
                      <SelectItem key={m} value={m}>{new Date(2026, Number(m) - 1, 1).toLocaleString("en-US", { month: "long" })}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Timezone"><Input value={workspace.timezone} onChange={(e) => setWorkspace({ ...workspace, timezone: e.target.value })} className="bg-surface-3 border-border" /></Field>
            </div>
          </Card>
        </TabsContent>

        {/* Fixed Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card title="Fixed expense templates" subtitle="Recurring overheads auto-allocated to each new order.">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-surface-1 hover:bg-surface-1">
                  <TableHead className="label-caption">Category</TableHead>
                  <TableHead className="label-caption text-right">Monthly</TableHead>
                  <TableHead className="label-caption text-right">Default allocation</TableHead>
                  <TableHead className="label-caption" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{t.category}</TableCell>
                    <TableCell className="text-right tabular text-muted-foreground">{formatPKR(t.monthly)}</TableCell>
                    <TableCell className="text-right tabular font-medium text-foreground">{formatPKR(t.allocated)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-danger" onClick={() => removeTemplate(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="grid gap-3 border-t border-border bg-surface-1 p-4 sm:grid-cols-[1fr,160px,160px,auto]">
              <Input value={newTemplate.category} onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })} placeholder="New category (e.g. Internet)" className="bg-surface-3 border-border" />
              <Input type="number" min={0} value={newTemplate.monthly} onChange={(e) => setNewTemplate({ ...newTemplate, monthly: e.target.value })} placeholder="Monthly Rs" className="bg-surface-3 border-border" />
              <Input type="number" min={0} value={newTemplate.allocated} onChange={(e) => setNewTemplate({ ...newTemplate, allocated: e.target.value })} placeholder="Per-order Rs" className="bg-surface-3 border-border" />
              <Button onClick={addTemplate} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary-hover">
                <Plus className="h-4 w-4" /> Add template
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="space-y-4">
          <Card title="Team members" subtitle="Invite teammates and assign a role.">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-surface-1 hover:bg-surface-1">
                  <TableHead className="label-caption">Name</TableHead>
                  <TableHead className="label-caption">Email</TableHead>
                  <TableHead className="label-caption">Role</TableHead>
                  <TableHead className="label-caption">Status</TableHead>
                  <TableHead className="label-caption" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Badge variant="secondary" className="border-0 bg-surface-3 text-foreground">{u.role}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("border-0", u.status === "active" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
                        {u.status === "active" ? "Active" : "Invited"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-danger" onClick={() => removeUser(u.id)} disabled={u.role === "Owner"}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="grid gap-3 border-t border-border bg-surface-1 p-4 sm:grid-cols-[1fr,1fr,160px,auto]">
              <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" className="bg-surface-3 border-border" />
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@company.pk" className="bg-surface-3 border-border" />
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as User["role"] })}>
                <SelectTrigger className="bg-surface-3 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Manager", "Operator", "Viewer"] as const).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={inviteUser} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary-hover">
                <Mail className="h-4 w-4" /> Invite
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences">
          <Card title="Preferences" subtitle="Tweak the look and notifications.">
            <ul className="divide-y divide-border">
              <Pref label="Dark mode"          desc="Use the industrial dark theme." checked={prefs.darkMode} onChange={(v) => setPrefs({ ...prefs, darkMode: v })} />
              <Pref label="Compact tables"     desc="Show more rows per page." checked={prefs.compactTables} onChange={(v) => setPrefs({ ...prefs, compactTables: v })} />
              <Pref label="Notify on overdue orders" desc="Email me when an order crosses delivery date." checked={prefs.notifyOverdue} onChange={(v) => setPrefs({ ...prefs, notifyOverdue: v })} />
              <Pref label="Notify on low stock"      desc="Email when stock drops below reorder level." checked={prefs.notifyLowStock} onChange={(v) => setPrefs({ ...prefs, notifyLowStock: v })} />
              <Pref label="Auto-allocate fixed expenses" desc="Apply fixed templates to new orders automatically." checked={prefs.autoAllocateFixed} onChange={(v) => setPrefs({ ...prefs, autoAllocateFixed: v })} />
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <header className="border-b border-border px-6 py-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Pref({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <li className="flex items-center justify-between gap-6 py-3">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </li>
  );
}
