ALTER TABLE "public"."monthly_spendings"
  ALTER COLUMN "month" SET NOT NULL;

ALTER TABLE "public"."monthly_spendings"
  ADD CONSTRAINT "monthly_spendings_amount_positive" CHECK ((amount > 0));

ALTER TABLE "public"."monthly_spendings"
  ADD CONSTRAINT "monthly_spendings_general_not_chargeable" CHECK (((unit_id IS NOT NULL) OR (chargeable IS NOT TRUE)));

ALTER TABLE "public"."monthly_spendings"
  ADD CONSTRAINT "monthly_spendings_month_is_first_of_month" CHECK ((month = (date_trunc('month'::text, (month)::timestamp with time zone))::date));

ALTER TABLE "public"."monthly_spendings"
  ADD CONSTRAINT "monthly_spendings_reason_not_blank" CHECK ((btrim((reason)::text) <> ''::text));

ALTER TABLE "public"."rent_payments"
  ADD CONSTRAINT "rent_payments_amount_positive" CHECK ((amount > 0));

ALTER TABLE "public"."rent_payments"
  ADD CONSTRAINT "rent_payments_month_is_first_of_month" CHECK ((month = (date_trunc('month'::text, (month)::timestamp with time zone))::date));

CREATE INDEX monthly_spendings_unit_id_month_idx ON public.monthly_spendings USING btree (unit_id, month);

CREATE INDEX rent_payments_unit_id_month_idx ON public.rent_payments USING btree (unit_id, month);

COMMENT ON COLUMN "public"."units"."advance" IS 'Reserved, unused. Null for every row; no application code reads or writes it.';

REVOKE ALL ON TABLE "public"."units" FROM "anon";
REVOKE ALL ON TABLE "public"."monthly_rents" FROM "anon";
REVOKE ALL ON TABLE "public"."rent_payments" FROM "anon";
REVOKE ALL ON TABLE "public"."monthly_spendings" FROM "anon";
