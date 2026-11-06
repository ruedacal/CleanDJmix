import { DEMO_TRACKS, DEMO_CANDIDATES, buildClubCues } from "../demo-data.js";

// In-memory implementation of the BeatWave REST contract (see ./endpoints.js).
// It mirrors status codes and JSON shapes so swapping to a real server is a config change.

const tracks = DEMO_TRACKS.map((t) => ({ ...t, cues: t.cues ? t.cues.slice() : [] }));
const jobs = new Map();
let jobSeq = 0;

const latency = (min, max) => min + Math.random() * (max - min);

function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        if (signal) {
            signal.addEventListener(
                "abort",
                () => {
                    clearTimeout(timer);
                    reject(new DOMException("Aborted", "AbortError"));
                },
                { once: true }
            );
        }
    });
}

const ok = (data, status = 200) => ({ status, data });
const fail = (status, code, message) => ({ status, data: { error: { code, message } } });
const findTrack = (id) => tracks.find((t) => t.id === id);

function fileEntries(body) {
    if (typeof FormData !== "undefined" && body instanceof FormData) {
        return body.getAll("files").map((file, i) => ({ name: file.name, path: body.getAll("paths")[i] || file.name }));
    }
    return ((body && body.files) || []).map((f) => (typeof f === "string" ? { name: f.split(/[\\/]/).pop(), path: f } : f));
}

function createJob(entries) {
    const jobId = `job_${Date.now().toString(36)}_${++jobSeq}`;
    const startedAt = Date.now();
    const items = entries.map((entry, i) => ({
        id: `${jobId}_${i}`,
        nombre: entry.name,
        path: entry.path,
        broken: /corrupt|broken/i.test(entry.name),
        startAt: startedAt + i * 450,
        durationMs: 2600 + Math.random() * 2400,
        seed: i,
        track: null,
    }));
    jobs.set(jobId, { jobId, items, total: entries.length });
    return jobs.get(jobId);
}

function materializeTrack(item, total) {
    const base = DEMO_TRACKS[(item.seed + total) % DEMO_TRACKS.length];
    const bpm = 120 + Math.round(Math.random() * 16);
    const track = {
        ...base,
        id: `trk_${item.id}`,
        title: item.nombre.replace(/\.[^.]+$/, ""),
        artist: "Sin identificar",
        album: "Importación local",
        bpm,
        cues: buildClubCues(bpm, base.duration),
        quality: Math.random() > 0.8 ? "fake" : "verified",
        path: item.path,
    };
    tracks.unshift(track);
    return track;
}

function snapshotItem(item, total, now) {
    const { id, nombre } = item;
    if (now < item.startAt) return { id, nombre, progreso: 0, estado: "cola" };
    const progreso = Math.min(100, ((now - item.startAt) / item.durationMs) * 100);
    if (item.broken && progreso > 55) return { id, nombre, progreso: 55, estado: "error", mensaje: "Cabecera de stream ilegible" };
    if (progreso >= 100) {
        if (!item.track) item.track = materializeTrack(item, total);
        return { id, nombre, progreso: 100, estado: "listo", track: item.track };
    }
    return { id, nombre, progreso: Math.round(progreso), estado: "analizando" };
}

function snapshotJob(job) {
    const now = Date.now();
    const items = job.items.map((item) => snapshotItem(item, job.total, now));
    const done = items.every((i) => i.estado === "listo" || i.estado === "error");
    return { jobId: job.jobId, status: done ? "completed" : "running", items };
}

