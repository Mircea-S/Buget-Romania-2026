import { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Area, AreaChart, Treemap, ComposedChart } from "recharts";
import ExplorerTab from "./components/ExplorerTab";
import { EXPLAINERS } from "./data/explainers";

// ─── DATA ───────────────────────────────────────────────────────────────
// Sursa: Anexa 3 — Formular 01 per ordonator principal de credite
// Valori în mld lei (mii lei ÷ 1.000.000)
const MINISTRIES = [
  // ── Social ──
  { name: "Min. Muncii, Familiei, Tineretului și Solidarității Sociale", short: "Muncă", cb: 91.8, ca: 92.47, cb25: 99.25, personal: 0.57, bunuri: 0.34, investitii: 0.02, fonduriEU: 2.19, cat: "social", desc: "Pensii, asistență socială, ajutoare" },
  { name: "Min. Educației și Cercetării", short: "Educație", cb: 64.79, ca: 65.25, cb25: 61.25, personal: 35.98, bunuri: 1.08, investitii: 1.18, fonduriEU: 10.98, cat: "social", desc: "Învățământ, cercetare, burse" },
  { name: "Min. Sănătății", short: "Sănătate", cb: 22.78, ca: 31.1, cb25: 26.15, personal: 2.51, bunuri: 6.17, investitii: 0.04, fonduriEU: 7.3, cat: "social", desc: "Spitale, programe naționale sănătate" },
  { name: "Min. Culturii", short: "Cultură", cb: 1.44, ca: 2.17, cb25: 1.39, personal: 0.05, bunuri: 0.2, investitii: 0, fonduriEU: 0.1, cat: "social", desc: "Cultură, patrimoniu, artă" },
  { name: "Secretariatul de Stat pentru Culte", short: "Culte", cb: 2.68, ca: 2.68, cb25: 2.83, personal: 0.01, bunuri: 0, investitii: 0, fonduriEU: 0, cat: "social", desc: "Salarizare personal clerical" },
  { name: "Academia Română", short: "Acad.Rom.", cb: 0.75, ca: 0.78, cb25: 0.57, personal: 0.39, bunuri: 0.09, investitii: 0.06, fonduriEU: 0.1, cat: "social", desc: "Cercetare, biblioteci, institute" },
  // ── Securitate ──
  { name: "Min. Apărării Naționale", short: "Apărare", cb: 49.37, ca: 112.54, cb25: 42.38, personal: 13.83, bunuri: 3.94, investitii: 22.29, fonduriEU: 0.22, cat: "securitate", desc: "Armată, înzestrare, NATO" },
  { name: "Min. Afacerilor Interne", short: "Interne", cb: 35.76, ca: 36.21, cb25: 34.45, personal: 19.64, bunuri: 1.26, investitii: 0.44, fonduriEU: 3.97, cat: "securitate", desc: "Poliție, pompieri, jandarmi, frontieră" },
  { name: "SRI", short: "SRI", cb: 5.2, ca: 5.67, cb25: 4.57, personal: 2.47, bunuri: 0.3, investitii: 0.25, fonduriEU: 0.75, cat: "securitate", desc: "Serviciul Român de Informații" },
  { name: "SIE", short: "SIE", cb: 0.81, ca: 0.76, cb25: 0.81, personal: 0.49, bunuri: 0.17, investitii: 0.15, fonduriEU: 0, cat: "securitate", desc: "Serviciul de Informații Externe" },
  { name: "SPP", short: "SPP", cb: 0.41, ca: 0.42, cb25: 0.45, personal: 0.36, bunuri: 0.03, investitii: 0.01, fonduriEU: 0.06, cat: "securitate", desc: "Serviciul de Protecție și Pază" },
  { name: "STS", short: "STS", cb: 1.53, ca: 1.67, cb25: 2.16, personal: 0.7, bunuri: 0.14, investitii: 0.12, fonduriEU: 0.55, cat: "securitate", desc: "Serviciul de Telecomunicații Speciale" },
  { name: "Min. Afacerilor Externe", short: "Externe", cb: 1.6, ca: 1.83, cb25: 1.69, personal: 0.58, bunuri: 0.54, investitii: 0.07, fonduriEU: 0.05, cat: "securitate", desc: "Ambasade, diplomație" },
  // ── Investiții ──
  { name: "Min. Transporturilor și Infrastructurii", short: "Transporturi", cb: 42.03, ca: 109.98, cb25: 43.63, personal: 0.08, bunuri: 0.02, investitii: 0, fonduriEU: 30.85, cat: "investitii", desc: "Drumuri, căi ferate, autostrăzi" },
  { name: "Min. Dezvoltării, Lucrărilor Publice și Administrației", short: "Dezvoltare", cb: 22.84, ca: 39.23, cb25: 28.9, personal: 0.13, bunuri: 0.02, investitii: 0.23, fonduriEU: 11.26, cat: "investitii", desc: "PNDL, Saligny, dezvoltare locală" },
  { name: "Min. Investițiilor și Proiectelor Europene", short: "Inv. EU", cb: 12.64, ca: 17.87, cb25: 7.33, personal: 0.03, bunuri: 0.01, investitii: 0, fonduriEU: 12.42, cat: "investitii", desc: "Gestionare fonduri europene" },
  // ── Economic ──
  { name: "Min. Agriculturii și Dezvoltării Rurale", short: "Agricultură", cb: 27.73, ca: 43.75, cb25: 26.39, personal: 0.83, bunuri: 0.15, investitii: 0.07, fonduriEU: 19.74, cat: "economic", desc: "Subvenții fermieri, APIA, dezvoltare rurală" },
  { name: "Min. Energiei", short: "Energie", cb: 19.72, ca: 10.18, cb25: 5.35, personal: 0.04, bunuri: 0.01, investitii: 0, fonduriEU: 2.89, cat: "economic", desc: "Subvenții energie, tranziție verde" },
  { name: "Min. Economiei, Digitalizării, Antreprenoriatului și Turismului", short: "Economie", cb: 3.68, ca: 3.97, cb25: 2.31, personal: 0.19, bunuri: 0.05, investitii: 0.02, fonduriEU: 2.46, cat: "economic", desc: "Turism, digitalizare, industrie" },
  { name: "Min. Mediului, Apelor și Pădurilor", short: "Mediu", cb: 5.95, ca: 4.67, cb25: 5.28, personal: 0.48, bunuri: 0.23, investitii: 0.38, fonduriEU: 4.35, cat: "economic", desc: "Protecția mediului, ape, păduri" },
  { name: "ANSVSA", short: "ANSVSA", cb: 1.46, ca: 1.48, cb25: 1.39, personal: 0.04, bunuri: 0, investitii: 0, fonduriEU: 0.2, cat: "economic", desc: "Siguranța alimentelor, control sanitar-veterinar" },
  // ── Justiție ──
  { name: "Min. Justiției", short: "Justiție", cb: 4.31, ca: 4.66, cb25: 4.11, personal: 0.4, bunuri: 0.52, investitii: 0.17, fonduriEU: 0.36, cat: "justitie", desc: "Instanțe, penitenciare" },
  { name: "Min. Public", short: "Min.Public", cb: 2.88, ca: 2.66, cb25: 1.74, personal: 2.26, bunuri: 0.16, investitii: 0.02, fonduriEU: 0.39, cat: "justitie", desc: "Parchete, procuratură" },
  { name: "Înalta Curte de Casație și Justiție", short: "ÎCCJ", cb: 4.99, ca: 5.02, cb25: 3.35, personal: 4.94, bunuri: 0.03, investitii: 0, fonduriEU: 0, cat: "justitie", desc: "Instanțe judecătorești" },
  { name: "Consiliul Superior al Magistraturii", short: "CSM", cb: 0.28, ca: 0.29, cb25: 0.26, personal: 0.19, bunuri: 0.02, investitii: 0, fonduriEU: 0.01, cat: "justitie", desc: "Autoguvernare justiție" },
  { name: "Curtea de Conturi", short: "C.Conturi", cb: 0.56, ca: 0.57, cb25: 0.49, personal: 0.37, bunuri: 0.03, investitii: 0.04, fonduriEU: 0.12, cat: "justitie", desc: "Audit public extern" },
  // ── Administrație ──
  { name: "Min. Finanțelor", short: "Finanțe", cb: 12.17, ca: 21.56, cb25: 11.13, personal: 3.9, bunuri: 0.42, investitii: 0.3, fonduriEU: 4.74, cat: "admin", desc: "ANAF, trezorerie, administrare fiscală" },
  { name: "Min. Finanțelor – Acțiuni Generale", short: "Fin.Acț.Gen.", cb: 112.43, ca: 112.89, cb25: 87.15, personal: 0, bunuri: 0.58, investitii: 0, fonduriEU: 25.77, cat: "admin", desc: "Dobânzi, transferuri, rezerve bugetare" },
  { name: "Secretariatul General al Guvernului", short: "SGG", cb: 2.68, ca: 2.84, cb25: 2.06, personal: 0.45, bunuri: 0.23, investitii: 0.02, fonduriEU: 0.67, cat: "admin", desc: "Coordonare guvernamentală" },
  { name: "Camera Deputaților", short: "Cam.Dep.", cb: 0.58, ca: 0.95, cb25: 0.56, personal: 0.39, bunuri: 0.09, investitii: 0.04, fonduriEU: 0, cat: "admin", desc: "Legislativ" },
  { name: "Senatul României", short: "Senat", cb: 0.26, ca: 0.26, cb25: 0.25, personal: 0.18, bunuri: 0.03, investitii: 0.02, fonduriEU: 0, cat: "admin", desc: "Legislativ" },
  { name: "Administrația Prezidențială", short: "Președinție", cb: 0.1, ca: 0.12, cb25: 0.07, personal: 0.04, bunuri: 0.04, investitii: 0.01, fonduriEU: 0, cat: "admin", desc: "Instituția prezidențială" },
  { name: "Curtea Constituțională", short: "C.Const.", cb: 0.04, ca: 0.04, cb25: 0.04, personal: 0.04, bunuri: 0.01, investitii: 0, fonduriEU: 0, cat: "admin", desc: "Control constituționalitate" },
];

