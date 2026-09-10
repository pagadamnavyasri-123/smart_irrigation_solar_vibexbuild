import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CloudRain,
  Droplets,
  Gauge,
  Leaf,
  Lightbulb,
  Menu,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Power,
  Radio,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Sprout,
  Sun,
  ThermometerSun,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserRound,
  Waves,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const crops = [
  { name: "Tomato", threshold: 40, color: "#ef7a62" },
  { name: "Groundnut", threshold: 35, color: "#d2a24c" },
  { name: "Rice", threshold: 55, color: "#69b58b" },
  { name: "Cotton", threshold: 30, color: "#a9b9c7" },
  { name: "Maize", threshold: 35, color: "#e4bd50" },
  { name: "Chilli", threshold: 40, color: "#d65b45" },
  { name: "Vegetables", threshold: 42, color: "#4eaf87" },
];

type Field = {
  id: number;
  name: string;
  crop: string;
  acres: number;
  moisture: number;
  threshold: number;
  color: string;
  status: string;
};

type AlertItem = {
  id: number;
  title: string;
  detail: string;
  kind: "warning" | "success" | "info" | "critical";
  time: string;
  read: boolean;
};

type View = "Dashboard" | "Fields" | "Irrigation" | "Solar Energy" | "Water Monitor" | "Analytics" | "Alerts" | "Simulation" | "Settings";

const navGroups = [
  { label: "COMMAND CENTER", items: [{ name: "Dashboard", icon: Gauge }, { name: "Fields", icon: Sprout }, { name: "Irrigation", icon: Droplets }] },
  { label: "MONITORING", items: [{ name: "Solar Energy", icon: Sun }, { name: "Water Monitor", icon: Waves }, { name: "Analytics", icon: Activity }] },
  { label: "SYSTEM", items: [{ name: "Alerts", icon: Bell }, { name: "Simulation", icon: Radio }, { name: "Settings", icon: Settings }] },
];

const soilTrend = [
  { time: "06:00", moisture: 44, threshold: 40 },
  { time: "08:00", moisture: 42, threshold: 40 },
  { time: "10:00", moisture: 39, threshold: 40 },
  { time: "12:00", moisture: 36, threshold: 40 },
  { time: "14:00", moisture: 41, threshold: 40 },
  { time: "16:00", moisture: 43, threshold: 40 },
  { time: "18:00", moisture: 41, threshold: 40 },
];
const solarTrend = [
  { time: "06:00", generation: 0.4, battery: 58 },
  { time: "08:00", generation: 1.6, battery: 64 },
  { time: "10:00", generation: 3.8, battery: 72 },
  { time: "12:00", generation: 5.8, battery: 82 },
  { time: "14:00", generation: 5.2, battery: 86 },
  { time: "16:00", generation: 3.4, battery: 84 },
  { time: "18:00", generation: 1.1, battery: 78 },
  { time: "20:00", generation: 0.2, battery: 72 },
];
const waterTrend = [
  { day: "Mon", smart: 680, traditional: 1120 },
  { day: "Tue", smart: 720, traditional: 1200 },
  { day: "Wed", smart: 640, traditional: 1160 },
  { day: "Thu", smart: 780, traditional: 1260 },
  { day: "Fri", smart: 750, traditional: 1200 },
  { day: "Sat", smart: 690, traditional: 1140 },
  { day: "Sun", smart: 750, traditional: 1200 },
];
const runtimeTrend = [
  { day: "Mon", minutes: 42 }, { day: "Tue", minutes: 38 }, { day: "Wed", minutes: 29 }, { day: "Thu", minutes: 48 }, { day: "Fri", minutes: 35 }, { day: "Sat", minutes: 31 }, { day: "Sun", minutes: 32 },
];

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Progress({ value, color = "green", className }: { value: number; color?: string; className?: string }) {
  return <div className={cn("progress-track", className)}><div className={cn("progress-value", `progress-${color}`)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: string }) {
  return <span className={cn("badge", `badge-${tone}`)}>{children}</span>;
}

function MetricCard({ icon: Icon, label, value, unit, meta, color, progress, trend }: { icon: any; label: string; value: string | number; unit?: string; meta: string; color: string; progress?: number; trend?: string }) {
  return <div className="metric-card">
    <div className="metric-top"><div className={cn("metric-icon", `metric-${color}`)}><Icon size={19} strokeWidth={2.1} /></div><span className="metric-label">{label}</span><MoreHorizontal size={17} className="muted-icon" /></div>
    <div className="metric-number">{value}<span>{unit}</span></div>
    {progress !== undefined && <Progress value={progress} color={color} />}
    <div className="metric-meta"><span>{meta}</span>{trend && <span className={trend.startsWith("+") ? "trend-up" : "trend-down"}>{trend}</span>}</div>
  </div>;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><span>{label}</span>{payload.map((item: any) => <strong key={item.dataKey} style={{ color: item.color }}>{item.value}{item.dataKey === "generation" ? " kWh" : item.dataKey === "battery" || item.dataKey === "moisture" ? "%" : " L"}</strong>)}</div>;
}

