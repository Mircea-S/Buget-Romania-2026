export default function Breadcrumb({ path, onNavigate }) {
  const crumbs = [{ label: "Toate instituțiile", pathSlice: [] }, ...path];
  return (
    <nav className="flex items-center gap-1 text-sm mb-4 flex-wrap" style={{ color: "var(--c-muted)" }}>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="mx-1">›</span>}
          {i < crumbs.length - 1 ? (
            <button
              onClick={() => onNavigate(crumb.pathSlice)}
              className="hover:underline cursor-pointer"
              style={{ color: "var(--c-accent, #3b82f6)" }}
            >
              {crumb.label}
            </button>
          ) : (
            <span style={{ color: "var(--c-text)" }} className="font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
