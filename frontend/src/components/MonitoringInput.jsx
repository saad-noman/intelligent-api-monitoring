import { useState } from 'react';
import { inputTemplate } from '../utils/monitoringData.js';

const PLACEHOLDER = inputTemplate();

// JSON input for POST /monitor: upload a .json file or paste JSON, then submit.
// Only JSON syntax is checked here; validating the content is the backend's job.
export default function MonitoringInput({ onSubmit, isSubmitting }) {
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState(null);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setText(await file.text());
    setParseError(null);
  }

  function handleSubmit(event) {
    event.preventDefault();
    try {
      onSubmit(JSON.parse(text));
      setParseError(null);
    } catch {
      setParseError('The input is not valid JSON.');
    }
  }

  return (
    <form className="card monitor-form" onSubmit={handleSubmit}>
      <div className="monitor-form-header">
        <h2>Monitoring input</h2>
        <label className="btn btn-secondary btn-sm file-button">
          Upload JSON file
          <input type="file" accept=".json,application/json" onChange={handleFile} hidden />
        </label>
      </div>

      <label htmlFor="monitor-json" className="section-label">
        API responses (single object or batch array)
      </label>
      <textarea
        id="monitor-json"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={PLACEHOLDER}
        rows={10}
        spellCheck={false}
        aria-invalid={Boolean(parseError)}
      />
      {parseError && <p className="field-error">{parseError}</p>}

      <button type="submit" className="btn btn-primary" disabled={isSubmitting || !text.trim()}>
        {isSubmitting ? 'Submitting…' : 'Submit for monitoring →'}
      </button>
    </form>
  );
}