const MACRO = {
  pib: 2045,
  venituriStat: 391.7,
  cheltuieliStatCB: 527.4,
  cheltuieliStatCA: 712.6,
  deficitStat: 135.7,
  venituriCons: 736.5, cheltuieliCons: 864.3,
  investitii: 163.8, fonduriEU: 110, dobanzile: 58.8,
  datorie: 62.5,
};

// Venituri buget de stat (net, după defalcări) — Anexa 1
const REVENUE_BREAKDOWN = [
  { name: "TVA (net, după defalcări)", value: 128.6, color: "#185FA5", detail: "Brut 156,3 mld – defalcări locale 27,7 mld" },
  { name: "Accize", value: 52.5, color: "#0F6E56", detail: "Accize pe combustibili, tutun, alcool" },
  { name: "Sume de la UE", value: 50.9, color: "#639922", detail: "Coeziune, PNRR, SAFE, alte fonduri" },
  { name: "Impozit pe profit", value: 42.4, color: "#534AB7", detail: "Profit agenți economici + bănci" },
  { name: "Venituri din proprietate", value: 19.8, color: "#BA7517", detail: "Dividende, certificate emisii CO₂" },
  { name: "Impozit pe venit (net)", value: 19.1, color: "#D85A30", detail: "Brut 59,7 mld – cote defalcate 40,6 mld" },
  { name: "Contribuții asigurări", value: 17.9, color: "#993556", detail: "CAS, CASS la bugetul de stat" },
  { name: "Alte venituri", value: 60.5, color: "#888780", detail: "Taxe, amenzi, venituri nefiscale, capital" },
];

