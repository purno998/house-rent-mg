import {createPortal} from 'react-dom'
import './Printable.css'

// Content that replaces the app when printing; hidden on screen
function Printable({children}) {
  return createPortal(<div className="printable">{children}</div>, document.body);
}

export default Printable
