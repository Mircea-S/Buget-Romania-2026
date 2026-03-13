import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Area, AreaChart, Treemap, ComposedChart } from "recharts";

// ─── DATA ───────────────────────────────────────────────────────────────
const MINISTRIES = [
  { name: "Muncă și Solidaritate", short: "Muncă", cb: 88.2, ca: 92.5, cb25: 89.1, cat: "social", desc: "Pensii, asistență socială, ajutoare" },
  { name: "Educație și Cercetare", short: "Educație", cb: 64.7, ca: 65.2, cb25: 61.2, cat: "social", desc: "Învățământ, cercetare, burse" },
  { name: "Apărare Națională", short: "Apărare", cb: 49.3, ca: 112.0, cb25: 42.5, cat: "securitate", desc: "Armată, înzestrare, NATO" },
  { name: "Transporturi și Infrastructură", short: "Transporturi", cb: 42.0, ca: 109.9, cb25: 43.6, cat: "investitii", desc: "Drumuri, căi ferate, autostrăzi" },
  { name: "Afaceri Interne (MAI)", short: "Interne", cb: 35.4, ca: 36.2, cb25: 34.1, cat: "securitate", desc: "Poliție, pompieri, jandarmi" },
  { name: "Dezvoltare și Administrație", short: "Dezvoltare", cb: 22.8, ca: 39.2, cb25: 28.5, cat: "investitii", desc: "PNDL, Saligny, dezvoltare locală" },
  { name: "Energie", short: "Energie", cb: 19.7, ca: 10.2, cb25: 5.35, cat: "economic", desc: "Subvenții energie, tranziție verde" },
  { name: "Investiții și Proiecte Europene", short: "Inv. EU", cb: 12.6, ca: 17.8, cb25: 7.3, cat: "investitii", desc: "Gestionare fonduri europene" },
  { name: "Sănătate", short: "Sănătate", cb: 11.2, ca: 12.4, cb25: 12.8, cat: "social", desc: "Spitale, programe naționale sănătate" },
  { name: "Agricultură", short: "Agricultură", cb: 24.5, ca: 25.8, cb25: 23.0, cat: "economic", desc: "Subvenții fermieri, APIA, dezvoltare rurală" },
  { name: "ÎCCJ + Justiție", short: "Justiție", cb: 7.5, ca: 7.8, cb25: 3.8, cat: "justitie", desc: "Instanțe, drepturi salariale restante" },
  { name: "SRI", short: "SRI", cb: 5.2, ca: 5.4, cb25: 4.6, cat: "securitate", desc: "Serviciul Român de Informații" },
  { name: "Economie și Digitalizare", short: "Economie", cb: 3.7, ca: 3.9, cb25: 2.3, cat: "economic", desc: "Turism, digitalizare, industrie" },
  { name: "Ministerul Public", short: "Min.Public", cb: 2.8, ca: 2.9, cb25: 1.7, cat: "justitie", desc: "Parchete, procuratură" },
  { name: "Afaceri Externe", short: "Externe", cb: 2.4, ca: 2.5, cb25: 2.3, cat: "securitate", desc: "Ambasade, diplomație" },
];

const MACRO = {
  pib: 2045,
  venituriStat: 391.7, cheltuieliStat: 527.4, deficitStat: 135.7,
  venituriCons: 736.5, cheltuieliCons: 864.3,
  investitii: 163.8, fonduriEU: 110, dobanzile: 60.8,
  datorie: 62.5, 
};

const REVENUE_BREAKDOWN = [
  { name: "Venituri fiscale", value: 357.6, color: "#185FA5", detail: "Impozit pe venit, profit, TVA, accize" },
  { name: "Contribuții sociale", value: 226.4, color: "#534AB7", detail: "CAS, CASS, contribuție asiguratorie" },
  { name: "Fonduri UE", value: 100.2, color: "#0F6E56", detail: "Coeziune, PNRR, SAFE" },
  { name: "Alte venituri", value: 52.3, color: "#BA7517", detail: "Amenzi, taxe, dividende, venituri nefiscale" },
];

const EXPENDITURE_STRUCTURE = [
  { name: "Asistență socială", pib: 12.2, mld: 249.5, color: "#534AB7" },
  { name: "Cheltuieli personal", pib: 8.2, mld: 167.7, color: "#0F6E56" },
  { name: "Investiții publice", pib: 8.0, mld: 163.8, color: "#639922" },
  { name: "Dobânzi", pib: 3.0, mld: 60.8, color: "#D85A30" },
  { name: "Bunuri și servicii", pib: 4.5, mld: 92.0, color: "#185FA5" },
  { name: "Subvenții", pib: 1.9, mld: 38.9, color: "#993556" },
  { name: "Alte cheltuieli", pib: 4.5, mld: 92.0, color: "#888780" },
];