// Cheltuieli buget de stat pe TITLURI — Anexa 1, credite bugetare
const EXPENDITURE_BY_TITLE = [
  { name: "Personal", mld: 89.8, color: "#0F6E56" },
  { name: "Asistență socială", mld: 74.5, color: "#534AB7" },
  { name: "Transferuri admin publice", mld: 71.1, color: "#185FA5" },
  { name: "Dobânzi", mld: 58.8, color: "#D85A30" },
  { name: "Proiecte FEN postaderare", mld: 49.5, color: "#639922" },
  { name: "Alte transferuri", mld: 33.0, color: "#BA7517" },
  { name: "Active nefinanciare", mld: 22.0, color: "#993556" },
  { name: "Proiecte FEN 2014-2020", mld: 16.4, color: "#0F6E56" },
  { name: "Bunuri și servicii", mld: 14.3, color: "#888780" },
  { name: "PNRR nerambursabil", mld: 10.7, color: "#185FA5" },
  { name: "Alte cheltuieli", mld: 9.4, color: "#A32D2D" },
  { name: "Subvenții", mld: 8.4, color: "#D85A30" },
];

// Cheltuieli buget de stat pe PĂRȚI FUNCȚIONALE — Anexa 1, credite bugetare
const EXPENDITURE_BY_FUNCTION = [
  { name: "Cheltuieli social-culturale", mld: 164.6, color: "#534AB7", detail: "Învățământ 56,7 + Asigurări sociale 78,4 + Sănătate 22,9 + Cultură 6,6" },
  { name: "Acțiuni economice", mld: 90.0, color: "#639922", detail: "Transporturi 41,1 + Agricultură 27,9 + Acțiuni generale 18,0" },
  { name: "Apărare, ordine publică", mld: 78.5, color: "#D85A30", detail: "Apărare 34,3 + Ordine publică 44,2" },
  { name: "Servicii publice generale", mld: 176.4, color: "#185FA5", detail: "Autorități 51,3 + Datorie publică 60,4 + Transferuri generale 31,4" },
  { name: "Locuințe, mediu, dezvoltare", mld: 18.0, color: "#993556", detail: "Locuințe 12,4 + Mediu 5,5" },
];

// Deficit cash (Anexa 1, pag. 42) + ESA (plan fiscal-bugetar)
const DEFICIT_TRAJECTORY = [
  { year: "2024", mld: 157.1, cash: 8.7, esa: 8.6 },
  { year: "2025", mld: 175.1, cash: 8.6, esa: 7.8 },
  { year: "2026", mld: 135.7, cash: 6.6, esa: 6.0 },
  { year: "2027", mld: 122.5, cash: 5.6, esa: 5.1 },
  { year: "2028", mld: 110.4, cash: 4.7, esa: 4.2 },
  { year: "2029", mld: 89.9, cash: 3.6, esa: 3.2 },
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
  admin: { label: "Administrație", color: "#888780" },
};

const EU_FUNDS = [
  { name: "Fonduri coeziune post-aderare", value: 51.3, growth: "+42%" },
  { name: "PNRR – Granturi", value: 41.4, growth: "+43%" },
  { name: "PNRR – Împrumuturi", value: 12.0, growth: "nou" },
  { name: "Instrument SAFE", value: 6.0, growth: "nou" },
];

// Venituri detaliate cu breakdown brut/defalcări
const REVENUE_DETAIL = [
  { name: "TVA brut", value: 156.3, parent: "TVA", color: "#185FA5" },
  { name: "TVA – defalcări locale", value: 27.7, parent: "TVA", color: "#185FA580" },
  { name: "Impozit venit brut", value: 59.7, parent: "Impozit venit", color: "#D85A30" },
  { name: "Impozit venit – cote defalcate", value: 40.6, parent: "Impozit venit", color: "#D85A3080" },
  { name: "Impozit pe profit", value: 42.4, parent: "Direct", color: "#534AB7" },
  { name: "Accize", value: 52.5, parent: "Indirect", color: "#0F6E56" },
  { name: "Contribuții asigurări", value: 17.9, parent: "Contribuții", color: "#993556" },
  { name: "Sume de la UE", value: 50.9, parent: "UE", color: "#639922" },
  { name: "Venituri din proprietate", value: 19.8, parent: "Nefiscale", color: "#BA7517" },
  { name: "Taxe jocuri noroc", value: 6.9, parent: "Indirect", color: "#A32D2D" },
  { name: "Taxe vamale", value: 2.6, parent: "Indirect", color: "#888780" },
  { name: "Alte venituri", value: 14.0, parent: "Altele", color: "#888780" },
];

// ─── HELPERS ────────────────────────────────────────────────────────────
const fmt = (n) => n.toLocaleString("ro-RO", { maximumFractionDigits: 1 });
const pct = (n) => (n >= 0 ? "+" : "") + fmt(n) + "%";

// ─── COMPONENTS ─────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Prezentare generală" },
  { id: "ministere", label: "Alocări ministere" },
  { id: "detaliu", label: "Detaliu ministere" },
  { id: "venituri", label: "Venituri" },
  { id: "venituriDetaliu", label: "Venituri detaliat" },
  { id: "cheltuieli", label: "Cheltuieli" },
  { id: "deficit", label: "Deficit & Datorie" },
  { id: "locale", label: "Bugete locale" },
  { id: "eu", label: "Fonduri UE" },
  { id: "explorer", label: "Explorer" },
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

