import { useEffect, useState } from 'react';

// How long success messages stay visible before they disappear on their own.
export const SUCCESS_MESSAGE_DURATION_MS = 5000;

// Returns true once `durationMs` has passed since `trigger` was set. Each new trigger
// value (e.g. a new outcome object) starts a fresh timer and shows the message again.
// Pass null as the trigger to never hide (e.g. for error messages).
export function useAutoHide(trigger, durationMs = SUCCESS_MESSAGE_DURATION_MS) {
  const [hiddenTrigger, setHiddenTrigger] = useState(null);

  useEffect(() => {
    if (!trigger) return undefined;
    const timer = setTimeout(() => setHiddenTrigger(trigger), durationMs);
    return () => clearTimeout(timer);
  }, [trigger, durationMs]);

  return Boolean(trigger) && hiddenTrigger === trigger;
}
