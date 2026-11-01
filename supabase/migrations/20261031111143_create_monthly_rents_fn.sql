SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_monthly_rents (
  p_month date
)
  RETURNS SETOF public.monthly_rents
  LANGUAGE sql
  SET search_path TO ''
  AS $function$
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
$function$;

REVOKE ALL ON FUNCTION "public"."create_monthly_rents"(date) FROM PUBLIC, "anon";

GRANT EXECUTE ON FUNCTION "public"."create_monthly_rents"(date) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."create_monthly_rents"(date) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_monthly_rents"(date) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_monthly_rents"(date) TO "service_role";
