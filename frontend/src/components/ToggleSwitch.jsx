// Accessible on/off switch. `checked` is the current state; `onChange(nextValue)` is
// called with the new state when clicked.
export default function ToggleSwitch({ id, label, checked, onChange, disabled = false }) {
  return (
    <div className="toggle-field">
      <label htmlFor={id} className="toggle-label">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle ${checked ? 'toggle-on' : ''}`}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span className="toggle-thumb" aria-hidden="true" />
        <span className="toggle-text">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  );
}
