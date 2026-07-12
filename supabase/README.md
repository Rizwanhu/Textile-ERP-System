# Supabase setup for TextileERP

## 1. Environment variables

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

This project also accepts `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new Supabase key format).

## 2. Run the database migrations

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Run `supabase/migrations/001_initial_schema.sql`
3. Run `supabase/migrations/002_workspace_crud.sql` (material requirements + inventory extras)
4. Run `supabase/migrations/003_client_accounts_slug.sql` (client account URL slugs)
5. Click **Run** for each file

This creates all tables, RLS policies, and the signup trigger that provisions `profiles` + `workspace_settings`.

## 3. Auth settings (recommended)

In **Authentication → Providers → Email**:

- Enable email sign-in
- For development, you may disable **Confirm email** so signup works immediately

## 4. Tables overview

| Area | Tables |
|------|--------|
| Auth | `profiles`, `workspace_settings` |
| Clients & billing | `clients`, `client_line_items`, `invoices`, `payments`, `credit_notes` |
| Orders | `orders`, `order_size_breakdown`, `order_timeline` |
| Materials | `materials` |
| Inventory | `inventory`, `inventory_history` |
| Expenses | `local_buyer_items`, `cutting_sheets`, `stitching_sheets`, `finishing_sheets`, `fixed_expenses`, `admin_expenses` |

All user-owned rows are protected with Row Level Security (`auth.uid() = user_id`).

## 5. App auth flow

- **Middleware** (`middleware.ts`) refreshes the session and redirects unauthenticated users to `/auth`
- **Server actions** (`actions/auth.ts`) handle login, signup, logout
- **AuthContext** syncs the Supabase session and loads the user profile from `profiles`

After migration, sign up at `/auth` to create your workspace.
