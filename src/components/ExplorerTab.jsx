import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import budgetData from "../data/budget-detail.json";
import Breadcrumb from "./Breadcrumb";
import DataTable from "./DataTable";
import TimeSeriesChart from "./TimeSeriesChart";
import { EXPLAINERS } from "../data/explainers";

const COMPARE_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"];

function buildInstitutionRows(institutions) {
  return institutions.map((inst) => {
    const total = inst.sections.find((s) => s.code === "5000");
    return {
      id: inst.id,
      label: inst.name,
      cb: total?.cb || [null, null, null, null, null, null],
      ca: total?.ca || [null, null, null, null, null, null],
      _inst: inst,
    };
  });
}

function buildSectionRows(inst) {
  return inst.sections.map((s, i) => ({
    id: `${s.code}-${i}`,
    code: s.code,
    label: s.label,
    cb: s.cb,
    ca: s.ca,
    _section: s,
  }));
}

function buildTitleRows(section) {
  return section.titles.map((t) => ({
    id: t.code,
    code: t.code,
    label: t.label,
    cb: t.cb,
    ca: t.ca,
    _title: t,
  }));
}

function buildItemRows(title) {
  return (title.items || []).map((it, i) => ({
    id: `${it.code}-${i}`,
    code: it.code,
    label: it.label,
    cb: it.cb,
    ca: it.ca,
  }));
}