function OverviewTab({ onNavigateExplorer }) {
  const top8 = useMemo(() => [...MINISTRIES].sort((a, b) => b.cb - a.cb).slice(0, 8), []);
  return (
    <div className="space-y-6">
      <p className="text-xs" style={{color:"var(--c-muted)"}}>{EXPLAINERS.overview.intro}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="PIB estimat" value={fmt(MACRO.pib)} unit="miliarde lei" />
        <MetricCard label="Venituri buget de stat" value={fmt(MACRO.venituriStat)} unit="mld lei · 19,2% PIB" accent="#0F6E56"/>
        <MetricCard label="Cheltuieli buget de stat" value={fmt(MACRO.cheltuieliStatCB)} unit="mld lei (CB)" accent="#D85A30"/>
        <MetricCard label="Deficit bugetar" value={"-" + fmt(MACRO.deficitStat)} unit="mld lei" accent="#A32D2D" sub={{text:"6,6% din PIB (cash)", color:"#A32D2D"}} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Investiții publice" value={fmt(MACRO.investitii)} unit="mld lei · 8% PIB" accent="#639922" sub={{text: "+25,6 mld vs 2025", color:"#639922"}} />
        <MetricCard label="Fonduri europene" value={"110+"} unit="mld lei" accent="#185FA5" sub={{text: "+40% față de 2025", color:"#185FA5"}} />
        <MetricCard label="Dobânzi datorii" value={fmt(MACRO.dobanzile)} unit="mld lei · 2,9% PIB" accent="#BA7517" sub={{text: "+10 mld vs 2025 (48,8→58,8)", color:"#BA7517"}} />
        <MetricCard label="Datorie publică" value={fmt(MACRO.datorie) + "%"} unit="din PIB" accent="#993556" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
        <div>
          <p className="text-sm font-medium mb-3" style={{color:"var(--c-text)"}}>Top 8 ordonatori – credite bugetare</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={top8} layout="vertical" margin={{left:4,right:16,top:4,bottom:4}}>
              <XAxis type="number" tick={{fontSize:11, fill:"var(--c-muted)"}} tickFormatter={v => v + " mld"} />
              <YAxis type="category" dataKey="short" width={90} tick={{fontSize:11, fill:"var(--c-text)"}} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cb" name="Credite bugetare" radius={[0,4,4,0]} barSize={18} cursor="pointer" onClick={(d) => onNavigateExplorer && onNavigateExplorer(d.name)}>
                {top8.map((m,i) => <Cell key={i} fill={CATEGORIES[m.cat].color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-sm font-medium mb-3" style={{color:"var(--c-text)"}}>Traiectoria deficitului (% PIB)</p>
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

      <div className="rounded-xl border p-4" style={{borderColor:"var(--border-color)", background:"var(--bg-surface)"}}>
        <p className="text-xs font-medium mb-2" style={{color:"var(--c-text)"}}>💡 Ce vedeți aici?</p>
        <p className="text-xs leading-relaxed" style={{color:"var(--c-muted)"}}>{EXPLAINERS.overview.context}</p>
      </div>
    </div>
  );
}

function MinistereTab({ onNavigateExplorer }) {
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
      <p className="text-xs" style={{color:"var(--c-muted)"}}>{EXPLAINERS.ministries.intro}</p>
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
            {[{id:"cb",label:"Credite bugetare"},{id:"ca",label:"Credite angajament"}].map(s=>(
              <button key={s.id} onClick={()=>setSortBy(s.id)} className="text-xs underline" style={{
                color: sortBy === s.id ? "var(--c-text)" : "var(--c-muted)"
              }}>{s.label}</button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={Math.max(300, filtered.length * 36)}>
            <BarChart data={filtered} layout="vertical" margin={{left:4,right:24,top:4,bottom:4}}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
              <XAxis type="number" tick={{fontSize:11, fill:"var(--c-muted)"}} tickFormatter={v => v + " mld"} />
              <YAxis type="category" dataKey="short" width={90} tick={{fontSize:11, fill:"var(--c-text)"}} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                const change = ((d.cb - d.cb25) / d.cb25 * 100);
                return (
                  <div className="rounded-lg border px-3 py-2 text-xs shadow-sm" style={{background:"var(--bg-card)", borderColor:"var(--border-color)", color:"var(--c-text)"}}>
                    <p className="font-medium">{d.name}</p>
                    <p className="mt-1" style={{color:"var(--c-muted)"}}>{d.desc}</p>
                    <p className="mt-1">CB 2026: <strong>{fmt(d.cb)} mld</strong></p>
                    <p>CA 2026: <strong>{fmt(d.ca)} mld</strong></p>
                    <p>CB 2025: {fmt(d.cb25)} mld → <span style={{color: change >= 0 ? "#639922" : "#A32D2D"}}>{pct(change)}</span></p>
                  </div>
                );
              }} />
              <Bar dataKey="cb" name="CB 2026" radius={[0,4,4,0]} barSize={18} cursor="pointer" onClick={(d) => onNavigateExplorer && onNavigateExplorer(d.name)}>
                {filtered.map((m,i) => <Cell key={i} fill={CATEGORIES[m.cat].color} fillOpacity={0.85} />)}
              </Bar>
              <Bar dataKey="cb25" name="CB 2025" radius={[0,4,4,0]} barSize={18} fillOpacity={0.3}>
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
            content={({ x, y, width, height, name, size, cat, fullName }) => {
              if (!width || !height || width < 30 || height < 25 || !name) return null;
              const nameFontSize = Math.max(11, Math.min(16, Math.floor(width / 8)));
              const valFontSize = Math.max(10, nameFontSize - 2);
              return (
                <g style={{cursor:"pointer"}} onClick={() => onNavigateExplorer && onNavigateExplorer(fullName || name)}>
                  <rect x={x} y={y} width={width} height={height} rx={6} fill={CATEGORIES[cat]?.color || "#888"} />
                  {width > 50 && height > 35 && <>
                    <text x={x + 8} y={y + 4 + nameFontSize} fontSize={nameFontSize} fill="var(--c-text)">{name}</text>
                    <text x={x + 8} y={y + 8 + nameFontSize + valFontSize} fontSize={valFontSize} fill="var(--c-text)">{typeof size === 'number' ? fmt(size) + ' mld' : ''}</text>
                  </>}
                </g>
              );
            }}
          >
            <Tooltip content={({ payload }) => {
              if (!payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{background:"var(--bg-card)",border:"1px solid var(--border-color)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"var(--c-text)",boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
                  <div style={{fontWeight:700}}>{d.name}</div>
                  <div>{fmt(d.size)} mld lei (CB 2026)</div>
                  {d.cat && CATEGORIES[d.cat] && <div style={{color:CATEGORIES[d.cat].color,fontWeight:600,marginTop:2}}>{CATEGORIES[d.cat].label}</div>}
                </div>
              );
            }} />
          </Treemap>
        </ResponsiveContainer>
      )}

      {viewMode === "table" && (
        <div className="overflow-x-auto rounded-lg border" style={{borderColor:"var(--border-color)"}}>
          <table className="w-full text-xs" style={{color:"var(--c-text)"}}>
            <thead>
              <tr style={{background:"var(--bg-surface)"}}>
                <th className="text-left p-2.5 font-medium">Ordonator</th>
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
                    <td className="p-2.5">
                      {onNavigateExplorer && <button onClick={() => onNavigateExplorer(m.name)} title="Vezi în Explorer" className="opacity-50 hover:opacity-100 text-xs">→</button>}
                    </td>
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

      <div className="rounded-xl border p-4" style={{borderColor:"var(--border-color)", background:"var(--bg-surface)"}}>
        <p className="text-xs font-medium mb-2" style={{color:"var(--c-text)"}}>💡 Ce vedeți aici?</p>
        <p className="text-xs leading-relaxed" style={{color:"var(--c-muted)"}}>{EXPLAINERS.ministries.context}</p>
      </div>
    </div>
  );
}

function DetaliiMinistereTab({ onNavigateExplorer }) {
  const STACK_COLORS = { personal: "#534AB7", bunuri: "#BA7517", investitii: "#639922", fonduriEU: "#185FA5", alte: "#888780" };

  const data = useMemo(() => {
    return [...MINISTRIES]
      .filter(m => m.cb >= 1.0)
      .sort((a, b) => b.cb - a.cb)
      .map(m => {
        const known = (m.personal || 0) + (m.bunuri || 0) + (m.investitii || 0) + (m.fonduriEU || 0);
        return { ...m, alte: Math.max(0, m.cb - known) };
      });
  }, []);

  return (
    <div className="space-y-5">
      <p className="text-sm font-medium" style={{color:"var(--c-text)"}}>Structura cheltuielilor per minister (mld lei, CB 2026)</p>
      <p className="text-xs" style={{color:"var(--c-muted)"}}>Arată <em>de ce</em> un minister are un buget mare: salarii, fonduri UE, investiții sau transferuri sociale. Pentru detalii complete pe capitole și titluri, vezi tab-ul <strong>Explorer</strong>.</p>
      <ResponsiveContainer width="100%" height={Math.max(400, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{left:4,right:24,top:4,bottom:4}}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
          <XAxis type="number" tick={{fontSize:11, fill:"var(--c-muted)"}} tickFormatter={v => v + " mld"} />
          <YAxis type="category" dataKey="short" width={90} tick={{fontSize:11, fill:"var(--c-text)"}} />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload;
            if (!d) return null;
            return (
              <div className="rounded-lg border px-3 py-2 text-xs shadow-sm" style={{background:"var(--bg-card)", borderColor:"var(--border-color)", color:"var(--c-text)"}}>
                <p className="font-medium mb-1">{d.name}</p>
                <p>Total CB: <strong>{fmt(d.cb)} mld</strong></p>
                {d.personal > 0 && <p style={{color:STACK_COLORS.personal}}>Personal: {fmt(d.personal)} mld</p>}
                {d.bunuri > 0 && <p style={{color:STACK_COLORS.bunuri}}>Bunuri: {fmt(d.bunuri)} mld</p>}
                {d.investitii > 0 && <p style={{color:STACK_COLORS.investitii}}>Investiții: {fmt(d.investitii)} mld</p>}
                {d.fonduriEU > 0 && <p style={{color:STACK_COLORS.fonduriEU}}>Fonduri UE: {fmt(d.fonduriEU)} mld</p>}
                {d.alte > 0 && <p style={{color:STACK_COLORS.alte}}>Alte (transferuri, subvenții...): {fmt(d.alte)} mld</p>}
              </div>
            );
          }} />
          <Bar dataKey="personal" name="Personal" stackId="a" fill={STACK_COLORS.personal} />
          <Bar dataKey="bunuri" name="Bunuri" stackId="a" fill={STACK_COLORS.bunuri} />
          <Bar dataKey="investitii" name="Investiții" stackId="a" fill={STACK_COLORS.investitii} />
          <Bar dataKey="fonduriEU" name="Fonduri UE" stackId="a" fill={STACK_COLORS.fonduriEU} />
          <Bar dataKey="alte" name="Alte" stackId="a" fill={STACK_COLORS.alte} radius={[0,4,4,0]} cursor="pointer" onClick={(d) => onNavigateExplorer && onNavigateExplorer(d.name)} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-1">
        {Object.entries(STACK_COLORS).map(([key, color]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs" style={{color:"var(--c-muted)"}}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{background: color}}/> {key === "personal" ? "Personal" : key === "bunuri" ? "Bunuri și servicii" : key === "investitii" ? "Investiții" : key === "fonduriEU" ? "Fonduri UE" : "Alte (transferuri, subvenții)"}
          </span>
        ))}
      </div>

      <div className="rounded-xl border p-4" style={{borderColor:"var(--border-color)", background:"var(--bg-surface)"}}>
        <p className="text-xs font-medium mb-2" style={{color:"var(--c-text)"}}>Exemple de structură</p>
        <p className="text-xs leading-relaxed" style={{color:"var(--c-muted)"}}>
          <strong>Educație</strong> (~65 mld): ~36 mld sunt salarii profesori + ~11 mld fonduri UE. <strong>Muncă</strong> (~92 mld): grosul sunt transferuri pentru pensii și asistență socială. <strong>Transporturi</strong> (~42 mld): ~31 mld sunt fonduri UE (autostrăzi, căi ferate). <strong>Apărare</strong> (~49 mld): ~14 mld salarii + ~22 mld investiții înzestrare.
        </p>
      </div>
    </div>
  );
}

function VenituriTab() {
  const [mode, setMode] = useState("pie");
  const total = REVENUE_BREAKDOWN.reduce((s,r)=>s+r.value, 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Venituri totale" value={fmt(MACRO.venituriStat)} unit="mld lei buget de stat" accent="#0F6E56" />
        <MetricCard label="TVA net" value="128,6" unit="mld lei (brut 156,3 – defalcări 27,7)" accent="#185FA5" />
        <MetricCard label="Sume de la UE" value="50,9" unit="mld lei" accent="#639922" sub={{text:"+297% vs 2025", color:"#639922"}} />
        <MetricCard label="Impozit pe profit" value="42,4" unit="mld lei" accent="#534AB7" sub={{text:"+3,6% vs 2025", color:"#534AB7"}} />
      </div>
      <p className="text-xs" style={{color:"var(--c-muted)"}}>{EXPLAINERS.revenue.intro}</p>
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
              <Pie data={REVENUE_BREAKDOWN} cx="50%" cy="50%" innerRadius={70} outerRadius={130} paddingAngle={3} dataKey="value" nameKey="name" label={({value})=> fmt(value) + " mld"} labelLine={{stroke:"var(--c-muted)",strokeWidth:0.5}} fontSize={11}>
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
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={REVENUE_BREAKDOWN} layout="vertical" margin={{left:4,right:24,top:4,bottom:4}}>
            <XAxis type="number" tick={{fontSize:11, fill:"var(--c-muted)"}} tickFormatter={v=>v+" mld"} />
            <YAxis type="category" dataKey="name" width={140} tick={{fontSize:10, fill:"var(--c-text)"}} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Venituri" radius={[0,4,4,0]} barSize={20}>
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

      <div className="rounded-xl border p-4" style={{borderColor:"var(--border-color)", background:"var(--bg-surface)"}}>
        <p className="text-xs font-medium mb-2" style={{color:"var(--c-text)"}}>💡 Ce vedeți aici?</p>
        <p className="text-xs leading-relaxed" style={{color:"var(--c-muted)"}}>{EXPLAINERS.revenue.context}</p>
      </div>
    </div>
  );
}

function VenituriDetaliuTab() {
  const treemapData = useMemo(() => {
    return REVENUE_DETAIL.map(r => ({
      name: r.name, size: r.value, color: r.color, parent: r.parent
    }));
  }, []);

  return (
    <div className="space-y-5">
      <p className="text-sm font-medium" style={{color:"var(--c-text)"}}>Venituri buget de stat — breakdown complet (mld lei)</p>
      <p className="text-xs" style={{color:"var(--c-muted)"}}>Arată diferența între valorile <em>brute</em> și cele <em>nete</em> (după defalcări către bugete locale).</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard label="TVA brut" value="156,3" unit="mld lei" accent="#185FA5" sub={{text: "–27,7 mld defalcări = 128,6 net", color:"#185FA5"}} />
        <MetricCard label="Impozit venit brut" value="59,7" unit="mld lei" accent="#D85A30" sub={{text: "–40,6 mld cote locale = 19,1 net", color:"#D85A30"}} />
        <MetricCard label="Total brut colectat" value="~490" unit="mld lei" accent="#0F6E56" sub={{text: "~100 mld merg la bugete locale", color:"#0F6E56"}} />
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <Treemap data={treemapData} dataKey="size" nameKey="name" stroke="var(--bg-card)" strokeWidth={2}
          content={({ x, y, width, height, name, size, color }) => {
            if (!width || !height || width < 30 || height < 25 || !name) return null;
            const nameFontSize = Math.max(11, Math.min(16, Math.floor(width / 8)));
            const valFontSize = Math.max(10, nameFontSize - 2);
            return (
              <g>
                <rect x={x} y={y} width={width} height={height} rx={6} fill={color || "#888"} />
                {width > 55 && height > 35 && <>
                  <text x={x + 8} y={y + 4 + nameFontSize} fontSize={nameFontSize} fill="var(--c-text)">{name}</text>
                  <text x={x + 8} y={y + 8 + nameFontSize + valFontSize} fontSize={valFontSize} fill="var(--c-text)">{typeof size === 'number' ? fmt(size) + ' mld' : ''}</text>
                </>}
              </g>
            );
          }}
        >
          <Tooltip content={({ payload }) => {
            if (!payload || !payload.length) return null;
            const d = payload[0].payload;
            return (
              <div style={{background:"var(--bg-card)",border:"1px solid var(--border-color)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"var(--c-text)",boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
                <div style={{fontWeight:700}}>{d.name}</div>
                <div>{fmt(d.size)} mld lei</div>
              </div>
            );
          }} />
        </Treemap>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={REVENUE_DETAIL} margin={{left:4,right:16,top:4,bottom:4}}>
          <XAxis dataKey="name" tick={{fontSize:9, fill:"var(--c-muted)"}} angle={-35} textAnchor="end" height={80} />
          <YAxis tick={{fontSize:11, fill:"var(--c-muted)"}} tickFormatter={v=>v+" mld"} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Venituri" radius={[4,4,0,0]} barSize={28}>
            {REVENUE_DETAIL.map((r,i) => <Cell key={i} fill={r.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="rounded-xl border p-4" style={{borderColor:"var(--border-color)", background:"var(--bg-surface)"}}>
        <p className="text-xs font-medium mb-2" style={{color:"var(--c-text)"}}>De ce contează diferența brut vs net?</p>
        <p className="text-xs leading-relaxed" style={{color:"var(--c-muted)"}}>
          Statul colectează ~156 mld lei TVA, dar 27,7 mld se duc direct către bugetele locale. Similar, din 59,7 mld impozit pe venit, 40,6 mld sunt cote defalcate care finanțează primării și consilii județene. Bugetul de stat reține doar diferența.
        </p>
      </div>
    </div>
  );
}

function CheltuieliTab() {
  const [view, setView] = useState("titluri");
  const [mode, setMode] = useState("bar");

  const data = view === "titluri" ? EXPENDITURE_BY_TITLE : EXPENDITURE_BY_FUNCTION;
  const total = data.reduce((s,e) => s + e.mld, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Cheltuieli buget stat CB" value={fmt(MACRO.cheltuieliStatCB)} unit="mld lei" />
        <MetricCard label="Personal" value="89,8" unit="mld lei · 4,4% PIB" accent="#0F6E56" sub={{text:"Stabil vs 2025 (+0,02%)",color:"#0F6E56"}} />
        <MetricCard label="Asistență socială" value="74,5" unit="mld lei" accent="#534AB7" sub={{text:"-0,7% vs 2025",color:"#534AB7"}} />
        <MetricCard label="Dobânzi" value={fmt(MACRO.dobanzile)} unit="mld lei" accent="#D85A30" sub={{text:"De la 48,8 → 58,8 mld (+20,5%)",color:"#D85A30"}} />
      </div>

      <p className="text-xs" style={{color:"var(--c-muted)"}}>{EXPLAINERS.expenditure.intro}</p>
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-medium mr-1" style={{color:"var(--c-muted)"}}>Vizualizare:</span>
        {[{id:"titluri",label:"Pe Titluri"},{id:"functii",label:"Pe Funcții"}].map(v => (
          <button key={v.id} onClick={()=>setView(v.id)} className="text-xs px-3 py-1 rounded-full border transition-all" style={{
            background: view===v.id?"var(--c-text)":"transparent", color: view===v.id?"var(--bg-card)":"var(--c-muted)", borderColor: view===v.id?"var(--c-text)":"var(--border-color)"
          }}>{v.label}</button>
        ))}
        <span className="mx-2 border-l" style={{borderColor:"var(--border-color)"}}/>
        {["bar","donut"].map(m => (
          <button key={m} onClick={()=>setMode(m)} className="text-xs px-3 py-1 rounded-full border transition-all" style={{
            background: mode===m?"var(--c-text)":"transparent", color: mode===m?"var(--bg-card)":"var(--c-muted)", borderColor: mode===m?"var(--c-text)":"var(--border-color)"
          }}>{m==="donut"?"Donut":"Bare"}</button>
        ))}
      </div>

      {mode === "bar" && (
        <ResponsiveContainer width="100%" height={Math.max(280, data.length * 36)}>
          <BarChart data={data} layout="vertical" margin={{left:4,right:24,top:4,bottom:4}}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
            <XAxis type="number" tick={{fontSize:11, fill:"var(--c-muted)"}} tickFormatter={v => v + " mld"} />
            <YAxis type="category" dataKey="name" width={160} tick={{fontSize:10, fill:"var(--c-text)"}} />
            <Tooltip content={({active,payload}) => {
              if(!active||!payload?.length) return null;
              const d = payload[0].payload;
              return <div className="rounded-lg border px-3 py-2 text-xs shadow-sm" style={{background:"var(--bg-card)", borderColor:"var(--border-color)", color:"var(--c-text)"}}>
                <p className="font-medium">{d.name}</p>
                <p>{fmt(d.mld)} mld lei ({fmt(d.mld/total*100)}%)</p>
                {d.detail && <p className="mt-1" style={{color:"var(--c-muted)"}}>{d.detail}</p>}
              </div>;
            }} />
            <Bar dataKey="mld" name="Cheltuieli" radius={[0,4,4,0]} barSize={20}>
              {data.map((e,i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {mode === "donut" && (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={130} paddingAngle={2} dataKey="mld" nameKey="name" label={({mld})=>fmt(mld)} labelLine={{stroke:"var(--c-muted)",strokeWidth:0.5}} fontSize={11}>
              {data.map((e,i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip content={({active,payload})=>{
              if(!active||!payload?.length) return null;
              const d=payload[0].payload;
              return <div className="rounded-lg border px-3 py-2 text-xs shadow-sm" style={{background:"var(--bg-card)",borderColor:"var(--border-color)",color:"var(--c-text)"}}>
                <p className="font-medium">{d.name}</p>
                <p>{fmt(d.mld)} mld lei ({fmt(d.mld/total*100)}%)</p>
                {d.detail && <p className="mt-1" style={{color:"var(--c-muted)"}}>{d.detail}</p>}
              </div>;
            }} />
          </PieChart>
        </ResponsiveContainer>
      )}

      <div className="flex flex-wrap gap-3 mt-1">
        {data.map((e,i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs" style={{color:"var(--c-muted)"}}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{background:e.color}}/> {e.name}
          </span>
        ))}
      </div>

      <div className="rounded-xl border p-4" style={{borderColor:"var(--border-color)", background:"var(--bg-surface)"}}>
        <p className="text-xs font-medium mb-2" style={{color:"var(--c-text)"}}>💡 Ce vedeți aici?</p>
        <p className="text-xs leading-relaxed" style={{color:"var(--c-muted)"}}>{EXPLAINERS.expenditure.context}</p>
      </div>
    </div>
  );
}

function DeficitTab() {
  return (
    <div className="space-y-5">
      <p className="text-xs" style={{color:"var(--c-muted)"}}>{EXPLAINERS.deficit.intro}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Deficit cash 2026" value="6,6%" unit={"din PIB · " + fmt(MACRO.deficitStat) + " mld lei"} accent="#A32D2D" />
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
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload;
            return <div className="rounded-lg border px-3 py-2 text-xs shadow-sm" style={{background:"var(--bg-card)", borderColor:"var(--border-color)", color:"var(--c-text)"}}>
              <p className="font-medium mb-1">{label}</p>
              {payload.map((p, i) => <p key={i} style={{color: p.color}}>{p.name}: {fmt(p.value)}% PIB</p>)}
              {d?.mld && <p className="mt-1" style={{color:"var(--c-muted)"}}>Cash: {fmt(d.mld)} mld lei</p>}
            </div>;
          }} />
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

      <div className="overflow-x-auto rounded-lg border" style={{borderColor:"var(--border-color)"}}>
        <table className="w-full text-xs" style={{color:"var(--c-text)"}}>
          <thead><tr style={{background:"var(--bg-surface)"}}>
            <th className="text-left p-2.5 font-medium">An</th>
            <th className="text-right p-2.5 font-medium">Deficit (mld lei)</th>
            <th className="text-right p-2.5 font-medium">Cash % PIB</th>
            <th className="text-right p-2.5 font-medium">ESA % PIB</th>
          </tr></thead>
          <tbody>
            {DEFICIT_TRAJECTORY.map((d, i) => (
              <tr key={i} className="border-t" style={{borderColor:"var(--border-color)"}}>
                <td className="p-2.5 font-medium">{d.year}</td>
                <td className="p-2.5 text-right tabular-nums">{fmt(d.mld)}</td>
                <td className="p-2.5 text-right tabular-nums" style={{color:"#A32D2D"}}>{fmt(d.cash)}%</td>
                <td className="p-2.5 text-right tabular-nums" style={{color:"#D85A30"}}>{fmt(d.esa)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border p-4 mt-2" style={{borderColor:"var(--border-color)", background:"var(--bg-surface)"}}>
        <p className="text-xs font-medium mb-2" style={{color:"var(--c-text)"}}>💡 Ce vedeți aici?</p>
        <p className="text-xs leading-relaxed" style={{color:"var(--c-muted)"}}>{EXPLAINERS.deficit.context}</p>
      </div>
    </div>
  );
}

function LocaleTab() {
  const total = TVA_LOCAL.reduce((s,t)=>s+t.value, 0);
  return (
    <div className="space-y-5">
      <p className="text-xs" style={{color:"var(--c-muted)"}}>{EXPLAINERS.locale.intro}</p>
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

      <div className="rounded-xl border p-4" style={{borderColor:"var(--border-color)", background:"var(--bg-surface)"}}>
        <p className="text-xs font-medium mb-2" style={{color:"var(--c-text)"}}>💡 Ce vedeți aici?</p>
        <p className="text-xs leading-relaxed" style={{color:"var(--c-muted)"}}>{EXPLAINERS.locale.context}</p>
      </div>
    </div>
  );
}

function EUTab() {
  const totalEU = EU_FUNDS.reduce((s,f)=>s+f.value, 0);
  const euColors = ["#0F6E56","#534AB7","#185FA5","#D85A30"];
  return (
    <div className="space-y-5">
      <p className="text-xs" style={{color:"var(--c-muted)"}}>{EXPLAINERS.eu.intro}</p>
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
            <Pie data={EU_FUNDS} cx="50%" cy="50%" innerRadius={55} outerRadius={105} paddingAngle={3} dataKey="value" nameKey="name" label={({value})=> fmt(value)} labelLine={{stroke:"var(--c-muted)",strokeWidth:0.5}} fontSize={11}>
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

      <div className="rounded-xl border p-4" style={{borderColor:"var(--border-color)", background:"var(--bg-surface)"}}>
        <p className="text-xs font-medium mb-2" style={{color:"var(--c-text)"}}>💡 Ce vedeți aici?</p>
        <p className="text-xs leading-relaxed" style={{color:"var(--c-muted)"}}>{EXPLAINERS.eu.context}</p>
      </div>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────
export default function BudgetExplorer() {
  const [activeTab, setActiveTab] = useState("overview");
  const [explorerInitId, setExplorerInitId] = useState(null);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("budget-theme") || "light"; } catch { return "light"; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("budget-theme", theme); } catch {}
  }, [theme]);

  const navigateToExplorer = (ministryName) => {
    setExplorerInitId(ministryName);
    setActiveTab("explorer");
  };

  return (
    <div>
      <div className="p-4 md:p-6" style={{color:"var(--c-text)", maxWidth:960, margin:"0 auto"}}>
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{color:"var(--c-text)"}}>
              Bugetul României 2026
            </h1>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{background:"#0F6E5618", color:"#0F6E56"}}>
              Proiect de lege
            </span>
            <button
              onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
              className="ml-auto text-sm px-2 py-1 rounded-lg border transition-all"
              style={{ borderColor: "var(--border-color)", color: "var(--c-muted)", background: "var(--bg-surface)" }}
              title={theme === "light" ? "Comută la modul întunecat" : "Comută la modul luminos"}
            >
              {theme === "light" ? "☾" : "☀"}
            </button>
          </div>
          <p className="text-xs mt-1" style={{color:"var(--c-muted)"}}>
            Explorer interactiv · Date din proiectul Legii bugetului de stat 2026, Ministerul Finanțelor
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 pb-3 mb-5 border-b" style={{borderColor:"var(--border-color)"}}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="text-xs font-medium px-3 py-1.5 rounded-full border transition-all"
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
          {activeTab === "overview" && <OverviewTab onNavigateExplorer={navigateToExplorer} />}
          {activeTab === "ministere" && <MinistereTab onNavigateExplorer={navigateToExplorer} />}
          {activeTab === "detaliu" && <DetaliiMinistereTab onNavigateExplorer={navigateToExplorer} />}
          {activeTab === "venituri" && <VenituriTab />}
          {activeTab === "venituriDetaliu" && <VenituriDetaliuTab />}
          {activeTab === "cheltuieli" && <CheltuieliTab />}
          {activeTab === "deficit" && <DeficitTab />}
          {activeTab === "locale" && <LocaleTab />}
          {activeTab === "eu" && <EUTab />}
          {activeTab === "explorer" && <ExplorerTab key={explorerInitId} initialSearchName={explorerInitId} />}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center" style={{borderColor:"var(--border-color)"}}>
          <p className="text-xs" style={{color:"var(--c-muted)"}}>
            Sursa: Proiect Legea bugetului de stat pe anul 2026 · Anexele 1-3 · Ministerul Finanțelor · mfinante.gov.ro
          </p>
        </div>
      </div>
    </div>
  );
}