const DEFICIT_TRAJECTORY = [
  { year: "2024", cash: 8.67, esa: 8.6 },
  { year: "2025", cash: 7.65, esa: 7.8 },
  { year: "2026", cash: 6.2, esa: 6.0 },
  { year: "2027", cash: 5.1, esa: 5.1 },
  { year: "2028", cash: 4.5, esa: 4.2 },
  { year: "2029", cash: 3.5, esa: 3.2 },
];

const TVA_LOCAL = [
  { name: "Cheltuieli descentralizate comune/orașe", value: 17622.5 },
  { name: "Cheltuieli descentralizate județe", value: 4445.7 },
  { name: "Echilibrare bugete locale", value: 3842.7 },
  { name: "Masă Sănătoasă + învățământ", value: 915.6 },
  { name: "Drumuri județene și comunale", value: 880.0 },
];

const CATEGORIES = {
  social: { label: "Social", color: "#534AB7" },
  securitate: { label: "Securitate", color: "#D85A30" },
  investitii: { label: "Investiții", color: "#639922" },
  economic: { label: "Economic", color: "#185FA5" },
  justitie: { label: "Justiție", color: "#993556" },
};

const EU_FUNDS = [
  { name: "Fonduri coeziune post-aderare", value: 51.3, growth: "+42%" },
  { name: "PNRR – Granturi", value: 41.4, growth: "+43%" },
  { name: "PNRR – Împrumuturi", value: 12.0, growth: "nou" },
  { name: "Instrument SAFE", value: 6.0, growth: "nou" },
];

// ─── HELPERS ────────────────────────────────────────────────────────────
const fmt = (n) => n.toLocaleString("ro-RO", { maximumFractionDigits: 1 });
const pct = (n) => (n >= 0 ? "+" : "") + fmt(n) + "%";

// ─── COMPONENTS ─────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Prezentare generală" },
  { id: "ministere", label: "Alocări ministere" },
  { id: "venituri", label: "Venituri" },
  { id: "cheltuieli", label: "Cheltuieli" },
  { id: "deficit", label: "Deficit & Datorie" },
  { id: "locale", label: "Bugete locale" },
  { id: "eu", label: "Fonduri UE" },
];

function MetricCard({ label, value, unit, sub, accent }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 p-4" style={{background: "var(--bg-card)"}}>
      <p className="text-xs uppercase tracking-wider mb-1" style={{color:"var(--c-muted)", letterSpacing:"0.08em"}}>{label}</p>
      <p className="text-2xl font-semibold leading-tight" style={{color: accent || "var(--c-text)", fontFeatureSettings:"'tnum'"}}>{value}</p>
      {unit && <p className="text-xs mt-0.5" style={{color:"var(--c-muted)"}}>{unit}</p>}
      {sub && <p className="text-xs mt-2 font-medium" style={{color: sub.color || "var(--c-muted)"}}>{sub.text}</p>}
    </div>
  );
}

function Badge({ children, color }) {
  return (
    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-md" style={{
      background: color + "18", color: color
    }}>{children}</span>
  );
}

function CustomTooltip({ active, payload, label, suffix = " mld lei" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border px-3 py-2 text-xs shadow-sm" style={{
      background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--c-text)"
    }}>
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}{suffix}</p>
      ))}
    </div>
  );
}

