import { formatObserved } from '../utils/format.js';

// Backend labels such as "flow_interrupted" -> "flow interrupted".
function humanize(label) {
  return label.replaceAll('_', ' ');
}

// Extra evidence shown after a finding when present: the user-impact band of a slow
// response and the HTTP status class of a failed request.
function FindingDetails({ finding }) {
  const details = [];
  if (finding.user_impact) details.push(`user impact: ${humanize(finding.user_impact)}`);
  if (finding.status_class) details.push(`status class: ${humanize(finding.status_class)}`);
  if (details.length === 0) return null;
  return <span className="muted"> ({details.join('; ')})</span>;
}

// Sources of an AI-researched threshold (links come from the search results, never from the model).
function ResearchSources({ research }) {
  if (!research?.references?.length) return null;
  return (
    <span className="muted">
      {' '}
      Threshold sources:{' '}
      {research.references.map((reference, index) => (
        <span key={reference.url}>
          {index > 0 && ', '}
          <a href={reference.url} target="_blank" rel="noopener noreferrer">
            {reference.title}
          </a>
        </span>
      ))}
    </span>
  );
}

// The detection rules that fired and the exact values they observed.
export default function EvidenceList({ findings }) {
  if (findings.length === 0) return null;
  return (
    <ul className="evidence-list">
      {findings.map((finding) => (
        <li key={finding.type}>
          <strong>{finding.type}</strong> — rule <code>{finding.rule}</code>; observed {formatObserved(finding.observed)}
          <FindingDetails finding={finding} />
          <ResearchSources research={finding.research} />
        </li>
      ))}
    </ul>
  );
}
