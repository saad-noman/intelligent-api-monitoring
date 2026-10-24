import { useState } from 'react';
import { inputTemplate } from '../utils/monitoringData.js';
import { toFriendlyMessage } from '../utils/errorMessages.js';

const PLACEHOLDER = inputTemplate();

// JSON input for POST /monitor: load the server's sample file, upload a .json file, or
// paste JSON, then submit. Only JSON syntax is checked here; validating the content is
// the backend's job.
export default function MonitoringInput({ onSubmit, onLoadSample, isSubmitting }) {
  const [text, setText] = useState('');
  const [inputError, setInputError] = useState(null);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setText(await file.text());
    setInputError(null);
  }

  async function handleLoadSample() {
    try {
      setText(JSON.stringify(await onLoadSample(), null, 2));
      setInputError(null);
    } catch (err) {
      setInputError(toFriendlyMessage(err));
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      setInputError('The input is not valid JSON.');
      return;
    }
    setInputError(null);
    onSubmit(payload);
  }

  return (
    <form className="card monitor-form" onSubmit={handleSubmit}>
      <div className="monitor-form-header">
        <h2>Monitoring input</h2>
        <div className="button-row">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleLoadSample}>
            Load sample batch
          </button>
          <label className="btn btn-secondary btn-sm file-button">
            Upload JSON file
            <input type="file" accept=".json,application/json" onChange={handleFile} hidden />
          </label>
        </div>
      </div>

      <label htmlFor="monitor-json" className="section-label">
        API observations (single object or batch array)
      </label>
      <textarea
        id="monitor-json"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={PLACEHOLDER}
        rows={10}
        spellCheck={false}
        aria-invalid={Boolean(inputError)}
      />
      {inputError && <p className="field-error">{inputError}</p>}

      <button type="submit" className="btn btn-primary" disabled={isSubmitting || !text.trim()}>
        {isSubmitting ? 'Submitting…' : 'Submit for monitoring →'}
      </button>
    </form>
  );
}
