// Renders LLM text safely (no HTML injection) with light formatting:
// blank-line separated paragraphs, "- " / "* " bullet lists, "# " headings, **bold**, *italic*.
const BULLET = /^\s*[-*•]\s+/;
const HEADING = /^\s*#{1,6}\s+/;

function renderInline(text) {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
      return part;
    });
}

function renderBlock(block, index) {
  const lines = block.split('\n').filter((line) => line.trim());
  if (lines.every((line) => BULLET.test(line))) {
    return (
      <ul key={index}>
        {lines.map((line, i) => (
          <li key={i}>{renderInline(line.replace(BULLET, ''))}</li>
        ))}
      </ul>
    );
  }
  if (lines.length === 1 && HEADING.test(lines[0])) {
    return <h4 key={index}>{renderInline(lines[0].replace(HEADING, ''))}</h4>;
  }
  return <p key={index}>{renderInline(lines.join(' '))}</p>;
}

export default function FormattedText({ text }) {
  return <div className="formatted-text">{text.split(/\n\s*\n/).map(renderBlock)}</div>;
}
