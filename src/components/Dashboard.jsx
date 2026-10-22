import {useEffect, useState, useSyncExternalStore} from 'react'
import {supabase} from "../utils/supabase.js";
import {fmt, monthKey, paymentTotal, RENT_COLS, rentTotal} from "../utils/rents.js";
import {createMonthlyRents} from "../utils/createRents.js";
import PaymentDialog from "./PaymentDialog.jsx";
import EntryListDialog from "./EntryListDialog.jsx";
import SpendingDialog from "./SpendingDialog.jsx";
import Menu from "./Menu.jsx";
import Printable from "./Printable.jsx";
import PrintBills from "./PrintBills.jsx";
import PrintSheet from "./PrintSheet.jsx";

const MONTHS = Array.from({length: 12}, (_, i) =>
  new Intl.DateTimeFormat('en-US', {month: 'long'}).format(new Date(2000, i, 1)));
const now = new Date();
const thisYear = now.getFullYear();
const thisMonth = now.getMonth();
const YEARS = [thisYear, thisYear - 1, thisYear - 2];

const TABLES = {payment: 'rent_payments', spending: 'monthly_spendings'};

function subscribeOnline(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

const Icon = ({children}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const ListIcon = () => (
  <Icon>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
  </Icon>
);
const PlusIcon = () => <Icon><path d="M12 5v14M5 12h14"/></Icon>;
const MinusIcon = () => <Icon><path d="M5 12h14"/></Icon>;
const CalendarPlusIcon = () => (
  <Icon>
    <path d="M8 2v4M16 2v4M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8M3 10h18M16 19h6M19 16v6"/>
  </Icon>
);
const PrinterIcon = () => (
  <Icon>
    <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <path d="M6 14h12v8H6z"/>
  </Icon>
);
const LogoutIcon = () => (
  <Icon>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <path d="M16 17l5-5-5-5M21 12H9"/>
  </Icon>
);
const ReceiptIcon = () => (
  <Icon>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 17.5v-11"/>
  </Icon>
);

function Dashboard({session, date, onDateChange}) {
  const [error, setError] = useState(null);
  const [units, setUnits] = useState([]);
  const [payingUnit, setPayingUnit] = useState(null);
  const [generalSpendings, setGeneralSpendings] = useState([]);
  // {unitId}, with unitId null for a general spending
  const [spending, setSpending] = useState(null);
  // {kind: 'payment' | 'spending', unitId}, with unitId null for general spendings
  const [listing, setListing] = useState(null);
  // Looked up on each render so an open list reflects reloads
  const listingEntries = !listing ? null
    : listing.unitId === null ? generalSpendings
      : units.find(u => u.id === listing.unitId)?.[`${listing.kind}s`] ?? [];
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine);
  const [reload, setReload] = useState(0);
  const reloadData = () => setReload(r => r + 1);
  const firstDayOfMonth = monthKey(date);
  const monthLabel = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  const unitsWithoutRent = units.filter(u => !u.monthlyRent);
  const unitsWithRent = units.filter(u => u.monthlyRent);
  // e.g. "AB" -> units 1A, 1B, 2A, ...
  const sheetUnits = (letters) => unitsWithRent.filter(u => letters.includes(u.id.slice(-1)));
  // {kind: 'bills'} or {kind: 'sheet', letters}; rendered only while printing
  const [printJob, setPrintJob] = useState(null);

  useEffect(() => {
    if (!printJob) return;
    const done = () => setPrintJob(null);
    window.addEventListener('afterprint', done);
    // The printout's font isn't used on screen, so the browser hasn't fetched it yet
    document.fonts.load('1em "Noto Sans Bengali"', 'অ').then(() => window.print());
    return () => window.removeEventListener('afterprint', done);
  }, [printJob]);

  async function createRents() {
    if (!window.confirm(`Create ${monthLabel} rent for ${unitsWithoutRent.length} unit(s)?`)) return;
    try {
      const rows = await createMonthlyRents(unitsWithoutRent, date);
      reloadData();
      const negative = rows.filter(r => r.due < 0);
      if (negative.length) {
        window.alert('Rents created, but these units carried over a negative due from last month. ' +
          'Something looks wrong, please check:\n\n' + negative.map(r => `${r.unit_id}: ${fmt(r.due)}`).join('\n'));
      }
    } catch (e) {
      setError({month: firstDayOfMonth, message: e.message});
    }
  }

  useEffect(() => {
    async function getUnits() {
      const {data, error, status} = await supabase.from('units').select();
      console.log({data, error, status, user: session.user.email});
      if (error) setError({month: firstDayOfMonth, message: error.message});
      else if (data) {
        return data;
      }
    }

    async function getRents() {
      const {data, error, status} = await supabase.from('monthly_rents').select().eq('month', firstDayOfMonth);
      console.log({data, error, status, user: session.user.email});
      if (error) setError({month: firstDayOfMonth, message: error.message});
      else if (data) {
        return data;
      }
    }

    async function getPayments() {
      const {data, error, status} = await supabase.from('rent_payments').select().eq('month', firstDayOfMonth).order('created_at');
      console.log({data, error, status, user: session.user.email});
      if (error) setError({month: firstDayOfMonth, message: error.message});
      else if (data) {
        return data;
      }
    }

    async function getSpendings() {
      const {data, error, status} = await supabase.from('monthly_spendings').select().eq('month', firstDayOfMonth).order('created_at');
      console.log({data, error, status, user: session.user.email});
      if (error) setError({month: firstDayOfMonth, message: error.message});
      else if (data) {
        return data;
      }
    }

    Promise.all([getUnits(), getRents(), getPayments(), getSpendings()]).then(result => {
      for (const unit of result[0]) {
        const rent = result[1].find(r => r.unit_id === unit.id);
        const payments = result[2].filter(r => r.unit_id === unit.id);
        unit.spendings = result[3].filter(s => s.unit_id === unit.id);

        if (rent) {
          // Not `unit.rent`: that's the unit's base rent column
          unit.monthlyRent = rent;
          unit.payments = payments;
          unit.total = rentTotal(rent);
          unit.payment = paymentTotal(payments);
          unit.due = unit.total - unit.payment;
        }
      }

      console.log(result[0]);
      setUnits(result[0]);
      setGeneralSpendings(result[3].filter(s => s.unit_id === null));
    }).catch(error => {
      console.log(error);
      // Don't leave the previous month's cards under the new month's name
      setUnits([]);
      setGeneralSpendings([]);
    });
  }, [session, firstDayOfMonth, reload]);

  return (
    <>
      <div className="page-header">
        <div className="period">
          <select aria-label="Month" value={date.getMonth()}
                  onChange={e => onDateChange(new Date(date.getFullYear(), Number(e.target.value), 1))}>
            {MONTHS.map((name, i) => (
              <option key={name} value={i} disabled={date.getFullYear() === thisYear && i > thisMonth}>{name}</option>
            ))}
          </select>
          <select aria-label="Year" value={date.getFullYear()} onChange={e => {
            const year = Number(e.target.value);
            // Switching to this year from a later month would land in the future
            const month = year === thisYear ? Math.min(date.getMonth(), thisMonth) : date.getMonth();
            onDateChange(new Date(year, month, 1));
          }}>
            {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <Menu label="More actions" items={[
          {
            label: `Create ${monthLabel} rents`, icon: <CalendarPlusIcon/>, disabled: !unitsWithoutRent.length,
            title: unitsWithoutRent.length ? undefined : 'Every unit already has rent for this month',
            onClick: createRents,
          },
          {
            label: `Print ${monthLabel} bills`, icon: <PrinterIcon/>, disabled: !unitsWithRent.length,
            title: unitsWithRent.length ? undefined : 'No rent set for this month',
            onClick: () => setPrintJob({kind: 'bills'}),
          },
          ...['AB', 'CD'].map(letters => ({
            label: `Print ${letters[0]} & ${letters[1]} sheet`, icon: <PrinterIcon/>,
            disabled: !sheetUnits(letters).length,
            title: sheetUnits(letters).length ? undefined : `No ${letters[0]}/${letters[1]} unit has rent this month`,
            onClick: () => setPrintJob({kind: 'sheet', letters}),
          })),
          {
            label: 'Show general spendings', icon: <ReceiptIcon/>, disabled: !generalSpendings.length,
            title: generalSpendings.length ? undefined : 'No general spendings this month',
            onClick: () => setListing({kind: 'spending', unitId: null}),
          },
          {label: 'Add general spending', icon: <MinusIcon/>, onClick: () => setSpending({unitId: null})},
          {
            label: 'Log out', icon: <LogoutIcon/>,
            onClick: async () => {
              // Data the service worker saved for offline use (see public/sw.js)
              await window.caches?.delete('supabase-data');
              supabase.auth.signOut();
            },
          },
        ]}/>
      </div>
      {!online && (
        <p className="offline">
          You're offline, showing the data from when you last opened this month. Changes won't be saved.
        </p>
      )}
      {error?.month === firstDayOfMonth && <p className="error">{error.message}</p>}
      <div className="main flex flex-col md:flex-row">
        {units.map((unit) => (
          <div className="card flex-auto" key={unit.id}>
            <div className="card-header flex flex-col">
              <span className={`id ${unit.due > 0 ? 'has-due' : ''}`}>{unit.id}</span>
              {/* Unit payments and spendings need this month's rent row to exist (foreign key) */}
              <Menu label={`Actions for ${unit.id}`} items={[
                {
                  label: 'Show payments', icon: <ListIcon/>, disabled: !unit.payments?.length,
                  title: unit.payments?.length ? undefined : 'No payments this month',
                  onClick: () => setListing({kind: 'payment', unitId: unit.id}),
                },
                {
                  label: 'Add payment', icon: <PlusIcon/>, disabled: !unit.monthlyRent,
                  title: unit.monthlyRent ? undefined : 'No rent set for this month',
                  onClick: () => setPayingUnit(unit),
                },
                {
                  label: 'Show spendings', icon: <ReceiptIcon/>, disabled: !unit.spendings.length,
                  title: unit.spendings.length ? undefined : 'No spendings this month',
                  onClick: () => setListing({kind: 'spending', unitId: unit.id}),
                },
                {
                  label: 'Add spending', icon: <MinusIcon/>, disabled: !unit.monthlyRent,
                  title: unit.monthlyRent ? undefined : 'No rent set for this month',
                  onClick: () => setSpending({unitId: unit.id}),
                },
              ]}/>
            </div>
            <div className="card-body">
              {RENT_COLS.filter((rc) => unit.monthlyRent?.[rc]).map((rc) => (
                <div><span>{rc}</span>: {unit.monthlyRent[rc]}</div>
              ))}
            </div>
            <div className="card-footer">
              <span className="total">{fmt(unit.total)}</span>
              <span className={`remaining ${unit.due > 0 ? 'has-due' : ''}`}>{fmt(unit.due)}</span>
            </div>
          </div>
        ))}
      </div>
      {payingUnit && (
        <PaymentDialog unitId={payingUnit.id} due={payingUnit.due} month={firstDayOfMonth}
                       monthLabel={monthLabel}
                       onClose={() => setPayingUnit(null)}
                       onSaved={() => {
                         setPayingUnit(null);
                         reloadData();
                       }}/>
      )}
      {listing && (
        <EntryListDialog noun={listing.kind} table={TABLES[listing.kind]} entries={listingEntries}
                         subtitle={`${listing.unitId ?? 'General'} · ${monthLabel}`}
                         onClose={() => setListing(null)} onDeleted={reloadData}/>
      )}
      {spending && (
        <SpendingDialog unitId={spending.unitId} month={firstDayOfMonth} monthLabel={monthLabel}
                        onClose={() => setSpending(null)}
                        onSaved={() => {
                          setSpending(null);
                          reloadData();
                        }}/>
      )}
      {printJob && (
        <Printable>
          {printJob.kind === 'bills'
            ? <PrintBills units={unitsWithRent} date={date}/>
            : <PrintSheet units={sheetUnits(printJob.letters)} date={date}/>}
        </Printable>
      )}
    </>
  )
}

export default Dashboard
