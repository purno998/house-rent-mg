import {supabase} from "./supabase.js";
import {monthKey, paymentTotal, rentTotal} from "./rents.js";

// Creates the month's rent rows for `units` from their base charges, carrying over each unit's
// remaining due (total - payments) from the previous month. Returns the inserted rows.
export async function createMonthlyRents(units, date) {
  const month = monthKey(date);
  const prevMonth = monthKey(new Date(date.getFullYear(), date.getMonth() - 1, 1));
  const ids = units.map(u => u.id);
  const [rents, payments] = await Promise.all([
    supabase.from('monthly_rents').select().eq('month', prevMonth).in('unit_id', ids),
    supabase.from('rent_payments').select().eq('month', prevMonth).in('unit_id', ids),
  ]);
  if (rents.error || payments.error) throw rents.error ?? payments.error;

  const rows = units.map(unit => {
    const prev = rents.data.find(r => r.unit_id === unit.id);
    const due = prev ? rentTotal(prev) - paymentTotal(payments.data.filter(p => p.unit_id === unit.id)) : 0;
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
