import { useState } from 'react';
import { toFriendlyMessage } from '../utils/errorMessages.js';
import { useAutoHide } from './useAutoHide.js';

// Shared state for an account settings form: runs one change, tracks the busy state,
// and keeps a success or error message. Success messages hide themselves after a while.
export function useAccountChange() {
  const [result, setResult] = useState(null); // { ok: boolean, message: string }
  const [isBusy, setIsBusy] = useState(false);
  const isResultHidden = useAutoHide(result?.ok ? result : null);

  // Returns true when the change succeeded.
  async function run(change, successMessage) {
    setIsBusy(true);
    setResult(null);
    try {
      await change();
      setResult({ ok: true, message: successMessage });
      return true;
    } catch (err) {
      setResult({ ok: false, message: toFriendlyMessage(err) });
      return false;
    } finally {
      setIsBusy(false);
    }
  }

  function showError(message) {
    setResult({ ok: false, message });
  }

  const visibleResult = result && !isResultHidden ? result : null;
  return { result: visibleResult, isBusy, run, showError };
}
