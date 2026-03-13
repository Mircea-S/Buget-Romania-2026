const YEAR_LABELS = ["2024", "2025", "2026", "2027", "2028", "2029"];

function fmt(val) {
  if (val == null) return "–";
  const mld = val / 1_000_000;
  if (Math.abs(mld) >= 0.01) return mld.toFixed(2);
  // Show in mii lei for very small values
  return (val / 1000).toFixed(1) + " mil";
}

function SortIcon({ active, dir }) {
  if (!active) return <span className="opacity-30 ml-1">↕</span>;
  return <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

export default function DataTable({
  rows,
  metric,
  sortCol,
  sortDir,
  onSort,
  onRowClick,
  onRowHover,
  selectedRow,
  selectable,
  selectedIds,
  onToggleSelect,
}) {
  const sorted = [...rows].sort((a, b) => {
    if (sortCol === -1) {
      // Sort by name
      return sortDir === "asc"
        ? a.label.localeCompare(b.label)
        : b.label.localeCompare(a.label);
    }
    const va = a[metric]?.[sortCol] ?? 0;
    const vb = b[metric]?.[sortCol] ?? 0;
    return sortDir === "asc" ? va - vb : vb - va;
  });

  const handleSort = (col) => {
    if (col === sortCol) {
      onSort(col, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSort(col, "desc");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ fontFeatureSettings: "'tnum'" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
            {selectable && <th className="p-2 w-8"></th>}
            <th
              className="text-left p-2 cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort(-1)}
            >
              Denumire <SortIcon active={sortCol === -1} dir={sortDir} />
            </th>
            {YEAR_LABELS.map((y, i) => (
              <th
                key={y}
                className="text-right p-2 cursor-pointer select-none whitespace-nowrap"
                onClick={() => handleSort(i)}
              >
                {y} <SortIcon active={sortCol === i} dir={sortDir} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => {
            const isSelected = selectedRow === row.id;
            const isChecked = selectedIds?.has(row.id);
            return (
              <tr
                key={row.id || idx}
                className="cursor-pointer transition-colors"
                style={{
                  borderBottom: "1px solid var(--border-color)",
                  background: isSelected ? "var(--bg-hover, rgba(59,130,246,0.08))" : "transparent",
                }}
                onClick={() => onRowClick?.(row)}
                onMouseEnter={() => onRowHover?.(row)}
              >
                {selectable && (
                  <td className="p-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked || false}
                      onChange={() => onToggleSelect?.(row.id)}
                    />
                  </td>
                )}
                <td className="p-2 font-medium" style={{ maxWidth: 420 }}>
                  <span className="block" style={{ lineHeight: 1.3 }}>{row.label}</span>
                  {row.code && (
                    <span className="text-xs" style={{ color: "var(--c-muted)" }}> {row.code}</span>
                  )}
                </td>
                {[0, 1, 2, 3, 4, 5].map((ci) => (
                  <td
                    key={ci}
                    className="text-right p-2 whitespace-nowrap"
                    style={{ color: ci === 2 ? "var(--c-text)" : "var(--c-muted)", fontWeight: ci === 2 ? 600 : 400 }}
                  >
                    {fmt(row[metric]?.[ci])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs mt-2" style={{ color: "var(--c-muted)" }}>
        Valori în mld lei • Sursă: Anexa 3, Formular 01 (SINTEZA)
      </p>
    </div>
  );
}
