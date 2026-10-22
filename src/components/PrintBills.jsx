import './PrintBills.css'
import {billTotal, bnMonth, bnUnitId, byUnitId, CHARGES, chargeableSpendings, taka} from "../utils/bills.js";

function Bill({unit, month}) {
  const rent = unit.monthlyRent;
  const rows = [
    ['মাস', month],
    ['ফ্ল্যাট নং', bnUnitId(unit.id)],
    ...CHARGES.filter(([key, , always]) => always || rent[key]).map(([key, label]) => [label, taka(rent[key]), true]),
    ...chargeableSpendings(unit).map(s => [s.reason, taka(s.amount), true]),
    ['বকেয়া', taka(rent.due), true],
  ];

  return (
    <div className="bill">
      {rows.map(([label, value, isAmount], i) => (
        <div className="bill-row" key={i}>
          <span>{label}</span>
          <span>:</span>
          <span className={isAmount ? 'amount' : undefined}>{value}</span>
        </div>
      ))}
      <div className="bill-row bill-total">
        <span>মোট</span>
        <span>:</span>
        <span className="amount">{taka(billTotal(unit))}</span>
      </div>
    </div>
  );
}

// Bill slips, four per A4 page
function PrintBills({units, date}) {
  const month = bnMonth(date);
  const sorted = [...units].sort(byUnitId);
  const pages = [];
  for (let i = 0; i < sorted.length; i += 4) pages.push(sorted.slice(i, i + 4));

  return pages.map((page, i) => (
    <section className="bills-page" key={i}>
      {page.map(unit => <Bill key={unit.id} unit={unit} month={month}/>)}
    </section>
  ));
}

export default PrintBills
