-- Creates the month's rent rows for units that don't have one yet, copying each unit's base
-- charges and carrying over last month's unpaid remainder. Replaces the read-compute-write
-- that used to live in src/utils/createRents.js, so the carry-over is atomic and the bill
-- total has exactly one definition (unit_month_totals).
create function public.create_monthly_rents(p_month date)
returns setof public.monthly_rents
language sql
security invoker
set search_path = ''
as $$
  insert into public.monthly_rents
    (unit_id, month, rent, electricity, water, gas, garbage, service_charge, due)
  select u.id, p_month, u.rent, u.electricity, u.water, u.gas, u.garbage, u.service_charge,
         nullif(coalesce(t.remaining, 0), 0)
  from public.units u
  left join public.unit_month_totals t
    on t.unit_id = u.id
   and t.month = (p_month - interval '1 month')::date
  where not exists (
    select 1 from public.monthly_rents r
    where r.unit_id = u.id and r.month = p_month
  )
  returning *;
$$;

revoke all on function public.create_monthly_rents(date) from public, anon;
grant execute on function public.create_monthly_rents(date) to authenticated;