function Home() {
  const [view, setView] = useState<View>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [mode, setMode] = useState<"AUTO" | "MANUAL">("AUTO");
  const [pumpManual, setPumpManual] = useState(false);
  const [live, setLive] = useState(true);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newCrop, setNewCrop] = useState("Tomato");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [fields, setFields] = useState<Field[]>([
    { id: 1, name: "North Field", crop: "Tomato", acres: 2, moisture: 38, threshold: 40, color: "#ef7a62", status: "Needs attention" },
    { id: 2, name: "South Field", crop: "Groundnut", acres: 1.5, moisture: 46, threshold: 35, color: "#d2a24c", status: "Healthy" },
    { id: 3, name: "Orchard Patch", crop: "Vegetables", acres: 1.2, moisture: 43, threshold: 42, color: "#58a77f", status: "Healthy" },
  ]);
  const [selectedFieldId, setSelectedFieldId] = useState(1);
  const [sensor, setSensor] = useState({ soil: 38, solar: 78, battery: 72, tank: 64, temp: 32, humidity: 58, rain: 10, flow: 0, waterToday: 750, energyToday: 5.8 });
  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: 1, title: "Soil moisture low", detail: "North Field is below the recommended level.", kind: "warning", time: "8 min ago", read: false },
    { id: 2, title: "Solar generation peak", detail: "Excellent time for an irrigation cycle.", kind: "info", time: "24 min ago", read: false },
    { id: 3, title: "Irrigation completed", detail: "South Field reached its target moisture.", kind: "success", time: "1 hr ago", read: true },
  ]);
  const [sim, setSim] = useState({ soil: 38, solar: 78, battery: 72, tank: 64, temp: 32, rain: 10 });

  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? fields[0];
  const threshold = selectedField?.threshold ?? 40;
  const pumpOn = mode === "MANUAL" ? pumpManual : demoRunning ? demoStep >= 5 && demoStep < 9 : sensor.soil < threshold && sensor.tank > 20 && sensor.battery > 25 && sensor.solar + sensor.battery > 75 && sensor.rain < 60;
  const unreadAlerts = alerts.filter((alert) => !alert.read).length;

  const decision = useMemo(() => {
    const s = sim;
    if (s.rain > 60) return { title: "Irrigation postponed", reason: "Rain probability is high. Let nature do the watering.", tone: "blue", icon: CloudRain };
    if (s.soil >= threshold) return { title: "Soil moisture is sufficient", reason: `Current moisture is ${s.soil}%, above the ${threshold}% target for ${selectedField?.crop}.`, tone: "green", icon: Check };
    if (s.tank < 20) return { title: "Irrigation unavailable", reason: "Water tank is below the minimum 20% operating level.", tone: "red", icon: AlertTriangle };
    if (s.battery < 25 && s.solar < 40) return { title: "Irrigation paused", reason: "Renewable energy is insufficient. Battery protection is active.", tone: "amber", icon: Zap };
    return { title: "Pump should turn ON", reason: `Soil is ${threshold - s.soil}% below the ${threshold}% crop target and energy is available.`, tone: "green", icon: Power };
  }, [sim, threshold, selectedField]);

  useEffect(() => {
    if (!live || demoRunning) return;
    const interval = window.setInterval(() => {
      setSensor((current) => {
        const hour = new Date().getHours();
        const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
        const solar = Math.round(Math.max(12, Math.min(96, daylight * 88 + (Math.random() * 8 - 4))));
        const isPump = mode === "MANUAL" ? pumpManual : current.soil < threshold && current.tank > 20 && current.battery > 25 && solar + current.battery > 75 && current.rain < 60;
        return {
          ...current,
          soil: Math.round(Math.max(18, Math.min(82, current.soil + (isPump ? 1.6 : -0.35)))),
          solar,
          battery: Math.round(Math.max(25, Math.min(100, current.battery + (solar > 50 ? 0.35 : -0.2) - (isPump ? 0.25 : 0)))),
          tank: Math.round(Math.max(8, Math.min(100, current.tank - (isPump ? 0.45 : 0)))),
          temp: Math.round(Math.max(24, Math.min(39, current.temp + (Math.random() > 0.5 ? 1 : -1)))),
          flow: isPump ? 18 : 0,
          waterToday: Math.round(current.waterToday + (isPump ? 2 : 0)),
          energyToday: Number((current.energyToday + (isPump ? 0.03 : 0.01)).toFixed(1)),
        };
      });
    }, 4000);
    return () => window.clearInterval(interval);
  }, [live, demoRunning, mode, pumpManual, threshold]);

  useEffect(() => {
    setSim({ soil: sensor.soil, solar: sensor.solar, battery: sensor.battery, tank: sensor.tank, temp: sensor.temp, rain: sensor.rain });
  }, [sensor]);

  function changeSim(key: keyof typeof sim, value: number) {
    setSim((prev) => ({ ...prev, [key]: value }));
    if (key === "soil") setSensor((prev) => ({ ...prev, soil: value }));
    if (key === "solar") setSensor((prev) => ({ ...prev, solar: value }));
    if (key === "battery") setSensor((prev) => ({ ...prev, battery: value }));
    if (key === "tank") setSensor((prev) => ({ ...prev, tank: value }));
    if (key === "temp") setSensor((prev) => ({ ...prev, temp: value }));
    if (key === "rain") setSensor((prev) => ({ ...prev, rain: value }));
  }

  function runDemo() {
    if (demoRunning) return;
    setView("Simulation"); setDemoRunning(true); setDemoStep(1);
    setSensor((prev) => ({ ...prev, soil: 25, solar: 85, battery: 75, tank: 70, flow: 0 }));
    setSim((prev) => ({ ...prev, soil: 25, solar: 85, battery: 75, tank: 70 }));
    const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    steps.forEach((step, index) => window.setTimeout(() => {
      setDemoStep(step);
      if (step >= 5 && step <= 7) {
        const moisture = [25, 28, 31, 35, 38][Math.min(4, step - 5)];
        setSensor((prev) => ({ ...prev, soil: moisture, tank: Math.max(30, prev.tank - 5), flow: 18 }));
        setSim((prev) => ({ ...prev, soil: moisture, tank: Math.max(30, prev.tank - 5) }));
      }
      if (step === 8) setSensor((prev) => ({ ...prev, soil: 38, flow: 0 }));
      if (step === 9) {
        setDemoRunning(false);
        setAlerts((prev) => [{ id: Date.now(), title: "Irrigation completed", detail: "North Field reached the target moisture in demo mode.", kind: "success", time: "Just now", read: false }, ...prev]);
      }
    }, index * 900));
  }

  function addField() {
    if (!newFieldName.trim()) return;
    const crop = crops.find((item) => item.name === newCrop) ?? crops[0];
    const field: Field = { id: Date.now(), name: newFieldName.trim(), crop: crop.name, acres: 1, moisture: 42, threshold: crop.threshold, color: crop.color, status: "Healthy" };
    setFields((prev) => [...prev, field]); setNewFieldName(""); setShowFieldForm(false); setSelectedFieldId(field.id);
  }

  function togglePump() {
    if (mode === "AUTO") { setMode("MANUAL"); setPumpManual(true); return; }
    if (!pumpManual && !window.confirm("Start the simulated pump manually for this prototype?")) return;
    setPumpManual(!pumpManual);
  }

  const nav = (name: string) => { setView(name as View); setSidebarOpen(false); };

  return <div className="app-shell">
    <aside className={cn("sidebar", sidebarOpen && "sidebar-open")}>
      <div className="brand"><div className="brand-mark"><Leaf size={22} fill="currentColor" /></div><div><div className="brand-name">Sow<span>lar</span></div><div className="brand-sub">SMART IRRIGATION</div></div><button className="mobile-close" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
      <div className="demo-pill"><span className="pulse-dot" /> SIMULATION MODE <CircleHelp size={14} /></div>
      <nav className="nav-list">{navGroups.map((group) => <div key={group.label} className="nav-group"><div className="nav-group-label">{group.label}</div>{group.items.map(({ name, icon: Icon }) => <button key={name} className={cn("nav-item", view === name && "active")} onClick={() => nav(name)}><Icon size={18} /><span>{name}</span>{name === "Alerts" && unreadAlerts > 0 && <span className="nav-count">{unreadAlerts}</span>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-tip"><Lightbulb size={18} /><div><strong>Smart tip</strong><p>Run irrigation during peak solar hours to save battery.</p></div></div><div className="profile"><div className="avatar">RK</div><div><strong>Ravi Kumar</strong><span>Demo farm owner</span></div><MoreHorizontal size={18} className="muted-icon" /></div></div>
    </aside>
    {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
    <main className="main-content">
      <header className="topbar"><button className="menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{view}</strong></div><div className="top-actions"><div className="live-switch"><span className={cn("status-dot", live ? "online" : "offline")} /> <span>{live ? "Live simulation" : "Simulation paused"}</span><button className={cn("switch", live && "on")} onClick={() => setLive(!live)}><span /></button></div><div className="notification-wrap"><button className="icon-btn" onClick={() => setAlertsOpen(!alertsOpen)}><Bell size={19} />{unreadAlerts > 0 && <span className="notification-dot" />}</button>{alertsOpen && <div className="notification-popover"><div className="popover-head"><div><strong>Notifications</strong><span>{unreadAlerts} new alerts</span></div><button onClick={() => setAlerts((prev) => prev.map((item) => ({ ...item, read: true })))}>Mark all read</button></div>{alerts.slice(0, 3).map((alert) => <div className="popover-alert" key={alert.id}><div className={cn("alert-mini-icon", `alert-${alert.kind}`)}>{alert.kind === "warning" ? <AlertTriangle size={15} /> : alert.kind === "success" ? <Check size={15} /> : <Sun size={15} />}</div><div><strong>{alert.title}</strong><p>{alert.detail}</p><span>{alert.time}</span></div></div>)}</div>}</div><div className="top-profile"><div className="avatar small">RK</div><ChevronDown size={15} className="muted-icon" /></div></div></header>
      <div className="page-content">
        {view === "Dashboard" && <DashboardView sensor={sensor} pumpOn={pumpOn} selectedField={selectedField} threshold={threshold} alerts={alerts} runDemo={runDemo} setView={setView} />}
        {view === "Fields" && <FieldsView fields={fields} selectedFieldId={selectedFieldId} setSelectedFieldId={setSelectedFieldId} onDelete={(id: number) => setFields((prev) => prev.filter((field) => field.id !== id))} showForm={showFieldForm} setShowForm={setShowFieldForm} name={newFieldName} setName={setNewFieldName} crop={newCrop} setCrop={setNewCrop} onAdd={addField} />}
        {view === "Irrigation" && <IrrigationView sensor={sensor} pumpOn={pumpOn} mode={mode} setMode={setMode} togglePump={togglePump} threshold={threshold} selectedField={selectedField} runDemo={runDemo} />}
        {view === "Solar Energy" && <EnergyView sensor={sensor} />}
        {view === "Water Monitor" && <WaterView sensor={sensor} />}
        {view === "Analytics" && <AnalyticsView />}
        {view === "Alerts" && <AlertsView alerts={alerts} setAlerts={setAlerts} />}
        {view === "Simulation" && <SimulationView sim={sim} decision={decision} changeSim={changeSim} runDemo={runDemo} demoRunning={demoRunning} demoStep={demoStep} />}
        {view === "Settings" && <SettingsView mode={mode} setMode={setMode} saved={settingsSaved} save={() => { setSettingsSaved(true); window.setTimeout(() => setSettingsSaved(false), 2200); }} />}
      </div>
    </main>
  </div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function DashboardView({ sensor, pumpOn, selectedField, threshold, alerts, runDemo, setView }: any) {
  return <><div className="welcome-row"><div><div className="eyebrow">THURSDAY, 10 SEPTEMBER 2026 <span className="eyebrow-live"><span className="status-dot online" /> LIVE DATA</span></div><h1>Welcome <span className="wave">✦</span></h1><p className="welcome-copy">Here’s how your farm is doing today.</p></div><div className="header-actions"><button className="btn secondary" onClick={() => setView("Simulation")}><Radio size={16} /> Simulation controls</button><button className="btn primary" onClick={runDemo}><Play size={16} fill="currentColor" /> Run irrigation demo</button></div></div>
    <div className="system-strip"><div className="system-strip-main"><div className="system-icon"><ShieldCheck size={20} /></div><div><strong>All systems are operating normally</strong><span>Smart irrigation is monitoring 3 fields · Last update just now</span></div></div><div className="system-strip-status"><span className="status-dot online" /> Connected</div></div>
    <div className="metrics-grid"><MetricCard icon={Droplets} label="Soil moisture" value={sensor.soil} unit="%" meta={sensor.soil < threshold ? "Needs attention" : "Optimal range"} color="green" progress={sensor.soil} trend={sensor.soil < threshold ? "-4% today" : "+2% today"} /><MetricCard icon={Sun} label="Solar power" value={sensor.solar} unit="%" meta="Good generation" color="yellow" progress={sensor.solar} trend="+8% today" /><MetricCard icon={Zap} label="Battery" value={sensor.battery} unit="%" meta="Healthy reserve" color="purple" progress={sensor.battery} trend="+4% today" /><MetricCard icon={Waves} label="Water tank" value={sensor.tank} unit="%" meta="Sufficient supply" color="blue" progress={sensor.tank} trend="-6% today" /></div>
    <div className="section-heading"><div><h2>Farm overview</h2><p>Live conditions across your operation</p></div><button className="text-btn" onClick={() => setView("Analytics")}>View analytics <ChevronRight size={16} /></button></div>
    <div className="overview-grid"><div className="card chart-card large"><div className="card-heading"><div><h3>Soil moisture trend</h3><p>North Field · {selectedField?.crop}</p></div><Badge tone="green"><span className="tiny-dot" /> Live</Badge></div><div className="chart-legend"><span><i className="legend-line green-line" /> Moisture</span><span><i className="legend-line dashed-line" /> Target {threshold}%</span><span className="chart-period">Today <ChevronDown size={13} /></span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={soilTrend}><defs><linearGradient id="soilFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5ca87e" stopOpacity={0.24} /><stop offset="100%" stopColor="#5ca87e" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0eb" /><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#9aa39a", fontSize: 11 }} dy={10} /><YAxis domain={[20, 60]} axisLine={false} tickLine={false} tick={{ fill: "#9aa39a", fontSize: 11 }} tickFormatter={(v) => `${v}%`} width={34} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="moisture" stroke="#4d9b73" strokeWidth={2.5} fill="url(#soilFill)" /><Line type="monotone" dataKey="threshold" stroke="#c3c9c1" strokeWidth={1.5} strokeDasharray="5 5" dot={false} /></AreaChart></ResponsiveContainer></div></div>
      <div className="card pump-card"><div className="card-heading"><div><h3>Pump status</h3><p>North Field · Automatic</p></div><div className={cn("pump-state", pumpOn ? "on" : "off")}><span className="status-dot" />{pumpOn ? "ON" : "OFF"}</div></div><div className={cn("pump-visual", pumpOn && "running")}><div className="pump-ring"><Power size={32} /></div><div className="pump-wave wave-a" /><div className="pump-wave wave-b" /></div><div className="pump-readout"><span>Current flow</span><strong>{pumpOn ? Math.max(sensor.flow, 18) : 0} <small>L/min</small></strong></div><div className="pump-reason"><Bot size={16} /><span>{pumpOn ? "Pump running because soil is below the recommended level." : "Pump remains off because conditions are currently balanced."}</span></div><button className="btn outline full" onClick={() => setView("Irrigation")}>Open irrigation control <ChevronRight size={16} /></button></div>
    </div>
    <div className="lower-grid"><div className="card recommendation"><div className="recommendation-icon"><Lightbulb size={20} /></div><div><div className="eyebrow">SMART RECOMMENDATION</div><h3>{sensor.solar > 65 ? "Great time to irrigate with solar" : "Let the battery recover before irrigating"}</h3><p>{sensor.solar > 65 ? "Solar generation is high right now. A short irrigation cycle can run mostly on clean energy." : "Solar power is low. Protect the battery and wait for the next daylight window."}</p></div><button className="icon-btn light" onClick={() => setView("Simulation")}><ChevronRight size={18} /></button></div><div className="card weather-card"><div className="card-heading"><div><h3>Field weather</h3><p>Simulated local conditions</p></div><Sun size={22} className="sun-icon" /></div><div className="weather-main"><strong>{sensor.temp}°</strong><span>Sunny & clear</span></div><div className="weather-details"><span><Droplets size={15} /> {sensor.humidity}% humidity</span><span><CloudRain size={15} /> {sensor.rain}% rain chance</span></div></div></div>
    <div className="section-heading activity-heading"><div><h2>Recent activity</h2><p>Your latest farm events</p></div><button className="text-btn" onClick={() => setView("Alerts")}>See all activity <ChevronRight size={16} /></button></div><div className="card activity-card">{alerts.slice(0, 3).map((alert: AlertItem, index: number) => <div className="activity-row" key={alert.id}><div className={cn("activity-icon", `alert-${alert.kind}`)}>{alert.kind === "warning" ? <AlertTriangle size={17} /> : alert.kind === "success" ? <Check size={17} /> : <Sun size={17} />}</div><div className="activity-copy"><strong>{alert.title}</strong><span>{alert.detail}</span></div><span className="activity-time">{alert.time}</span>{index === 0 && <Badge tone="amber">Review</Badge>}</div>)}</div>
  </>;
}

function FieldsView({ fields, selectedFieldId, setSelectedFieldId, onDelete, showForm, setShowForm, name, setName, crop, setCrop, onAdd }: any) {
  return <><PageHeader eyebrow="FIELD MANAGEMENT" title="My fields" description="Keep every plot healthy with crop-aware moisture targets." action={<button className="btn primary" onClick={() => setShowForm(!showForm)}><Plus size={17} /> Add field</button>} />{showForm && <div className="card add-field-form"><div><h3>Add a new field</h3><p>Set a simple target to start the simulation.</p></div><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Field name" /><select value={crop} onChange={(e) => setCrop(e.target.value)}>{crops.map((item) => <option key={item.name}>{item.name}</option>)}</select><button className="btn primary" onClick={onAdd}>Save field</button></div>}<div className="field-summary"><div><span>Total area</span><strong>{fields.reduce((sum: number, item: Field) => sum + item.acres, 0).toFixed(1)} <small>acres</small></strong></div><div><span>Healthy fields</span><strong>{fields.filter((item: Field) => item.status === "Healthy").length}<small> / {fields.length}</small></strong></div><div><span>Avg moisture</span><strong>{Math.round(fields.reduce((sum: number, item: Field) => sum + item.moisture, 0) / fields.length)}<small>%</small></strong></div><div><span>Water saved this week</span><strong>2,940 <small>L</small></strong></div></div><div className="field-grid">{fields.map((field: Field) => <div className={cn("card field-card", selectedFieldId === field.id && "selected")} key={field.id} onClick={() => setSelectedFieldId(field.id)}><div className="field-top"><div className="field-crop" style={{ background: `${field.color}22`, color: field.color }}><Sprout size={22} /></div><button className="icon-btn subtle" onClick={(e) => { e.stopPropagation(); onDelete(field.id); }}><Trash2 size={16} /></button></div><div className="field-name-row"><div><h3>{field.name}</h3><p>{field.crop} · {field.acres} acres</p></div><Badge tone={field.status === "Healthy" ? "green" : "amber"}>{field.status === "Healthy" ? "Healthy" : "Needs attention"}</Badge></div><div className="field-moisture"><div><span>Soil moisture</span><strong>{field.moisture}%</strong></div><Progress value={field.moisture} color={field.status === "Healthy" ? "green" : "amber"} /></div><div className="field-footer"><span>Target moisture <strong>{field.threshold}%</strong></span><span className="text-btn small">View details <ChevronRight size={14} /></span></div></div>)}</div></>;
}

function IrrigationView({ sensor, pumpOn, mode, setMode, togglePump, threshold, selectedField, runDemo }: any) {
  return <><PageHeader eyebrow="IRRIGATION CONTROL" title="Water with confidence" description="A transparent decision engine for every irrigation cycle." action={<button className="btn primary" onClick={runDemo}><Play size={16} fill="currentColor" /> Run demo cycle</button>} /><div className="control-layout"><div className="card control-card"><div className="control-top"><div><h3>North Field pump</h3><p>{selectedField?.crop} · Target moisture {threshold}%</p></div><div className={cn("pump-state large", pumpOn ? "on" : "off")}><span className="status-dot" /> {pumpOn ? "PUMP ON" : "PUMP OFF"}</div></div><div className="control-orb"><div className={cn("pump-visual big", pumpOn && "running")}><div className="pump-ring"><Power size={42} /></div><div className="pump-wave wave-a" /><div className="pump-wave wave-b" /></div></div><div className="decision-banner"><Bot size={19} /><div><strong>{pumpOn ? "Automatic irrigation is active" : "Automatic irrigation is on standby"}</strong><span>{pumpOn ? "Soil moisture is below the recommended level and energy is available." : "Soil moisture is sufficient or the system is protecting its resources."}</span></div></div><div className="mode-control"><div><span className="eyebrow">CONTROL MODE</span><strong>{mode === "AUTO" ? "Automatic" : "Manual override"}</strong></div><div className="segmented"><button className={mode === "AUTO" ? "selected" : ""} onClick={() => setMode("AUTO")}>AUTO</button><button className={mode === "MANUAL" ? "selected" : ""} onClick={() => setMode("MANUAL")}>MANUAL</button></div></div><div className="manual-actions"><button className={cn("btn", pumpOn ? "danger" : "primary")} onClick={togglePump}><Power size={17} /> {pumpOn ? "Stop simulated pump" : "Start simulated pump"}</button><span>Manual controls are simulation-only. No physical hardware is connected.</span></div></div><div className="card live-readings"><div className="card-heading"><div><h3>Live readings</h3><p>Updated just now</p></div><Radio size={19} className="green-icon" /></div>{[["Soil moisture", `${sensor.soil}%`, sensor.soil, "green"], ["Solar power", `${sensor.solar}%`, sensor.solar, "yellow"], ["Battery level", `${sensor.battery}%`, sensor.battery, "purple"], ["Water tank", `${sensor.tank}%`, sensor.tank, "blue"]].map(([label, value, progress, color]) => <div className="reading" key={label as string}><div><span>{label}</span><strong>{value}</strong></div><Progress value={progress as number} color={color as string} /></div>)}<div className="energy-priority"><Zap size={16} /><span>Energy priority: <strong>{sensor.solar > 60 ? "Solar first" : "Battery backup"}</strong></span></div></div></div><div className="card history-card"><div className="card-heading"><div><h3>Recent irrigation sessions</h3><p>Transparent history for your farm</p></div><button className="text-btn">Export log <ChevronRight size={15} /></button></div><table><thead><tr><th>DATE</th><th>FIELD</th><th>START</th><th>DURATION</th><th>WATER USED</th><th>MODE</th></tr></thead><tbody><tr><td>10 Sep 2026</td><td><strong>North Field</strong></td><td>09:30 AM</td><td>18 min</td><td>120 L</td><td><Badge tone="green">AUTO</Badge></td></tr><tr><td>09 Sep 2026</td><td><strong>South Field</strong></td><td>04:10 PM</td><td>14 min</td><td>96 L</td><td><Badge tone="green">AUTO</Badge></td></tr><tr><td>08 Sep 2026</td><td><strong>North Field</strong></td><td>11:20 AM</td><td>22 min</td><td>148 L</td><td><Badge tone="blue">MANUAL</Badge></td></tr></tbody></table></div></>;
}

function EnergyView({ sensor }: { sensor: any }) {
  return <><PageHeader eyebrow="ENERGY MONITOR" title="Solar energy" description="Use the sun first. Keep the battery ready for when you need it." action={<Badge tone="yellow"><Sun size={14} /> Simulation estimates</Badge>} /><div className="metrics-grid three"><MetricCard icon={Sun} label="Solar power" value={sensor.solar} unit="%" meta="Peak generation window" color="yellow" progress={sensor.solar} trend="+8% today" /><MetricCard icon={Zap} label="Energy generated" value="5.8" unit=" kWh" meta="Today · simulated" color="purple" trend="+12% vs avg" /><MetricCard icon={Power} label="Grid dependency" value="Low" meta="66.7% estimated reduction" color="green" /></div><div className="two-col"><div className="card chart-card"><div className="card-heading"><div><h3>Solar generation</h3><p>Generated energy and battery reserve</p></div><span className="chart-period">Today <ChevronDown size={13} /></span></div><div className="chart-legend"><span><i className="legend-line yellow-line" /> Generation (kWh)</span><span><i className="legend-line purple-line" /> Battery (%)</span></div><div className="chart-wrap tall"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={solarTrend}><CartesianGrid vertical={false} stroke="#edf0eb" /><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#9aa39a", fontSize: 11 }} dy={10} /><YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: "#9aa39a", fontSize: 11 }} width={25} /><YAxis yAxisId="right" orientation="right" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#9aa39a", fontSize: 11 }} width={30} /><Tooltip content={<ChartTooltip />} /><Bar yAxisId="left" dataKey="generation" fill="#efbd4f" radius={[4, 4, 0, 0]} barSize={16} /><Line yAxisId="right" type="monotone" dataKey="battery" stroke="#9a84ca" strokeWidth={2.5} dot={false} /></ComposedChart></ResponsiveContainer></div></div><div className="card energy-breakdown"><div className="card-heading"><div><h3>Energy mix</h3><p>Where today’s power came from</p></div></div><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: "Solar", value: 82 }, { name: "Battery", value: 14 }, { name: "Grid", value: 4 }]} dataKey="value" innerRadius={60} outerRadius={84} paddingAngle={4} stroke="none"><Cell fill="#efbd4f" /><Cell fill="#9a84ca" /><Cell fill="#d6ddd6" /></Pie></PieChart></ResponsiveContainer><div className="donut-center"><strong>82%</strong><span>solar</span></div></div><div className="mix-legend"><span><i style={{ background: "#efbd4f" }} /> Solar <strong>82%</strong></span><span><i style={{ background: "#9a84ca" }} /> Battery <strong>14%</strong></span><span><i style={{ background: "#d6ddd6" }} /> Grid <strong>4%</strong></span></div></div></div><div className="info-callout"><Sun size={19} /><div><strong>Solar-first energy management</strong><p>The system prioritizes solar power, then uses battery reserve. If both are insufficient, irrigation is paused in this simulation.</p></div></div></>;
}

function WaterView({ sensor }: { sensor: any }) {
  return <><PageHeader eyebrow="WATER MONITOR" title="Every drop counts" description="See the difference smart irrigation makes to your daily water use." action={<Badge tone="blue"><Droplets size={14} /> Demo data</Badge>} /><div className="water-stats"><div className="card water-stat blue-stat"><Droplets size={20} /><span>Water tank</span><strong>{sensor.tank}%</strong><Progress value={sensor.tank} color="blue" /><small>520 L available</small></div><div className="card water-stat"><TrendingDown size={20} /><span>Estimated saved</span><strong>450 L <small>/ day</small></strong><p>37.5% less than traditional irrigation</p></div><div className="card water-stat"><Waves size={20} /><span>Consumed today</span><strong>{sensor.waterToday} L</strong><p>Within your 900 L daily target</p></div><div className="card water-stat"><Gauge size={20} /><span>Current flow</span><strong>{sensor.flow} <small>L/min</small></strong><p>{sensor.flow ? "Pump is running" : "Pump is idle"}</p></div></div><div className="card chart-card water-chart"><div className="card-heading"><div><h3>Smart vs traditional irrigation</h3><p>Weekly water consumption · simulated estimates</p></div><div className="chart-legend"><span><i className="legend-line blue-line" /> Smart</span><span><i className="legend-line gray-line" /> Traditional</span></div></div><div className="chart-wrap tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={waterTrend} barGap={5}><CartesianGrid vertical={false} stroke="#edf0eb" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9aa39a", fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#9aa39a", fontSize: 11 }} tickFormatter={(v) => `${v}L`} width={42} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="smart" fill="#5a9ecc" radius={[4, 4, 0, 0]} barSize={20} /><Bar dataKey="traditional" fill="#d9dfd9" radius={[4, 4, 0, 0]} barSize={20} /></BarChart></ResponsiveContainer></div></div><div className="savings-banner"><div className="savings-icon"><Droplets size={24} /></div><div><span>THIS WEEK’S WATER SAVING</span><strong>3,150 L <small>estimated</small></strong></div><div className="savings-side"><TrendingDown size={16} /> 37.5% vs traditional</div></div></>;
}

function AnalyticsView() {
  return <><PageHeader eyebrow="FARM ANALYTICS" title="Measure what matters" description="Simple trends to help you make better decisions each week." action={<button className="btn secondary"><RotateCcw size={16} /> Last 7 days</button>} /><div className="analytics-kpis"><div><span>Water saved</span><strong>3,150 <small>L</small></strong><em><TrendingDown size={14} /> 37.5% better</em></div><div><span>Energy saved</span><strong>3.2 <small>kWh</small></strong><em><TrendingDown size={14} /> 66.7% grid reduction</em></div><div><span>Irrigation sessions</span><strong>8</strong><em><TrendingUp size={14} /> 2 vs last week</em></div><div><span>Pump runtime</span><strong>2h 35m</strong><em>Within target</em></div></div><div className="analytics-grid"><div className="card chart-card"><div className="card-heading"><div><h3>Soil moisture stability</h3><p>North Field · percent</p></div></div><div className="chart-wrap tall"><ResponsiveContainer width="100%" height="100%"><LineChart data={soilTrend}><CartesianGrid vertical={false} stroke="#edf0eb" /><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#9aa39a", fontSize: 11 }} /><YAxis domain={[20, 60]} axisLine={false} tickLine={false} tick={{ fill: "#9aa39a", fontSize: 11 }} width={28} /><Tooltip content={<ChartTooltip />} /><Line type="monotone" dataKey="moisture" stroke="#4d9b73" strokeWidth={2.5} dot={{ r: 3, fill: "#4d9b73", strokeWidth: 0 }} /><Line type="monotone" dataKey="threshold" stroke="#c4cbc4" strokeDasharray="5 5" dot={false} /></LineChart></ResponsiveContainer></div></div><div className="card chart-card"><div className="card-heading"><div><h3>Pump runtime</h3><p>Minutes per day</p></div></div><div className="chart-wrap tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={runtimeTrend}><CartesianGrid vertical={false} stroke="#edf0eb" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9aa39a", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#9aa39a", fontSize: 11 }} width={25} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="minutes" fill="#76b18d" radius={[5, 5, 0, 0]} barSize={25} /></BarChart></ResponsiveContainer></div></div></div><div className="card weekly-table"><div className="card-heading"><div><h3>Weekly savings</h3><p>Compared to traditional irrigation</p></div><Badge tone="green">On track</Badge></div><div className="savings-row"><span>Water</span><Progress value={75} color="blue" /><strong>3,150 L</strong></div><div className="savings-row"><span>Energy</span><Progress value={66} color="yellow" /><strong>3.2 kWh</strong></div><div className="savings-row"><span>Solar contribution</span><Progress value={82} color="purple" /><strong>82%</strong></div></div></>;
}

function AlertsView({ alerts, setAlerts }: any) {
  return <><PageHeader eyebrow="NOTIFICATION CENTER" title="Alerts & activity" description="Stay ahead of conditions that need your attention." action={<button className="btn secondary" onClick={() => setAlerts((prev: AlertItem[]) => prev.map((item) => ({ ...item, read: true })))}><Check size={16} /> Mark all read</button>} /><div className="alert-summary"><div><span className="summary-icon amber"><AlertTriangle size={18} /></span><strong>{alerts.filter((item: AlertItem) => item.kind === "warning").length}</strong><span>Needs attention</span></div><div><span className="summary-icon green"><Check size={18} /></span><strong>{alerts.filter((item: AlertItem) => item.kind === "success").length}</strong><span>Completed</span></div><div><span className="summary-icon blue"><Sun size={18} /></span><strong>{alerts.filter((item: AlertItem) => item.kind === "info").length}</strong><span>Information</span></div></div><div className="card full-alert-list">{alerts.map((alert: AlertItem) => <div className={cn("full-alert", !alert.read && "unread")} key={alert.id}><div className={cn("full-alert-icon", `alert-${alert.kind}`)}>{alert.kind === "warning" ? <AlertTriangle size={19} /> : alert.kind === "success" ? <Check size={19} /> : <Sun size={19} />}</div><div className="full-alert-copy"><div><strong>{alert.title}</strong>{!alert.read && <span className="unread-label">NEW</span>}</div><p>{alert.detail}</p><span>{alert.time}</span></div>{!alert.read && <button className="text-btn" onClick={() => setAlerts((prev: AlertItem[]) => prev.map((item) => item.id === alert.id ? { ...item, read: true } : item))}>Mark read</button>}</div>)}</div></>;
}

function SimulationView({ sim, decision, changeSim, runDemo, demoRunning, demoStep }: any) {
  const DecisionIcon = decision.icon;
  const steps = ["Soil dries", "Energy check", "Water check", "Pump starts", "Soil recovers", "Target reached"];
  return <><PageHeader eyebrow="SIMULATION CONTROL" title="Make the system think" description="Change the virtual conditions and watch the explainable decision engine respond instantly." action={<button className="btn primary" onClick={runDemo} disabled={demoRunning}>{demoRunning ? <><span className="spinner" /> Demo running</> : <><Play size={16} fill="currentColor" /> Run irrigation demo</>}</button>} /><div className="simulation-grid"><div className="card sliders-card"><div className="card-heading"><div><h3>Virtual sensor inputs</h3><p>Drag a slider to simulate a field condition</p></div><Badge tone="purple"><Radio size={13} /> Live</Badge></div><SliderRow label="Soil moisture" value={sim.soil} min={0} max={100} suffix="%" icon={Droplets} color="green" onChange={(value: number) => changeSim("soil", value)} /><SliderRow label="Solar power" value={sim.solar} min={0} max={100} suffix="%" icon={Sun} color="yellow" onChange={(value: number) => changeSim("solar", value)} /><SliderRow label="Battery reserve" value={sim.battery} min={0} max={100} suffix="%" icon={Zap} color="purple" onChange={(value: number) => changeSim("battery", value)} /><SliderRow label="Water tank" value={sim.tank} min={0} max={100} suffix="%" icon={Waves} color="blue" onChange={(value: number) => changeSim("tank", value)} /><SliderRow label="Temperature" value={sim.temp} min={20} max={45} suffix="°C" icon={ThermometerSun} color="amber" onChange={(value: number) => changeSim("temp", value)} /><SliderRow label="Rain probability" value={sim.rain} min={0} max={100} suffix="%" icon={CloudRain} color="blue" onChange={(value: number) => changeSim("rain", value)} /></div><div className="card decision-card"><div className="decision-label"><Bot size={17} /> EXPLAINABLE DECISION</div><div className={cn("decision-icon", `decision-${decision.tone}`)}><DecisionIcon size={27} /></div><h2>{decision.title}</h2><p>{decision.reason}</p><div className="decision-checks"><div><Check size={14} /> Crop threshold <strong>≥ 40%</strong></div><div><Check size={14} /> Energy available <strong>{sim.solar + sim.battery > 75 ? "Yes" : "No"}</strong></div><div><Check size={14} /> Water available <strong>{sim.tank > 20 ? "Yes" : "No"}</strong></div><div><Check size={14} /> Rain risk <strong>{sim.rain > 60 ? "High" : "Low"}</strong></div></div><div className="decision-footer"><span>Decision recalculates as you adjust inputs.</span><Activity size={16} /></div></div></div><div className="card demo-timeline"><div className="card-heading"><div><h3>Run Irrigation Demo</h3><p>Watch a complete automatic cycle in under 10 seconds</p></div><span className="demo-duration">{demoRunning ? "Running now" : "Ready to run"}</span></div><div className="timeline">{steps.map((step, index) => <div className={cn("timeline-step", demoStep >= index + 4 ? "complete" : demoStep === index + 1 ? "current" : "")} key={step}><div className="timeline-node">{demoStep >= index + 4 ? <Check size={14} /> : index + 1}</div><span>{step}</span></div>)}</div><div className="demo-explainer"><Lightbulb size={17} /><span>{demoRunning ? (demoStep < 5 ? "System is checking conditions before starting the pump..." : demoStep < 8 ? "Water is flowing. Moisture is moving toward the crop target..." : "Target moisture reached. Closing the cycle and recording the saving...") : "The demo sets soil to 25%, confirms solar and water availability, starts the simulated pump, then restores the target moisture."}</span></div></div></>;
}

function SliderRow({ label, value, min, max, suffix, icon: Icon, color, onChange }: any) { return <div className="slider-row"><div className="slider-label"><div className={cn("slider-icon", `metric-${color}`)}><Icon size={16} /></div><span>{label}</span><strong>{value}{suffix}</strong></div><input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ accentColor: color === "green" ? "#4d9b73" : color === "yellow" ? "#e5b64b" : color === "purple" ? "#9a84ca" : color === "blue" ? "#5a9ecc" : "#e6a452" }} /></div>; }

function SettingsView({ mode, setMode, saved, save }: any) {
  return <><PageHeader eyebrow="SETTINGS" title="Make it yours" description="Tune the simulation for how you want to run your farm." action={saved ? <Badge tone="green"><Check size={14} /> Settings saved</Badge> : <button className="btn primary" onClick={save}><Save size={16} /> Save settings</button>} /><div className="settings-layout"><div className="card settings-card"><div className="settings-section"><div className="settings-title"><UserRound size={18} /><div><h3>Farm profile</h3><p>Shown in your workspace</p></div></div><label>Farmer name<input defaultValue="Ravi Kumar" /></label><label>Farm name<input defaultValue="Green Valley Farm" /></label><label>Default field<select defaultValue="North Field"><option>North Field</option><option>South Field</option><option>Orchard Patch</option></select></label></div><div className="settings-section"><div className="settings-title"><Gauge size={18} /><div><h3>System preferences</h3><p>How the decision engine behaves</p></div></div><label>Default irrigation mode<div className="segmented wide"><button className={mode === "AUTO" ? "selected" : ""} onClick={() => setMode("AUTO")}>Automatic</button><button className={mode === "MANUAL" ? "selected" : ""} onClick={() => setMode("MANUAL")}>Manual</button></div></label><label>Default moisture threshold<div className="input-with-unit"><input defaultValue="40" type="number" /><span>%</span></div></label><label>Simulation speed<select defaultValue="Normal (4 seconds)"><option>Slow (8 seconds)</option><option>Normal (4 seconds)</option><option>Fast (2 seconds)</option></select></label></div></div><div className="card settings-card"><div className="settings-section"><div className="settings-title"><Bell size={18} /><div><h3>Alert preferences</h3><p>Choose what deserves your attention</p></div></div>{["Low soil moisture", "Low battery or water", "Irrigation started", "Daily summary"].map((item, index) => <div className="setting-toggle" key={item}><div><strong>{item}</strong><span>{index === 0 ? "Notify when crops need water" : index === 1 ? "Protect the system resources" : index === 2 ? "Keep a record of each cycle" : "Review your farm each morning"}</span></div><div className={cn("switch", index < 3 && "on")}><span /></div></div>)}</div><div className="settings-note"><ShieldCheck size={18} /><div><strong>Simulation, not hardware</strong><p>This prototype uses generated data. It does not connect to or control physical pumps, sensors, solar panels, or electricity.</p></div></div></div></div></>;
}

export default Home;
