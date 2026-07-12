"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const DEFAULT_DATA = [
  { m: "Nov", revenue: 11_760_000, expenses: 8_680_000 },
  { m: "Dec", revenue: 14_280_000, expenses: 9_940_000 },
  { m: "Jan", revenue: 13_160_000, expenses: 9_240_000 },
  { m: "Feb", revenue: 17_360_000, expenses: 11_480_000 },
  { m: "Mar", revenue: 19_880_000, expenses: 12_880_000 },
  { m: "Apr", revenue: 23_520_000, expenses: 14_560_000 },
];

type Point = { m: string; revenue: number; expenses: number };

export function RevenueChart({ data }: { data?: Point[] }) {
  const chartData = data?.length ? data : DEFAULT_DATA;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="section-header">Revenue vs Expenses</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Last 6 months · PKR</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /><span className="text-muted-foreground">Revenue</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet" /><span className="text-muted-foreground">Expenses</span></div>
        </div>
      </div>
      <div className="h-60 w-full">
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--violet))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--violet))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="m" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
            <Tooltip formatter={(v) => `Rs ${(Number(v) / 1_000_000).toFixed(2)}M`} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev)" strokeWidth={2} />
            <Area type="monotone" dataKey="expenses" stroke="hsl(var(--violet))" fill="url(#exp)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
