import {supabase} from "./supabase.js";
import {monthKey, paymentTotal} from "./rents.js";
import {billTotal} from "./bills.js";

// Creates the month's rent rows for `units` from their base charges, carrying over each unit's
// remaining due (previous month's bill total - payments). Returns the inserted rows.
export async function createMonthlyRents(units, date) {
  const month = monthKey(date);
  const prevMonth = monthKey(new Date(date.getFullYear(), date.getMonth() - 1, 1));
  const ids = units.map(u => u.id);
  const [rents, payments, spendings] = await Promise.all([
    supabase.from('monthly_rents').select().eq('month', prevMonth).in('unit_id', ids),
    supabase.from('rent_payments').select().eq('month', prevMonth).in('unit_id', ids),
    supabase.from('monthly_spendings').select().eq('month', prevMonth).in('unit_id', ids),
  ]);
  const fetchError = rents.error ?? payments.error ?? spendings.error;
  if (fetchError) throw fetchError;

  const rows = units.map(unit => {
    const prev = rents.data.find(r => r.unit_id === unit.id);
    const ofUnit = (list) => list.filter(r => r.unit_id === unit.id);
    // Same total as the dashboard and printed bills
    const due = prev
      ? billTotal({monthlyRent: prev, spendings: ofUnit(spendings.data)}) - paymentTotal(ofUnit(payments.data))
      : 0;
    return {
      unit_id: unit.id,
      month,
      rent: unit.rent,
      electricity: unit.electricity,
      water: unit.water,
      gas: unit.gas,
      garbage: unit.garbage,
      service_charge: unit.service_charge,
      due: due || null,
    };
  });
  const {error} = await supabase.from('monthly_rents').insert(rows);
  if (error) throw error;
  return rows;
}
