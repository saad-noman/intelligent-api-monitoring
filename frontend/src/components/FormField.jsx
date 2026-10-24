// Labeled input; extra props (type, value, onChange, required, ...) go to the <input>.
export default function FormField({ id, label, hint, ...inputProps }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} {...inputProps} />
      {hint && <small className="muted">{hint}</small>}
    </div>
  );
}
