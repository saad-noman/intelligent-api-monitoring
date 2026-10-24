import { formatObserved } from '../utils/format.js';

// The detection rules that fired and the exact values they observed.
export default function EvidenceList({ findings }) {
  if (findings.length === 0) return null;
  return (
    <ul className="evidence-list">
      {findings.map((finding) => (
        <li key={finding.type}>
          <strong>{finding.type}</strong> — rule <code>{finding.rule}</code>; observed {formatObserved(finding.observed)}
        </li>
      ))}
    </ul>
  );
}
