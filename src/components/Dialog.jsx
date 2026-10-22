import {useEffect, useRef} from 'react'
import './Dialog.css'

// Modal that is open while mounted; Esc, a backdrop tap or onClose unmounts it.
function Dialog({title, subtitle, onClose, children}) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current.showModal();
  }, []);

  return (
    // The body fills the dialog, so a click landing on the dialog itself is on the backdrop
    <dialog ref={ref} className="dialog" onClose={onClose} onClick={e => e.target === ref.current && onClose()}>
      <div className="dialog-body">
        <h2>{title}</h2>
        {subtitle && <p className="dialog-sub">{subtitle}</p>}
        {children}
      </div>
    </dialog>
  );
}

export default Dialog
