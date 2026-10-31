import {supabase} from "./supabase.js";
import {monthKey} from "./rents.js";

// Creates the month's rent rows for every unit that doesn't have one yet, carrying over each
// unit's unpaid remainder from the previous month. Atomic and idempotent — the work is done by
// public.create_monthly_rents (see supabase/schemas/06_create_monthly_rents.sql), so the bill
// total has a single definition. Returns the inserted rows.
export async function createMonthlyRents(date) {
  const {data, error} = await supabase.rpc('create_monthly_rents', {p_month: monthKey(date)});
  if (error) throw error;
  return data;
}
