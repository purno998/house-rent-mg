import './PrintSheet.css'
import {paymentTotal} from "../utils/rents.js";
import {billTotal, bnMonth, bnUnitId, byUnitId, CHARGES, extraCharges, taka} from "../utils/bills.js";

// The expense table is padded with blank rows up to this, for handwritten extras
const MIN_EXPENSE_ROWS = 10;

// Monthly collection sheet: one row per unit with blank পাওনা/আদায় to fill in by hand,
// then the month's general spendings and the sheet's unit spendings
function PrintSheet({units, generalSpendings, date}) {
  const sorted = [...units].sort(byUnitId);
  const expenses = [
    ...generalSpendings.map(s => ({id: s.id, label: s.reason, amount: s.amount})),
    ...sorted.flatMap(u => u.spendings.map(s => ({id: s.id, label: `${bnUnitId(u.id)}: ${s.reason}`, amount: s.amount}))),
  ];
  const blankRows = Math.max(MIN_EXPENSE_ROWS - expenses.length, 0);
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
          {expenses.map(e => (
            <tr key={e.id}>
              <td>{e.label}</td>
              <td>{taka(e.amount)}</td>
            </tr>
          ))}
          {Array.from({length: blankRows}, (_, i) => (
            <tr key={`blank-${i}`}>
              <td/>
              <td/>
            </tr>
          ))}
        </tbody>
      </table>
      <p>মোট খরচ: {taka(paymentTotal(expenses))}</p>
    </section>
  );
}

export default PrintSheet
