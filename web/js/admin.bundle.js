(() => {
  // web/js/admin/ui.jsx
  var { useState } = React;
  var ICON_PATHS = {
    home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    db: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
    users: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm13 9v-1a4 4 0 0 0-3-3.8M16 4.2a3 3 0 0 1 0 5.6",
    megaphone: "M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1zm14-3a5 5 0 0 1 0 8",
    ticket: "M3 8a2 2 0 0 0 0 4v-0 4a2 2 0 0 1 2 2h14a2 2 0 0 1 2-2v-4a2 2 0 0 1 0-4V6a2 2 0 0 1-2-2H5a2 2 0 0 1-2 2zm10-4v16",
    spark: "M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z",
    image: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9.5a1 1 0 1 0 0-.01",
    chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
    search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 3l-4.3-4.3",
    card: "M3 6h18v12H3zM3 10h18M7 15h4",
    bell: "M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7m4 11a2 2 0 0 0 4 0",
    terminal: "M4 5h16v14H4zM8 9l3 3-3 3m5 0h3",
    gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
    plus: "M12 5v14M5 12h14",
    download: "M12 4v11m-5-5l5 5 5-5M5 20h14",
    trash: "M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3",
    copy: "M9 9h11v11H9zM5 15H4V4h11v1",
    menu: "M4 6h16M4 12h16M4 18h16",
    x: "M6 6l12 12M18 6L6 18",
    send: "M4 12l16-8-6 16-2-7z",
    refresh: "M20 11a8 8 0 0 0-14.9-3M4 4v4h4m-4 5a8 8 0 0 0 14.9 3M20 20v-4h-4",
    external: "M14 4h6v6m0-6l-9 9M18 14v6H4V6h6",
    code: "M8 8l-4 4 4 4m8-8l4 4-4 4M14 5l-4 14",
    flow: "M5 4h6v5H5zM13 15h6v5h-6zM8 9v4a2 2 0 0 0 2 2h3",
    share: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
    pen: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
    play: "M7 5l12 7-12 7z",
    up: "M12 19V5m-6 6l6-6 6 6",
    down: "M12 5v14m-6-6l6 6 6-6"
  };
  function Icon({ name, size = 16, className = "" }) {
    return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: ICON_PATHS[name] || "" }));
  }
  function SectionHeader({ eyebrow, title, desc, children }) {
    return /* @__PURE__ */ React.createElement("header", { className: "sec-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "sec-eyebrow" }, eyebrow), /* @__PURE__ */ React.createElement("h1", { className: "sec-title" }, title), desc && /* @__PURE__ */ React.createElement("p", { className: "sec-desc" }, desc)), children && /* @__PURE__ */ React.createElement("div", { className: "sec-actions" }, children));
  }
  function Card({ title, action, children, bodyClass = "card-body", className = "" }) {
    return /* @__PURE__ */ React.createElement("section", { className: `card ${className}` }, title && /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h2", { className: "card-title" }, title), action), /* @__PURE__ */ React.createElement("div", { className: bodyClass }, children));
  }
  function Stat({ label, value, delta }) {
    const positive = delta && !String(delta).startsWith("-");
    return /* @__PURE__ */ React.createElement("div", { className: "card stat" }, /* @__PURE__ */ React.createElement("span", { className: "stat-label" }, label), /* @__PURE__ */ React.createElement("span", { className: "stat-value" }, value), delta && /* @__PURE__ */ React.createElement("span", { className: `stat-delta ${positive ? "up" : "down"}` }, positive ? "+" : "", delta, " vs. mes anterior"));
  }
  function Badge({ tone = "off", children, plain }) {
    return /* @__PURE__ */ React.createElement("span", { className: `badge badge-${tone} ${plain ? "badge-plain" : ""}` }, children);
  }
  function Toggle({ checked, onChange, label }) {
    return /* @__PURE__ */ React.createElement("button", { type: "button", role: "switch", "aria-checked": checked, "aria-label": label, className: "toggle", onClick: () => onChange(!checked) });
  }
  function Button({ icon, children, variant = "", size = "", ...props }) {
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: `btn ${variant ? "btn-" + variant : ""} ${size ? "btn-" + size : ""}`, ...props }, icon && /* @__PURE__ */ React.createElement(Icon, { name: icon, size: size === "sm" ? 14 : 16 }), children);
  }
  function Field({ label, id, children }) {
    return /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { htmlFor: id }, label), children);
  }
  function Chips({ options, value, onChange, label }) {
    return /* @__PURE__ */ React.createElement("div", { className: "chips", role: "group", "aria-label": label }, options.map((o) => /* @__PURE__ */ React.createElement("button", { key: o, type: "button", className: "chip", "aria-pressed": value === o, onClick: () => onChange(o) }, o)));
  }
  function LineChart({ data, labels, height = 220, compare }) {
    const w = 640, h = height, pad = 28;
    const all = compare ? data.concat(compare) : data;
    const max = Math.max(...all) * 1.1, min = 0;
    const x = (i) => pad + i * (w - pad * 2) / (data.length - 1);
    const y = (v) => h - pad - (v - min) / (max - min) * (h - pad * 2);
    const path = (arr) => arr.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const area = `${path(data)} L${x(data.length - 1)},${h - pad} L${x(0)},${h - pad} Z`;
    return /* @__PURE__ */ React.createElement("svg", { className: "chart", viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": "Gr\xE1fico de evoluci\xF3n" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "lc-fill", x1: "0", x2: "0", y1: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#22d3ee", stopOpacity: "0.22" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#22d3ee", stopOpacity: "0" }))), [0, 1, 2, 3].map((i) => {
      const yy = pad + i * (h - pad * 2) / 3;
      return /* @__PURE__ */ React.createElement("line", { key: i, x1: pad, x2: w - pad, y1: yy, y2: yy, stroke: "rgba(255,255,255,0.06)" });
    }), compare && /* @__PURE__ */ React.createElement("path", { d: path(compare), fill: "none", stroke: "#71717a", strokeWidth: "1.5", strokeDasharray: "4 4" }), /* @__PURE__ */ React.createElement("path", { d: area, fill: "url(#lc-fill)" }), /* @__PURE__ */ React.createElement("path", { d: path(data), fill: "none", stroke: "#22d3ee", strokeWidth: "2" }), labels && labels.map((l, i) => i % Math.ceil(labels.length / 7) === 0 ? /* @__PURE__ */ React.createElement("text", { key: i, x: x(i), y: h - 8, fill: "#71717a", fontSize: "10", textAnchor: "middle", fontFamily: "JetBrains Mono" }, l) : null));
  }
  function Bars({ items, format = (v) => v }) {
    const max = Math.max(...items.map((i) => i.value));
    return /* @__PURE__ */ React.createElement("div", { className: "bars" }, items.map((it, idx) => /* @__PURE__ */ React.createElement("div", { className: "bar-row", key: it.label }, /* @__PURE__ */ React.createElement("span", { className: "muted" }, it.label), /* @__PURE__ */ React.createElement("div", { className: "bar-track" }, /* @__PURE__ */ React.createElement("div", { className: `bar-fill ${idx > 0 ? "dim" : ""}`, style: { width: `${it.value / max * 100}%` } })), /* @__PURE__ */ React.createElement("span", { className: "mono", style: { textAlign: "right" } }, format(it.value)))));
  }
  function useToast() {
    const [msg, setMsg] = useState(null);
    const show = (m) => {
      setMsg(m);
      clearTimeout(show._t);
      show._t = setTimeout(() => setMsg(null), 2400);
    };
    const node = msg ? /* @__PURE__ */ React.createElement("div", { className: "toast", role: "status" }, msg) : null;
    return [node, show];
  }
  var eur = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var num = (n) => n.toLocaleString("es-ES");

  // web/js/admin/data.js
  var DAYS = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2026, 9, 12 + i);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
  var wave = (base, amp, seed2) => DAYS.map((_, i) => Math.round(base + amp * Math.sin(i / 3 + seed2) + i * (amp / 12) + (i * 7919 + seed2 * 31) % 13 * (amp / 20)));
  var REVENUE = wave(1800, 420, 1);
  var REVENUE_PREV = wave(1500, 300, 2.4);
  var ACTIVE_USERS = wave(3200, 600, 0.5);
  var SESSIONS = wave(5400, 900, 1.7);
  var DB_TABLES = {
    users: {
      columns: ["id", "email", "plan", "pa\xEDs", "alta", "estado"],
      rows: [
        ["u_1042", "marta.dj@gmail.com", "PRO", "ES", "2026-10-28", "activo"],
        ["u_1041", "kiko.beats@outlook.com", "FREE", "MX", "2026-10-27", "activo"],
        ["u_1040", "lena.techno@gmx.de", "PRO", "DE", "2026-10-27", "activo"],
        ["u_1039", "djnoir@proton.me", "STUDIO", "FR", "2026-10-25", "suspendido"],
        ["u_1038", "alex.house@gmail.com", "FREE", "ES", "2026-10-24", "activo"],
        ["u_1037", "sara.vinyl@icloud.com", "PRO", "AR", "2026-10-22", "activo"],
        ["u_1036", "groove.pablo@gmail.com", "FREE", "CO", "2026-10-20", "inactivo"]
      ]
    },
    tracks: {
      columns: ["id", "t\xEDtulo", "artista", "bpm", "key", "an\xE1lisis"],
      rows: [
        ["t_88120", "Midnight Circuit", "Kolsch", "124", "8A", "completo"],
        ["t_88119", "Solar Drift", "Ben B\xF6hmer", "122", "5A", "completo"],
        ["t_88118", "Pressure Point", "Amelie Lens", "134", "11A", "pendiente"],
        ["t_88117", "Low Tide", "Tale Of Us", "118", "2A", "completo"],
        ["t_88116", "Afterglow", "Lane 8", "120", "9B", "error"]
      ]
    },
    subscriptions: {
      columns: ["id", "usuario", "plan", "importe", "renovaci\xF3n", "estado"],
      rows: [
        ["s_3301", "u_1042", "PRO mensual", "9,99 \u20AC", "2026-11-28", "activo"],
        ["s_3300", "u_1040", "PRO anual", "89,00 \u20AC", "2027-10-27", "activo"],
        ["s_3299", "u_1039", "STUDIO mensual", "19,99 \u20AC", "2026-11-25", "impago"],
        ["s_3298", "u_1037", "PRO mensual", "9,99 \u20AC", "2026-11-22", "activo"]
      ]
    },
    sets: {
      columns: ["id", "nombre", "usuario", "pistas", "duraci\xF3n", "p\xFAblico"],
      rows: [
        ["set_510", "Warehouse Night", "u_1042", "28", "2h 10m", "s\xED"],
        ["set_509", "Sunset Melodic", "u_1040", "19", "1h 32m", "no"],
        ["set_508", "Peak Time 134", "u_1039", "34", "2h 45m", "s\xED"]
      ]
    }
  };
  var PROMOS = [
    { id: "p1", name: "Black Friday \u2014 PRO anual -40%", audience: "Usuarios FREE", start: "2026-11-24", end: "2026-12-01", status: true, conv: 6.8 },
    { id: "p2", name: "Trial STUDIO 14 d\xEDas", audience: "Usuarios PRO", start: "2026-11-01", end: "2026-11-30", status: true, conv: 3.1 },
    { id: "p3", name: "Reactivaci\xF3n \u2014 1 mes gratis", audience: "Inactivos > 60 d\xEDas", start: "2026-10-01", end: "2026-10-31", status: false, conv: 2.4 }
  ];
  var CODES = [
    { code: "BFRIDAY40", type: "%", value: 40, uses: 312, limit: 1e3, expires: "2026-12-01", active: true },
    { code: "DJWELCOME", type: "%", value: 20, uses: 1840, limit: 0, expires: "\u2014", active: true },
    { code: "FESTIVAL10", type: "\u20AC", value: 10, uses: 98, limit: 200, expires: "2026-11-15", active: true },
    { code: "SUMMER25", type: "%", value: 25, uses: 500, limit: 500, expires: "2026-09-01", active: false }
  ];
  var SKILLS = [
    { id: "sk1", name: "Harmonic Mixing Pro", desc: "Sugerencias de mezcla arm\xF3nica avanzadas en Copilot", campaign: "Black Friday", plans: ["FREE", "PRO"], active: true },
    { id: "sk2", name: "Stem Separation", desc: "Separaci\xF3n de voces e instrumentales en Cues", campaign: "Festival Season", plans: ["PRO"], active: true },
    { id: "sk3", name: "Set Auditor IA", desc: "Auditor\xEDa autom\xE1tica de energ\xEDa y transiciones", campaign: "Navidad 2026", plans: ["FREE", "PRO", "STUDIO"], active: false },
    { id: "sk4", name: "Map Caratulas HD", desc: "Car\xE1tulas en alta resoluci\xF3n en la vista Map", campaign: "\u2014", plans: ["STUDIO"], active: false }
  ];
  var BANNERS = [
    { id: "b1", title: "Black Friday: PRO anual al 40%", sub: "Solo hasta el 1 de diciembre", cta: "Aprovechar", placement: "Home \u2014 superior", style: "cyan", active: true, ctr: 4.2 },
    { id: "b2", title: "Nuevo: Stem Separation", sub: "Disponible para usuarios PRO", cta: "Probar ahora", placement: "Cues \u2014 lateral", style: "dark", active: true, ctr: 2.7 },
    { id: "b3", title: "Encuesta de satisfacci\xF3n", sub: "Ay\xFAdanos a mejorar en 2 minutos", cta: "Responder", placement: "Modal post-sesi\xF3n", style: "light", active: false, ctr: 1.1 }
  ];
  var INVOICES = [
    { id: "INV-2026-1188", client: "marta.dj@gmail.com", plan: "PRO mensual", amount: 9.99, date: "2026-11-08", status: "pagada" },
    { id: "INV-2026-1187", client: "lena.techno@gmx.de", plan: "PRO anual", amount: 89, date: "2026-11-07", status: "pagada" },
    { id: "INV-2026-1186", client: "djnoir@proton.me", plan: "STUDIO mensual", amount: 19.99, date: "2026-11-06", status: "fallida" },
    { id: "INV-2026-1185", client: "sara.vinyl@icloud.com", plan: "PRO mensual", amount: 9.99, date: "2026-11-05", status: "pagada" },
    { id: "INV-2026-1184", client: "club.razzmatazz@empresa.es", plan: "STUDIO equipo x5", amount: 79, date: "2026-11-03", status: "reembolsada" }
  ];
  var NOTICES = [
    { id: "n1", title: "Mantenimiento programado", body: "El an\xE1lisis de pistas estar\xE1 en pausa el 14/11 de 03:00 a 04:00 CET.", channel: "In-app + Email", audience: "Todos", date: "2026-11-10", status: "programado" },
    { id: "n2", title: "Nueva versi\xF3n 3.2", body: "Llega el modo Map con car\xE1tulas y mejoras en Copilot.", channel: "In-app", audience: "Todos", date: "2026-11-02", status: "enviado" },
    { id: "n3", title: "Pago fallido", body: "Actualiza tu m\xE9todo de pago para mantener STUDIO.", channel: "Email", audience: "Impagos", date: "2026-11-06", status: "enviado" }
  ];
  var LOGS = [
    ["2026-11-10 09:42:18", "ERROR", "api/analyze", "Timeout analizando t_88116 (Afterglow) tras 30s"],
    ["2026-11-10 09:41:02", "INFO", "auth", "Login correcto u_1042 desde 83.45.x.x"],
    ["2026-11-10 09:40:55", "WARN", "billing", "Reintento de cobro s_3299 (2/3)"],
    ["2026-11-10 09:39:12", "INFO", "promo", "C\xF3digo BFRIDAY40 aplicado por u_1038"],
    ["2026-11-10 09:37:40", "DEBUG", "copilot", "Cache hit arm\xF3nico 8A\u21929A (12ms)"],
    ["2026-11-10 09:35:21", "INFO", "admin", "Banner b1 activado por admin@beatwave.pro"],
    ["2026-11-10 09:33:09", "ERROR", "storage", "Car\xE1tula no encontrada para set_509"],
    ["2026-11-10 09:30:44", "WARN", "api/rate", "L\xEDmite de peticiones alcanzado IP 190.12.x.x"],
    ["2026-11-10 09:28:13", "INFO", "skills", "Skill sk2 habilitada para plan PRO"],
    ["2026-11-10 09:25:57", "DEBUG", "map", "Render 412 nodos en 38ms"],
    ["2026-11-10 09:22:30", "INFO", "auth", "Registro nuevo u_1043 (ES)"]
  ];
  var SEO_PAGES = [
    { path: "/", title: "BEATWAVE PRO \u2014 Precision Audio Intelligence", score: 94, clicks: 4210, pos: 3.2 },
    { path: "/copilot", title: "Live Copilot para DJs", score: 88, clicks: 1890, pos: 5.8 },
    { path: "/precios", title: "Planes y precios", score: 72, clicks: 1204, pos: 8.1 },
    { path: "/academy", title: "Academy \u2014 aprende a mezclar", score: 65, clicks: 860, pos: 11.4 }
  ];

  // web/js/admin/sections-core.jsx
  var { useState: useState2, useMemo } = React;
  function Overview({ go }) {
    const total = REVENUE.reduce((a, b) => a + b, 0);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Resumen", title: "Estado de la plataforma", desc: "Ingresos, usuarios y salud del sistema en los \xFAltimos 30 d\xEDas." }, /* @__PURE__ */ React.createElement(Button, { icon: "download" }, "Exportar informe")), /* @__PURE__ */ React.createElement("div", { className: "grid g-4" }, /* @__PURE__ */ React.createElement(Stat, { label: "Ingresos (30 d)", value: eur(total), delta: "18,4%" }), /* @__PURE__ */ React.createElement(Stat, { label: "Usuarios activos", value: num(ACTIVE_USERS[ACTIVE_USERS.length - 1]), delta: "9,1%" }), /* @__PURE__ */ React.createElement(Stat, { label: "Suscripciones PRO", value: "1.284", delta: "6,3%" }), /* @__PURE__ */ React.createElement(Stat, { label: "Tasa de abandono", value: "2,9%", delta: "-0,4%" })), /* @__PURE__ */ React.createElement("div", { className: "grid g-main" }, /* @__PURE__ */ React.createElement(Card, { title: "Ingresos diarios", action: /* @__PURE__ */ React.createElement("span", { className: "faint", style: { fontSize: 12 } }, "\u2014 periodo anterior") }, /* @__PURE__ */ React.createElement(LineChart, { data: REVENUE, compare: REVENUE_PREV, labels: DAYS })), /* @__PURE__ */ React.createElement(Card, { title: "Accesos r\xE1pidos" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, [
      ["ticket", "Crear c\xF3digo descuento", "codes"],
      ["megaphone", "Lanzar promoci\xF3n", "promos"],
      ["image", "Nuevo banner", "banners"],
      ["bell", "Enviar aviso", "notices"]
    ].map(([ic, label, id]) => /* @__PURE__ */ React.createElement("button", { key: id, type: "button", className: "btn", style: { justifyContent: "flex-start", height: 42 }, onClick: () => go(id) }, /* @__PURE__ */ React.createElement(Icon, { name: ic }), " ", label))))), /* @__PURE__ */ React.createElement("div", { className: "grid g-2" }, /* @__PURE__ */ React.createElement(Card, { title: "Ingresos por plan" }, /* @__PURE__ */ React.createElement(Bars, { items: [{ label: "PRO mensual", value: 21400 }, { label: "PRO anual", value: 18900 }, { label: "STUDIO", value: 9800 }, { label: "Equipos", value: 4200 }], format: eur })), /* @__PURE__ */ React.createElement(Card, { title: "\xDAltimos eventos", bodyClass: "log", action: /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => go("logs") }, "Ver logs") }, LOGS.slice(0, 5).map((l, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "log-line", style: { gridTemplateColumns: "70px 56px 1fr" } }, /* @__PURE__ */ React.createElement("span", { className: "faint" }, l[0].slice(11)), /* @__PURE__ */ React.createElement("span", { className: `lvl-${l[1]}` }, l[1]), /* @__PURE__ */ React.createElement("span", { className: "muted", style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, l[3]))))));
  }
  var stateTone = (v) => ["activo", "completo", "s\xED"].includes(v) ? "on" : ["suspendido", "error", "impago"].includes(v) ? "err" : null;
  function Database({ toast }) {
    const [table, setTable] = useState2("users");
    const [q, setQ] = useState2("");
    const t = DB_TABLES[table];
    const rows = useMemo(() => t.rows.filter((r) => r.join(" ").toLowerCase().includes(q.toLowerCase())), [t, q]);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Datos", title: "Base de datos", desc: "Explora, filtra y edita registros de las tablas principales. Los cambios quedan registrados en Logs." }, /* @__PURE__ */ React.createElement(Button, { icon: "download", onClick: () => toast(`Exportando ${table}.csv`) }, "Exportar CSV"), /* @__PURE__ */ React.createElement(Button, { icon: "plus", variant: "primary", onClick: () => toast("Nuevo registro (pendiente de backend)") }, "Nuevo registro")), /* @__PURE__ */ React.createElement("div", { className: "grid g-4" }, Object.entries(DB_TABLES).map(([name, tb]) => /* @__PURE__ */ React.createElement("button", { key: name, type: "button", className: "card stat", style: { cursor: "pointer", textAlign: "left", borderColor: table === name ? "var(--bw-cyan)" : void 0 }, onClick: () => {
      setTable(name);
      setQ("");
    }, "aria-pressed": table === name }, /* @__PURE__ */ React.createElement("span", { className: "stat-label row" }, /* @__PURE__ */ React.createElement(Icon, { name: "db", size: 14 }), " ", name), /* @__PURE__ */ React.createElement("span", { className: "stat-value" }, num(tb.rows.length * 1873 + 12)), /* @__PURE__ */ React.createElement("span", { className: "faint mono", style: { fontSize: 11 } }, tb.columns.length, " columnas")))), /* @__PURE__ */ React.createElement(
      Card,
      {
        title: /* @__PURE__ */ React.createElement("span", { className: "mono" }, "public.", table),
        bodyClass: "",
        action: /* @__PURE__ */ React.createElement("div", { className: "adm-search", style: { height: 32, maxWidth: 260 } }, /* @__PURE__ */ React.createElement(Icon, { name: "search", size: 14 }), /* @__PURE__ */ React.createElement("label", { htmlFor: "db-q", className: "sr-only" }, "Buscar en la tabla"), /* @__PURE__ */ React.createElement("input", { id: "db-q", placeholder: "Filtrar filas\u2026", value: q, onChange: (e) => setQ(e.target.value) }))
      },
      /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, t.columns.map((c) => /* @__PURE__ */ React.createElement("th", { key: c, scope: "col" }, c)), /* @__PURE__ */ React.createElement("th", null, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "Acciones")))), /* @__PURE__ */ React.createElement("tbody", null, rows.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r[0] }, r.map((cell, i) => {
        const tone = stateTone(cell);
        return /* @__PURE__ */ React.createElement("td", { key: i, className: i === 0 ? "mono faint" : "" }, tone ? /* @__PURE__ */ React.createElement(Badge, { tone }, cell) : cell);
      }), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "ghost", onClick: () => toast(`Editar ${r[0]}`) }, "Editar")))))), !rows.length && /* @__PURE__ */ React.createElement("div", { className: "empty" }, "Sin resultados para \u201C", q, "\u201D."))
    ));
  }
  function Logs() {
    const [level, setLevel] = useState2("Todos");
    const [q, setQ] = useState2("");
    const rows = LOGS.filter((l) => (level === "Todos" || l[1] === level) && l.join(" ").toLowerCase().includes(q.toLowerCase()));
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Sistema", title: "Logs", desc: "Registro en tiempo real de API, autenticaci\xF3n, facturaci\xF3n y acciones de administradores." }, /* @__PURE__ */ React.createElement(Button, { icon: "refresh" }, "Actualizar"), /* @__PURE__ */ React.createElement(Button, { icon: "download" }, "Descargar")), /* @__PURE__ */ React.createElement("div", { className: "row between wrap" }, /* @__PURE__ */ React.createElement(Chips, { label: "Nivel", options: ["Todos", "ERROR", "WARN", "INFO", "DEBUG"], value: level, onChange: setLevel }), /* @__PURE__ */ React.createElement("div", { className: "adm-search", style: { maxWidth: 300 } }, /* @__PURE__ */ React.createElement(Icon, { name: "search", size: 14 }), /* @__PURE__ */ React.createElement("label", { htmlFor: "log-q", className: "sr-only" }, "Buscar en logs"), /* @__PURE__ */ React.createElement("input", { id: "log-q", placeholder: "Buscar m\xF3dulo o mensaje\u2026", value: q, onChange: (e) => setQ(e.target.value) }))), /* @__PURE__ */ React.createElement(Card, { bodyClass: "log" }, rows.map((l, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "log-line" }, /* @__PURE__ */ React.createElement("span", { className: "faint" }, l[0]), /* @__PURE__ */ React.createElement("span", { className: `lvl-${l[1]}` }, l[1]), /* @__PURE__ */ React.createElement("span", { className: "muted" }, l[2]), /* @__PURE__ */ React.createElement("span", null, l[3]))), !rows.length && /* @__PURE__ */ React.createElement("div", { className: "empty" }, "No hay eventos con estos filtros.")));
  }

  // web/js/admin/sections-growth.jsx
  var { useState: useState3 } = React;
  function Promotions({ toast }) {
    const [items, setItems] = useState3(PROMOS);
    const [form, setForm] = useState3({ name: "", audience: "Usuarios FREE", start: "", end: "" });
    const add = (e) => {
      e.preventDefault();
      if (!form.name.trim()) return;
      setItems([{ id: "p" + Date.now(), ...form, status: true, conv: 0 }, ...items]);
      setForm({ name: "", audience: "Usuarios FREE", start: "", end: "" });
      toast("Promoci\xF3n creada");
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Crecimiento", title: "Promociones", desc: "Campa\xF1as con segmentaci\xF3n por audiencia y ventana de fechas. Comb\xEDnalas con c\xF3digos y banners." }), /* @__PURE__ */ React.createElement("div", { className: "grid g-main" }, /* @__PURE__ */ React.createElement(Card, { title: "Campa\xF1as", bodyClass: "" }, /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Campa\xF1a"), /* @__PURE__ */ React.createElement("th", null, "Audiencia"), /* @__PURE__ */ React.createElement("th", null, "Fechas"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "Conv."), /* @__PURE__ */ React.createElement("th", null, "Activa"))), /* @__PURE__ */ React.createElement("tbody", null, items.map((p) => /* @__PURE__ */ React.createElement("tr", { key: p.id }, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 500 } }, p.name), /* @__PURE__ */ React.createElement("td", { className: "muted" }, p.audience), /* @__PURE__ */ React.createElement("td", { className: "mono faint" }, p.start || "\u2014", " \u2192 ", p.end || "\u2014"), /* @__PURE__ */ React.createElement("td", { className: "num" }, p.conv.toFixed(1), "%"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Toggle, { label: `Activar ${p.name}`, checked: p.status, onChange: (v) => setItems(items.map((x) => x.id === p.id ? { ...x, status: v } : x)) })))))))), /* @__PURE__ */ React.createElement(Card, { title: "Nueva promoci\xF3n" }, /* @__PURE__ */ React.createElement("form", { className: "stack", onSubmit: add }, /* @__PURE__ */ React.createElement(Field, { label: "Nombre", id: "pr-name" }, /* @__PURE__ */ React.createElement("input", { id: "pr-name", className: "input", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), placeholder: "Ej. Navidad \u2014 STUDIO -30%", required: true })), /* @__PURE__ */ React.createElement(Field, { label: "Audiencia", id: "pr-aud" }, /* @__PURE__ */ React.createElement("select", { id: "pr-aud", className: "select", value: form.audience, onChange: (e) => setForm({ ...form, audience: e.target.value }) }, /* @__PURE__ */ React.createElement("option", null, "Usuarios FREE"), /* @__PURE__ */ React.createElement("option", null, "Usuarios PRO"), /* @__PURE__ */ React.createElement("option", null, "Usuarios STUDIO"), /* @__PURE__ */ React.createElement("option", null, "Inactivos ", ">", " 60 d\xEDas"), /* @__PURE__ */ React.createElement("option", null, "Todos"))), /* @__PURE__ */ React.createElement("div", { className: "grid g-2", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Field, { label: "Inicio", id: "pr-s" }, /* @__PURE__ */ React.createElement("input", { id: "pr-s", type: "date", className: "input", value: form.start, onChange: (e) => setForm({ ...form, start: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Fin", id: "pr-e" }, /* @__PURE__ */ React.createElement("input", { id: "pr-e", type: "date", className: "input", value: form.end, onChange: (e) => setForm({ ...form, end: e.target.value }) }))), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary" }, /* @__PURE__ */ React.createElement(Icon, { name: "plus" }), " Crear promoci\xF3n")))));
  }
  var randomCode = () => "BW" + Math.random().toString(36).slice(2, 8).toUpperCase();
  function Codes({ toast }) {
    const [codes, setCodes] = useState3(CODES);
    const [form, setForm] = useState3({ code: "", type: "%", value: 15, limit: 100, expires: "" });
    const inject = (e) => {
      e.preventDefault();
      const code = (form.code || randomCode()).toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (codes.some((c) => c.code === code)) return toast("Ese c\xF3digo ya existe");
      setCodes([{ ...form, code, value: Number(form.value), limit: Number(form.limit), uses: 0, expires: form.expires || "\u2014", active: true }, ...codes]);
      setForm({ code: "", type: "%", value: 15, limit: 100, expires: "" });
      toast(`C\xF3digo ${code} inyectado`);
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Crecimiento", title: "C\xF3digos descuento", desc: "Genera e inyecta c\xF3digos con l\xEDmite de usos y caducidad. Se validan en el servidor al pagar." }), /* @__PURE__ */ React.createElement("div", { className: "grid g-main" }, /* @__PURE__ */ React.createElement(Card, { title: "C\xF3digos", bodyClass: "" }, /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "C\xF3digo"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "Descuento"), /* @__PURE__ */ React.createElement("th", null, "Usos"), /* @__PURE__ */ React.createElement("th", null, "Caduca"), /* @__PURE__ */ React.createElement("th", null, "Estado"), /* @__PURE__ */ React.createElement("th", null, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "Acciones")))), /* @__PURE__ */ React.createElement("tbody", null, codes.map((c) => {
      const pct = c.limit ? Math.min(100, c.uses / c.limit * 100) : 0;
      return /* @__PURE__ */ React.createElement("tr", { key: c.code }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "code-tag" }, c.code)), /* @__PURE__ */ React.createElement("td", { className: "num" }, c.type === "%" ? `${c.value}%` : `${c.value} \u20AC`), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "mono", style: { fontSize: 12 } }, num(c.uses), c.limit ? ` / ${num(c.limit)}` : " / \u221E"), c.limit > 0 && /* @__PURE__ */ React.createElement("div", { className: "progress" }, /* @__PURE__ */ React.createElement("span", { style: { width: `${pct}%` } })))), /* @__PURE__ */ React.createElement("td", { className: "mono faint" }, c.expires), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Toggle, { label: `Activar ${c.code}`, checked: c.active, onChange: (v) => setCodes(codes.map((x) => x.code === c.code ? { ...x, active: v } : x)) })), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "ghost", icon: "copy", "aria-label": `Copiar ${c.code}`, onClick: () => {
        navigator.clipboard && navigator.clipboard.writeText(c.code);
        toast("Copiado");
      } })));
    }))))), /* @__PURE__ */ React.createElement(Card, { title: "Inyectar c\xF3digo" }, /* @__PURE__ */ React.createElement("form", { className: "stack", onSubmit: inject }, /* @__PURE__ */ React.createElement(Field, { label: "C\xF3digo (vac\xEDo = aleatorio)", id: "cd-code" }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("input", { id: "cd-code", className: "input mono", value: form.code, onChange: (e) => setForm({ ...form, code: e.target.value.toUpperCase() }), placeholder: "NAVIDAD30", maxLength: 20 }), /* @__PURE__ */ React.createElement(Button, { icon: "refresh", "aria-label": "Generar c\xF3digo", onClick: () => setForm({ ...form, code: randomCode() }) }))), /* @__PURE__ */ React.createElement("div", { className: "grid g-2", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Field, { label: "Tipo", id: "cd-type" }, /* @__PURE__ */ React.createElement("select", { id: "cd-type", className: "select", value: form.type, onChange: (e) => setForm({ ...form, type: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "%" }, "Porcentaje"), /* @__PURE__ */ React.createElement("option", { value: "\u20AC" }, "Importe fijo"))), /* @__PURE__ */ React.createElement(Field, { label: "Valor", id: "cd-val" }, /* @__PURE__ */ React.createElement("input", { id: "cd-val", type: "number", min: "1", max: form.type === "%" ? 100 : 500, className: "input", value: form.value, onChange: (e) => setForm({ ...form, value: e.target.value }), required: true })), /* @__PURE__ */ React.createElement(Field, { label: "L\xEDmite de usos (0 = \u221E)", id: "cd-lim" }, /* @__PURE__ */ React.createElement("input", { id: "cd-lim", type: "number", min: "0", className: "input", value: form.limit, onChange: (e) => setForm({ ...form, limit: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Caducidad", id: "cd-exp" }, /* @__PURE__ */ React.createElement("input", { id: "cd-exp", type: "date", className: "input", value: form.expires, onChange: (e) => setForm({ ...form, expires: e.target.value }) }))), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary" }, /* @__PURE__ */ React.createElement(Icon, { name: "ticket" }), " Inyectar c\xF3digo")))));
  }
  function Skills({ toast }) {
    const [skills, setSkills] = useState3(SKILLS);
    const toggle = (id, v) => {
      setSkills(skills.map((s) => s.id === id ? { ...s, active: v } : s));
      toast(v ? "Skill desplegada a usuarios" : "Skill retirada");
    };
    const togglePlan = (id, plan) => setSkills(skills.map((s) => s.id === id ? { ...s, plans: s.plans.includes(plan) ? s.plans.filter((p) => p !== plan) : [...s.plans, plan] } : s));
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Crecimiento", title: "Skills en campa\xF1as", desc: "Desbloquea funciones de la app de forma temporal por campa\xF1a y plan, sin publicar una nueva versi\xF3n." }, /* @__PURE__ */ React.createElement(Button, { icon: "plus", variant: "primary", onClick: () => toast("Registrar skill (pendiente de backend)") }, "Registrar skill")), /* @__PURE__ */ React.createElement("div", { className: "grid g-2" }, skills.map((s) => /* @__PURE__ */ React.createElement(Card, { key: s.id }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("div", { className: "ico-box", style: s.active ? { color: "var(--bw-cyan)" } : void 0 }, /* @__PURE__ */ React.createElement(Icon, { name: "spark" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "card-title" }, s.name), /* @__PURE__ */ React.createElement("p", { className: "faint", style: { margin: 0, fontSize: 12 } }, "Campa\xF1a: ", s.campaign))), /* @__PURE__ */ React.createElement(Toggle, { label: `Desplegar ${s.name}`, checked: s.active, onChange: (v) => toggle(s.id, v) })), /* @__PURE__ */ React.createElement("p", { className: "muted", style: { margin: 0 } }, s.desc), /* @__PURE__ */ React.createElement("div", { className: "row wrap", role: "group", "aria-label": "Planes con acceso" }, /* @__PURE__ */ React.createElement("span", { className: "faint", style: { fontSize: 12 } }, "Planes:"), ["FREE", "PRO", "STUDIO"].map((p) => /* @__PURE__ */ React.createElement("button", { key: p, type: "button", className: "chip", "aria-pressed": s.plans.includes(p), onClick: () => togglePlan(s.id, p) }, p))))))));
  }
  function Banners({ toast }) {
    const [banners, setBanners] = useState3(BANNERS);
    const [draft, setDraft] = useState3({ title: "Nuevo set de bienvenida", sub: "Descarga 20 pistas analizadas gratis", cta: "Descargar", placement: "Home \u2014 superior", style: "cyan" });
    const save = () => {
      setBanners([{ id: "b" + Date.now(), ...draft, active: false, ctr: 0 }, ...banners]);
      toast("Banner guardado como borrador");
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Crecimiento", title: "Banners", desc: "Dise\xF1a banners con vista previa en vivo y elige d\xF3nde aparecen dentro de la app." }), /* @__PURE__ */ React.createElement("div", { className: "grid g-main" }, /* @__PURE__ */ React.createElement(Card, { title: "Editor" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: `banner-preview style-${draft.style}`, "aria-label": "Vista previa del banner" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "bp-title" }, draft.title || "T\xEDtulo"), /* @__PURE__ */ React.createElement("p", { className: "bp-sub" }, draft.sub)), /* @__PURE__ */ React.createElement("button", { type: "button", className: "bp-cta", tabIndex: -1 }, /* @__PURE__ */ React.createElement("span", null, draft.cta || "CTA"))), /* @__PURE__ */ React.createElement("div", { className: "grid g-2", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Field, { label: "T\xEDtulo", id: "bn-t" }, /* @__PURE__ */ React.createElement("input", { id: "bn-t", className: "input", maxLength: 60, value: draft.title, onChange: (e) => setDraft({ ...draft, title: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Subt\xEDtulo", id: "bn-s" }, /* @__PURE__ */ React.createElement("input", { id: "bn-s", className: "input", maxLength: 90, value: draft.sub, onChange: (e) => setDraft({ ...draft, sub: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Texto del bot\xF3n", id: "bn-c" }, /* @__PURE__ */ React.createElement("input", { id: "bn-c", className: "input", maxLength: 20, value: draft.cta, onChange: (e) => setDraft({ ...draft, cta: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Ubicaci\xF3n", id: "bn-p" }, /* @__PURE__ */ React.createElement("select", { id: "bn-p", className: "select", value: draft.placement, onChange: (e) => setDraft({ ...draft, placement: e.target.value }) }, /* @__PURE__ */ React.createElement("option", null, "Home \u2014 superior"), /* @__PURE__ */ React.createElement("option", null, "Cues \u2014 lateral"), /* @__PURE__ */ React.createElement("option", null, "Sets \u2014 inferior"), /* @__PURE__ */ React.createElement("option", null, "Modal post-sesi\xF3n")))), /* @__PURE__ */ React.createElement("div", { className: "row between wrap" }, /* @__PURE__ */ React.createElement("div", { className: "chips", role: "group", "aria-label": "Estilo" }, [["cyan", "Cian"], ["dark", "Oscuro"], ["light", "Claro"]].map(([k, l]) => /* @__PURE__ */ React.createElement("button", { key: k, type: "button", className: "chip", "aria-pressed": draft.style === k, onClick: () => setDraft({ ...draft, style: k }) }, l))), /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "plus", onClick: save }, "Guardar banner")))), /* @__PURE__ */ React.createElement(Card, { title: "Publicados", bodyClass: "list" }, banners.map((b) => /* @__PURE__ */ React.createElement("div", { key: b.id, className: "list-item" }, /* @__PURE__ */ React.createElement("div", { className: "ico-box" }, /* @__PURE__ */ React.createElement(Icon, { name: "image" })), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0, flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, b.title), /* @__PURE__ */ React.createElement("div", { className: "faint", style: { fontSize: 12 } }, b.placement, " \xB7 CTR ", /* @__PURE__ */ React.createElement("span", { className: "mono" }, b.ctr.toFixed(1), "%"))), /* @__PURE__ */ React.createElement(Toggle, { label: `Activar ${b.title}`, checked: b.active, onChange: (v) => setBanners(banners.map((x) => x.id === b.id ? { ...x, active: v } : x)) }))))));
  }

  // web/js/admin/sections-insights.jsx
  var { useState: useState4 } = React;
  function Analytics() {
    const [metric, setMetric] = useState4("Sesiones");
    const series = metric === "Sesiones" ? SESSIONS : ACTIVE_USERS;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Insights", title: "Anal\xEDtica", desc: "Uso de la app por secci\xF3n, retenci\xF3n y fuentes de adquisici\xF3n." }, /* @__PURE__ */ React.createElement(Button, { icon: "download" }, "Exportar")), /* @__PURE__ */ React.createElement("div", { className: "grid g-4" }, /* @__PURE__ */ React.createElement(Stat, { label: "Sesiones (30 d)", value: num(SESSIONS.reduce((a, b) => a + b, 0)), delta: "12,7%" }), /* @__PURE__ */ React.createElement(Stat, { label: "Duraci\xF3n media", value: "23m 41s", delta: "4,2%" }), /* @__PURE__ */ React.createElement(Stat, { label: "Retenci\xF3n D30", value: "41,8%", delta: "2,1%" }), /* @__PURE__ */ React.createElement(Stat, { label: "Pistas analizadas", value: "186.420", delta: "22,5%" })), /* @__PURE__ */ React.createElement(Card, { title: "Tendencia", action: /* @__PURE__ */ React.createElement(Chips, { label: "M\xE9trica", options: ["Sesiones", "Usuarios activos"], value: metric, onChange: setMetric }) }, /* @__PURE__ */ React.createElement(LineChart, { data: series, labels: DAYS })), /* @__PURE__ */ React.createElement("div", { className: "grid g-2" }, /* @__PURE__ */ React.createElement(Card, { title: "Uso por secci\xF3n" }, /* @__PURE__ */ React.createElement(Bars, { items: [{ label: "Copilot", value: 38 }, { label: "Cues", value: 24 }, { label: "Sets", value: 18 }, { label: "Map", value: 12 }, { label: "Auditar", value: 8 }], format: (v) => `${v}%` })), /* @__PURE__ */ React.createElement(Card, { title: "Adquisici\xF3n" }, /* @__PURE__ */ React.createElement(Bars, { items: [{ label: "Org\xE1nico", value: 4820 }, { label: "Referidos", value: 2140 }, { label: "Instagram", value: 1760 }, { label: "YouTube", value: 980 }, { label: "Email", value: 610 }], format: num }))));
  }
  function ScoreRing({ value }) {
    const r = 36, c = 2 * Math.PI * r;
    return /* @__PURE__ */ React.createElement("div", { className: "score-ring", role: "img", "aria-label": `Puntuaci\xF3n SEO ${value} de 100` }, /* @__PURE__ */ React.createElement("svg", { width: "84", height: "84", viewBox: "0 0 84 84" }, /* @__PURE__ */ React.createElement("circle", { cx: "42", cy: "42", r, fill: "none", stroke: "#1b1b21", strokeWidth: "6" }), /* @__PURE__ */ React.createElement("circle", { cx: "42", cy: "42", r, fill: "none", stroke: "#22d3ee", strokeWidth: "6", strokeLinecap: "round", strokeDasharray: c, strokeDashoffset: c * (1 - value / 100), transform: "rotate(-90 42 42)" })), /* @__PURE__ */ React.createElement("span", null, value));
  }
  function Seo({ toast }) {
    const [meta, setMeta] = useState4({ title: "BEATWAVE PRO \u2014 Precision Audio Intelligence", desc: "Analiza, organiza y mezcla tu m\xFAsica con IA: BPM, tonalidad, cues y un copiloto en directo para DJs." });
    const avg2 = Math.round(SEO_PAGES.reduce((a, p) => a + p.score, 0) / SEO_PAGES.length);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Insights", title: "SEO", desc: "Rendimiento org\xE1nico por p\xE1gina y edici\xF3n de metadatos con vista previa de Google." }, /* @__PURE__ */ React.createElement(Button, { icon: "refresh", onClick: () => toast("Auditor\xEDa SEO lanzada") }, "Auditar ahora")), /* @__PURE__ */ React.createElement("div", { className: "grid g-main" }, /* @__PURE__ */ React.createElement(Card, { title: "P\xE1ginas indexadas", bodyClass: "" }, /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Ruta"), /* @__PURE__ */ React.createElement("th", null, "T\xEDtulo"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "Clics"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "Pos. media"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "Score"))), /* @__PURE__ */ React.createElement("tbody", null, SEO_PAGES.map((p) => /* @__PURE__ */ React.createElement("tr", { key: p.path }, /* @__PURE__ */ React.createElement("td", { className: "mono" }, p.path), /* @__PURE__ */ React.createElement("td", { className: "muted", style: { maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis" } }, p.title), /* @__PURE__ */ React.createElement("td", { className: "num" }, num(p.clicks)), /* @__PURE__ */ React.createElement("td", { className: "num" }, p.pos.toFixed(1)), /* @__PURE__ */ React.createElement("td", { className: "num" }, /* @__PURE__ */ React.createElement("span", { className: p.score < 70 ? "danger" : p.score >= 85 ? "cyan" : "" }, p.score)))))))), /* @__PURE__ */ React.createElement(Card, { title: "Salud global" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(ScoreRing, { value: avg2 }), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 4, fontSize: 13 } }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "danger mono" }, "2"), " p\xE1ginas sin meta descripci\xF3n"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "mono" }, "5"), " im\xE1genes sin texto alternativo"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "cyan mono" }, "0"), " errores 404 activos"))))), /* @__PURE__ */ React.createElement(Card, { title: "Metadatos de la home" }, /* @__PURE__ */ React.createElement("div", { className: "grid g-2" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement(Field, { label: `T\xEDtulo (${meta.title.length}/60)`, id: "seo-t" }, /* @__PURE__ */ React.createElement("input", { id: "seo-t", className: "input", maxLength: 70, value: meta.title, onChange: (e) => setMeta({ ...meta, title: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: `Descripci\xF3n (${meta.desc.length}/160)`, id: "seo-d" }, /* @__PURE__ */ React.createElement("textarea", { id: "seo-d", className: "textarea", maxLength: 180, value: meta.desc, onChange: (e) => setMeta({ ...meta, desc: e.target.value }) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Button, { variant: "primary", onClick: () => toast("Metadatos guardados") }, "Guardar metadatos"))), /* @__PURE__ */ React.createElement("div", { className: "serp", "aria-label": "Vista previa en Google" }, /* @__PURE__ */ React.createElement("div", { className: "serp-url" }, "beatwave.pro \u203A inicio"), /* @__PURE__ */ React.createElement("div", { className: "serp-title" }, meta.title.length > 60 ? meta.title.slice(0, 60) + "\u2026" : meta.title), /* @__PURE__ */ React.createElement("p", { className: "serp-desc" }, meta.desc.length > 160 ? meta.desc.slice(0, 160) + "\u2026" : meta.desc)))));
  }
  var invTone = { pagada: "on", fallida: "err", reembolsada: "off" };
  function Billing({ toast }) {
    const [filter, setFilter] = useState4("Todas");
    const list = INVOICES.filter((i) => filter === "Todas" || i.status === filter.toLowerCase());
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Negocio", title: "Facturaci\xF3n", desc: "Ingresos recurrentes, facturas emitidas, cobros fallidos y reembolsos." }, /* @__PURE__ */ React.createElement(Button, { icon: "external", onClick: () => toast("Abriendo pasarela de pago") }, "Abrir pasarela"), /* @__PURE__ */ React.createElement(Button, { icon: "download" }, "Exportar facturas")), /* @__PURE__ */ React.createElement("div", { className: "grid g-4" }, /* @__PURE__ */ React.createElement(Stat, { label: "MRR", value: eur(18640), delta: "7,9%" }), /* @__PURE__ */ React.createElement(Stat, { label: "ARR", value: eur(223680), delta: "7,9%" }), /* @__PURE__ */ React.createElement(Stat, { label: "ARPU", value: "11,42 \u20AC", delta: "1,6%" }), /* @__PURE__ */ React.createElement(Stat, { label: "Cobros fallidos", value: "14", delta: "-3" })), /* @__PURE__ */ React.createElement(Card, { title: "Facturas", bodyClass: "", action: /* @__PURE__ */ React.createElement(Chips, { label: "Estado", options: ["Todas", "Pagada", "Fallida", "Reembolsada"], value: filter, onChange: setFilter }) }, /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Factura"), /* @__PURE__ */ React.createElement("th", null, "Cliente"), /* @__PURE__ */ React.createElement("th", null, "Plan"), /* @__PURE__ */ React.createElement("th", null, "Fecha"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "Importe"), /* @__PURE__ */ React.createElement("th", null, "Estado"), /* @__PURE__ */ React.createElement("th", null, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "Acciones")))), /* @__PURE__ */ React.createElement("tbody", null, list.map((i) => /* @__PURE__ */ React.createElement("tr", { key: i.id }, /* @__PURE__ */ React.createElement("td", { className: "mono" }, i.id), /* @__PURE__ */ React.createElement("td", null, i.client), /* @__PURE__ */ React.createElement("td", { className: "muted" }, i.plan), /* @__PURE__ */ React.createElement("td", { className: "mono faint" }, i.date), /* @__PURE__ */ React.createElement("td", { className: "num" }, i.amount.toLocaleString("es-ES", { style: "currency", currency: "EUR" })), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Badge, { tone: invTone[i.status] }, i.status)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, i.status === "fallida" ? /* @__PURE__ */ React.createElement(Button, { size: "sm", onClick: () => toast(`Reintentando cobro ${i.id}`) }, "Reintentar") : /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "ghost", icon: "download", "aria-label": `Descargar ${i.id}` })))))))), /* @__PURE__ */ React.createElement(Card, { title: "Ingresos diarios" }, /* @__PURE__ */ React.createElement(LineChart, { data: REVENUE, labels: DAYS, height: 180 })));
  }
  function Notices({ toast }) {
    const [items, setItems] = useState4(NOTICES);
    const [form, setForm] = useState4({ title: "", body: "", channel: "In-app", audience: "Todos" });
    const send = (e) => {
      e.preventDefault();
      if (!form.title.trim() || !form.body.trim()) return;
      setItems([{ id: "n" + Date.now(), ...form, date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), status: "enviado" }, ...items]);
      setForm({ title: "", body: "", channel: "In-app", audience: "Todos" });
      toast("Aviso enviado");
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Sistema", title: "Avisos", desc: "Comunica mantenimientos, novedades e incidencias por notificaci\xF3n in-app, email o ambos." }), /* @__PURE__ */ React.createElement("div", { className: "grid g-main" }, /* @__PURE__ */ React.createElement(Card, { title: "Historial", bodyClass: "list" }, items.map((n) => /* @__PURE__ */ React.createElement("div", { key: n.id, className: "list-item", style: { alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", { className: "ico-box" }, /* @__PURE__ */ React.createElement(Icon, { name: "bell" })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "row between wrap" }, /* @__PURE__ */ React.createElement("strong", { style: { fontWeight: 600 } }, n.title), /* @__PURE__ */ React.createElement(Badge, { tone: n.status === "enviado" ? "on" : "off" }, n.status)), /* @__PURE__ */ React.createElement("p", { className: "muted", style: { margin: "4px 0", textWrap: "pretty" } }, n.body), /* @__PURE__ */ React.createElement("span", { className: "faint", style: { fontSize: 12 } }, n.channel, " \xB7 ", n.audience, " \xB7 ", /* @__PURE__ */ React.createElement("span", { className: "mono" }, n.date)))))), /* @__PURE__ */ React.createElement(Card, { title: "Nuevo aviso" }, /* @__PURE__ */ React.createElement("form", { className: "stack", onSubmit: send }, /* @__PURE__ */ React.createElement(Field, { label: "T\xEDtulo", id: "nt-t" }, /* @__PURE__ */ React.createElement("input", { id: "nt-t", className: "input", maxLength: 80, value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), required: true })), /* @__PURE__ */ React.createElement(Field, { label: "Mensaje", id: "nt-b" }, /* @__PURE__ */ React.createElement("textarea", { id: "nt-b", className: "textarea", maxLength: 400, value: form.body, onChange: (e) => setForm({ ...form, body: e.target.value }), required: true })), /* @__PURE__ */ React.createElement("div", { className: "grid g-2", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Field, { label: "Canal", id: "nt-c" }, /* @__PURE__ */ React.createElement("select", { id: "nt-c", className: "select", value: form.channel, onChange: (e) => setForm({ ...form, channel: e.target.value }) }, /* @__PURE__ */ React.createElement("option", null, "In-app"), /* @__PURE__ */ React.createElement("option", null, "Email"), /* @__PURE__ */ React.createElement("option", null, "In-app + Email"))), /* @__PURE__ */ React.createElement(Field, { label: "Audiencia", id: "nt-a" }, /* @__PURE__ */ React.createElement("select", { id: "nt-a", className: "select", value: form.audience, onChange: (e) => setForm({ ...form, audience: e.target.value }) }, /* @__PURE__ */ React.createElement("option", null, "Todos"), /* @__PURE__ */ React.createElement("option", null, "FREE"), /* @__PURE__ */ React.createElement("option", null, "PRO"), /* @__PURE__ */ React.createElement("option", null, "STUDIO"), /* @__PURE__ */ React.createElement("option", null, "Impagos")))), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary" }, /* @__PURE__ */ React.createElement(Icon, { name: "send" }), " Enviar aviso")))));
  }
  function Settings({ toast }) {
    const [flags, setFlags] = useState4({ maintenance: false, signups: true, twofa: true, betas: false });
    const items = [
      ["maintenance", "Modo mantenimiento", "Muestra una pantalla de mantenimiento a todos los usuarios."],
      ["signups", "Registro abierto", "Permite que nuevos usuarios creen cuenta."],
      ["twofa", "2FA obligatorio para admins", "Exige segundo factor en este panel."],
      ["betas", "Funciones beta", "Activa funciones experimentales para usuarios STUDIO."]
    ];
    const admins = [["Carlos Rueda", "admin@beatwave.pro", "Propietario"], ["Laura M.", "laura@beatwave.pro", "Marketing"], ["Soporte", "soporte@beatwave.pro", "Solo lectura"]];
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Sistema", title: "Ajustes", desc: "Interruptores globales de la plataforma y equipo con acceso al panel." }), /* @__PURE__ */ React.createElement("div", { className: "grid g-2" }, /* @__PURE__ */ React.createElement(Card, { title: "Plataforma", bodyClass: "list" }, items.map(([k, t, d]) => /* @__PURE__ */ React.createElement("div", { key: k, className: "list-item" }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 500 } }, t), /* @__PURE__ */ React.createElement("div", { className: "faint", style: { fontSize: 12 } }, d)), /* @__PURE__ */ React.createElement(Toggle, { label: t, checked: flags[k], onChange: (v) => {
      setFlags({ ...flags, [k]: v });
      toast(`${t}: ${v ? "activado" : "desactivado"}`);
    } })))), /* @__PURE__ */ React.createElement(Card, { title: "Equipo", bodyClass: "list", action: /* @__PURE__ */ React.createElement(Button, { size: "sm", icon: "plus", onClick: () => toast("Invitaci\xF3n enviada") }, "Invitar") }, admins.map(([n, e, r]) => /* @__PURE__ */ React.createElement("div", { key: e, className: "list-item" }, /* @__PURE__ */ React.createElement("div", { className: "adm-avatar" }, n.split(" ").map((p) => p[0]).join("").slice(0, 2)), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 500 } }, n), /* @__PURE__ */ React.createElement("div", { className: "faint", style: { fontSize: 12 } }, e)), /* @__PURE__ */ React.createElement(Badge, { plain: true }, r))))));
  }

  // web/js/admin/data-deep.js
  var seed = 20261112;
  var rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  var pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  var int = (a, b) => Math.floor(a + rnd() * (b - a + 1));
  var SECTIONS = ["Copilot", "Sets", "Map", "Auditar", "Cues", "Academia", "Biblioteca", "Ajustes"];
  var SECTION_WEIGHT = { Copilot: 1.6, Sets: 1.4, Map: 0.9, Auditar: 1.1, Cues: 1.2, Academia: 0.8, Biblioteca: 1.3, Ajustes: 0.2 };
  var PLANS = ["FREE", "FREE", "FREE", "PRO", "PRO", "STUDIO"];
  var COUNTRIES = ["ES", "ES", "MX", "AR", "DE", "FR", "CO", "US", "IT"];
  var DEVICES = ["desktop", "desktop", "desktop", "tablet", "m\xF3vil"];
  var KEYS = ["1A", "2A", "4A", "5A", "8A", "8B", "9B", "11A", "12A"];
  var NAMES = ["marta", "kiko", "lena", "djnoir", "alex", "sara", "pablo", "iris", "teo", "nadia", "bruno", "vera", "omar", "luz", "hugo"];
  var users = Array.from({ length: 60 }, (_, i) => {
    const plan = pick(PLANS);
    const boost = plan === "STUDIO" ? 3 : plan === "PRO" ? 2 : 1;
    return {
      id: `u_${1100 - i}`,
      email: `${NAMES[i % NAMES.length]}${i}@mail.com`,
      plan,
      pais: pick(COUNTRIES),
      alta: `2026-${String(int(6, 10)).padStart(2, "0")}-${String(int(1, 28)).padStart(2, "0")}`,
      sesiones: int(2, 14) * boost,
      minutos_totales: 0,
      temas_procesados: Math.round(int(3, 40) * boost * (0.6 + rnd()))
    };
  });
  var sesiones = [];
  var eventos = [];
  users.forEach((u) => {
    for (let s = 0; s < u.sesiones; s++) {
      const id = `ses_${9e3 + sesiones.length}`;
      const fecha = `2026-11-${String(int(1, 11)).padStart(2, "0")}`;
      const nSec = int(1, 5);
      let total = 0;
      for (let k = 0; k < nSec; k++) {
        const seccion = pick(SECTIONS);
        const segundos = Math.round(int(40, 600) * SECTION_WEIGHT[seccion]);
        total += segundos;
        eventos.push({ sesion_id: id, usuario_id: u.id, seccion, segundos, fecha });
      }
      const duracion_min = Math.round(total / 6) / 10;
      u.minutos_totales += duracion_min;
      sesiones.push({ id, usuario_id: u.id, fecha, duracion_min, secciones: nSec, dispositivo: pick(DEVICES) });
    }
    u.minutos_totales = Math.round(u.minutos_totales);
  });
  var temas = [];
  users.forEach((u) => {
    for (let t = 0; t < Math.min(u.temas_procesados, 12); t++) {
      temas.push({
        id: `t_${5e4 + temas.length}`,
        usuario_id: u.id,
        bpm: int(112, 140),
        tonalidad: pick(KEYS),
        estado: rnd() > 0.92 ? "error" : "completo",
        fecha: `2026-11-${String(int(1, 11)).padStart(2, "0")}`
      });
    }
  });
  var toTable = (rows) => ({ columns: Object.keys(rows[0]), rows });
  var SQL_TABLES = {
    usuarios: toTable(users),
    sesiones: toTable(sesiones),
    eventos_seccion: toTable(eventos),
    temas: toTable(temas)
  };
  var SAVED_QUERIES = [
    { name: "Tiempo medio por secci\xF3n", sql: "SELECT seccion, AVG(segundos) AS media_seg, COUNT(*) AS visitas\nFROM eventos_seccion\nGROUP BY seccion\nORDER BY media_seg DESC" },
    { name: "Top 10 por temas procesados", sql: "SELECT id, email, plan, temas_procesados\nFROM usuarios\nORDER BY temas_procesados DESC\nLIMIT 10" },
    { name: "Usuarios por plan", sql: "SELECT plan, COUNT(*) AS usuarios, AVG(minutos_totales) AS min_medios\nFROM usuarios\nGROUP BY plan" },
    { name: "Sesiones por dispositivo", sql: "SELECT dispositivo, COUNT(*) AS sesiones, AVG(duracion_min) AS duracion_media\nFROM sesiones\nGROUP BY dispositivo\nORDER BY sesiones DESC" },
    { name: "Errores de an\xE1lisis", sql: "SELECT id, usuario_id, bpm, tonalidad, fecha\nFROM temas\nWHERE estado = 'error'\nORDER BY fecha DESC" }
  ];
  var avg = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
  var TIME_BY_SECTION = SECTIONS.map((s) => {
    const ev = eventos.filter((e) => e.seccion === s);
    return { label: s, value: Math.round(avg(ev.map((e) => e.segundos))), visits: ev.length };
  }).sort((a, b) => b.value - a.value);
  var BEHAVIOR_KPIS = {
    avgSessionMin: avg(sesiones.map((s) => s.duracion_min)),
    sessionsPerUser: sesiones.length / users.length,
    tracksPerUser: avg(users.map((u) => u.temas_procesados)),
    sectionsPerSession: avg(sesiones.map((s) => s.secciones))
  };
  var AVG_SESSION_TREND = DAYS.map((_, i) => Math.round((14 + 3 * Math.sin(i / 4) + i * 0.12 + i % 5 * 0.4) * 10) / 10);
  var BUCKETS = [[0, 5], [6, 15], [16, 30], [31, 60], [61, 100], [101, 999]];
  var TRACKS_HISTOGRAM = BUCKETS.map(([a, b]) => ({
    label: b === 999 ? `${a}+` : `${a}\u2013${b}`,
    value: users.filter((u) => u.temas_procesados >= a && u.temas_procesados <= b).length
  }));
  var TOP_PROCESSORS = [...users].sort((a, b) => b.temas_procesados - a.temas_procesados).slice(0, 6);
  var FLOW_SECTIONS = ["Copilot", "Sets", "Map", "Auditar", "Cues", "Academia"];
  var TRANSITIONS = FLOW_SECTIONS.map((from, i) => {
    const raw = FLOW_SECTIONS.map((to, j) => i === j ? 0 : int(2, 30) + (j === (i + 1) % FLOW_SECTIONS.length ? 25 : 0));
    const sum = raw.reduce((a, b) => a + b, 0);
    return { from, values: raw.map((v) => Math.round(v / sum * 100)) };
  });
  var TOP_PATHS = [
    { path: ["Inicio", "Copilot", "Sets"], share: 23.4, conv: 41 },
    { path: ["Inicio", "Biblioteca", "Auditar", "Cues"], share: 17.1, conv: 36 },
    { path: ["Inicio", "Sets", "Map"], share: 12.8, conv: 29 },
    { path: ["Inicio", "Academia", "Copilot"], share: 9.6, conv: 52 },
    { path: ["Inicio", "Copilot", "Cues", "Sets"], share: 7.2, conv: 47 }
  ];
  var COHORTS = [
    { cohort: "Jun 2026", size: 412, values: [100, 61, 48, 41, 37, 34] },
    { cohort: "Jul 2026", size: 538, values: [100, 64, 51, 44, 39] },
    { cohort: "Ago 2026", size: 497, values: [100, 58, 46, 40] },
    { cohort: "Sep 2026", size: 621, values: [100, 66, 54] },
    { cohort: "Oct 2026", size: 744, values: [100, 69] },
    { cohort: "Nov 2026", size: 302, values: [100] }
  ];
  var DEVICE_SPLIT = ["desktop", "tablet", "m\xF3vil"].map((d) => ({ label: d, value: sesiones.filter((s) => s.dispositivo === d).length }));
  var growth = (base, step) => DAYS.map((_, i) => Math.round(base + i * step + Math.sin(i / 2) * step * 3));
  var SOCIAL_ACCOUNTS = [
    { id: "ig", name: "Instagram", handle: "@beatwave.app", followers: 18420, growth: 4.2, engagement: 5.1, connected: true, series: growth(17200, 40), limit: 2200 },
    { id: "tt", name: "TikTok", handle: "@beatwave", followers: 32950, growth: 9.8, engagement: 8.4, connected: true, series: growth(3e4, 98), limit: 2200 },
    { id: "yt", name: "YouTube", handle: "BEATWAVE Academy", followers: 6120, growth: 2.7, engagement: 3.9, connected: true, series: growth(5960, 6), limit: 5e3 },
    { id: "x", name: "X", handle: "@beatwaveapp", followers: 4210, growth: -0.6, engagement: 1.2, connected: true, series: growth(4240, -1), limit: 280 },
    { id: "sc", name: "SoundCloud", handle: "beatwave-mixes", followers: 2890, growth: 1.9, engagement: 2.6, connected: false, series: growth(2830, 2), limit: 500 },
    { id: "th", name: "Threads", handle: "@beatwave.app", followers: 1540, growth: 6.3, engagement: 4.4, connected: false, series: growth(1450, 3), limit: 500 }
  ];
  var SCHEDULED_POSTS = [
    { id: "p1", when: "2026-11-13 18:00", networks: ["ig", "tt"], text: "C\xF3mo construir un set peak-time en 5 pasos con Copilot", status: "programado" },
    { id: "p2", when: "2026-11-14 12:30", networks: ["yt"], text: "Clase gratis: armon\xEDa Camelot para principiantes", status: "programado" },
    { id: "p3", when: "2026-11-15 20:00", networks: ["x", "th"], text: "Black Friday: STUDIO -40% solo 72h", status: "borrador" }
  ];
  var CONTENT_LIBRARY = [
    { id: "c1", type: "Blog", title: "10 errores al mezclar en clave (y c\xF3mo evitarlos)", status: "publicado", author: "Carlos R.", date: "2026-11-08", views: 4820 },
    { id: "c2", type: "Academia", title: "M\xF3dulo 3 \xB7 Transiciones por energ\xEDa", status: "publicado", author: "Equipo edu", date: "2026-11-05", views: 2310 },
    { id: "c3", type: "Redes", title: "Reel: auditor\xEDa de un set en 30 s", status: "programado", author: "Luc\xEDa M.", date: "2026-11-13", views: 0 },
    { id: "c4", type: "Blog", title: "Gu\xEDa de BPM por g\xE9nero 2026", status: "borrador", author: "Carlos R.", date: "2026-11-10", views: 0 },
    { id: "c5", type: "Academia", title: "Lecci\xF3n \xB7 Cue points para warm-up", status: "revisi\xF3n", author: "Equipo edu", date: "2026-11-11", views: 0 }
  ];
  var ACADEMY_MODULES = ["Fundamentos de mezcla", "Armon\xEDa y Camelot", "Estructura de sets", "Uso del Copilot", "Cues y preparaci\xF3n", "Producci\xF3n para DJs"];

  // web/js/admin/sql.js
  var AGG = /^(count|sum|avg|min|max)\s*\(\s*(\*|[\w.]+)\s*\)$/i;
  var WRITE = /^\s*(insert|update|delete|drop|alter|create|truncate|grant|revoke)\b/i;
  var MAX_ROWS = 500;
  function splitTop(s) {
    const out = [];
    let depth = 0, cur = "";
    for (const ch of s) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function resolver(columns) {
    const map = Object.fromEntries(columns.map((c) => [c.toLowerCase(), c]));
    return (name) => {
      const key = name.toLowerCase().split(".").pop();
      if (!map[key]) throw new Error(`Columna desconocida: ${name}`);
      return map[key];
    };
  }
  function parseValue(raw) {
    const v = raw.trim();
    if (/^'.*'$/.test(v)) return v.slice(1, -1).replace(/''/g, "'");
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    throw new Error(`Valor no v\xE1lido: ${v} (usa comillas simples para texto)`);
  }
  function parseWhere(str, col) {
    return str.split(/\s+or\s+/i).map((group) => group.split(/\s+and\s+/i).map((atom) => {
      const m = atom.trim().match(/^([\w.]+)\s*(not\s+like|like|>=|<=|!=|<>|=|>|<)\s*(.+)$/i);
      if (!m) throw new Error(`Condici\xF3n no v\xE1lida: ${atom.trim()}`);
      return { col: col(m[1]), op: m[2].toLowerCase().replace(/\s+/g, " "), value: parseValue(m[3]) };
    }));
  }
  function test(row, { col, op, value }) {
    const a = row[col];
    if (op === "like" || op === "not like") {
      const re = new RegExp(`^${String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".")}$`, "i");
      return op === "like" ? re.test(String(a)) : !re.test(String(a));
    }
    const [x, y] = typeof value === "number" ? [Number(a), value] : [String(a), value];
    switch (op) {
      case "=":
        return x === y;
      case "!=":
      case "<>":
        return x !== y;
      case ">":
        return x > y;
      case "<":
        return x < y;
      case ">=":
        return x >= y;
      case "<=":
        return x <= y;
      default:
        return false;
    }
  }
  function aggregate(fn, field, rows) {
    if (fn === "count") return field === "*" ? rows.length : rows.filter((r) => r[field] != null).length;
    const vals = rows.map((r) => Number(r[field])).filter((n) => !Number.isNaN(n));
    if (!vals.length) return null;
    if (fn === "sum") return round(vals.reduce((a, b) => a + b, 0));
    if (fn === "avg") return round(vals.reduce((a, b) => a + b, 0) / vals.length);
    if (fn === "min") return Math.min(...vals);
    return Math.max(...vals);
  }
  var round = (n) => Math.round(n * 100) / 100;
  var cmp = (a, b) => typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), "es");
  function runSql(query, tables) {
    const started = performance.now();
    const q = query.replace(/--.*$/gm, "").replace(/\s+/g, " ").trim().replace(/;$/, "");
    if (!q) throw new Error("Escribe una consulta.");
    if (WRITE.test(q)) throw new Error("Modo solo lectura: las sentencias de escritura est\xE1n bloqueadas en la consola.");
    const m = q.match(/^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(.+?))?(?:\s+group\s+by\s+(.+?))?(?:\s+order\s+by\s+(.+?))?(?:\s+limit\s+(\d+))?$/i);
    if (!m) throw new Error("Sintaxis no soportada. Usa SELECT \u2026 FROM \u2026 [WHERE] [GROUP BY] [ORDER BY] [LIMIT].");
    const [, selStr, tableName, whereStr, groupStr, orderStr, limitStr] = m;
    const table = tables[tableName.toLowerCase()];
    if (!table) throw new Error(`Tabla desconocida: ${tableName}. Disponibles: ${Object.keys(tables).join(", ")}`);
    const col = resolver(table.columns);
    let rows = table.rows;
    if (whereStr) {
      const groups = parseWhere(whereStr, col);
      rows = rows.filter((r) => groups.some((g) => g.every((c) => test(r, c))));
    }
    const sel = splitTop(selStr).map((item) => {
      const am = item.match(/^(.+?)\s+as\s+(\w+)$/i);
      const expr = (am ? am[1] : item).trim();
      const agg = expr.match(AGG);
      if (expr === "*") return { star: true };
      if (agg) return { agg: agg[1].toLowerCase(), field: agg[2] === "*" ? "*" : col(agg[2]), label: am ? am[2] : expr.toLowerCase() };
      const c = col(expr);
      return { field: c, label: am ? am[2] : c };
    });
    const groupCols = groupStr ? splitTop(groupStr).map(col) : [];
    const isAgg = groupCols.length > 0 || sel.some((s) => s.agg);
    let columns, out;
    if (isAgg) {
      if (sel.some((s) => s.star)) throw new Error("No se puede usar * junto a GROUP BY o agregados.");
      sel.forEach((s) => {
        if (!s.agg && !groupCols.includes(s.field)) throw new Error(`La columna ${s.field} debe aparecer en GROUP BY o en un agregado.`);
      });
      const groups = /* @__PURE__ */ new Map();
      rows.forEach((r) => {
        const key = groupCols.map((g) => r[g]).join("\0");
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(r);
      });
      if (!groupCols.length && !groups.size) groups.set("", []);
      columns = sel.map((s) => s.label);
      out = [...groups.values()].map((g) => sel.map((s) => s.agg ? aggregate(s.agg, s.field, g) : g[0][s.field]));
    } else {
      columns = sel.flatMap((s) => s.star ? table.columns : [s.label]);
      out = rows.map((r) => sel.flatMap((s) => s.star ? table.columns.map((c) => r[c]) : [r[s.field]]));
    }
    if (orderStr) {
      const keys = splitTop(orderStr).map((k) => {
        const km = k.match(/^(.+?)(?:\s+(asc|desc))?$/i);
        const name = km[1].trim().toLowerCase();
        const idx = columns.findIndex((c) => c.toLowerCase() === name);
        if (idx < 0) throw new Error(`ORDER BY debe usar una columna del resultado: ${km[1].trim()}`);
        return { idx, dir: km[2] && km[2].toLowerCase() === "desc" ? -1 : 1 };
      });
      out = [...out].sort((a, b) => {
        for (const k of keys) {
          const d = cmp(a[k.idx], b[k.idx]) * k.dir;
          if (d) return d;
        }
        return 0;
      });
    }
    const total = out.length;
    out = out.slice(0, Math.min(limitStr ? Number(limitStr) : MAX_ROWS, MAX_ROWS));
    return { columns, rows: out, total, ms: Math.max(1, Math.round(performance.now() - started)) };
  }
  function toCsv(columns, rows) {
    const esc = (v) => v == null ? "" : /[",\n;]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
    return [columns, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  }

  // web/js/admin/sections-data.jsx
  var { useState: useState5, useMemo: useMemo2 } = React;
  var mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  function QueryConsole({ toast }) {
    const [sql, setSql] = useState5(SAVED_QUERIES[0].sql);
    const [result, setResult] = useState5(() => runSql(SAVED_QUERIES[0].sql, SQL_TABLES));
    const [error, setError] = useState5(null);
    const [view, setView] = useState5("Tabla");
    const [history, setHistory] = useState5([]);
    const [saved, setSaved] = useState5(SAVED_QUERIES);
    const run = (q = sql) => {
      try {
        const r = runSql(q, SQL_TABLES);
        setResult(r);
        setError(null);
        setHistory((h) => [{ sql: q, rows: r.total, ms: r.ms, at: (/* @__PURE__ */ new Date()).toLocaleTimeString("es-ES") }, ...h].slice(0, 8));
      } catch (e) {
        setError(e.message);
        setResult(null);
      }
    };
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        run();
      }
    };
    const load = (q) => {
      setSql(q);
      run(q);
    };
    const insert = (text) => setSql((s) => `${s}${/\s$/.test(s) || !s ? "" : " "}${text}`);
    const exportCsv = () => {
      if (!result) return;
      const blob = new Blob([toCsv(result.columns, result.rows)], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "consulta-beatwave.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    };
    const saveQuery = () => {
      const name = window.prompt("Nombre de la consulta");
      if (!name) return;
      setSaved((s) => [{ name, sql }, ...s]);
      toast("Consulta guardada");
    };
    const chartable = result && result.columns.length >= 2 && result.rows.length > 0 && result.rows.every((r) => typeof r[r.length - 1] === "number");
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Datos", title: "Consultas SQL", desc: "Lanza consultas de solo lectura contra la base de datos. Ctrl/\u2318 + Enter para ejecutar. Las sentencias de escritura est\xE1n bloqueadas." }, /* @__PURE__ */ React.createElement(Button, { icon: "download", onClick: exportCsv, disabled: !result }, "Exportar CSV"), /* @__PURE__ */ React.createElement(Button, { icon: "plus", onClick: saveQuery }, "Guardar consulta")), /* @__PURE__ */ React.createElement("div", { className: "grid q-layout" }, /* @__PURE__ */ React.createElement("aside", { className: "stack" }, /* @__PURE__ */ React.createElement(Card, { title: "Esquema", bodyClass: "schema" }, Object.entries(SQL_TABLES).map(([name, t]) => /* @__PURE__ */ React.createElement("details", { key: name, className: "schema-table", open: name === "eventos_seccion" }, /* @__PURE__ */ React.createElement("summary", null, /* @__PURE__ */ React.createElement(Icon, { name: "db", size: 14 }), /* @__PURE__ */ React.createElement("span", { className: "mono" }, name), /* @__PURE__ */ React.createElement("span", { className: "faint mono schema-count" }, num(t.rows.length))), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("button", { type: "button", className: "schema-col", onClick: () => insert(name) }, "insertar tabla")), t.columns.map((c) => /* @__PURE__ */ React.createElement("li", { key: c }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "schema-col mono", onClick: () => insert(c) }, c, /* @__PURE__ */ React.createElement("span", { className: "faint" }, typeof t.rows[0][c] === "number" ? "num" : "text")))))))), /* @__PURE__ */ React.createElement(Card, { title: "Consultas guardadas", bodyClass: "list" }, saved.map((q) => /* @__PURE__ */ React.createElement("button", { key: q.name, type: "button", className: "list-item saved-q", onClick: () => load(q.sql) }, /* @__PURE__ */ React.createElement(Icon, { name: "play", size: 12 }), /* @__PURE__ */ React.createElement("span", null, q.name))))), /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("section", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h2", { className: "card-title" }, "Editor"), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement(Badge, { tone: "on" }, "read-only"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "sm", icon: "play", onClick: () => run() }, "Ejecutar"))), /* @__PURE__ */ React.createElement("label", { htmlFor: "sql-editor", className: "sr-only" }, "Consulta SQL"), /* @__PURE__ */ React.createElement("textarea", { id: "sql-editor", className: "sql-editor", spellCheck: "false", value: sql, onChange: (e) => setSql(e.target.value), onKeyDown, rows: 7 })), /* @__PURE__ */ React.createElement("section", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h2", { className: "card-title" }, "Resultado", result && /* @__PURE__ */ React.createElement("span", { className: "faint mono q-meta" }, num(result.total), " filas \xB7 ", result.ms, " ms", result.total > result.rows.length ? ` \xB7 mostrando ${result.rows.length}` : "")), chartable && /* @__PURE__ */ React.createElement(Chips, { label: "Vista del resultado", options: ["Tabla", "Gr\xE1fica"], value: view, onChange: setView })), error && /* @__PURE__ */ React.createElement("p", { className: "q-error", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "x", size: 14 }), error), result && (view === "Gr\xE1fica" && chartable ? /* @__PURE__ */ React.createElement("div", { className: "card-body" }, /* @__PURE__ */ React.createElement(Bars, { items: result.rows.slice(0, 15).map((r) => ({ label: String(r[0]), value: r[r.length - 1] })), format: (v) => num(v) })) : /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap q-results" }, /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, result.columns.map((c) => /* @__PURE__ */ React.createElement("th", { key: c, scope: "col" }, c)))), /* @__PURE__ */ React.createElement("tbody", null, result.rows.map((r, i) => /* @__PURE__ */ React.createElement("tr", { key: i }, r.map((v, j) => /* @__PURE__ */ React.createElement("td", { key: j, className: typeof v === "number" ? "num mono" : "mono" }, v == null ? /* @__PURE__ */ React.createElement("span", { className: "faint" }, "NULL") : typeof v === "number" ? num(v) : v)))))), !result.rows.length && /* @__PURE__ */ React.createElement("p", { className: "empty" }, "La consulta no devolvi\xF3 filas.")))), history.length > 0 && /* @__PURE__ */ React.createElement(Card, { title: "Historial de esta sesi\xF3n", bodyClass: "list" }, history.map((h, i) => /* @__PURE__ */ React.createElement("button", { key: i, type: "button", className: "list-item saved-q", onClick: () => load(h.sql) }, /* @__PURE__ */ React.createElement("span", { className: "mono faint" }, h.at), /* @__PURE__ */ React.createElement("span", { className: "mono q-hist" }, h.sql.replace(/\s+/g, " ")), /* @__PURE__ */ React.createElement("span", { className: "mono faint" }, h.rows, " f \xB7 ", h.ms, " ms")))))));
  }
  function VBars({ items, label }) {
    const max = Math.max(...items.map((i) => i.value));
    return /* @__PURE__ */ React.createElement("div", { className: "vbars", role: "img", "aria-label": label }, items.map((it) => /* @__PURE__ */ React.createElement("div", { key: it.label, className: "vbar" }, /* @__PURE__ */ React.createElement("span", { className: "mono vbar-val" }, it.value), /* @__PURE__ */ React.createElement("div", { className: "vbar-track" }, /* @__PURE__ */ React.createElement("div", { className: "vbar-fill", style: { height: `${it.value / max * 100}%` } })), /* @__PURE__ */ React.createElement("span", { className: "mono faint vbar-label" }, it.label))));
  }
  var heat = (v, max = 100) => ({ background: `rgba(34, 211, 238, ${(0.06 + v / max * 0.8).toFixed(2)})`, color: v / max > 0.55 ? "var(--bw-cyan-ink)" : "var(--bw-white)" });
  function TransitionMatrix() {
    const max = Math.max(...TRANSITIONS.flatMap((t) => t.values));
    return /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "heat" }, /* @__PURE__ */ React.createElement("caption", { className: "sr-only" }, "Porcentaje de usuarios que pasan de una secci\xF3n (fila) a otra (columna)"), /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { scope: "col" }, /* @__PURE__ */ React.createElement("span", { className: "faint" }, "desde \u2193 / hacia \u2192")), FLOW_SECTIONS.map((s) => /* @__PURE__ */ React.createElement("th", { key: s, scope: "col" }, s)))), /* @__PURE__ */ React.createElement("tbody", null, TRANSITIONS.map((t) => /* @__PURE__ */ React.createElement("tr", { key: t.from }, /* @__PURE__ */ React.createElement("th", { scope: "row" }, t.from), t.values.map((v, j) => /* @__PURE__ */ React.createElement("td", { key: j, style: v ? heat(v, max) : void 0, className: "mono" }, v ? `${v}%` : "\u2014")))))));
  }
  function Cohorts() {
    return /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "heat" }, /* @__PURE__ */ React.createElement("caption", { className: "sr-only" }, "Retenci\xF3n mensual por cohorte de alta"), /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { scope: "col" }, "Cohorte"), /* @__PURE__ */ React.createElement("th", { scope: "col" }, "Usuarios"), [0, 1, 2, 3, 4, 5].map((m) => /* @__PURE__ */ React.createElement("th", { key: m, scope: "col" }, "M", m)))), /* @__PURE__ */ React.createElement("tbody", null, COHORTS.map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.cohort }, /* @__PURE__ */ React.createElement("th", { scope: "row" }, c.cohort), /* @__PURE__ */ React.createElement("td", { className: "mono muted" }, num(c.size)), [0, 1, 2, 3, 4, 5].map((m) => c.values[m] != null ? /* @__PURE__ */ React.createElement("td", { key: m, className: "mono", style: heat(c.values[m]) }, c.values[m], "%") : /* @__PURE__ */ React.createElement("td", { key: m, className: "heat-empty" })))))));
  }
  function Behavior({ go }) {
    const [range, setRange] = useState5("30 d\xEDas");
    const k = BEHAVIOR_KPIS;
    const totalSec = useMemo2(() => TIME_BY_SECTION.reduce((a, b) => a + b.value * b.visits, 0), []);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Insights", title: "Comportamiento de usuarios", desc: "Tiempo de uso, navegaci\xF3n entre secciones, retenci\xF3n y volumen de temas procesados por usuario." }, /* @__PURE__ */ React.createElement(Chips, { label: "Rango", options: ["7 d\xEDas", "30 d\xEDas", "90 d\xEDas"], value: range, onChange: setRange }), /* @__PURE__ */ React.createElement(Button, { icon: "terminal", onClick: () => go("query") }, "Abrir en SQL")), /* @__PURE__ */ React.createElement("div", { className: "grid g-4" }, /* @__PURE__ */ React.createElement(Stat, { label: "Tiempo medio por sesi\xF3n", value: `${k.avgSessionMin.toFixed(1)} min`, delta: "6,2%" }), /* @__PURE__ */ React.createElement(Stat, { label: "Sesiones por usuario", value: k.sessionsPerUser.toFixed(1), delta: "3,1%" }), /* @__PURE__ */ React.createElement(Stat, { label: "Temas procesados / usuario", value: k.tracksPerUser.toFixed(1), delta: "11,4%" }), /* @__PURE__ */ React.createElement(Stat, { label: "Secciones por sesi\xF3n", value: k.sectionsPerSession.toFixed(1), delta: "-1,8%" })), /* @__PURE__ */ React.createElement("div", { className: "grid g-main" }, /* @__PURE__ */ React.createElement(Card, { title: "Duraci\xF3n media de sesi\xF3n (min)", action: /* @__PURE__ */ React.createElement("span", { className: "faint mono" }, range) }, /* @__PURE__ */ React.createElement(LineChart, { data: AVG_SESSION_TREND, labels: DAYS })), /* @__PURE__ */ React.createElement(Card, { title: "Sesiones por dispositivo" }, /* @__PURE__ */ React.createElement(Bars, { items: DEVICE_SPLIT, format: num }))), /* @__PURE__ */ React.createElement("div", { className: "grid g-2" }, /* @__PURE__ */ React.createElement(Card, { title: "Tiempo medio por secci\xF3n (mm:ss)" }, /* @__PURE__ */ React.createElement(Bars, { items: TIME_BY_SECTION, format: mmss })), /* @__PURE__ */ React.createElement(Card, { title: "Reparto del tiempo total", bodyClass: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { scope: "col" }, "Secci\xF3n"), /* @__PURE__ */ React.createElement("th", { scope: "col", className: "num" }, "Visitas"), /* @__PURE__ */ React.createElement("th", { scope: "col", className: "num" }, "Media"), /* @__PURE__ */ React.createElement("th", { scope: "col", className: "num" }, "% tiempo"))), /* @__PURE__ */ React.createElement("tbody", null, TIME_BY_SECTION.map((s) => /* @__PURE__ */ React.createElement("tr", { key: s.label }, /* @__PURE__ */ React.createElement("td", null, s.label), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, num(s.visits)), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, mmss(s.value)), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, (s.value * s.visits * 100 / totalSec).toFixed(1), "%"))))))), /* @__PURE__ */ React.createElement(Card, { title: "Navegaci\xF3n entre secciones", action: /* @__PURE__ */ React.createElement("span", { className: "faint" }, "% de salidas desde cada secci\xF3n") }, /* @__PURE__ */ React.createElement(TransitionMatrix, null)), /* @__PURE__ */ React.createElement("div", { className: "grid g-main" }, /* @__PURE__ */ React.createElement(Card, { title: "Recorridos m\xE1s frecuentes", bodyClass: "list" }, TOP_PATHS.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.path.join(), className: "list-item path-row" }, /* @__PURE__ */ React.createElement("div", { className: "path" }, p.path.map((step, i) => /* @__PURE__ */ React.createElement(React.Fragment, { key: step + i }, i > 0 && /* @__PURE__ */ React.createElement("span", { className: "faint", "aria-hidden": "true" }, "\u2192"), /* @__PURE__ */ React.createElement("span", { className: "code-tag" }, step)))), /* @__PURE__ */ React.createElement("span", { className: "mono muted" }, p.share, "% sesiones"), /* @__PURE__ */ React.createElement("span", { className: "mono cyan" }, p.conv, "% conv.")))), /* @__PURE__ */ React.createElement(Card, { title: "Temas procesados por usuario" }, /* @__PURE__ */ React.createElement(VBars, { items: TRACKS_HISTOGRAM, label: "Distribuci\xF3n de usuarios por n\xFAmero de temas procesados" }), /* @__PURE__ */ React.createElement("p", { className: "faint vbars-cap" }, "N\xBA de usuarios por tramo de temas procesados"))), /* @__PURE__ */ React.createElement("div", { className: "grid g-main" }, /* @__PURE__ */ React.createElement(Card, { title: "Retenci\xF3n por cohorte" }, /* @__PURE__ */ React.createElement(Cohorts, null)), /* @__PURE__ */ React.createElement(Card, { title: "Usuarios con m\xE1s temas", bodyClass: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { scope: "col" }, "Usuario"), /* @__PURE__ */ React.createElement("th", { scope: "col" }, "Plan"), /* @__PURE__ */ React.createElement("th", { scope: "col", className: "num" }, "Temas"), /* @__PURE__ */ React.createElement("th", { scope: "col", className: "num" }, "Min"))), /* @__PURE__ */ React.createElement("tbody", null, TOP_PROCESSORS.map((u) => /* @__PURE__ */ React.createElement("tr", { key: u.id }, /* @__PURE__ */ React.createElement("td", { className: "mono" }, u.email), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Badge, { tone: u.plan === "FREE" ? "off" : "on", plain: true }, u.plan)), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, u.temas_procesados), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, num(u.minutos_totales)))))))));
  }

  // web/js/admin/sections-content.jsx
  var { useState: useState6 } = React;
  var statusTone = { publicado: "on", programado: "on", borrador: "off", revisi\u00F3n: "off", error: "err" };
  var netName = (id) => {
    var _a;
    return ((_a = SOCIAL_ACCOUNTS.find((a) => a.id === id)) == null ? void 0 : _a.name) || id;
  };
  var initials = (name) => name.slice(0, 2).toUpperCase();
  function Social({ go, toast }) {
    const [accounts, setAccounts] = useState6(SOCIAL_ACCOUNTS);
    const [selected, setSelected] = useState6("tt");
    const [posts, setPosts] = useState6(SCHEDULED_POSTS);
    const current = accounts.find((a) => a.id === selected);
    const connected = accounts.filter((a) => a.connected);
    const totalFollowers = connected.reduce((s, a) => s + a.followers, 0);
    const avgEng = connected.reduce((s, a) => s + a.engagement, 0) / (connected.length || 1);
    const toggleConn = (id) => {
      setAccounts((list) => list.map((a) => a.id === id ? { ...a, connected: !a.connected } : a));
      const acc = accounts.find((a) => a.id === id);
      toast(acc.connected ? `${acc.name} desconectada` : `${acc.name} conectada`);
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Contenido", title: "Redes sociales", desc: "Cuentas conectadas, crecimiento de audiencia y publicaciones programadas." }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "pen", onClick: () => go("content") }, "Crear publicaci\xF3n")), /* @__PURE__ */ React.createElement("div", { className: "grid g-4" }, /* @__PURE__ */ React.createElement(Stat, { label: "Seguidores totales", value: num(totalFollowers), delta: "5,9%" }), /* @__PURE__ */ React.createElement(Stat, { label: "Engagement medio", value: `${avgEng.toFixed(1)}%`, delta: "0,8%" }), /* @__PURE__ */ React.createElement(Stat, { label: "Cuentas conectadas", value: `${connected.length}/${accounts.length}` }), /* @__PURE__ */ React.createElement(Stat, { label: "Publicaciones programadas", value: posts.filter((p) => p.status === "programado").length })), /* @__PURE__ */ React.createElement("div", { className: "grid g-3" }, accounts.map((a) => /* @__PURE__ */ React.createElement("section", { key: a.id, className: `card social-card ${selected === a.id ? "is-selected" : ""}` }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "social-main", onClick: () => setSelected(a.id), "aria-pressed": selected === a.id }, /* @__PURE__ */ React.createElement("div", { className: "ico-box mono" }, initials(a.name)), /* @__PURE__ */ React.createElement("div", { className: "social-id" }, /* @__PURE__ */ React.createElement("span", { className: "social-name" }, a.name), /* @__PURE__ */ React.createElement("span", { className: "faint mono" }, a.handle)), /* @__PURE__ */ React.createElement(Badge, { tone: a.connected ? "on" : "off" }, a.connected ? "Conectada" : "Sin conectar")), /* @__PURE__ */ React.createElement("div", { className: "social-metrics" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "faint" }, "Seguidores"), /* @__PURE__ */ React.createElement("span", { className: "mono" }, num(a.followers))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "faint" }, "30 d\xEDas"), /* @__PURE__ */ React.createElement("span", { className: `mono ${a.growth >= 0 ? "up" : "down"}` }, a.growth >= 0 ? "+" : "", a.growth, "%")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "faint" }, "Engagement"), /* @__PURE__ */ React.createElement("span", { className: "mono" }, a.engagement, "%"))), /* @__PURE__ */ React.createElement("div", { className: "social-foot" }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: a.connected ? "ghost" : "", onClick: () => toggleConn(a.id) }, a.connected ? "Desconectar" : "Conectar cuenta"))))), /* @__PURE__ */ React.createElement("div", { className: "grid g-main" }, /* @__PURE__ */ React.createElement(Card, { title: `Crecimiento de seguidores \xB7 ${current.name}`, action: /* @__PURE__ */ React.createElement("span", { className: "faint mono" }, "30 d\xEDas") }, /* @__PURE__ */ React.createElement(LineChart, { data: current.series, labels: DAYS })), /* @__PURE__ */ React.createElement(Card, { title: "Cola de publicaci\xF3n", bodyClass: "list" }, posts.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, className: "list-item post-row" }, /* @__PURE__ */ React.createElement("div", { className: "stack-tight" }, /* @__PURE__ */ React.createElement("span", null, p.text), /* @__PURE__ */ React.createElement("span", { className: "faint mono" }, p.when, " \xB7 ", p.networks.map(netName).join(", "))), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement(Badge, { tone: statusTone[p.status] }, p.status), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "ghost", icon: "trash", "aria-label": `Eliminar publicaci\xF3n: ${p.text}`, onClick: () => {
      setPosts((l) => l.filter((x) => x.id !== p.id));
      toast("Publicaci\xF3n eliminada");
    } })))), !posts.length && /* @__PURE__ */ React.createElement("p", { className: "empty" }, "No hay publicaciones en cola."))));
  }
  var HASHTAGS = ["#DJ", "#DJLife", "#Techno", "#HouseMusic", "#Camelot", "#BEATWAVE", "#MixingTips"];
  function SocialComposer({ onCreate }) {
    const connected = SOCIAL_ACCOUNTS.filter((a) => a.connected);
    const [nets, setNets] = useState6(["ig", "tt"]);
    const [text, setText] = useState6("");
    const [when, setWhen] = useState6("2026-11-14T18:00");
    const limit = Math.min(...nets.map((n) => SOCIAL_ACCOUNTS.find((a) => a.id === n).limit), 5e3);
    const over = text.length > limit;
    const toggleNet = (id) => setNets((l) => l.includes(id) ? l.filter((x) => x !== id) : [...l, id]);
    const submit = (status) => {
      if (!text.trim() || !nets.length || over) return;
      onCreate({ type: "Redes", title: text.slice(0, 70), status, date: when.slice(0, 10) }, status === "programado" ? `Programado en ${nets.map(netName).join(", ")}` : "Borrador guardado");
      setText("");
    };
    return /* @__PURE__ */ React.createElement("div", { className: "grid g-main" }, /* @__PURE__ */ React.createElement(Card, { title: "Nueva publicaci\xF3n" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "field-label", id: "nets-label" }, "Redes"), /* @__PURE__ */ React.createElement("div", { className: "chips", role: "group", "aria-labelledby": "nets-label" }, connected.map((a) => /* @__PURE__ */ React.createElement("button", { key: a.id, type: "button", className: "chip", "aria-pressed": nets.includes(a.id), onClick: () => toggleNet(a.id) }, a.name)))), /* @__PURE__ */ React.createElement(Field, { label: "Texto", id: "sc-text" }, /* @__PURE__ */ React.createElement("textarea", { id: "sc-text", className: "textarea", rows: 6, value: text, onChange: (e) => setText(e.target.value), placeholder: "Escribe el copy de la publicaci\xF3n\u2026" })), /* @__PURE__ */ React.createElement("div", { className: "row between wrap" }, /* @__PURE__ */ React.createElement("div", { className: "chips", role: "group", "aria-label": "A\xF1adir hashtag" }, HASHTAGS.map((h) => /* @__PURE__ */ React.createElement("button", { key: h, type: "button", className: "chip", onClick: () => setText((t) => `${t}${t && !/\s$/.test(t) ? " " : ""}${h}`) }, h))), /* @__PURE__ */ React.createElement("span", { className: `mono ${over ? "danger" : "faint"}` }, text.length, "/", limit)), /* @__PURE__ */ React.createElement(Field, { label: "Programar para", id: "sc-when" }, /* @__PURE__ */ React.createElement("input", { id: "sc-when", type: "datetime-local", className: "input", value: when, onChange: (e) => setWhen(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "send", onClick: () => submit("programado"), disabled: !text.trim() || !nets.length || over }, "Programar"), /* @__PURE__ */ React.createElement(Button, { onClick: () => submit("borrador"), disabled: !text.trim() }, "Guardar borrador")))), /* @__PURE__ */ React.createElement(Card, { title: "Vista previa" }, /* @__PURE__ */ React.createElement("div", { className: "post-preview" }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("div", { className: "adm-brand-mark" }, "BW"), /* @__PURE__ */ React.createElement("div", { className: "stack-tight" }, /* @__PURE__ */ React.createElement("span", { className: "social-name" }, "beatwave.app"), /* @__PURE__ */ React.createElement("span", { className: "faint" }, nets.map(netName).join(" \xB7 ") || "Selecciona una red"))), /* @__PURE__ */ React.createElement("p", { className: "post-text" }, text || /* @__PURE__ */ React.createElement("span", { className: "faint" }, "El texto aparecer\xE1 aqu\xED.")), /* @__PURE__ */ React.createElement("span", { className: "faint mono" }, when.replace("T", " ")))));
  }
  var slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  function BlogEditor({ onCreate }) {
    const [f, setF] = useState6({ title: "", excerpt: "", body: "", category: "T\xE9cnica", tags: "" });
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
    const words = f.body.trim() ? f.body.trim().split(/\s+/).length : 0;
    const slug = slugify(f.title) || "nuevo-articulo";
    const submit = (status) => {
      if (!f.title.trim()) return;
      onCreate({ type: "Blog", title: f.title, status, date: "2026-11-12" }, status === "publicado" ? "Art\xEDculo publicado en el blog" : "Borrador guardado");
      setF({ title: "", excerpt: "", body: "", category: "T\xE9cnica", tags: "" });
    };
    return /* @__PURE__ */ React.createElement("div", { className: "grid g-main" }, /* @__PURE__ */ React.createElement(Card, { title: "Nuevo art\xEDculo" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement(Field, { label: "T\xEDtulo", id: "bl-title" }, /* @__PURE__ */ React.createElement("input", { id: "bl-title", className: "input", value: f.title, onChange: set("title"), placeholder: "Ej. C\xF3mo preparar un set de 2 horas" })), /* @__PURE__ */ React.createElement("div", { className: "grid g-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Categor\xEDa", id: "bl-cat" }, /* @__PURE__ */ React.createElement("select", { id: "bl-cat", className: "select", value: f.category, onChange: set("category") }, ["T\xE9cnica", "Armon\xEDa", "Producto", "Entrevistas", "Novedades"].map((c) => /* @__PURE__ */ React.createElement("option", { key: c }, c)))), /* @__PURE__ */ React.createElement(Field, { label: "Etiquetas", id: "bl-tags" }, /* @__PURE__ */ React.createElement("input", { id: "bl-tags", className: "input", value: f.tags, onChange: set("tags"), placeholder: "techno, bpm, mezcla" }))), /* @__PURE__ */ React.createElement(Field, { label: "Extracto / meta descripci\xF3n", id: "bl-ex" }, /* @__PURE__ */ React.createElement("textarea", { id: "bl-ex", className: "textarea", rows: 2, value: f.excerpt, onChange: set("excerpt") })), /* @__PURE__ */ React.createElement("span", { className: `mono ${f.excerpt.length > 160 ? "danger" : "faint"}` }, f.excerpt.length, "/160 caracteres"), /* @__PURE__ */ React.createElement(Field, { label: "Contenido (Markdown)", id: "bl-body" }, /* @__PURE__ */ React.createElement("textarea", { id: "bl-body", className: "textarea mono", rows: 10, value: f.body, onChange: set("body"), placeholder: "## Introducci\xF3n\n\nEscribe aqu\xED\u2026" })), /* @__PURE__ */ React.createElement("div", { className: "row between wrap" }, /* @__PURE__ */ React.createElement("span", { className: "faint mono" }, words, " palabras \xB7 ", Math.max(1, Math.round(words / 220)), " min de lectura"), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement(Button, { onClick: () => submit("borrador"), disabled: !f.title.trim() }, "Guardar borrador"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "send", onClick: () => submit("publicado"), disabled: !f.title.trim() }, "Publicar"))))), /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement(Card, { title: "Vista previa en Google" }, /* @__PURE__ */ React.createElement("div", { className: "serp", "aria-label": "Vista previa en Google" }, /* @__PURE__ */ React.createElement("div", { className: "serp-url" }, "beatwave.pro \u203A blog \u203A ", slug), /* @__PURE__ */ React.createElement("div", { className: "serp-title" }, f.title || "T\xEDtulo del art\xEDculo", " \u2014 BEATWAVE"), /* @__PURE__ */ React.createElement("p", { className: "serp-desc" }, f.excerpt || "A\xF1ade un extracto para controlar c\xF3mo aparece el art\xEDculo en buscadores."))), /* @__PURE__ */ React.createElement(Card, { title: "Checklist SEO", bodyClass: "list" }, [
      ["T\xEDtulo entre 30 y 60 caracteres", f.title.length >= 30 && f.title.length <= 60],
      ["Meta descripci\xF3n de 70\u2013160", f.excerpt.length >= 70 && f.excerpt.length <= 160],
      ["M\xE1s de 600 palabras", words > 600],
      ["Incluye subt\xEDtulos (##)", /^##\s/m.test(f.body)],
      ["Al menos una etiqueta", f.tags.trim().length > 0]
    ].map(([label, ok]) => /* @__PURE__ */ React.createElement("div", { key: label, className: "list-item" }, /* @__PURE__ */ React.createElement(Badge, { tone: ok ? "on" : "off" }, ok ? "OK" : "Pendiente"), /* @__PURE__ */ React.createElement("span", { className: ok ? "" : "muted" }, label))))));
  }
  var BLOCK_TYPES = ["Texto", "V\xEDdeo", "Ejercicio", "Quiz"];
  function LessonBuilder({ onCreate }) {
    const [f, setF] = useState6({ module: ACADEMY_MODULES[0], title: "", level: "Inicial", minutes: 12, audience: "Todos" });
    const [blocks, setBlocks] = useState6([{ id: 1, type: "Texto", content: "" }, { id: 2, type: "V\xEDdeo", content: "" }]);
    const [featured, setFeatured] = useState6(false);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
    const addBlock = (type) => setBlocks((b) => [...b, { id: Date.now(), type, content: "" }]);
    const updateBlock = (id, content) => setBlocks((b) => b.map((x) => x.id === id ? { ...x, content } : x));
    const removeBlock = (id) => setBlocks((b) => b.filter((x) => x.id !== id));
    const move = (i, d) => setBlocks((b) => {
      const n = [...b];
      const j = i + d;
      if (j < 0 || j >= n.length) return b;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
    const submit = (status) => {
      if (!f.title.trim()) return;
      onCreate({ type: "Academia", title: `${f.module} \xB7 ${f.title}`, status, date: "2026-11-12" }, status === "publicado" ? "Lecci\xF3n publicada en Academia" : "Lecci\xF3n enviada a revisi\xF3n");
      setF({ ...f, title: "" });
    };
    const placeholder = { Texto: "Explicaci\xF3n de la lecci\xF3n\u2026", V\u00EDdeo: "URL del v\xEDdeo (YouTube, Vimeo o CDN)", Ejercicio: "Instrucciones del ejercicio pr\xE1ctico en la app\u2026", Quiz: "Pregunta | respuesta correcta | opci\xF3n 2 | opci\xF3n 3" };
    return /* @__PURE__ */ React.createElement("div", { className: "grid g-main" }, /* @__PURE__ */ React.createElement(Card, { title: "Nueva lecci\xF3n de Academia" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "grid g-2" }, /* @__PURE__ */ React.createElement(Field, { label: "M\xF3dulo", id: "ac-mod" }, /* @__PURE__ */ React.createElement("select", { id: "ac-mod", className: "select", value: f.module, onChange: set("module") }, ACADEMY_MODULES.map((m) => /* @__PURE__ */ React.createElement("option", { key: m }, m)))), /* @__PURE__ */ React.createElement(Field, { label: "T\xEDtulo de la lecci\xF3n", id: "ac-title" }, /* @__PURE__ */ React.createElement("input", { id: "ac-title", className: "input", value: f.title, onChange: set("title"), placeholder: "Ej. Mezclar en claves adyacentes" }))), /* @__PURE__ */ React.createElement("div", { className: "grid g-3" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "field-label" }, "Nivel"), /* @__PURE__ */ React.createElement(Chips, { label: "Nivel", options: ["Inicial", "Medio", "Avanzado"], value: f.level, onChange: (level) => setF({ ...f, level }) })), /* @__PURE__ */ React.createElement(Field, { label: "Duraci\xF3n (min)", id: "ac-min" }, /* @__PURE__ */ React.createElement("input", { id: "ac-min", type: "number", min: "1", className: "input", value: f.minutes, onChange: set("minutes") })), /* @__PURE__ */ React.createElement(Field, { label: "Visible para", id: "ac-aud" }, /* @__PURE__ */ React.createElement("select", { id: "ac-aud", className: "select", value: f.audience, onChange: set("audience") }, ["Todos", "PRO y STUDIO", "Solo STUDIO"].map((a) => /* @__PURE__ */ React.createElement("option", { key: a }, a))))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "field-label" }, "Bloques de contenido"), /* @__PURE__ */ React.createElement("ol", { className: "blocks" }, blocks.map((b, i) => /* @__PURE__ */ React.createElement("li", { key: b.id, className: "block" }, /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("span", { className: "code-tag" }, i + 1, " \xB7 ", b.type), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "ghost", icon: "up", "aria-label": "Subir bloque", onClick: () => move(i, -1), disabled: i === 0 }), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "ghost", icon: "down", "aria-label": "Bajar bloque", onClick: () => move(i, 1), disabled: i === blocks.length - 1 }), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "ghost", icon: "trash", "aria-label": "Eliminar bloque", onClick: () => removeBlock(b.id) }))), /* @__PURE__ */ React.createElement("label", { htmlFor: `blk-${b.id}`, className: "sr-only" }, "Contenido del bloque ", b.type), /* @__PURE__ */ React.createElement("textarea", { id: `blk-${b.id}`, className: "textarea", rows: b.type === "Texto" ? 4 : 2, value: b.content, onChange: (e) => updateBlock(b.id, e.target.value), placeholder: placeholder[b.type] })))), /* @__PURE__ */ React.createElement("div", { className: "row wrap" }, BLOCK_TYPES.map((t) => /* @__PURE__ */ React.createElement(Button, { key: t, size: "sm", icon: "plus", onClick: () => addBlock(t) }, t)))), /* @__PURE__ */ React.createElement("div", { className: "row between wrap" }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement(Toggle, { checked: featured, onChange: setFeatured, label: "Destacar en la portada de Academia" }), /* @__PURE__ */ React.createElement("span", { className: "muted" }, "Destacar en la portada de Academia")), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement(Button, { onClick: () => submit("revisi\xF3n"), disabled: !f.title.trim() }, "Enviar a revisi\xF3n"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "send", onClick: () => submit("publicado"), disabled: !f.title.trim() }, "Publicar"))))), /* @__PURE__ */ React.createElement(Card, { title: "Esquema de la lecci\xF3n" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "stack-tight" }, /* @__PURE__ */ React.createElement("span", { className: "faint mono" }, f.module), /* @__PURE__ */ React.createElement("span", { className: "lesson-title" }, f.title || "T\xEDtulo de la lecci\xF3n"), /* @__PURE__ */ React.createElement("span", { className: "muted" }, f.level, " \xB7 ", f.minutes, " min \xB7 ", f.audience, featured ? " \xB7 Destacada" : "")), /* @__PURE__ */ React.createElement("ol", { className: "outline" }, blocks.map((b) => /* @__PURE__ */ React.createElement("li", { key: b.id }, /* @__PURE__ */ React.createElement("span", { className: "code-tag" }, b.type), /* @__PURE__ */ React.createElement("span", { className: b.content ? "" : "faint" }, b.content ? b.content.slice(0, 60) : "Sin contenido")))))));
  }
  function ContentStudio({ toast }) {
    const [tab, setTab] = useState6("Redes");
    const [library, setLibrary] = useState6(CONTENT_LIBRARY);
    const [filter, setFilter] = useState6("Todo");
    const onCreate = (item, msg) => {
      setLibrary((l) => [{ id: `c${Date.now()}`, author: "Carlos R.", views: 0, ...item }, ...l]);
      toast(msg);
    };
    const rows = filter === "Todo" ? library : library.filter((c) => c.type === filter);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionHeader, { eyebrow: "Contenido", title: "Estudio de contenido", desc: "Crea publicaciones para redes, art\xEDculos para el blog y lecciones internas para las secciones de aprendizaje." }, /* @__PURE__ */ React.createElement(Chips, { label: "Tipo de contenido", options: ["Redes", "Blog", "Academia"], value: tab, onChange: setTab })), tab === "Redes" && /* @__PURE__ */ React.createElement(SocialComposer, { onCreate }), tab === "Blog" && /* @__PURE__ */ React.createElement(BlogEditor, { onCreate }), tab === "Academia" && /* @__PURE__ */ React.createElement(LessonBuilder, { onCreate }), /* @__PURE__ */ React.createElement(Card, { title: "Biblioteca de contenido", action: /* @__PURE__ */ React.createElement(Chips, { label: "Filtrar biblioteca", options: ["Todo", "Redes", "Blog", "Academia"], value: filter, onChange: setFilter }), bodyClass: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { scope: "col" }, "T\xEDtulo"), /* @__PURE__ */ React.createElement("th", { scope: "col" }, "Tipo"), /* @__PURE__ */ React.createElement("th", { scope: "col" }, "Estado"), /* @__PURE__ */ React.createElement("th", { scope: "col" }, "Autor"), /* @__PURE__ */ React.createElement("th", { scope: "col" }, "Fecha"), /* @__PURE__ */ React.createElement("th", { scope: "col", className: "num" }, "Vistas"))), /* @__PURE__ */ React.createElement("tbody", null, rows.map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.id }, /* @__PURE__ */ React.createElement("td", null, c.title), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "code-tag" }, c.type)), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Badge, { tone: statusTone[c.status] }, c.status)), /* @__PURE__ */ React.createElement("td", { className: "muted" }, c.author), /* @__PURE__ */ React.createElement("td", { className: "mono muted" }, c.date), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, c.views ? num(c.views) : "\u2014")))))));
  }

  // web/js/admin.jsx
  var { useState: useState7, useEffect } = React;
  var NAV = [
    { group: "Operaci\xF3n", items: [
      { id: "overview", label: "Resumen", icon: "home", C: Overview },
      { id: "database", label: "Base de datos", icon: "db", C: Database },
      { id: "query", label: "Consultas SQL", icon: "code", C: QueryConsole }
    ] },
    { group: "Crecimiento", items: [
      { id: "promos", label: "Promociones", icon: "megaphone", C: Promotions, count: 2 },
      { id: "codes", label: "C\xF3digos descuento", icon: "ticket", C: Codes, count: 3 },
      { id: "skills", label: "Skills en campa\xF1as", icon: "spark", C: Skills },
      { id: "banners", label: "Banners", icon: "image", C: Banners }
    ] },
    { group: "Insights", items: [
      { id: "analytics", label: "Anal\xEDtica", icon: "chart", C: Analytics },
      { id: "behavior", label: "Comportamiento", icon: "flow", C: Behavior },
      { id: "seo", label: "SEO", icon: "search", C: Seo }
    ] },
    { group: "Contenido", items: [
      { id: "social", label: "Redes sociales", icon: "share", C: Social },
      { id: "content", label: "Estudio de contenido", icon: "pen", C: ContentStudio }
    ] },
    { group: "Negocio", items: [
      { id: "billing", label: "Facturaci\xF3n", icon: "card", C: Billing }
    ] },
    { group: "Sistema", items: [
      { id: "notices", label: "Avisos", icon: "bell", C: Notices, count: 1 },
      { id: "logs", label: "Logs", icon: "terminal", C: Logs },
      { id: "settings", label: "Ajustes", icon: "gear", C: Settings }
    ] }
  ];
  var ALL = NAV.flatMap((g) => g.items);
  var fromHash = () => ALL.some((i) => i.id === location.hash.slice(1)) ? location.hash.slice(1) : "overview";
  function AdminApp() {
    const [active, setActive] = useState7(fromHash);
    const [menuOpen, setMenuOpen] = useState7(false);
    const [toastNode, toast] = useToast();
    useEffect(() => {
      const onHash = () => setActive(fromHash());
      window.addEventListener("hashchange", onHash);
      return () => window.removeEventListener("hashchange", onHash);
    }, []);
    const go = (id) => {
      location.hash = id;
      setActive(id);
      setMenuOpen(false);
      window.scrollTo(0, 0);
    };
    const current = ALL.find((i) => i.id === active);
    const Section = current.C;
    return /* @__PURE__ */ React.createElement("div", { className: "adm" }, /* @__PURE__ */ React.createElement("aside", { className: `adm-side ${menuOpen ? "open" : ""}`, "aria-label": "Navegaci\xF3n del panel" }, /* @__PURE__ */ React.createElement("div", { className: "adm-brand" }, /* @__PURE__ */ React.createElement("div", { className: "adm-brand-mark" }, "BW"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "adm-brand-name" }, "BEATWAVE"), /* @__PURE__ */ React.createElement("div", { className: "adm-brand-sub" }, "Admin Console"))), /* @__PURE__ */ React.createElement("nav", { className: "adm-nav" }, NAV.map((g) => /* @__PURE__ */ React.createElement("div", { key: g.group, className: "adm-nav-group" }, /* @__PURE__ */ React.createElement("div", { className: "adm-nav-label" }, g.group), g.items.map((it) => /* @__PURE__ */ React.createElement("button", { key: it.id, type: "button", className: "adm-nav-item", "aria-current": active === it.id ? "page" : void 0, onClick: () => go(it.id) }, /* @__PURE__ */ React.createElement(Icon, { name: it.icon }), it.label, it.count ? /* @__PURE__ */ React.createElement("span", { className: "adm-nav-count" }, it.count) : null))))), /* @__PURE__ */ React.createElement("div", { className: "adm-side-foot" }, /* @__PURE__ */ React.createElement("div", { className: "adm-avatar" }, "CR"), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 500 } }, "Carlos Rueda"), /* @__PURE__ */ React.createElement("div", { className: "faint", style: { fontSize: 11 } }, "Propietario")))), /* @__PURE__ */ React.createElement("div", { className: "adm-main" }, /* @__PURE__ */ React.createElement("header", { className: "adm-top" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost adm-menu-btn", "aria-label": menuOpen ? "Cerrar men\xFA" : "Abrir men\xFA", "aria-expanded": menuOpen, onClick: () => setMenuOpen(!menuOpen) }, /* @__PURE__ */ React.createElement(Icon, { name: menuOpen ? "x" : "menu" })), /* @__PURE__ */ React.createElement("div", { className: "adm-search" }, /* @__PURE__ */ React.createElement(Icon, { name: "search", size: 14 }), /* @__PURE__ */ React.createElement("label", { htmlFor: "global-q", className: "sr-only" }, "Buscar en el panel"), /* @__PURE__ */ React.createElement("input", { id: "global-q", placeholder: "Buscar usuarios, c\xF3digos, facturas\u2026" }), /* @__PURE__ */ React.createElement("span", { className: "adm-kbd" }, "\u2318K")), /* @__PURE__ */ React.createElement("div", { className: "adm-env" }, /* @__PURE__ */ React.createElement("span", { className: "adm-dot", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", { className: "label" }, "Producci\xF3n \xB7 datos de ejemplo"))), /* @__PURE__ */ React.createElement("main", { className: "adm-content" }, /* @__PURE__ */ React.createElement(Section, { go, toast }))), toastNode);
  }
  ReactDOM.render(/* @__PURE__ */ React.createElement(AdminApp, null), document.getElementById("admin-root"));
})();
