// Dataset de ejemplo para consultas y analítica profunda. Sustituir por /api/admin/query y /api/admin/analytics al conectar el backend.
import { DAYS } from './data.js';

let seed = 20261112;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (a, b) => Math.floor(a + rnd() * (b - a + 1));

export const SECTIONS = ['Copilot', 'Sets', 'Map', 'Auditar', 'Cues', 'Academia', 'Biblioteca', 'Ajustes'];
const SECTION_WEIGHT = { Copilot: 1.6, Sets: 1.4, Map: 0.9, Auditar: 1.1, Cues: 1.2, Academia: 0.8, Biblioteca: 1.3, Ajustes: 0.2 };
const PLANS = ['FREE', 'FREE', 'FREE', 'PRO', 'PRO', 'STUDIO'];
const COUNTRIES = ['ES', 'ES', 'MX', 'AR', 'DE', 'FR', 'CO', 'US', 'IT'];
const DEVICES = ['desktop', 'desktop', 'desktop', 'tablet', 'móvil'];
const KEYS = ['1A', '2A', '4A', '5A', '8A', '8B', '9B', '11A', '12A'];
const NAMES = ['marta', 'kiko', 'lena', 'djnoir', 'alex', 'sara', 'pablo', 'iris', 'teo', 'nadia', 'bruno', 'vera', 'omar', 'luz', 'hugo'];

const users = Array.from({ length: 60 }, (_, i) => {
    const plan = pick(PLANS);
    const boost = plan === 'STUDIO' ? 3 : plan === 'PRO' ? 2 : 1;
    return {
        id: `u_${1100 - i}`,
        email: `${NAMES[i % NAMES.length]}${i}@mail.com`,
        plan,
        pais: pick(COUNTRIES),
        alta: `2026-${String(int(6, 10)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`,
        sesiones: int(2, 14) * boost,
        minutos_totales: 0,
        temas_procesados: Math.round(int(3, 40) * boost * (0.6 + rnd())),
    };
});

