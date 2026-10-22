import './PrintSheet.css'
import {billTotal, bnMonth, bnUnitId, byUnitId, CHARGES, extraCharges, taka} from "../utils/bills.js";

const EXPENSES = ['গার্ডের বেতন + সিঁড়ি মুছা', 'পানির বিল', 'চেক মিটার'];
const EXPENSE_ROWS = 10;

// Monthly collection sheet: one row per unit, blank columns/totals and an expense table filled in by hand
function PrintSheet({units, date}) {
  const sorted = [...units].sort(byUnitId);
  // Optional columns only appear when some unit on the sheet uses them
  const charges = CHARGES.filter(([key, , always]) => always || sorted.some(u => u.monthlyRent[key]));
  const hasExtras = sorted.some(u => extraCharges(u));

  return (
    <section className="sheet">
      <h1>মাস: {bnMonth(date)}</h1>
      <table>
        <thead>
          <tr>
            <th>ফ্ল্যাট নং</th>
            {charges.map(([key, label]) => <th key={key}>{label}</th>)}
            {hasExtras && <th>অন্যান্য</th>}
            <th>বকেয়া</th>
            <th>মোট</th>
            <th>পাওনা</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(unit => (
            <tr key={unit.id}>
              <td className="unit">{bnUnitId(unit.id)}</td>
              {charges.map(([key]) => <td key={key}>{taka(unit.monthlyRent[key])}</td>)}
              {hasExtras && <td>{taka(extraCharges(unit))}</td>}
              <td>{taka(unit.monthlyRent.due)}</td>
              <td>{taka(billTotal(unit))}</td>
              <td/>
            </tr>
          ))}
        </tbody>
      </table>
      <p>মোট আদায়:</p>

      <h2>খরচ</h2>
      <table className="expenses">
        <thead>
          <tr>
            <th>খাত</th>
            <th>পরিমান</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({length: EXPENSE_ROWS}, (_, i) => (
            <tr key={i}>
              <td>{EXPENSES[i]}</td>
              <td/>
            </tr>
          ))}
        </tbody>
      </table>
      <p>মোট খরচ:</p>
    </section>
  );
}

export default PrintSheet
