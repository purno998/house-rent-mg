import {useState} from 'react'
import {supabase} from "../utils/supabase.js";
import Dialog from "./Dialog.jsx";

function PaymentDialog({unitId, due, month, monthLabel, onClose, onSaved}) {
  const [amount, setAmount] = useState(due > 0 ? String(due) : '');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const {error} = await supabase.from('rent_payments').insert({unit_id: unitId, month, amount: Number(amount)});
    setSaving(false);
    if (error) setError(error.message);
    else onSaved();
  }

  return (
    <Dialog title="Add payment" subtitle={`${unitId} · ${monthLabel}`} onClose={onClose}>
      <form onSubmit={save}>
        <label>
          Amount (৳)
          <input type="number" inputMode="numeric" min="1" step="1" value={amount}
                 onChange={e => setAmount(e.target.value)} onFocus={e => e.target.select()} autoFocus required/>
        </label>
        {error && <p className="dialog-error">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Dialog>
  );
}

export default PaymentDialog
