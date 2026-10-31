CREATE VIEW "public"."unit_month_totals" WITH (security_invoker=true) AS
 SELECT unit_id, month, rent_total, extras,
    (rent_total + extras) AS total,
    paid,
    ((rent_total + extras) - paid) AS remaining
   FROM ( SELECT r.unit_id,
            r.month,
            ((((((COALESCE(r.rent, 0) + COALESCE(r.electricity, 0)) + COALESCE(r.water, 0)) + COALESCE(r.gas, 0)) + COALESCE(r.garbage, 0)) + COALESCE(r.service_charge, 0)) + COALESCE(r.due, 0)) AS rent_total,
            COALESCE(( SELECT (sum(s.amount))::integer AS sum
                   FROM public.monthly_spendings s
                  WHERE (((s.unit_id)::text = (r.unit_id)::text) AND (s.month = r.month) AND (s.chargeable IS TRUE))), 0) AS extras,
            COALESCE(( SELECT (sum(p.amount))::integer AS sum
                   FROM public.rent_payments p
                  WHERE (((p.unit_id)::text = (r.unit_id)::text) AND (p.month = r.month))), 0) AS paid
           FROM public.monthly_rents r) t;

GRANT SELECT ON TABLE "public"."unit_month_totals" TO "authenticated";
REVOKE ALL ON TABLE "public"."unit_month_totals" FROM "anon";