const sesiones = [];
const eventos = [];
users.forEach((u) => {
    for (let s = 0; s < u.sesiones; s++) {
        const id = `ses_${9000 + sesiones.length}`;
        const fecha = `2026-11-${String(int(1, 11)).padStart(2, '0')}`;
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

const temas = [];
users.forEach((u) => {
    for (let t = 0; t < Math.min(u.temas_procesados, 12); t++) {
        temas.push({
            id: `t_${50000 + temas.length}`,
            usuario_id: u.id,
            bpm: int(112, 140),
            tonalidad: pick(KEYS),
            estado: rnd() > 0.92 ? 'error' : 'completo',
            fecha: `2026-11-${String(int(1, 11)).padStart(2, '0')}`,
        });
    }
});

const toTable = (rows) => ({ columns: Object.keys(rows[0]), rows });

export const SQL_TABLES = {
    usuarios: toTable(users),
    sesiones: toTable(sesiones),
    eventos_seccion: toTable(eventos),
    temas: toTable(temas),
};

export const SAVED_QUERIES = [
    { name: 'Tiempo medio por sección', sql: 'SELECT seccion, AVG(segundos) AS media_seg, COUNT(*) AS visitas\nFROM eventos_seccion\nGROUP BY seccion\nORDER BY media_seg DESC' },
    { name: 'Top 10 por temas procesados', sql: 'SELECT id, email, plan, temas_procesados\nFROM usuarios\nORDER BY temas_procesados DESC\nLIMIT 10' },
    { name: 'Usuarios por plan', sql: 'SELECT plan, COUNT(*) AS usuarios, AVG(minutos_totales) AS min_medios\nFROM usuarios\nGROUP BY plan' },
    { name: 'Sesiones por dispositivo', sql: 'SELECT dispositivo, COUNT(*) AS sesiones, AVG(duracion_min) AS duracion_media\nFROM sesiones\nGROUP BY dispositivo\nORDER BY sesiones DESC' },
    { name: 'Errores de análisis', sql: "SELECT id, usuario_id, bpm, tonalidad, fecha\nFROM temas\nWHERE estado = 'error'\nORDER BY fecha DESC" },
];

// ── Métricas derivadas del mismo dataset ─────────────────────────
const avg = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

export const TIME_BY_SECTION = SECTIONS.map((s) => {
    const ev = eventos.filter((e) => e.seccion === s);
    return { label: s, value: Math.round(avg(ev.map((e) => e.segundos))), visits: ev.length };
}).sort((a, b) => b.value - a.value);

export const BEHAVIOR_KPIS = {
    avgSessionMin: avg(sesiones.map((s) => s.duracion_min)),
    sessionsPerUser: sesiones.length / users.length,
    tracksPerUser: avg(users.map((u) => u.temas_procesados)),
    sectionsPerSession: avg(sesiones.map((s) => s.secciones)),
};

export const AVG_SESSION_TREND = DAYS.map((_, i) => Math.round((14 + 3 * Math.sin(i / 4) + i * 0.12 + (i % 5) * 0.4) * 10) / 10);

const BUCKETS = [[0, 5], [6, 15], [16, 30], [31, 60], [61, 100], [101, 999]];
export const TRACKS_HISTOGRAM = BUCKETS.map(([a, b]) => ({
    label: b === 999 ? `${a}+` : `${a}–${b}`,
    value: users.filter((u) => u.temas_procesados >= a && u.temas_procesados <= b).length,
}));

export const TOP_PROCESSORS = [...users].sort((a, b) => b.temas_procesados - a.temas_procesados).slice(0, 6);

// Matriz de transiciones origen → destino (% de salidas desde la sección origen).
export const FLOW_SECTIONS = ['Copilot', 'Sets', 'Map', 'Auditar', 'Cues', 'Academia'];
export const TRANSITIONS = FLOW_SECTIONS.map((from, i) => {
    const raw = FLOW_SECTIONS.map((to, j) => (i === j ? 0 : int(2, 30) + (j === (i + 1) % FLOW_SECTIONS.length ? 25 : 0)));
    const sum = raw.reduce((a, b) => a + b, 0);
    return { from, values: raw.map((v) => Math.round((v / sum) * 100)) };
});

export const TOP_PATHS = [
    { path: ['Inicio', 'Copilot', 'Sets'], share: 23.4, conv: 41 },
    { path: ['Inicio', 'Biblioteca', 'Auditar', 'Cues'], share: 17.1, conv: 36 },
    { path: ['Inicio', 'Sets', 'Map'], share: 12.8, conv: 29 },
    { path: ['Inicio', 'Academia', 'Copilot'], share: 9.6, conv: 52 },
    { path: ['Inicio', 'Copilot', 'Cues', 'Sets'], share: 7.2, conv: 47 },
];

export const COHORTS = [
    { cohort: 'Jun 2026', size: 412, values: [100, 61, 48, 41, 37, 34] },
    { cohort: 'Jul 2026', size: 538, values: [100, 64, 51, 44, 39] },
    { cohort: 'Ago 2026', size: 497, values: [100, 58, 46, 40] },
    { cohort: 'Sep 2026', size: 621, values: [100, 66, 54] },
    { cohort: 'Oct 2026', size: 744, values: [100, 69] },
    { cohort: 'Nov 2026', size: 302, values: [100] },
];

export const DEVICE_SPLIT = ['desktop', 'tablet', 'móvil'].map((d) => ({ label: d, value: sesiones.filter((s) => s.dispositivo === d).length }));

// ── Redes sociales y contenido ───────────────────────────────────
const growth = (base, step) => DAYS.map((_, i) => Math.round(base + i * step + Math.sin(i / 2) * step * 3));

export const SOCIAL_ACCOUNTS = [
    { id: 'ig', name: 'Instagram', handle: '@beatwave.app', followers: 18420, growth: 4.2, engagement: 5.1, connected: true, series: growth(17200, 40), limit: 2200 },
    { id: 'tt', name: 'TikTok', handle: '@beatwave', followers: 32950, growth: 9.8, engagement: 8.4, connected: true, series: growth(30000, 98), limit: 2200 },
    { id: 'yt', name: 'YouTube', handle: 'BEATWAVE Academy', followers: 6120, growth: 2.7, engagement: 3.9, connected: true, series: growth(5960, 6), limit: 5000 },
    { id: 'x', name: 'X', handle: '@beatwaveapp', followers: 4210, growth: -0.6, engagement: 1.2, connected: true, series: growth(4240, -1), limit: 280 },
    { id: 'sc', name: 'SoundCloud', handle: 'beatwave-mixes', followers: 2890, growth: 1.9, engagement: 2.6, connected: false, series: growth(2830, 2), limit: 500 },
    { id: 'th', name: 'Threads', handle: '@beatwave.app', followers: 1540, growth: 6.3, engagement: 4.4, connected: false, series: growth(1450, 3), limit: 500 },
];

export const SCHEDULED_POSTS = [
    { id: 'p1', when: '2026-11-13 18:00', networks: ['ig', 'tt'], text: 'Cómo construir un set peak-time en 5 pasos con Copilot', status: 'programado' },
    { id: 'p2', when: '2026-11-14 12:30', networks: ['yt'], text: 'Clase gratis: armonía Camelot para principiantes', status: 'programado' },
    { id: 'p3', when: '2026-11-15 20:00', networks: ['x', 'th'], text: 'Black Friday: STUDIO -40% solo 72h', status: 'borrador' },
];

export const CONTENT_LIBRARY = [
    { id: 'c1', type: 'Blog', title: '10 errores al mezclar en clave (y cómo evitarlos)', status: 'publicado', author: 'Víctor R.', date: '2026-11-08', views: 4820 },
    { id: 'c2', type: 'Academia', title: 'Módulo 3 · Transiciones por energía', status: 'publicado', author: 'Equipo edu', date: '2026-11-05', views: 2310 },
    { id: 'c3', type: 'Redes', title: 'Reel: auditoría de un set en 30 s', status: 'programado', author: 'Lucía M.', date: '2026-11-13', views: 0 },
    { id: 'c4', type: 'Blog', title: 'Guía de BPM por género 2026', status: 'borrador', author: 'Víctor R.', date: '2026-11-10', views: 0 },
    { id: 'c5', type: 'Academia', title: 'Lección · Cue points para warm-up', status: 'revisión', author: 'Equipo edu', date: '2026-11-11', views: 0 },
];

export const ACADEMY_MODULES = ['Fundamentos de mezcla', 'Armonía y Camelot', 'Estructura de sets', 'Uso del Copilot', 'Cues y preparación', 'Producción para DJs'];
