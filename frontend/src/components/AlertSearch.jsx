import { useState } from 'react';

// Search box for one saved alert by its unique ID. The backend validates the format.
export default function AlertSearch({ onSearch, onClear, isSearching, hasResult }) {
  const [alertId, setAlertId] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    onSearch(alertId.trim());
  }

  function handleClear() {
    setAlertId('');
    onClear();
  }

  return (
    <form className="card alert-search" onSubmit={handleSubmit} role="search">
      <label htmlFor="alert-search" className="section-label">
        Find a saved alert by ID
      </label>
      <div className="alert-search-row">
        <input
          id="alert-search"
          type="search"
          value={alertId}
          onChange={(event) => setAlertId(event.target.value)}
          placeholder="ALR-YYYYMMDD-XXXXXXXX"
          spellCheck={false}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={isSearching || !alertId.trim()}>
          {isSearching ? 'Searching…' : 'Search'}
        </button>
        {hasResult && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