export default function ExplorerTab({ initialSearchName }) {
  const institutions = budgetData.institutions;

  const [path, setPath] = useState(() => {
    if (initialSearchName) {
      // Find institution by fuzzy name match
      const q = initialSearchName.toLowerCase();
      const match = institutions.find((i) => i.name.toLowerCase().includes(q));
      if (match) return [{ id: match.id }];
    }
    return [];
  });
  const [metric, setMetric] = useState("cb");
  const [sortCol, setSortCol] = useState(2); // 2026
  const [sortDir, setSortDir] = useState("desc");
  const [selectedRow, setSelectedRow] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [compareIds, setCompareIds] = useState(new Set());
  const [showCompare, setShowCompare] = useState(false);

  // Build breadcrumb path info
  const breadcrumbPath = useMemo(() => {
    const crumbs = [];
    if (path.length >= 1) {
      const inst = institutions.find((i) => i.id === path[0].id);
      if (inst) {
        crumbs.push({ label: inst.name.length > 40 ? inst.name.substring(0, 40) + "…" : inst.name, pathSlice: [] });
        if (path.length >= 2) {
          const section = inst.sections.find((s) => s.code === path[1].code);
          if (section) {
            crumbs.push({ label: `${section.code} ${section.label}`, pathSlice: [path[0]] });
            if (path.length >= 3) {
              const title = section.titles.find((t) => t.code === path[2].code);
              if (title) {
                crumbs.push({ label: `${title.code} ${title.label}`, pathSlice: [path[0], path[1]] });
              }
            }
          }
        }
      }
    }
    return crumbs;
  }, [path, institutions]);

  // Current data rows based on navigation depth
  const { rows, level, currentInst, currentSection } = useMemo(() => {
    if (path.length === 0) {
      let r = buildInstitutionRows(institutions);
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        r = r.filter((row) => row.label.toLowerCase().includes(q));
      }
      return { rows: r, level: 0, currentInst: null, currentSection: null };
    }
    const inst = institutions.find((i) => i.id === path[0].id);
    if (!inst) return { rows: [], level: 0, currentInst: null, currentSection: null };

    if (path.length === 1) {
      return { rows: buildSectionRows(inst), level: 1, currentInst: inst, currentSection: null };
    }

    const section = inst.sections.find((s) => s.code === path[1].code);
    if (!section) return { rows: [], level: 1, currentInst: inst, currentSection: null };

    if (path.length === 2) {
      return { rows: buildTitleRows(section), level: 2, currentInst: inst, currentSection: section };
    }

    const title = section.titles.find((t) => t.code === path[2].code);
    if (!title?.items?.length) return { rows: buildTitleRows(section), level: 2, currentInst: inst, currentSection: section };

    return { rows: buildItemRows(title), level: 3, currentInst: inst, currentSection: section };
  }, [path, institutions, searchQuery]);

  const handleRowClick = (row) => {
    if (level === 0) {
      setPath([{ id: row.id }]);
      setSelectedRow(null);
      setSortCol(2);
    } else if (level === 1 && row._section?.titles?.length > 0) {
      setPath([path[0], { code: row.code }]);
      setSelectedRow(null);
      setSortCol(2);
    } else if (level === 2 && row._title?.items?.length > 0) {
      setPath([path[0], path[1], { code: row.code }]);
      setSelectedRow(null);
      setSortCol(2);
    } else {
      setSelectedRow(selectedRow === row.id ? null : row.id);
    }
  };

  const handleNavigate = (pathSlice) => {
    setPath(pathSlice);
    setSelectedRow(null);
    setShowCompare(false);
  };

  const handleSort = (col, dir) => {
    setSortCol(col);
    setSortDir(dir);
  };

  const handleToggleSelect = (id) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  };

  // Time series for hovered/selected row
  const chartRow = useMemo(() => {
    if (!selectedRow) return null;
    return rows.find((r) => r.id === selectedRow) || null;
  }, [selectedRow, rows]);

  // Comparison data
  const compareData = useMemo(() => {
    if (!showCompare || compareIds.size < 2) return null;
    const selected = institutions.filter((i) => compareIds.has(i.id));

    // Get all title codes across selected institutions' 5000 sections
    const titleSet = new Map();
    selected.forEach((inst) => {
      const total = inst.sections.find((s) => s.code === "5000");
      if (total) {
        total.titles.forEach((t) => {
          if (!titleSet.has(t.code)) titleSet.set(t.code, t.label);
        });
      }
    });

    const chartData = Array.from(titleSet.entries()).map(([code, label]) => {
      const point = { name: label.length > 25 ? label.substring(0, 25) + "…" : label };
      selected.forEach((inst) => {
        const total = inst.sections.find((s) => s.code === "5000");
        const title = total?.titles.find((t) => t.code === code);
        point[inst.id] = title?.cb?.[2] ? title.cb[2] / 1_000_000 : 0;
      });
      return point;
    });

    return { chartData, selected };
  }, [showCompare, compareIds, institutions]);

  return (
    <div>
      {/* Header with controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--c-text)" }}>
            Explorer date bugetare
          </h2>
          <p className="text-xs" style={{ color: "var(--c-muted)" }}>
            Toate instituțiile • {level === 3 ? "Formular 02 (DETALIAT)" : "Formular 01 (SINTEZA)"} • {institutions.length} ordonatori principali
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--c-muted)" }}>{EXPLAINERS.explorer.intro}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMetric("cb")}
            className="px-3 py-1 rounded-lg text-xs font-medium border transition-colors"
            style={{
              background: metric === "cb" ? "var(--c-text)" : "transparent",
              color: metric === "cb" ? "var(--bg-card)" : "var(--c-muted)",
              borderColor: metric === "cb" ? "var(--c-text)" : "var(--border-color)",
            }}
          >
            Credite bugetare
          </button>
          <button
            onClick={() => setMetric("ca")}
            className="px-3 py-1 rounded-lg text-xs font-medium border transition-colors"
            style={{
              background: metric === "ca" ? "var(--c-text)" : "transparent",
              color: metric === "ca" ? "var(--bg-card)" : "var(--c-muted)",
              borderColor: metric === "ca" ? "var(--c-text)" : "var(--border-color)",
            }}
          >
            Credite angajament
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {path.length > 0 && <Breadcrumb path={breadcrumbPath} onNavigate={handleNavigate} />}

      {/* Search (level 0 only) */}
      {level === 0 && (
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Caută instituție..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border text-sm"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-color)",
              color: "var(--c-text)",
              maxWidth: 400,
            }}
          />
          {compareIds.size >= 2 && (
            <button
              onClick={() => setShowCompare(!showCompare)}
              className="px-4 py-2 rounded-lg text-xs font-medium border"
              style={{
                background: showCompare ? "#3b82f6" : "transparent",
                color: showCompare ? "#fff" : "#3b82f6",
                borderColor: "#3b82f6",
              }}
            >
              Compară ({compareIds.size})
            </button>
          )}
        </div>
      )}

      {/* Comparison chart */}
      {showCompare && compareData && (
        <div className="mb-6 rounded-xl border p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}>
          <p className="text-sm font-medium mb-3" style={{ color: "var(--c-text)" }}>
            Comparație CB 2026 — defalcare pe titluri (mld lei)
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={compareData.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--c-muted)" }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "var(--c-muted)" }} />
              <Tooltip
                formatter={(val, name) => {
                  const inst = compareData.selected.find((i) => i.id === name);
                  return [val.toFixed(2) + " mld", inst?.name || name];
                }}
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: 12 }}
              />
              <Legend
                formatter={(val) => {
                  const inst = compareData.selected.find((i) => i.id === val);
                  return inst ? (inst.name.length > 30 ? inst.name.substring(0, 30) + "…" : inst.name) : val;
                }}
                wrapperStyle={{ fontSize: 11 }}
              />
              {compareData.selected.map((inst, idx) => (
                <Bar key={inst.id} dataKey={inst.id} fill={COMPARE_COLORS[idx % COMPARE_COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data table */}
      <DataTable
        key={level}
        rows={rows}
        metric={metric}
        sortCol={sortCol}
        sortDir={sortDir}
        onSort={handleSort}
        onRowClick={handleRowClick}
        onRowHover={(row) => level >= 2 && setSelectedRow(row.id)}
        selectedRow={selectedRow}
        selectable={level === 0}
        selectedIds={compareIds}
        onToggleSelect={handleToggleSelect}
      />

      {/* Drill hint */}
      {level < 3 && rows.length > 0 && (
        <p className="text-xs mt-2 italic" style={{ color: "var(--c-muted)" }}>
          {level === 0
            ? "Click pe o instituție pentru a vedea capitolele funcționale"
            : level === 1
            ? "Click pe un capitol pentru detaliere pe titluri de cheltuieli"
            : "Click pe un titlu pentru detaliere pe articole"}
        </p>
      )}

      {/* Time series chart for selected row */}
      {chartRow && (
        <div style={{ position: "sticky", bottom: 0, zIndex: 10, boxShadow: "0 -4px 12px rgba(0,0,0,0.08)" }}>
          <TimeSeriesChart row={chartRow} />
        </div>
      )}

      <div className="rounded-xl border p-4 mt-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-surface)" }}>
        <p className="text-xs font-medium mb-2" style={{ color: "var(--c-text)" }}>💡 Ce vedeți aici?</p>
        <p className="text-xs leading-relaxed" style={{ color: "var(--c-muted)" }}>{EXPLAINERS.explorer.context}</p>
      </div>
    </div>
  );
}
