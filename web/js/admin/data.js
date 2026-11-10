// Datos de ejemplo para el diseño del panel. Sustituir por llamadas a /api/admin/* al conectar el backend.

export const DAYS = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2026, 9, 12 + i);
    return `${d.getDate()}/${d.getMonth() + 1}`;
});

const wave = (base, amp, seed) => DAYS.map((_, i) => Math.round(base + amp * Math.sin(i / 3 + seed) + i * (amp / 12) + ((i * 7919 + seed * 31) % 13) * (amp / 20)));

export const REVENUE = wave(1800, 420, 1);
export const REVENUE_PREV = wave(1500, 300, 2.4);
export const ACTIVE_USERS = wave(3200, 600, 0.5);
export const SESSIONS = wave(5400, 900, 1.7);

export const DB_TABLES = {
    users: {
        columns: ['id', 'email', 'plan', 'país', 'alta', 'estado'],
        rows: [
            ['u_1042', 'marta.dj@gmail.com', 'PRO', 'ES', '2026-10-28', 'activo'],
            ['u_1041', 'kiko.beats@outlook.com', 'FREE', 'MX', '2026-10-27', 'activo'],
            ['u_1040', 'lena.techno@gmx.de', 'PRO', 'DE', '2026-10-27', 'activo'],
            ['u_1039', 'djnoir@proton.me', 'STUDIO', 'FR', '2026-10-25', 'suspendido'],
            ['u_1038', 'alex.house@gmail.com', 'FREE', 'ES', '2026-10-24', 'activo'],
            ['u_1037', 'sara.vinyl@icloud.com', 'PRO', 'AR', '2026-10-22', 'activo'],
            ['u_1036', 'groove.pablo@gmail.com', 'FREE', 'CO', '2026-10-20', 'inactivo'],
        ],
    },
    tracks: {
        columns: ['id', 'título', 'artista', 'bpm', 'key', 'análisis'],
        rows: [
            ['t_88120', 'Midnight Circuit', 'Kolsch', '124', '8A', 'completo'],
            ['t_88119', 'Solar Drift', 'Ben Böhmer', '122', '5A', 'completo'],
            ['t_88118', 'Pressure Point', 'Amelie Lens', '134', '11A', 'pendiente'],
            ['t_88117', 'Low Tide', 'Tale Of Us', '118', '2A', 'completo'],
            ['t_88116', 'Afterglow', 'Lane 8', '120', '9B', 'error'],
        ],
    },
    subscriptions: {
        columns: ['id', 'usuario', 'plan', 'importe', 'renovación', 'estado'],
        rows: [
            ['s_3301', 'u_1042', 'PRO mensual', '9,99 €', '2026-11-28', 'activo'],
            ['s_3300', 'u_1040', 'PRO anual', '89,00 €', '2027-10-27', 'activo'],
            ['s_3299', 'u_1039', 'STUDIO mensual', '19,99 €', '2026-11-25', 'impago'],
            ['s_3298', 'u_1037', 'PRO mensual', '9,99 €', '2026-11-22', 'activo'],
        ],
    },
    sets: {
        columns: ['id', 'nombre', 'usuario', 'pistas', 'duración', 'público'],
        rows: [
            ['set_510', 'Warehouse Night', 'u_1042', '28', '2h 10m', 'sí'],
            ['set_509', 'Sunset Melodic', 'u_1040', '19', '1h 32m', 'no'],
            ['set_508', 'Peak Time 134', 'u_1039', '34', '2h 45m', 'sí'],
        ],
    },
};

export const PROMOS = [
    { id: 'p1', name: 'Black Friday — PRO anual -40%', audience: 'Usuarios FREE', start: '2026-11-24', end: '2026-12-01', status: true, conv: 6.8 },
    { id: 'p2', name: 'Trial STUDIO 14 días', audience: 'Usuarios PRO', start: '2026-11-01', end: '2026-11-30', status: true, conv: 3.1 },
    { id: 'p3', name: 'Reactivación — 1 mes gratis', audience: 'Inactivos > 60 días', start: '2026-10-01', end: '2026-10-31', status: false, conv: 2.4 },
];

export const CODES = [
    { code: 'BFRIDAY40', type: '%', value: 40, uses: 312, limit: 1000, expires: '2026-12-01', active: true },
    { code: 'DJWELCOME', type: '%', value: 20, uses: 1840, limit: 0, expires: '—', active: true },
    { code: 'FESTIVAL10', type: '€', value: 10, uses: 98, limit: 200, expires: '2026-11-15', active: true },
    { code: 'SUMMER25', type: '%', value: 25, uses: 500, limit: 500, expires: '2026-09-01', active: false },
];

