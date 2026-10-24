import { createContext, useCallback, useContext, useRef, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const ConfirmContext = createContext(null);

// Provides `confirm(options)` to the whole app, which opens the styled ConfirmDialog
// and resolves to true (confirmed) or false (cancelled).
// options: { title, message, confirmLabel, cancelLabel, tone: 'danger' | 'warning' | 'primary' }
export function ConfirmProvider({ children }) {
  const [options, setOptions] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((nextOptions) => {
    setOptions(nextOptions);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function handleClose(confirmed) {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog options={options} onClose={handleClose} />
    </ConfirmContext.Provider>
  );
}

// Usage: const confirm = useConfirm(); if (await confirm({ title: 'Delete?' })) { ... }
export function useConfirm() {
  return useContext(ConfirmContext);
}
