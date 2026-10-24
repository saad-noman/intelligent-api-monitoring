// Two-tone page heading: `title` in the primary color, `highlight` in the accent color.
export default function PageHeader({ eyebrow, title, highlight, children }) {
  return (
    <header className="page-header">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>
        {title} {highlight && <span className="accent">{highlight}</span>}
      </h1>
      {children && <p className="lead">{children}</p>}
    </header>
  );
}
