import { useState } from 'react';

// Remembers for the current browser session that a message was dismissed.
// Storage can be unavailable (private mode, blocked site data), so every access is guarded.
function readDismissed(storageKey) {
  try {
    return sessionStorage.getItem(storageKey) === 'true';
  } catch {
    return false;
  }
}

function saveDismissed(storageKey) {
  try {
    sessionStorage.setItem(storageKey, 'true');
  } catch {
    // The message stays hidden until the page reloads.
  }
}

export function useDismissible(storageKey) {
  const [isDismissed, setIsDismissed] = useState(() => readDismissed(storageKey));

  function dismiss() {
    saveDismissed(storageKey);
    setIsDismissed(true);
  }

  return [isDismissed, dismiss];
}