const routes = [
    ["GET", "/api/health", () => ok({ status: "ok", engine: "mock", version: "1.0.0" })],

    ["GET", "/api/tracks", async (_, { signal }) => {
        await sleep(latency(250, 450), signal);
        return ok({ items: tracks, total: tracks.length });
    }],

    ["POST", "/api/library/upload", async (_, { body, signal }) => {
        const entries = fileEntries(body);
        if (!entries.length) return fail(422, "no_files", "No se recibieron archivos");
        await sleep(latency(120, 260), signal);
        const job = createJob(entries);
        return ok(snapshotJob(job), 202);
    }],

    ["GET", "/api/ingest/jobs/:jobId", async ({ jobId }) => {
        const job = jobs.get(jobId);
        return job ? ok(snapshotJob(job)) : fail(404, "job_not_found", "Trabajo de ingesta inexistente");
    }],

    ["GET", "/api/tracks/:trackId/compatibility", async ({ trackId }, { signal }) => {
        await sleep(latency(80, 180), signal);
        return findTrack(trackId) ? ok({ masterId: trackId, scores: null }) : fail(404, "track_not_found", "Pista no encontrada");
    }],

    ["POST", "/api/tracks/fingerprint", async (_, { body, signal }) => {
        const track = findTrack(body && body.trackId);
        if (!track) return fail(404, "track_not_found", "Pista no encontrada");
        await sleep(latency(2200, 3000), signal);
        return ok({ trackId: track.id, candidates: DEMO_CANDIDATES(track) });
    }],

    ["PATCH", "/api/tracks/:trackId/metadata", async ({ trackId }, { body, signal }) => {
        const track = findTrack(trackId);
        if (!track) return fail(404, "track_not_found", "Pista no encontrada");
        await sleep(latency(800, 1300), signal);
        Object.assign(track, (body && body.fields) || {});
        return ok({ track, targets: (body && body.targets) || [] });
    }],

    ["GET", "/api/tracks/:trackId/cues", async ({ trackId }, { signal }) => {
        const track = findTrack(trackId);
        if (!track) return fail(404, "track_not_found", "Pista no encontrada");
        await sleep(latency(350, 600), signal);
        return ok({ trackId, cues: track.cues });
    }],

    ["PUT", "/api/tracks/:trackId/cues/:index", async ({ trackId, index }, { body, signal }) => {
        const track = findTrack(trackId);
        const slot = Number(index);
        if (!track) return fail(404, "track_not_found", "Pista no encontrada");
        if (!Number.isInteger(slot) || slot < 0 || slot > 7) return fail(422, "invalid_cue_index", "Índice de cue fuera de rango (0-7)");
        await sleep(latency(150, 300), signal);
        const cue = { time: body.positionMs / 1000, color: body.color, name: body.name };
        track.cues = Array.from({ length: 8 }, (_, i) => (i === slot ? cue : track.cues[i] || null));
        return ok({ trackId, index: slot, cue });
    }],

    ["DELETE", "/api/tracks/:trackId/cues/:index", async ({ trackId, index }, { signal }) => {
        const track = findTrack(trackId);
        if (!track) return fail(404, "track_not_found", "Pista no encontrada");
        await sleep(latency(120, 240), signal);
        track.cues = track.cues.map((c, i) => (i === Number(index) ? null : c));
        return { status: 204, data: null };
    }],

    ["POST", "/api/exports", async (_, { body, signal }) => {
        const formats = ["rekordbox", "serato", "traktor"];
        if (!body || !formats.includes(body.format)) return fail(422, "invalid_format", "Formato de exportación no soportado");
        await sleep(latency(300, 600), signal);
        return ok({ exportId: `exp_${Date.now().toString(36)}`, format: body.format, status: "queued" }, 202);
    }],
].map(([method, pattern, handler]) => {
    const keys = [];
    const regex = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, key) => (keys.push(key), "([^/]+)"))}$`);
    return { method, regex, keys, handler };
});

export async function handleMockRequest(method, path, options = {}) {
    for (const route of routes) {
        if (route.method !== method) continue;
        const match = route.regex.exec(path);
        if (!match) continue;
        const params = Object.fromEntries(route.keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]));
        return route.handler(params, options);
    }
    return fail(404, "route_not_found", `${method} ${path} no existe`);
}
