import {useState} from 'react'
import './EntryListDialog.css'
import {supabase} from "../utils/supabase.js";
import {fmt, paymentTotal} from "../utils/rents.js";
import Dialog from "./Dialog.jsx";

const fmtTime = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});

// Lists payments or spendings (noun "payment" / "spending") from `table`, each deletable
function EntryListDialog({noun, table, entries, subtitle, onClose, onDeleted}) {
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  async function remove(entry) {
    if (!window.confirm(`Delete the ${fmt(entry.amount)} ${noun}?`)) return;
    setDeletingId(entry.id);
    const {error} = await supabase.from(table).delete().eq('id', entry.id);
    if (error) {
      setError(error.message);
      setDeletingId(null);
    } else {
      setError(null);
      onDeleted();
    }
  }

  return (
    <Dialog title={`${noun[0].toUpperCase()}${noun.slice(1)}s`} subtitle={subtitle} onClose={onClose}>
      {entries.length ? (
        <ul className="entry-list">
          {entries.map((entry) => (
            <li key={entry.id}>
              <span className="label">
                {entry.reason && (
                  <span className="reason">
                    {entry.reason}
                    {entry.chargeable && <span className="tag">Chargeable</span>}
                    {entry.unit_id === null && <span className="tag">{entry.forAB ? 'A & B' : 'C & D'}</span>}
                  </span>
                )}
                <span>{fmtTime.format(new Date(entry.created_at))}</span>
              </span>
              <span className="amount">{fmt(entry.amount)}</span>
              <button className="icon-button" onClick={() => remove(entry)} disabled={deletingId === entry.id}
                      aria-label={`Delete ${fmt(entry.amount)} ${noun}`} title={`Delete ${noun}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No {noun}s this month.</p>
      )}
      <div className="entry-list-total">
        <span>Total</span>
        <span className="amount">{fmt(paymentTotal(entries))}</span>
      </div>
      {error && <p className="dialog-error">{error}</p>}
      <div className="dialog-actions">
        <button type="button" className="secondary" onClick={onClose}>Close</button>
      </div>
    </Dialog>
  );
}

export default EntryListDialog
