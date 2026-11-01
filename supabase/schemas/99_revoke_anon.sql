-- Supabase grants anon full DML on every new table by default, and `declarative sync`
-- regenerates those grants unless the revocation is declared here. Nothing in this app
-- queries unauthenticated, so anon gets nothing.
revoke all on table public.units from anon;
revoke all on table public.monthly_rents from anon;
revoke all on table public.rent_payments from anon;
revoke all on table public.monthly_spendings from anon;
revoke all on table public.unit_month_totals from anon;

revoke all on function public.monthly_spendings_sync_for_ab() from public, anon;
