// Motor SQL de solo lectura sobre el dataset de ejemplo (subconjunto: SELECT / WHERE / GROUP BY / ORDER BY / LIMIT).
// Al conectar el backend, sustituir runSql por un POST a /api/admin/query con un rol de base de datos read-only.

const AGG = /^(count|sum|avg|min|max)\s*\(\s*(\*|[\w.]+)\s*\)$/i;
const WRITE = /^\s*(insert|update|delete|drop|alter|create|truncate|grant|revoke)\b/i;
const MAX_ROWS = 500;

function splitTop(s) {
    const out = [];
    let depth = 0, cur = '';
    for (const ch of s) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
}

function resolver(columns) {
    const map = Object.fromEntries(columns.map((c) => [c.toLowerCase(), c]));
    return (name) => {
        const key = name.toLowerCase().split('.').pop();
        if (!map[key]) throw new Error(`Columna desconocida: ${name}`);
        return map[key];
    };
}

function parseValue(raw) {
    const v = raw.trim();
    if (/^'.*'$/.test(v)) return v.slice(1, -1).replace(/''/g, "'");
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    throw new Error(`Valor no válido: ${v} (usa comillas simples para texto)`);
}

function parseWhere(str, col) {
    return str.split(/\s+or\s+/i).map((group) => group.split(/\s+and\s+/i).map((atom) => {
        const m = atom.trim().match(/^([\w.]+)\s*(not\s+like|like|>=|<=|!=|<>|=|>|<)\s*(.+)$/i);
        if (!m) throw new Error(`Condición no válida: ${atom.trim()}`);
        return { col: col(m[1]), op: m[2].toLowerCase().replace(/\s+/g, ' '), value: parseValue(m[3]) };
    }));
}

function test(row, { col, op, value }) {
    const a = row[col];
    if (op === 'like' || op === 'not like') {
        const re = new RegExp(`^${String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')}$`, 'i');
        return op === 'like' ? re.test(String(a)) : !re.test(String(a));
    }
    const [x, y] = typeof value === 'number' ? [Number(a), value] : [String(a), value];
    switch (op) {
        case '=': return x === y;
        case '!=': case '<>': return x !== y;
        case '>': return x > y;
        case '<': return x < y;
        case '>=': return x >= y;
        case '<=': return x <= y;
        default: return false;
    }
}

function aggregate(fn, field, rows) {
    if (fn === 'count') return field === '*' ? rows.length : rows.filter((r) => r[field] != null).length;
    const vals = rows.map((r) => Number(r[field])).filter((n) => !Number.isNaN(n));
    if (!vals.length) return null;
    if (fn === 'sum') return round(vals.reduce((a, b) => a + b, 0));
    if (fn === 'avg') return round(vals.reduce((a, b) => a + b, 0) / vals.length);
    if (fn === 'min') return Math.min(...vals);
    return Math.max(...vals);
}

const round = (n) => Math.round(n * 100) / 100;
const cmp = (a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'es'));

export function runSql(query, tables) {
    const started = performance.now();
    const q = query.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim().replace(/;$/, '');
    if (!q) throw new Error('Escribe una consulta.');
    if (WRITE.test(q)) throw new Error('Modo solo lectura: las sentencias de escritura están bloqueadas en la consola.');

    const m = q.match(/^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(.+?))?(?:\s+group\s+by\s+(.+?))?(?:\s+order\s+by\s+(.+?))?(?:\s+limit\s+(\d+))?$/i);
    if (!m) throw new Error('Sintaxis no soportada. Usa SELECT … FROM … [WHERE] [GROUP BY] [ORDER BY] [LIMIT].');
    const [, selStr, tableName, whereStr, groupStr, orderStr, limitStr] = m;

    const table = tables[tableName.toLowerCase()];
    if (!table) throw new Error(`Tabla desconocida: ${tableName}. Disponibles: ${Object.keys(tables).join(', ')}`);
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
        if (expr === '*') return { star: true };
        if (agg) return { agg: agg[1].toLowerCase(), field: agg[2] === '*' ? '*' : col(agg[2]), label: am ? am[2] : expr.toLowerCase() };
        const c = col(expr);
        return { field: c, label: am ? am[2] : c };
    });

    const groupCols = groupStr ? splitTop(groupStr).map(col) : [];
    const isAgg = groupCols.length > 0 || sel.some((s) => s.agg);
    let columns, out;

    if (isAgg) {
        if (sel.some((s) => s.star)) throw new Error('No se puede usar * junto a GROUP BY o agregados.');
        sel.forEach((s) => {
            if (!s.agg && !groupCols.includes(s.field)) throw new Error(`La columna ${s.field} debe aparecer en GROUP BY o en un agregado.`);
        });
        const groups = new Map();
        rows.forEach((r) => {
            const key = groupCols.map((g) => r[g]).join('\u0000');
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(r);
        });
        if (!groupCols.length && !groups.size) groups.set('', []);
        columns = sel.map((s) => s.label);
        out = [...groups.values()].map((g) => sel.map((s) => (s.agg ? aggregate(s.agg, s.field, g) : g[0][s.field])));
    } else {
        columns = sel.flatMap((s) => (s.star ? table.columns : [s.label]));
        out = rows.map((r) => sel.flatMap((s) => (s.star ? table.columns.map((c) => r[c]) : [r[s.field]])));
    }

    if (orderStr) {
        const keys = splitTop(orderStr).map((k) => {
            const km = k.match(/^(.+?)(?:\s+(asc|desc))?$/i);
            const name = km[1].trim().toLowerCase();
            const idx = columns.findIndex((c) => c.toLowerCase() === name);
            if (idx < 0) throw new Error(`ORDER BY debe usar una columna del resultado: ${km[1].trim()}`);
            return { idx, dir: km[2] && km[2].toLowerCase() === 'desc' ? -1 : 1 };
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

export function toCsv(columns, rows) {
    const esc = (v) => (v == null ? '' : /[",\n;]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    return [columns, ...rows].map((r) => r.map(esc).join(',')).join('\n');
}
