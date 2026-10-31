SET local check_function_bodies = off;

ALTER TABLE "public"."monthly_spendings"
  ADD COLUMN "for_ab" boolean;

UPDATE "public"."monthly_spendings" SET "for_ab" = "forAB" WHERE "forAB" IS NOT NULL;

CREATE OR REPLACE FUNCTION public.monthly_spendings_sync_for_ab()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  if tg_op = 'INSERT' then
    if new.for_ab is null and new."forAB" is not null then
      new.for_ab := new."forAB";
    elsif new."forAB" is null and new.for_ab is not null then
      new."forAB" := new.for_ab;
    end if;
  else
    if new.for_ab is distinct from old.for_ab then
      new."forAB" := new.for_ab;
    elsif new."forAB" is distinct from old."forAB" then
      new.for_ab := new."forAB";
    end if;
  end if;
  return new;
end
$function$;

CREATE TRIGGER monthly_spendings_sync_for_ab
  BEFORE INSERT OR UPDATE ON public.monthly_spendings
  FOR EACH ROW
  EXECUTE FUNCTION public.monthly_spendings_sync_for_ab();

REVOKE ALL ON FUNCTION "public"."monthly_spendings_sync_for_ab"() FROM PUBLIC, "anon";

REVOKE ALL ON FUNCTION "public"."monthly_spendings_sync_for_ab"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."monthly_spendings_sync_for_ab"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."monthly_spendings_sync_for_ab"() TO "service_role";
