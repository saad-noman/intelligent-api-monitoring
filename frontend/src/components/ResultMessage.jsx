import StatusMessage from './StatusMessage.jsx';

// Shows a { ok, message } result from useAccountChange, or nothing.
export default function ResultMessage({ result }) {
  if (!result) return null;
  return <StatusMessage variant={result.ok ? 'success' : 'error'}>{result.message}</StatusMessage>;
}
