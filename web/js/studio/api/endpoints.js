import { getApiConfig } from "./config.js";
import { http } from "./http.js";

// REST contract consumed by the Studio. Components import only from this module.
//
//   GET    /api/health
//   GET    /api/tracks                              -> { items: Track[], total }
//   POST   /api/library/upload        (multipart)   -> 202 IngestJob
//   GET    /api/ingest/jobs/:jobId                  -> IngestJob
//   GET    /api/tracks/:id/compatibility            -> { masterId, scores: Record<id, number> | null }
//   POST   /api/tracks/fingerprint    { trackId }   -> { trackId, candidates: Candidate[] }
//   PATCH  /api/tracks/:id/metadata   { fields, targets } -> { track, targets }
//   GET    /api/tracks/:id/cues                     -> { trackId, cues: (Cue | null)[8] }
//   PUT    /api/tracks/:id/cues/:index { positionMs, color, name }
//   DELETE /api/tracks/:id/cues/:index
//   POST   /api/exports               { format }    -> 202 { exportId, status }
//
// IngestJob = { jobId, status: "running" | "completed", items: [{ id, nombre, progreso, estado, mensaje?, track? }] }

const enc = encodeURIComponent;

export const api = {
    health: (options) => http.get("/api/health", options),

    tracks: {
        list: (options) => http.get("/api/tracks", options),
        compatibility: (trackId, options) => http.get(`/api/tracks/${enc(trackId)}/compatibility`, options),
        fingerprint: (trackId, options) => http.post("/api/tracks/fingerprint", { trackId }, options),
        updateMetadata: (trackId, fields, targets, options) => http.patch(`/api/tracks/${enc(trackId)}/metadata`, { fields, targets }, options),
    },

    cues: {
        list: (trackId, options) => http.get(`/api/tracks/${enc(trackId)}/cues`, options),
        save: (trackId, index, { positionMs, color, name }, options) =>
            http.put(`/api/tracks/${enc(trackId)}/cues/${index}`, { positionMs, color, name }, options),
        remove: (trackId, index, options) => http.delete(`/api/tracks/${enc(trackId)}/cues/${index}`, options),
    },

    library: {
        upload: (files, options) => {
            const form = new FormData();
            files.forEach((file) => {
                form.append("files", file, file.name);
                form.append("paths", file.webkitRelativePath || file.name);
            });
            return http.post("/api/library/upload", form, options);
        },
    },

    ingest: {
        job: (jobId, options) => http.get(`/api/ingest/jobs/${enc(jobId)}`, options),

        // Short polling works identically in browsers, Tauri webviews and Capacitor,
        // with no socket or native-plugin dependency.
        watch(jobId, onUpdate, { signal, intervalMs = getApiConfig().pollIntervalMs } = {}) {
            return new Promise((resolve, reject) => {
                let failures = 0;
                const tick = async () => {
                    if (signal && signal.aborted) return resolve(null);
                    try {
                        const job = await api.ingest.job(jobId, { signal });
                        failures = 0;
                        onUpdate(job);
                        if (job.status === "completed") return resolve(job);
                    } catch (error) {
                        if (signal && signal.aborted) return resolve(null);
                        if (++failures >= 5) return reject(error);
                    }
                    setTimeout(tick, intervalMs);
                };
                tick();
            });
        },
    },

    exports: {
        create: (format, options) => http.post("/api/exports", { format }, options),
    },
};