export const SKILLS = [
    { id: 'sk1', name: 'Harmonic Mixing Pro', desc: 'Sugerencias de mezcla armónica avanzadas en Copilot', campaign: 'Black Friday', plans: ['FREE', 'PRO'], active: true },
    { id: 'sk2', name: 'Stem Separation', desc: 'Separación de voces e instrumentales en Cues', campaign: 'Festival Season', plans: ['PRO'], active: true },
    { id: 'sk3', name: 'Set Auditor IA', desc: 'Auditoría automática de energía y transiciones', campaign: 'Navidad 2026', plans: ['FREE', 'PRO', 'STUDIO'], active: false },
    { id: 'sk4', name: 'Map Caratulas HD', desc: 'Carátulas en alta resolución en la vista Map', campaign: '—', plans: ['STUDIO'], active: false },
];

export const BANNERS = [
    { id: 'b1', title: 'Black Friday: PRO anual al 40%', sub: 'Solo hasta el 1 de diciembre', cta: 'Aprovechar', placement: 'Home — superior', style: 'cyan', active: true, ctr: 4.2 },
    { id: 'b2', title: 'Nuevo: Stem Separation', sub: 'Disponible para usuarios PRO', cta: 'Probar ahora', placement: 'Cues — lateral', style: 'dark', active: true, ctr: 2.7 },
    { id: 'b3', title: 'Encuesta de satisfacción', sub: 'Ayúdanos a mejorar en 2 minutos', cta: 'Responder', placement: 'Modal post-sesión', style: 'light', active: false, ctr: 1.1 },
];

export const INVOICES = [
    { id: 'INV-2026-1188', client: 'marta.dj@gmail.com', plan: 'PRO mensual', amount: 9.99, date: '2026-11-08', status: 'pagada' },
    { id: 'INV-2026-1187', client: 'lena.techno@gmx.de', plan: 'PRO anual', amount: 89, date: '2026-11-07', status: 'pagada' },
    { id: 'INV-2026-1186', client: 'djnoir@proton.me', plan: 'STUDIO mensual', amount: 19.99, date: '2026-11-06', status: 'fallida' },
    { id: 'INV-2026-1185', client: 'sara.vinyl@icloud.com', plan: 'PRO mensual', amount: 9.99, date: '2026-11-05', status: 'pagada' },
    { id: 'INV-2026-1184', client: 'club.razzmatazz@empresa.es', plan: 'STUDIO equipo x5', amount: 79, date: '2026-11-03', status: 'reembolsada' },
];

export const NOTICES = [
    { id: 'n1', title: 'Mantenimiento programado', body: 'El análisis de pistas estará en pausa el 14/11 de 03:00 a 04:00 CET.', channel: 'In-app + Email', audience: 'Todos', date: '2026-11-10', status: 'programado' },
    { id: 'n2', title: 'Nueva versión 3.2', body: 'Llega el modo Map con carátulas y mejoras en Copilot.', channel: 'In-app', audience: 'Todos', date: '2026-11-02', status: 'enviado' },
    { id: 'n3', title: 'Pago fallido', body: 'Actualiza tu método de pago para mantener STUDIO.', channel: 'Email', audience: 'Impagos', date: '2026-11-06', status: 'enviado' },
];

export const LOGS = [
    ['2026-11-10 09:42:18', 'ERROR', 'api/analyze', 'Timeout analizando t_88116 (Afterglow) tras 30s'],
    ['2026-11-10 09:41:02', 'INFO', 'auth', 'Login correcto u_1042 desde 83.45.x.x'],
    ['2026-11-10 09:40:55', 'WARN', 'billing', 'Reintento de cobro s_3299 (2/3)'],
    ['2026-11-10 09:39:12', 'INFO', 'promo', 'Código BFRIDAY40 aplicado por u_1038'],
    ['2026-11-10 09:37:40', 'DEBUG', 'copilot', 'Cache hit armónico 8A→9A (12ms)'],
    ['2026-11-10 09:35:21', 'INFO', 'admin', 'Banner b1 activado por admin@beatwave.pro'],
    ['2026-11-10 09:33:09', 'ERROR', 'storage', 'Carátula no encontrada para set_509'],
    ['2026-11-10 09:30:44', 'WARN', 'api/rate', 'Límite de peticiones alcanzado IP 190.12.x.x'],
    ['2026-11-10 09:28:13', 'INFO', 'skills', 'Skill sk2 habilitada para plan PRO'],
    ['2026-11-10 09:25:57', 'DEBUG', 'map', 'Render 412 nodos en 38ms'],
    ['2026-11-10 09:22:30', 'INFO', 'auth', 'Registro nuevo u_1043 (ES)'],
];

export const SEO_PAGES = [
    { path: '/', title: 'BEATWAVE PRO — Precision Audio Intelligence', score: 94, clicks: 4210, pos: 3.2 },
    { path: '/copilot', title: 'Live Copilot para DJs', score: 88, clicks: 1890, pos: 5.8 },
    { path: '/precios', title: 'Planes y precios', score: 72, clicks: 1204, pos: 8.1 },
    { path: '/academy', title: 'Academy — aprende a mezclar', score: 65, clicks: 860, pos: 11.4 },
];
