-- The single source of truth for a unit's monthly money.
-- rent_total mirrors RENT_COLS in src/utils/rents.js; extras counts chargeable spendings only.
-- security_invoker is required: without it a view runs as its owner and bypasses RLS.
create view public.unit_month_totals with (security_invoker = true) as
select unit_id, month, rent_total, extras,
       rent_total + extras as total,
       paid,
       rent_total + extras - paid as remaining
from (
  select r.unit_id,
         r.month,
         coalesce(r.rent, 0) + coalesce(r.electricity, 0) + coalesce(r.water, 0)
           + coalesce(r.gas, 0) + coalesce(r.garbage, 0) + coalesce(r.service_charge, 0)
           + coalesce(r.due, 0) as rent_total,
         coalesce((select sum(s.amount)::int from public.monthly_spendings s
                   where s.unit_id = r.unit_id and s.month = r.month and s.chargeable is true), 0) as extras,
         coalesce((select sum(p.amount)::int from public.rent_payments p
                   where p.unit_id = r.unit_id and p.month = r.month), 0) as paid
  from public.monthly_rents r
) t;

grant select on public.unit_month_totals to authenticated;
