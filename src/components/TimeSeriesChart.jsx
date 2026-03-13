import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const YEARS = ["2024", "2025", "2026", "2027", "2028", "2029"];

function fmtTooltip(val) {
  if (val == null) return "–";
  return (val / 1_000_000).toFixed(2) + " mld lei";
}

export default function TimeSeriesChart({ row, title }) {
  if (!row) return null;

  const data = YEARS.map((y, i) => ({
    year: y,
    cb: row.cb?.[i] ?? null,
    ca: row.ca?.[i] ?? null,
  })).filter((d) => d.cb != null || d.ca != null);

  if (data.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}>
      <p className="text-sm font-medium mb-3" style={{ color: "var(--c-text)" }}>
        {title || row.label} — Evoluție 2024–2029
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--c-muted)" }} />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--c-muted)" }}
            tickFormatter={(v) => (v / 1_000_000).toFixed(1)}
            width={50}
          />
          <Tooltip
            formatter={(val, name) => [fmtTooltip(val), name === "cb" ? "Credite bugetare" : "Credite de angajament"]}
            labelFormatter={(l) => `Anul ${l}`}
            contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: 13 }}
          />
          <Legend
            formatter={(val) => (val === "cb" ? "Credite bugetare" : "Credite angajament")}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Area type="monotone" dataKey="cb" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} connectNulls />
          <Area type="monotone" dataKey="ca" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 3" connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
