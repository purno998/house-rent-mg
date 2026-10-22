import {useId, useRef} from 'react'
import './Menu.css'

// items: [{label, icon, onClick, disabled}]
function Menu({label, items}) {
  const id = useId();
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Runs before the popover toggles: pin the menu under the button, right-aligned.
  // Page coordinates (not viewport) so it scrolls along with the button.
  function place() {
    const rect = buttonRef.current.getBoundingClientRect();
    menuRef.current.style.top = `${rect.bottom + window.scrollY + 4}px`;
    menuRef.current.style.left = `${rect.right + window.scrollX}px`;
  }

  return (
    <>
      <button ref={buttonRef} className="icon-button" popoverTarget={id} onClick={place}
              aria-label={label} title={label}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="12" cy="19" r="2"/>
        </svg>
      </button>
      <div ref={menuRef} id={id} popover="auto" className="menu">
        {items.map((item) => (
          <button key={item.label} className="menu-item" disabled={item.disabled} title={item.title} onClick={() => {
            menuRef.current.hidePopover();
            item.onClick();
          }}>
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

export default Menu
