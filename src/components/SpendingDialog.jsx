import {useState} from 'react'
import {supabase} from "../utils/supabase.js";
import Dialog from "./Dialog.jsx";

// unitId is null for a spending that isn't tied to a unit
function SpendingDialog({unitId, month, monthLabel, onClose, onSaved}) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [chargeable, setChargeable] = useState(false);
  const [forAB, setForAB] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const {error} = await supabase.from('monthly_spendings').insert({
      unit_id: unitId, month, amount: Number(amount), reason: reason.trim(), chargeable,
      // Only general spendings need it; a unit's letter already picks its sheet
      forAB: unitId ? null : forAB,
    });
    setSaving(false);
    if (error) setError(error.message);
    else onSaved();
  }

  return (
    <Dialog title="Add spending" subtitle={`${unitId ?? 'General'} · ${monthLabel}`} onClose={onClose}>
      <form onSubmit={save}>
        <label>
          Amount (৳)
          <input type="number" inputMode="numeric" min="1" step="1" value={amount}
                 onChange={e => setAmount(e.target.value)} autoFocus required/>
        </label>
        <label>
          Reason
          <input value={reason} onChange={e => setReason(e.target.value)} pattern=".*\S.*"
                 title="Enter a reason" required/>
        </label>
        {unitId ? (
          <label className="checkbox">
            <input type="checkbox" checked={chargeable} onChange={e => setChargeable(e.target.checked)}/>
            Charge to tenant (adds it to the bill)
          </label>
        ) : (
          <label className="checkbox">
            <input type="checkbox" checked={forAB} onChange={e => setForAB(e.target.checked)}/>
            For the A & B sheet (otherwise C & D)
          </label>
        )}
        {error && <p className="dialog-error">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Dialog>
  );
}

export default SpendingDialog