// ─── TAB VIEWS ──────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="PIB estimat" value={fmt(MACRO.pib)} unit="miliarde lei" />
        <MetricCard label="Venituri consolidate" value={fmt(MACRO.venituriCons)} unit="mld lei · 36% PIB" accent="#0F6E56"/>
        <MetricCard label="Cheltuieli consolidate" value={fmt(MACRO.cheltuieliCons)} unit="mld lei · 42,3% PIB" accent="#D85A30"/>
        <MetricCard label="Deficit bugetar" value={"-" + fmt(MACRO.deficitStat)} unit="mld lei" accent="#A32D2D" sub={{text:"6,2% din PIB (cash)", color:"#A32D2D"}} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Investiții publice" value={fmt(MACRO.investitii)} unit="mld lei · 8% PIB" accent="#639922" sub={{text: "+25,6 mld vs 2025", color:"#639922"}} />
        <MetricCard label="Fonduri europene" value={"110+"} unit="mld lei" accent="#185FA5" sub={{text: "+40% față de 2025", color:"#185FA5"}} />
        <MetricCard label="Dobânzi datorii" value={fmt(MACRO.dobanzile)} unit="mld lei · 3% PIB" accent="#BA7517" sub={{text: "+10,3 mld vs 2025", color:"#BA7517"}} />
        <MetricCard label="Datorie publică" value={fmt(MACRO.datorie) + "%"} unit="din PIB" accent="#993556" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
        <div>
          <p className="text-sm font-medium mb-3" style={{color:"var(--c-text)"}}>Top 8 ministere – credite bugetare</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={MINISTRIES.slice(0, 8)} layout="vertical" margin={{left:4,right:16,top:4,bottom:4}}>
              <XAxis type="number" tick={{fontSize:11, fill:"var(--c-muted)"}} tickFormatter={v => v + " mld"} />
              <YAxis type="category" dataKey="short" width={80} tick={{fontSize:11, fill:"var(--c-text)"}} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cb" name="Credite bugetare" radius={[0,4,4,0]} barSize={18}>
                {MINISTRIES.slice(0,8).map((m,i) => <Cell key={i} fill={CATEGORIES[m.cat].color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-sm font-medium mb-3" style={{color:"var(--c-text)"}}>Traiectoria deficitului ESA (% PIB)</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={DEFICIT_TRAJECTORY} margin={{left:4,right:16,top:4,bottom:4}}>
              <defs>
                <linearGradient id="defGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A32D2D" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#A32D2D" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="year" tick={{fontSize:11, fill:"var(--c-muted)"}} />
              <YAxis domain={[0,10]} tick={{fontSize:11, fill:"var(--c-muted)"}} tickFormatter={v=>v+"%"} />
              <Tooltip content={<CustomTooltip suffix="% PIB" />} />
              <Area type="monotone" dataKey="esa" name="Deficit ESA" stroke="#A32D2D" fill="url(#defGrad)" strokeWidth={2} dot={{r:4, fill:"#A32D2D"}} />
              <Line type="monotone" dataKey={() => 3} name="Limita UE" stroke="#888" strokeDasharray="6 4" dot={false} strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MinistereTab() {
  const [sortBy, setSortBy] = useState("cb");
  const [filterCat, setFilterCat] = useState("all");
  const [viewMode, setViewMode] = useState("bar");

  const filtered = useMemo(() => {
    let arr = filterCat === "all" ? [...MINISTRIES] : MINISTRIES.filter(m => m.cat === filterCat);
    arr.sort((a, b) => b[sortBy] - a[sortBy]);
    return arr;
  }, [sortBy, filterCat]);

  const treemapData = useMemo(() => filtered.map(m => ({
    name: m.short, size: m.cb, cat: m.cat, fullName: m.name
  })), [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium mr-1" style={{color:"var(--c-muted)"}}>Categorie:</span>
        {[{id:"all",label:"Toate"},...Object.entries(CATEGORIES).map(([id,v])=>({id,label:v.label}))].map(c => (
          <button key={c.id} onClick={() => setFilterCat(c.id)} className="text-xs px-3 py-1 rounded-full border transition-all" style={{
            background: filterCat === c.id ? "var(--c-text)" : "transparent",
            color: filterCat === c.id ? "var(--bg-card)" : "var(--c-muted)",
            borderColor: filterCat === c.id ? "var(--c-text)" : "var(--border-color)"
          }}>{c.label}</button>
        ))}
        <div className="ml-auto flex gap-1">
          {[{id:"bar",label:"Bare"},{id:"treemap",label:"Treemap"},{id:"table",label:"Tabel"}].map(v=>(
            <button key={v.id} onClick={()=>setViewMode(v.id)} className="text-xs px-3 py-1 rounded-full border transition-all" style={{
              background: viewMode === v.id ? "var(--c-text)" : "transparent",
              color: viewMode === v.id ? "var(--bg-card)" : "var(--c-muted)",
              borderColor: viewMode === v.id ? "var(--c-text)" : "var(--border-color)"
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      {viewMode === "bar" && (
        <div>
          <div className="flex gap-2 mb-3">
            <span className="text-xs" style={{color:"var(--c-muted)"}}>Sortare:</span>
            {[{id:"cb",label:"Credite bugetare"},{id:"ca",label:"Credite angajament"},{id:"change",label:"Variație % vs 2025"}].map(s=>(
              <button key={s.id} onClick={()=>setSortBy(s.id === "change" ? "cb" : s.id)} className="text-xs underline" style={{
                color: sortBy === s.id ? "var(--c-text)" : "var(--c-muted)"
              }}>{s.label}</button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={Math.max(300, filtered.length * 44)}>
            <BarChart data={filtered} layout="vertical" margin={{left:4,right:24,top:4,bottom:4}}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
              <XAxis type="number" tick={{fontSize:11, fill:"var(--c-muted)"}} tickFormatter={v => v + " mld"} />
              <YAxis type="category" dataKey="short" width={85} tick={{fontSize:11, fill:"var(--c-text)"}} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                const change = ((d.cb - d.cb25) / d.cb25 * 100);
                return (
                  <div className="rounded-lg border px-3 py-2 text-xs shadow-sm" style={{background:"var(--bg-card)", borderColor:"var(--border-color)", color:"var(--c-text)"}}>
                    <p className="font-medium">{d.name}</p>
                    <p className="mt-1" style={{color:"var(--c-muted)"}}>{d.desc}</p>
                    <p className="mt-1">Credite bugetare: <strong>{fmt(d.cb)} mld</strong></p>
                    <p>Credite angajament: <strong>{fmt(d.ca)} mld</strong></p>
                    <p>2025: {fmt(d.cb25)} mld → Variație: <span style={{color: change >= 0 ? "#639922" : "#A32D2D"}}>{pct(change)}</span></p>
                  </div>
                );
              }} />
              <Bar dataKey="cb" name="Credite bugetare 2026" radius={[0,4,4,0]} barSize={20}>
                {filtered.map((m,i) => <Cell key={i} fill={CATEGORIES[m.cat].color} fillOpacity={0.85} />)}
              </Bar>
              <Bar dataKey="cb25" name="Credite bugetare 2025" radius={[0,4,4,0]} barSize={20} fillOpacity={0.3}>
                {filtered.map((m,i) => <Cell key={i} fill={CATEGORIES[m.cat].color} fillOpacity={0.25} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs" style={{color:"var(--c-muted)"}}><span className="inline-block w-3 h-3 rounded-sm" style={{background:"var(--c-text)", opacity:0.85}}/> 2026</span>
            <span className="flex items-center gap-1.5 text-xs" style={{color:"var(--c-muted)"}}><span className="inline-block w-3 h-3 rounded-sm" style={{background:"var(--c-text)", opacity:0.25}}/> 2025</span>
          </div>
        </div>
      )}

      {viewMode === "treemap" && (
        <ResponsiveContainer width="100%" height={400}>
          <Treemap data={treemapData} dataKey="size" nameKey="name" stroke="var(--bg-card)" strokeWidth={2}
            content={({ x, y, width, height, name, size, cat }) => {
              if (!width || !height || width < 30 || height < 25 || !name) return null;
              return (
                <g>
                  <rect x={x} y={y} width={width} height={height} rx={6} fill={CATEGORIES[cat]?.color || "#888"} fillOpacity={0.8} />
                  {width > 50 && height > 35 && <>
                    <text x={x + 8} y={y + 18} fontSize={12} fontWeight={500} fill="#fff">{name}</text>
                    <text x={x + 8} y={y + 34} fontSize={11} fill="#ffffffbb">{typeof size === 'number' ? fmt(size) + ' mld' : ''}</text>
                  </>}
                </g>
              );
            }}
          />
        </ResponsiveContainer>
      )}

      {viewMode === "table" && (
        <div className="overflow-x-auto rounded-lg border" style={{borderColor:"var(--border-color)"}}>
          <table className="w-full text-xs" style={{color:"var(--c-text)"}}>
            <thead>
              <tr style={{background:"var(--bg-surface)"}}>
                <th className="text-left p-2.5 font-medium">Minister</th>
                <th className="text-right p-2.5 font-medium">CB 2026</th>
                <th className="text-right p-2.5 font-medium">CA 2026</th>
                <th className="text-right p-2.5 font-medium">CB 2025</th>
                <th className="text-right p-2.5 font-medium">Variație</th>
                <th className="text-left p-2.5 font-medium">Categorie</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const change = ((m.cb - m.cb25) / m.cb25 * 100);
                return (
                  <tr key={i} className="border-t" style={{borderColor:"var(--border-color)"}}>
                    <td className="p-2.5 font-medium">{m.short}</td>
                    <td className="p-2.5 text-right tabular-nums">{fmt(m.cb)} mld</td>
                    <td className="p-2.5 text-right tabular-nums">{fmt(m.ca)} mld</td>
                    <td className="p-2.5 text-right tabular-nums" style={{color:"var(--c-muted)"}}>{fmt(m.cb25)} mld</td>
                    <td className="p-2.5 text-right font-medium tabular-nums" style={{color: change >= 0 ? "#639922" : "#A32D2D"}}>{pct(change)}</td>
                    <td className="p-2.5"><Badge color={CATEGORIES[m.cat].color}>{CATEGORIES[m.cat].label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-medium" style={{borderColor:"var(--c-text)", background:"var(--bg-surface)"}}>
                <td className="p-2.5">TOTAL filtrat</td>
                <td className="p-2.5 text-right tabular-nums">{fmt(filtered.reduce((s,m) => s + m.cb, 0))} mld</td>
                <td className="p-2.5 text-right tabular-nums">{fmt(filtered.reduce((s,m) => s + m.ca, 0))} mld</td>
                <td className="p-2.5 text-right tabular-nums" style={{color:"var(--c-muted)"}}>{fmt(filtered.reduce((s,m) => s + m.cb25, 0))} mld</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function VenituriTab() {
  const [mode, setMode] = useState("pie");
  const total = REVENUE_BREAKDOWN.reduce((s,r)=>s+r.value, 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {REVENUE_BREAKDOWN.map((r,i) => (
          <MetricCard key={i} label={r.name} value={fmt(r.value)} unit="miliarde lei" accent={r.color} sub={{text: fmt(r.value / total * 100) + "% din total", color: r.color}} />
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        {["pie","bar"].map(m => (
          <button key={m} onClick={()=>setMode(m)} className="text-xs px-3 py-1 rounded-full border transition-all" style={{
            background: mode===m?"var(--c-text)":"transparent", color: mode===m?"var(--bg-card)":"var(--c-muted)", borderColor: mode===m?"var(--c-text)":"var(--border-color)"
          }}>{m==="pie"?"Donut":"Bare"}</button>
        ))}
      </div>
      {mode === "pie" ? (
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={REVENUE_BREAKDOWN} cx="50%" cy="50%" innerRadius={70} outerRadius={130} paddingAngle={3} dataKey="value" nameKey="name" label={({name, value})=> fmt(value) + " mld"} labelLine={{stroke:"var(--c-muted)",strokeWidth:0.5}} fontSize={11}>
                {REVENUE_BREAKDOWN.map((r,i) => <Cell key={i} fill={r.color} />)}
              </Pie>
              <Tooltip content={({active,payload}) => {
                if(!active||!payload?.length) return null;
                const d = payload[0].payload;
                return <div className="rounded-lg border px-3 py-2 text-xs shadow-sm" style={{background:"var(--bg-card)", borderColor:"var(--border-color)", color:"var(--c-text)"}}>
                  <p className="font-medium">{d.name}</p>
                  <p>{fmt(d.value)} mld lei ({fmt(d.value/total*100)}%)</p>
                  <p style={{color:"var(--c-muted)"}}>{d.detail}</p>
                </div>;
              }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={REVENUE_BREAKDOWN} margin={{left:4,right:16,top:4,bottom:4}}>
            <XAxis dataKey="name" tick={{fontSize:10, fill:"var(--c-muted)"}} />
            <YAxis tick={{fontSize:11, fill:"var(--c-muted)"}} tickFormatter={v=>v+" mld"} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Venituri" radius={[4,4,0,0]} barSize={48}>
              {REVENUE_BREAKDOWN.map((r,i) => <Cell key={i} fill={r.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      <div className="flex flex-wrap gap-3 mt-1">
        {REVENUE_BREAKDOWN.map((r,i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs" style={{color:"var(--c-muted)"}}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{background:r.color}}/> {r.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function CheltuieliTab() {
  const [mode, setMode] = useState("donut");
  const total = EXPENDITURE_STRUCTURE.reduce((s,e) => s + e.mld, 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Cheltuieli totale" value={fmt(MACRO.cheltuieliCons)} unit="mld lei · 42,3% PIB" />
        <MetricCard label="Personal" value="8,2%" unit="din PIB (de la 8,8%)" accent="#0F6E56" sub={{text:"Scădere ca pondere",color:"#0F6E56"}} />
        <MetricCard label="Asistență socială" value="~250" unit="mld lei · 12,2% PIB" accent="#534AB7" />
        <MetricCard label="Dobânzi" value={fmt(MACRO.dobanzile)} unit="mld lei · +10,3 mld" accent="#D85A30" sub={{text:"De la 50,5 → 60,8 mld",color:"#D85A30"}} />
      </div>
      <div className="flex gap-2">
        {["donut","bar","pib"].map(m => (
          <button key={m} onClick={()=>setMode(m)} className="text-xs px-3 py-1 rounded-full border transition-all" style={{
            background: mode===m?"var(--c-text)":"transparent", color: mode===m?"var(--bg-card)":"var(--c-muted)", borderColor: mode===m?"var(--c-text)":"var(--border-color)"
          }}>{m==="donut"?"Donut":m==="bar"?"Bare (mld lei)":"% PIB"}</button>
        ))}
      </div>
      {mode === "donut" && (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={EXPENDITURE_STRUCTURE} cx="50%" cy="50%" innerRadius={70} outerRadius={130} paddingAngle={2} dataKey="mld" nameKey="name" label={({name,mld})=>fmt(mld)} labelLine={{stroke:"var(--c-muted)",strokeWidth:0.5}} fontSize={11}>
              {EXPENDITURE_STRUCTURE.map((e,i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip content={({active,payload})=>{
              if(!active||!payload?.length) return null;
              const d=payload[0].payload;
              return <div className="rounded-lg border px-3 py-2 text-xs shadow-sm" style={{background:"var(--bg-card)",borderColor:"var(--border-color)",color:"var(--c-text)"}}>
                <p className="font-medium">{d.name}</p><p>{fmt(d.mld)} mld lei · {d.pib}% PIB</p>
              </div>;
            }} />
          </PieChart>
        </ResponsiveContainer>
      )}
      {mode === "bar" && (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={EXPENDITURE_STRUCTURE} margin={{left:4,right:16,top:4,bottom:4}}>
            <XAxis dataKey="name" tick={{fontSize:10, fill:"var(--c-muted)"}} angle={-25} textAnchor="end" height={60} />
            <YAxis tick={{fontSize:11, fill:"var(--c-muted)"}} tickFormatter={v=>v+" mld"} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="mld" name="Cheltuieli" radius={[4,4,0,0]} barSize={36}>
              {EXPENDITURE_STRUCTURE.map((e,i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      {mode === "pib" && (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={EXPENDITURE_STRUCTURE} layout="vertical" margin={{left:4,right:24,top:4,bottom:4}}>
            <XAxis type="number" tick={{fontSize:11,fill:"var(--c-muted)"}} tickFormatter={v=>v+"%"} domain={[0,14]} />
            <YAxis type="category" dataKey="name" width={110} tick={{fontSize:11,fill:"var(--c-text)"}} />
            <Tooltip content={<CustomTooltip suffix="% PIB" />} />
            <Bar dataKey="pib" name="% PIB" radius={[0,4,4,0]} barSize={20}>
              {EXPENDITURE_STRUCTURE.map((e,i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      <div className="flex flex-wrap gap-3 mt-1">
        {EXPENDITURE_STRUCTURE.map((e,i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs" style={{color:"var(--c-muted)"}}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{background:e.color}}/> {e.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function DeficitTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Deficit cash 2026" value="6,2%" unit="din PIB · 127,7 mld lei" accent="#A32D2D" />
        <MetricCard label="Deficit ESA 2026" value="6,0%" unit="din PIB" accent="#D85A30" />
        <MetricCard label="Țintă 2029" value="3,2%" unit="ESA % PIB" accent="#639922" sub={{text: "Reducere de 2,8 pp", color:"#639922"}} />
        <MetricCard label="Datorie publică" value="62,5%" unit="din PIB la final 2026" accent="#993556" />
      </div>

      <p className="text-sm font-medium" style={{color:"var(--c-text)"}}>Traiectoria deficitului 2024 – 2029</p>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={DEFICIT_TRAJECTORY} margin={{left:4,right:16,top:4,bottom:4}}>
          <defs>
            <linearGradient id="cashG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A32D2D" stopOpacity={0.2}/><stop offset="100%" stopColor="#A32D2D" stopOpacity={0.02}/>
            </linearGradient>
            <linearGradient id="esaG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D85A30" stopOpacity={0.2}/><stop offset="100%" stopColor="#D85A30" stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="year" tick={{fontSize:12, fill:"var(--c-muted)"}} />
          <YAxis domain={[0,10]} tick={{fontSize:11, fill:"var(--c-muted)"}} tickFormatter={v=>v+"%"} />
          <Tooltip content={<CustomTooltip suffix="% PIB" />} />
          <Area type="monotone" dataKey="cash" name="Deficit cash" stroke="#A32D2D" fill="url(#cashG)" strokeWidth={2.5} dot={{r:5, fill:"#A32D2D", stroke:"#fff", strokeWidth:2}} />
          <Area type="monotone" dataKey="esa" name="Deficit ESA" stroke="#D85A30" fill="url(#esaG)" strokeWidth={2} dot={{r:4, fill:"#D85A30", stroke:"#fff", strokeWidth:2}} strokeDasharray="6 3" />
          <Line type="monotone" dataKey={() => 3} name="Limita UE 3%" stroke="#639922" strokeDasharray="8 4" dot={false} strokeWidth={1.5} />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-4">
        <span className="flex items-center gap-1.5 text-xs" style={{color:"var(--c-muted)"}}><span className="inline-block w-6 h-0.5 rounded" style={{background:"#A32D2D"}}/> Deficit cash</span>
        <span className="flex items-center gap-1.5 text-xs" style={{color:"var(--c-muted)"}}><span className="inline-block w-6 border-t-2 border-dashed" style={{borderColor:"#D85A30"}}/> Deficit ESA</span>
        <span className="flex items-center gap-1.5 text-xs" style={{color:"var(--c-muted)"}}><span className="inline-block w-6 border-t-2 border-dashed" style={{borderColor:"#639922"}}/> Limita UE 3%</span>
      </div>

      <div className="rounded-xl border p-4 mt-2" style={{borderColor:"var(--border-color)", background:"var(--bg-surface)"}}>
        <p className="text-xs font-medium mb-2" style={{color:"var(--c-text)"}}>Context</p>
        <p className="text-xs leading-relaxed" style={{color:"var(--c-muted)"}}>
          România s-a angajat prin Planul Fiscal-Bugetar Structural pe Termen Mediu să reducă gradual deficitul, cu obiectivul de a se conforma regulamentelor europene din 2031. Dobânzile la datoria publică cresc cu 10,3 mld lei față de 2025 (de la 50,5 la 60,8 mld), reflectând costul finanțării deficitelor acumulate.
        </p>
      </div>
    </div>
  );
}

function LocaleTab() {
  const total = TVA_LOCAL.reduce((s,t)=>s+t.value, 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard label="TVA pt bugete locale" value={"27.706,5"} unit="milioane lei" accent="#185FA5" />
        <MetricCard label="Resurse locale totale" value={"86,4"} unit="mld lei · +7,4 mld vs 2025" accent="#0F6E56" />
        <MetricCard label="Impozit pe venit – cotă locală" value="63%" unit="la comune, orașe, municipii" />
      </div>
      <p className="text-sm font-medium" style={{color:"var(--c-text)"}}>Repartizarea TVA către bugete locale (milioane lei)</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={TVA_LOCAL} layout="vertical" margin={{left:4,right:24,top:4,bottom:4}}>
          <XAxis type="number" tick={{fontSize:11, fill:"var(--c-muted)"}} tickFormatter={v => Math.round(v).toLocaleString("ro-RO")} />
          <YAxis type="category" dataKey="name" width={200} tick={{fontSize:10, fill:"var(--c-text)"}} />
          <Tooltip content={({active,payload})=>{
            if(!active||!payload?.length) return null;
            const d=payload[0].payload;
            return <div className="rounded-lg border px-3 py-2 text-xs shadow-sm" style={{background:"var(--bg-card)", borderColor:"var(--border-color)", color:"var(--c-text)"}}>
              <p className="font-medium">{d.name}</p>
              <p>{d.value.toLocaleString("ro-RO")} mil lei ({fmt(d.value/total*100)}%)</p>
            </div>;
          }} />
          <Bar dataKey="value" name="Sume" radius={[0,4,4,0]} barSize={22} fill="#185FA5" />
        </BarChart>
      </ResponsiveContainer>

      <div className="rounded-xl border p-4" style={{borderColor:"var(--border-color)", background:"var(--bg-surface)"}}>
        <p className="text-xs font-medium mb-2" style={{color:"var(--c-text)"}}>Cotele din impozitul pe venit (art. 6)</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs" style={{color:"var(--c-muted)"}}>
          <div><strong style={{color:"var(--c-text)"}}>63%</strong> – bugete locale ale comunelor, orașelor, municipiilor</div>
          <div><strong style={{color:"var(--c-text)"}}>15%</strong> – bugetul local al județului</div>
          <div><strong style={{color:"var(--c-text)"}}>14%</strong> – echilibrare la nivel național</div>
          <div><strong style={{color:"var(--c-text)"}}>6%</strong> – fond la dispoziția consiliului județean</div>
          <div><strong style={{color:"var(--c-text)"}}>2%</strong> – finanțare teatre, opere, filarmonici</div>
          <div><strong style={{color:"var(--c-text)"}}>14%</strong> – fond CGMB (pentru București)</div>
        </div>
      </div>
    </div>
  );
}

function EUTab() {
  const totalEU = EU_FUNDS.reduce((s,f)=>s+f.value, 0);
  const euColors = ["#0F6E56","#534AB7","#185FA5","#D85A30"];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total fonduri UE" value={"110+"} unit="mld lei în 2026" accent="#0F6E56" sub={{text:"+40% față de 2025 (78 mld)", color:"#0F6E56"}} />
        <MetricCard label="Investiții din UE" value="~67%" unit="din totalul investițiilor" accent="#185FA5" />
        <MetricCard label="SAFE (apărare)" value="~6" unit="mld lei avansuri" accent="#D85A30" sub={{text: "Până la 16,2 mld € până 2030", color:"#D85A30"}} />
        <MetricCard label="PNRR de atras" value="10+" unit="mld € rămase" accent="#534AB7" />
      </div>

      <p className="text-sm font-medium" style={{color:"var(--c-text)"}}>Fonduri europene pe surse (mld lei)</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={EU_FUNDS} cx="50%" cy="50%" innerRadius={55} outerRadius={105} paddingAngle={3} dataKey="value" nameKey="name" label={({name,value})=> fmt(value)} labelLine={{stroke:"var(--c-muted)",strokeWidth:0.5}} fontSize={11}>
              {EU_FUNDS.map((_,i) => <Cell key={i} fill={euColors[i]} />)}
            </Pie>
            <Tooltip content={({active,payload})=>{
              if(!active||!payload?.length) return null;
              const d=payload[0].payload;
              return <div className="rounded-lg border px-3 py-2 text-xs shadow-sm" style={{background:"var(--bg-card)", borderColor:"var(--border-color)", color:"var(--c-text)"}}>
                <p className="font-medium">{d.name}</p>
                <p>{fmt(d.value)} mld lei · {d.growth}</p>
              </div>;
            }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-3">
          {EU_FUNDS.map((f,i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3" style={{borderColor:"var(--border-color)"}}>
              <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0" style={{background:euColors[i]}}/>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{color:"var(--c-text)"}}>{f.name}</p>
                <p className="text-xs" style={{color:"var(--c-muted)"}}>{fmt(f.value)} mld lei</p>
              </div>
              <Badge color={euColors[i]}>{f.growth}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border p-4" style={{borderColor:"var(--border-color)", background:"var(--bg-surface)"}}>
        <p className="text-xs font-medium mb-2" style={{color:"var(--c-text)"}}>Proiecte majore finanțate din fonduri UE</p>
        <p className="text-xs leading-relaxed" style={{color:"var(--c-muted)"}}>
          Autostrada Moldovei • Infrastructură spitalicească • Energie și eficiență energetică • Mobilitate urbană • Pașcani–Suceava–Siret • Târgu Neamț–Iași–Ungheni • Înzestrare militară prin SAFE • Consolidarea capacităților de apărare
        </p>
      </div>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────
export default function BudgetExplorer() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div>
      <div className="p-4 md:p-6" style={{color:"var(--c-text)", maxWidth:960, margin:"0 auto"}}>
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{color:"var(--c-text)"}}>
              Bugetul României 2026
            </h1>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{background:"#0F6E5618", color:"#0F6E56"}}>
              Proiect de lege
            </span>
          </div>
          <p className="text-xs mt-1" style={{color:"var(--c-muted)"}}>
            Explorer interactiv · Date din proiectul Legii bugetului de stat 2026, Ministerul Finanțelor
          </p>
        </div>

        {/* Tabs */}
        <div className="tab-scroll flex gap-1 overflow-x-auto pb-3 mb-5 border-b" style={{borderColor:"var(--border-color)"}}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap transition-all"
              style={{
                background: activeTab === tab.id ? "var(--c-text)" : "transparent",
                color: activeTab === tab.id ? "var(--bg-card)" : "var(--c-muted)",
                borderColor: activeTab === tab.id ? "var(--c-text)" : "var(--border-color)",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "ministere" && <MinistereTab />}
          {activeTab === "venituri" && <VenituriTab />}
          {activeTab === "cheltuieli" && <CheltuieliTab />}
          {activeTab === "deficit" && <DeficitTab />}
          {activeTab === "locale" && <LocaleTab />}
          {activeTab === "eu" && <EUTab />}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center" style={{borderColor:"var(--border-color)"}}>
          <p className="text-xs" style={{color:"var(--c-muted)"}}>
            Sursa: Proiect Legea bugetului de stat pe anul 2026 · Ministerul Finanțelor · mfinante.gov.ro
          </p>
        </div>
      </div>
    </div>
  );
}
