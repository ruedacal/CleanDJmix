const { useState, useEffect, useRef, useMemo, useCallback } = React;
import { Icons } from '../shell/icons.jsx';
import { TableHarmonicWaveform, formatMsToTime } from '../waveforms/index.js';
import { DEFAULT_VINYL_SVG, getValidCover } from '../data/constants.js';
import { SectionTitle } from '../shell/workspace-ui.jsx';
import { UnifiedLibraryBrowserModal } from '../modals/index.js';

// =========================================================================
// ESPACIO DE TRABAJO: SET-BUILDER & ENERGY FLOW CANVAS (MOTOR ROBUSTO)
// =========================================================================

function parseCamelotKey(keyStr) {
    if (!keyStr || keyStr === '--' || keyStr === '?') return null;
    const match = String(keyStr).trim().toUpperCase().match(/^(\d{1,2})([AB])$/);
    if (match) {
        return { num: parseInt(match[1], 10), letter: match[2] };
    }
    return null;
}

function getTrackBpm(t) {
    if (!t) return null;
    for (const k of [t.bpm, t.b, t.displayBpm]) {
        if (k !== undefined && k !== null && k !== '' && k !== '--') {
            const v = parseFloat(k);
            if (!isNaN(v) && v > 40 && v < 250) return Math.round(v * 100) / 100;
        }
    }
    return null;
}

function getTrackKey(t) {
    if (!t) return null;
    for (const k of [t.key, t.k, t.tonalidad, t.initial_key]) {
        if (k && k !== '--' && k !== '?' && k !== 'N/D') {
            return String(k).trim().toUpperCase();
        }
    }
    return null;
}

function getTrackLufs(t) {
    if (!t) return -8.5;
    for (const k of [t.lufs, t.integrated_lufs, t.loudness_lufs]) {
        if (k !== undefined && k !== null && k !== '' && k !== '--') {
            const v = parseFloat(k);
            if (!isNaN(v) && v < 0) return Math.round(v * 10) / 10;
        }
    }
    return -8.5;
}

function parseDurationSec(val) {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return (!isNaN(val) && val > 0) ? val : 0;
    const str = String(val).trim();
    if (str.includes(':')) {
        const parts = str.split(':').map(p => parseFloat(p) || 0);
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
    }
    const num = parseFloat(str);
    return (!isNaN(num) && num > 0) ? num : 0;
}

function evaluateHarmonicTransition(keyA, keyB) {
    const kA = parseCamelotKey(keyA);
    const kB = parseCamelotKey(keyB);
    if (!kA || !kB) {
        return {
            type: 'UNKNOWN',
            badge: '❓ Tonalidad N/D',
            color: 'bg-djzinc-800 text-gray-400 border-djzinc-700',
            score: 50,
            desc: 'Una de las pistas no tiene tonalidad Camelot detectada. Audita las pistas para calcular compatibilidad.'
        };
    }

    if (kA.num === kB.num && kA.letter === kB.letter) {
        return {
            type: 'EXACT',
            badge: '🟢 Misma Clave (0)',
            color: 'bg-emerald-950/90 text-emerald-300 border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
            score: 100,
            desc: 'Armonía perfecta (0): Mismo tono y modo. Fusión de bajo y melodías completamente transparente.'
        };
    }

    if (kA.num === kB.num && kA.letter !== kB.letter) {
        return {
            type: 'MODAL',
            badge: '🟣 Cambio Modal (A↔B)',
            color: 'bg-purple-950/90 text-purple-300 border-purple-600 shadow-[0_0_8px_rgba(168,85,247,0.3)]',
            score: 95,
            desc: 'Giro emocional (A↔B): Modulación entre escala menor y mayor relativa.'
        };
    }

    const diff = (kB.num - kA.num + 12) % 12;

    if (diff === 1 && kA.letter === kB.letter) {
        return {
            type: 'BOOST_PLUS_1',
            badge: '⚡ Subida Energía (+1)',
            color: 'bg-amber-950/90 text-amber-300 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
            score: 90,
            desc: 'Subida de tensión (+1): Inyección natural de energía armónica en pista.'
        };
    }

    if (diff === 11 && kA.letter === kB.letter) {
        return {
            type: 'DROP_MINUS_1',
            badge: '🔵 Descenso Suave (-1)',
            color: 'bg-cyan-950/90 text-cyan-300 border-cyan-600 shadow-[0_0_8px_rgba(6,182,212,0.3)]',
            score: 85,
            desc: 'Descenso suave (-1): Relajación armónica hacia tonalidades más profundas o oscuras.'
        };
    }

    if (diff === 2 && kA.letter === kB.letter) {
        return {
            type: 'BOOST_PLUS_2',
            badge: '🔥 Salto Doble (+2)',
            color: 'bg-orange-950/90 text-orange-300 border-orange-500',
            score: 75,
            desc: 'Salto doble de energía (+2): Mezclar en drop o corte percusivo para impacto máximo.'
        };
    }

    if ((diff === 1 || diff === 11) && kA.letter !== kB.letter) {
        return {
            type: 'DIAGONAL',
            badge: '🔷 Diagonal (±1 A/B)',
            color: 'bg-blue-950/90 text-cyan-400 border-blue-600',
            score: 70,
            desc: 'Modulación diagonal: Transición cruzada armónicamente aceptable con frases largas.'
        };
    }

    return {
        type: 'CLASH',
        badge: '⚠️ Choque Disonante',
        color: 'bg-rose-950/90 text-rose-300 border-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.3)]',
        score: 30,
        desc: 'Conflicto armónico. No solapar sintes o voces; mezclar en sección percusiva limpia.'
    };
}

function evaluateLufsTransition(lufsA, lufsB) {
    const vA = (lufsA !== undefined && lufsA !== null) ? parseFloat(lufsA) : -9.0;
    const vB = (lufsB !== undefined && lufsB !== null) ? parseFloat(lufsB) : -9.0;
    const delta = Math.round((vB - vA) * 10) / 10;
    const absDelta = Math.abs(delta);

    if (absDelta > 2.5) {
        const sign = delta > 0 ? `+${delta}` : `${delta}`;
        const advice = delta > 0 
            ? `Bajar Trim/Ganancia ~${absDelta} dB en mesa antes de abrir el fader.`
            : `Subir Trim/Ganancia ~${absDelta} dB para compensar caída de volumen.`;
        return {
            isAlert: true,
            delta,
            badge: `⚠️ Salto LUFS ${sign} dB`,
            color: 'bg-amber-950/90 text-amber-300 border-amber-600',
            advice
        };
    }

    return {
        isAlert: false,
        delta,
        badge: `🟢 LUFS Equilibrado (${delta > 0 ? '+' : ''}${delta} dB)`,
        color: 'bg-djzinc-850 text-emerald-400 border-djzinc-700',
        advice: 'Sonoridad uniforme sin saltos de volumen en pista.'
    };
}

function evaluateAntiMuddyTransition(trackA, trackB) {
    const isBassA = (trackA?.low_ratio || 33) >= 45 || trackA?.acoustic_role === 'Bass Driver';
    const isBassB = (trackB?.low_ratio || 33) >= 45 || trackB?.acoustic_role === 'Bass Driver';

    if (isBassA && isBassB) {
        return {
            isCollision: true,
            badge: '⚠️ Colisión Bass (30-80 Hz)',
            color: 'bg-red-950/90 text-red-300 border-red-700 animate-pulse',
            advice: 'Ambos temas son Bass Drivers. Cortar EQ Low del tema saliente antes del drop para evitar barrizal de graves y cancelación de fase.'
        };
    }

    const isCompA = isBassA && (trackB?.acoustic_role === 'Vocal / Lead' || trackB?.acoustic_role === 'Percussive Tool');
    const isCompB = isBassB && (trackA?.acoustic_role === 'Vocal / Lead' || trackA?.acoustic_role === 'Percussive Tool');

    if (isCompA || isCompB) {
        return {
            isCollision: false,
            badge: '🟢 Espectros Complementarios',
            color: 'bg-emerald-950/90 text-emerald-300 border-emerald-700',
            advice: 'Mezcla limpia garantizada: Una pista aporta el cuerpo subgrave y la otra rellena medios/agudos sin empastar.'
        };
    }

    return {
        isCollision: false,
        badge: '🔵 Espectro Neutro',
        color: 'bg-djzinc-850 text-gray-300 border-djzinc-700',
        advice: 'Distribución de frecuencias equilibrada.'
    };
}

export const SetBuilderWorkspace = ({
    setTracks = [],
    setSetTracks,
    auditTracks = [],
    setAuditTracks,
    onPlayTrack,
    nowPlayingTrack,
    isPlaying,
    onTogglePlay,
    onNavigateTab,
    lang = "es",
    customLibraries = [],
    activeCustomLibId = null,
    onSaveCustomLibraries = null
}) => {
    const [setName, setSetName] = useState("BeatWave_Mainstage_Set");
    const [selectedTrackIdx, setSelectedTrackIdx] = useState(null);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [fsBrowserOpen, setFsBrowserOpen] = useState(false);
    const [searchAddQuery, setSearchAddQuery] = useState("");
    const [exportStatus, setExportStatus] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isAuditingSet, setIsAuditingSet] = useState(false);
    const [auditSetProgress, setAuditSetProgress] = useState(0);
    const [folderLoading, setFolderLoading] = useState(false);
    const [folderProgress, setFolderProgress] = useState({ pct: 0, msg: '' });

    // Nuevos Modos: 'list' (Secuencial) | 'graph' (Graph Playlists) | 'ai_advisor' (Asesor AI & Calidad)
    const [viewMode, setViewMode] = useState('list');
    const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
    const [isLoadingGraph, setIsLoadingGraph] = useState(false);
    const [aiAuditResult, setAiAuditResult] = useState(null);
    const [isLoadingAiAudit, setIsLoadingAiAudit] = useState(false);
    const [hoveredFlowIdx, setHoveredFlowIdx] = useState(null);

    // Sincronizar automáticamente metadatos si las pistas fueron auditadas en otra pestaña
    useEffect(() => {
        if (!auditTracks || auditTracks.length === 0 || !setTracks || setTracks.length === 0) return;
        let hasChanges = false;
        const updated = setTracks.map(st => {
            const found = auditTracks.find(at => 
                (at.id && String(at.id) === String(st.id)) ||
                (at.path && st.path && at.path === st.path) ||
                (at.filename && st.filename && at.filename === st.filename)
            );
            if (found) {
                const newBpm = found.bpm || found.b;
                const newKey = found.key || found.k;
                const newLufs = found.lufs || found.integrated_lufs;
                const newRole = found.acoustic_role;
                if (
                    (newBpm && newBpm !== '--' && st.bpm !== newBpm) ||
                    (newKey && newKey !== '--' && st.key !== newKey) ||
                    (newRole && st.acoustic_role !== newRole)
                ) {
                    hasChanges = true;
                    return {
                        ...st,
                        ...found,
                        bpm: (newBpm && newBpm !== '--') ? newBpm : st.bpm,
                        key: (newKey && newKey !== '--') ? newKey : st.key,
                        lufs: (newLufs && newLufs !== '--') ? newLufs : st.lufs,
                        acoustic_role: newRole || st.acoustic_role || 'Balanced Full-Range',
                        low_ratio: found.low_ratio || st.low_ratio || 33.3,
                        mid_ratio: found.mid_ratio || st.mid_ratio || 33.3,
                        high_ratio: found.high_ratio || st.high_ratio || 33.4
                    };
                }
            }
            return st;
        });
        if (hasChanges) {
            setSetTracks(updated);
        }
    }, [auditTracks]);

    // Estadísticas globales del Set a prueba de fallos (sin NaNs)
    const stats = useMemo(() => {
        if (!setTracks || setTracks.length === 0) {
            return { totalDurationSec: 0, minBpm: 0, maxBpm: 0, avgBpm: 0, avgLufs: 0, harmonicScore: 100, pendingAuditCount: 0 };
        }

        let totalSec = 0;
        let validBpms = [];
        let validLufs = [];
        let pendingAudit = 0;

        setTracks.forEach(t => {
            const rawD = t.duration_sec || t.duration || t.duracion || 0;
            const d = parseDurationSec(rawD);
            totalSec += (d > 0 ? d : 240);

            const b = getTrackBpm(t);
            if (b !== null) {
                validBpms.push(b);
            } else {
                pendingAudit++;
            }

            const l = getTrackLufs(t);
            validLufs.push(l);
        });

        const minBpm = validBpms.length > 0 ? Math.round(Math.min(...validBpms)) : 124;
        const maxBpm = validBpms.length > 0 ? Math.round(Math.max(...validBpms)) : 128;
        const avgBpm = validBpms.length > 0 ? Math.round((validBpms.reduce((a, b) => a + b, 0) / validBpms.length) * 10) / 10 : 126;
        const avgLufs = validLufs.length > 0 ? Math.round((validLufs.reduce((a, b) => a + b, 0) / validLufs.length) * 10) / 10 : -8.5;

        // Calcular puntuación armónica global
        let totalScore = 0;
        let transitionsCount = Math.max(1, setTracks.length - 1);
        for (let i = 0; i < setTracks.length - 1; i++) {
            const trkA = setTracks[i];
            const trkB = setTracks[i + 1];
            const harm = evaluateHarmonicTransition(getTrackKey(trkA), getTrackKey(trkB));
            totalScore += harm.score;
        }
        const harmonicScore = setTracks.length <= 1 ? 100 : Math.round(totalScore / transitionsCount);

        return { totalDurationSec: totalSec, minBpm, maxBpm, avgBpm, avgLufs, harmonicScore, pendingAuditCount: pendingAudit };
    }, [setTracks]);

    // Formatear duración en HH:MM:SS
    const formattedDuration = useMemo(() => {
        const s = stats.totalDurationSec;
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = Math.floor(s % 60);
        if (hrs > 0) {
            return `${hrs}h ${mins < 10 ? '0' : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
        }
        return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }, [stats.totalDurationSec]);

    // Reordenar pista arriba/abajo
    const handleMoveTrack = (index, direction) => {
        const newIdx = index + direction;
        if (newIdx < 0 || newIdx >= setTracks.length) return;
        const updated = [...setTracks];
        const [moved] = updated.splice(index, 1);
        updated.splice(newIdx, 0, moved);
        setSetTracks(updated);
        setSelectedTrackIdx(newIdx);
    };

    // Eliminar pista del set
    const handleRemoveTrack = (index) => {
        const updated = setTracks.filter((_, i) => i !== index);
        setSetTracks(updated);
        if (selectedTrackIdx === index) setSelectedTrackIdx(null);
    };

    // Añadir pista al set con normalización robusta de metadatos
    const handleAddTrack = (track) => {
        if (!track) return;
        const normalized = {
            ...track,
            id: track.id || `set_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            path: track.path || track.filepath || track.f || '',
            f: track.f || track.path || track.filepath || '',
            title: track.title || track.t || track.filename || 'Pista',
            t: track.title || track.t || track.filename || 'Pista',
            artist: track.artist || track.a || 'Artista',
            a: track.artist || track.a || 'Artista',
            bpm: getTrackBpm(track) || track.bpm || track.b,
            key: getTrackKey(track) || track.key || track.k,
            lufs: getTrackLufs(track),
            acoustic_role: track.acoustic_role || 'Balanced Full-Range',
            low_ratio: track.low_ratio || 33.3,
            mid_ratio: track.mid_ratio || 33.3,
            high_ratio: track.high_ratio || 33.4,
            duration_sec: parseDurationSec(track.duration_sec || track.duration) || 240
        };
        setSetTracks(prev => [...prev, normalized]);
    };

    // Añadir todas las pistas disponibles desde la biblioteca de auditoría
    const handleAddAllFromLibrary = () => {
        if (!auditTracks || auditTracks.length === 0) {
            setExportStatus({ type: 'error', msg: 'No hay pistas en la biblioteca de auditoría para añadir. Carga primero una carpeta.' });
            setTimeout(() => setExportStatus(null), 3500);
            return;
        }
        const formatted = auditTracks.map((t, idx) => ({
            ...t,
            id: t.id || `set_${Date.now()}_${idx}`,
            path: t.path || t.filepath || t.f || '',
            f: t.f || t.path || t.filepath || '',
            title: t.title || t.t || t.filename || `Pista ${idx + 1}`,
            t: t.title || t.t || t.filename || `Pista ${idx + 1}`,
            artist: t.artist || t.a || 'Artista',
            a: t.artist || t.a || 'Artista',
            bpm: getTrackBpm(t) || t.bpm || t.b,
            key: getTrackKey(t) || t.key || t.k,
            lufs: getTrackLufs(t),
            acoustic_role: t.acoustic_role || 'Balanced Full-Range',
            low_ratio: t.low_ratio || 33.3,
            mid_ratio: t.mid_ratio || 33.3,
            high_ratio: t.high_ratio || 33.4,
            duration_sec: parseDurationSec(t.duration_sec || t.duration) || 240
        }));
        setSetTracks(formatted);
        setIsAddDrawerOpen(false);
        setExportStatus({ type: 'success', msg: `✓ Se han añadido todas las ${formatted.length} pistas de la biblioteca al Set.` });
        setTimeout(() => setExportStatus(null), 4000);
    };

    // Añadir 25 pistas aleatorias desde la biblioteca de auditoría
    const handleAddRandom25 = () => {
        if (!auditTracks || auditTracks.length === 0) {
            setExportStatus({ type: 'error', msg: 'No hay pistas en la biblioteca de auditoría. Carga primero una carpeta de música.' });
            setTimeout(() => setExportStatus(null), 3500);
            return;
        }
        const shuffled = [...auditTracks].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(25, shuffled.length));
        const formatted = selected.map((t, idx) => ({
            ...t,
            id: t.id || `set_rand_${Date.now()}_${idx}`,
            path: t.path || t.filepath || t.f || '',
            f: t.f || t.path || t.filepath || '',
            title: t.title || t.t || t.filename || `Pista ${idx + 1}`,
            t: t.title || t.t || t.filename || `Pista ${idx + 1}`,
            artist: t.artist || t.a || 'Artista',
            a: t.artist || t.a || 'Artista',
            bpm: getTrackBpm(t) || t.bpm || t.b,
            key: getTrackKey(t) || t.key || t.k,
            lufs: getTrackLufs(t),
            acoustic_role: t.acoustic_role || 'Balanced Full-Range',
            low_ratio: t.low_ratio || 33.3,
            mid_ratio: t.mid_ratio || 33.3,
            high_ratio: t.high_ratio || 33.4,
            duration_sec: parseDurationSec(t.duration_sec || t.duration) || 240
        }));
        setSetTracks(formatted);
        setIsAddDrawerOpen(false);
        setExportStatus({ type: 'success', msg: `✓ ${formatted.length} pistas aleatorias seleccionadas de tu biblioteca y añadidas al Set.` });
        setTimeout(() => setExportStatus(null), 4000);
    };

    // Cargar colección guardada completa en el Set
    const handleCargarColeccion = (targetLibId = null) => {
        const activeLib = (targetLibId && (customLibraries || []).find(l => l.id === targetLibId))
            || (customLibraries || []).find(l => l.id === activeCustomLibId) 
            || (customLibraries && customLibraries[0]);
        const colTracks = [];
        const seenKeys = new Set();
        if (activeLib && activeLib.folders) {
            activeLib.folders.forEach(f => {
                (f.tracks || []).forEach(tr => {
                    const key = tr.path || tr.filepath || tr.f || tr.id;
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        colTracks.push(tr);
                    }
                });
            });
        }
        if (colTracks.length > 0) {
            const formattedTracks = colTracks.map((t, idx) => ({
                ...t,
                id: t.id || `set_col_${Date.now()}_${idx}`,
                path: t.path || t.filepath || t.f || '',
                f: t.f || t.path || t.filepath || '',
                title: t.title || t.t || t.filename || `Track ${idx + 1}`,
                t: t.title || t.t || t.filename || `Track ${idx + 1}`,
                artist: t.artist || t.a || 'Artista',
                a: t.artist || t.a || 'Artista',
                bpm: getTrackBpm(t) || t.bpm || t.b,
                key: getTrackKey(t) || t.key || t.k,
                lufs: getTrackLufs(t),
                acoustic_role: t.acoustic_role || 'Balanced Full-Range',
                low_ratio: t.low_ratio || 33.3,
                mid_ratio: t.mid_ratio || 33.3,
                high_ratio: t.high_ratio || 33.4,
                duration_sec: parseDurationSec(t.duration_sec || t.duration) || 240
            }));
            setSetTracks(prev => [...prev, ...formattedTracks]);
            if (setAuditTracks) {
                setAuditTracks(prev => {
                    const merged = [...prev];
                    formattedTracks.forEach(nt => {
                        if (!merged.some(x => x.path === nt.path)) merged.push(nt);
                    });
                    return merged;
                });
            }
            setExportStatus({ type: 'success', msg: `✓ Se han añadido ${formattedTracks.length} pistas al Set desde la Colección "${activeLib.name || 'Colección'}"` });
        } else {
            setExportStatus({ type: 'error', msg: 'La colección seleccionada está vacía.' });
        }
        setTimeout(() => setExportStatus(null), 4000);
    };

    // Abre la modal unificada de selección de biblioteca y carpetas
    const handleAddFolderToSet = () => {
        setFsBrowserOpen(true);
    };

    // Procesa las pistas seleccionadas desde la modal unificada
    const handleCargarRutaAlSet = async (targets) => {
        setFsBrowserOpen(false);
        try {
            setFolderLoading(true);
            setFolderProgress({ pct: 10, msg: 'Examinando y cargando archivos...' });
            const targetPath = Array.isArray(targets) ? targets[0] : targets;
            let rawTracks = [];
            try {
                const resp = await fetch('/api/escanear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ruta: targetPath })
                });
                if (resp.ok) {
                    const data = await resp.json();
                    if (data && Array.isArray(data.tracks)) rawTracks = data.tracks;
                }
            } catch (e) {}

            if ((!rawTracks || rawTracks.length === 0) && window.eel && window.eel.cargar_metadatos_directorio) {
                try {
                    const resEel = await window.eel.cargar_metadatos_directorio(targets)();
                    if (resEel && Array.isArray(resEel.tracks)) rawTracks = resEel.tracks;
                } catch (e) {}
            }

            if (rawTracks && rawTracks.length > 0) {
                const formattedTracks = rawTracks.map((t, idx) => ({
                    ...t,
                    id: t.id || `set_${Date.now()}_${idx}`,
                    path: t.path || t.filepath || t.f || '',
                    f: t.f || t.path || t.filepath || '',
                    title: t.title || t.t || t.filename || `Track ${idx + 1}`,
                    t: t.title || t.t || t.filename || `Track ${idx + 1}`,
                    artist: t.artist || t.a || 'Artista',
                    a: t.artist || t.a || 'Artista',
                    bpm: getTrackBpm(t) || t.bpm || t.b,
                    key: getTrackKey(t) || t.key || t.k,
                    lufs: getTrackLufs(t),
                    acoustic_role: t.acoustic_role || 'Balanced Full-Range',
                    low_ratio: t.low_ratio || 33.3,
                    mid_ratio: t.mid_ratio || 33.3,
                    high_ratio: t.high_ratio || 33.4,
                    duration_sec: parseDurationSec(t.duration_sec || t.duration) || 240
                }));
                setSetTracks(prev => [...prev, ...formattedTracks]);
                if (setAuditTracks) {
                    setAuditTracks(prev => {
                        const merged = [...prev];
                        formattedTracks.forEach(nt => {
                            if (!merged.some(x => x.path === nt.path)) merged.push(nt);
                        });
                        return merged;
                    });
                }
                const folderName = typeof targetPath === 'string' ? (targetPath.split('/').pop() || targetPath) : 'archivos seleccionados';
                setExportStatus({ type: 'success', msg: `✓ Se han añadido ${formattedTracks.length} pistas al Set desde "${folderName}"` });
            } else {
                setExportStatus({ type: 'error', msg: 'No se encontraron pistas de audio compatibles en la ruta seleccionada.' });
            }
        } catch (err) {
            console.error("Error al añadir carpeta al set:", err);
            setExportStatus({ type: 'error', msg: `Error: ${err.message || err}` });
        } finally {
            setFolderLoading(false);
            setTimeout(() => setExportStatus(null), 4000);
        }
    };

    // Cargar Grafo de Transiciones No Lineales (DJOID Graph Playlists)
    const handleCargarGrafo = async () => {
        if (!setTracks || setTracks.length === 0) return;
        setIsLoadingGraph(true);
        try {
            if (window.eel && window.eel.generar_grafo_playlist) {
                const res = await window.eel.generar_grafo_playlist(setTracks, auditTracks)();
                if (res) setGraphData(res);
            } else {
                const resp = await fetch('/api/session/graph', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ set_tracks: setTracks, library_tracks: auditTracks })
                });
                if (resp.ok) {
                    const res = await resp.json();
                    if (res) setGraphData(res);
                }
            }
        } catch (e) {
            console.error("Error generando grafo:", e);
        } finally {
            setIsLoadingGraph(false);
        }
    };

    // Auditar Calidad de la Sesión con Google Gemini AI y DSP Engine
    const handleAuditarSesionAi = async () => {
        if (!setTracks || setTracks.length === 0) {
            alert("Añade al menos una pista a la sesión para poder auditarla.");
            return;
        }
        setIsLoadingAiAudit(true);
        try {
            if (window.eel && window.eel.auditar_calidad_sesion_ai) {
                const res = await window.eel.auditar_calidad_sesion_ai(setTracks, auditTracks)();
                if (res) setAiAuditResult(res);
            } else {
                const resp = await fetch('/api/session/audit_ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ set_tracks: setTracks, library_tracks: auditTracks })
                });
                if (resp.ok) {
                    const res = await resp.json();
                    if (res) setAiAuditResult(res);
                }
            }
        } catch (e) {
            console.error("Error auditando sesión con AI:", e);
        } finally {
            setIsLoadingAiAudit(false);
        }
    };

    // Aplicar Propuesta de Sesión Alternativa generada por AI
    const handleAplicarPropuesta = (prop) => {
        if (!prop || !prop.tracks) return;
        setSetTracks([...prop.tracks]);
        setExportStatus({ type: 'success', msg: `✓ Propuesta "${prop.titulo}" aplicada a la sesión.` });
        setTimeout(() => setExportStatus(null), 4000);
    };

    // Insertar Pista Puente para resolver choque armónico
    const handleInsertarPuente = (indexFrom, bridgeTrack) => {
        if (!bridgeTrack) return;
        const updated = [...setTracks];
        updated.splice(indexFrom + 1, 0, bridgeTrack);
        setSetTracks(updated);
        setExportStatus({ type: 'success', msg: `✓ Pista puente "${bridgeTrack.title || 'Puente'}" insertada entre los temas.` });
        setTimeout(() => setExportStatus(null), 4000);
    };

    // Limpiar todo el set
    const handleClearSet = () => {
        if (window.confirm("¿Seguro que deseas vaciar todas las pistas de este set?")) {
            setSetTracks([]);
            setSelectedTrackIdx(null);
        }
    };

    // Cargar Set de Demostración con pistas locales reales de audio
    const handleLoadDemoSet = () => {
        if (auditTracks && auditTracks.length >= 3) {
            setSetTracks([...auditTracks.slice(0, 8)]);
            return;
        }
        const demo = [
            { 
                id: 101, 
                title: "Scorpia (Original Mix)", 
                artist: "Marco Bailey", 
                bpm: 126, 
                key: "8A", 
                duration_sec: 390, 
                lufs: -8.8, 
                acoustic_role: "Bass Driver", 
                low_ratio: 48, 
                mid_ratio: 32, 
                high_ratio: 20,
                format: "FLAC",
                path: "/Users/admin/Music/mi musica/Marco Bailey - Scorpia.flac",
                f: "/Users/admin/Music/mi musica/Marco Bailey - Scorpia.flac"
            },
            { 
                id: 102, 
                title: "Horny Tiger (Club Edit)", 
                artist: "Marco Bailey", 
                bpm: 127, 
                key: "9A", 
                duration_sec: 360, 
                lufs: -8.5, 
                acoustic_role: "Vocal / Lead", 
                low_ratio: 30, 
                mid_ratio: 46, 
                high_ratio: 24,
                format: "MP3",
                path: "/Users/admin/Music/mi musica/Marco Bailey - Horny Tiger.mp3",
                f: "/Users/admin/Music/mi musica/Marco Bailey - Horny Tiger.mp3"
            },
            { 
                id: 103, 
                title: "Frostbite (Peak Tool)", 
                artist: "Marco Bailey", 
                bpm: 128, 
                key: "9A", 
                duration_sec: 330, 
                lufs: -8.4, 
                acoustic_role: "Percussive Tool", 
                low_ratio: 25, 
                mid_ratio: 40, 
                high_ratio: 35,
                format: "FLAC",
                path: "/Users/admin/Music/mi musica/Marco Bailey - Frostbite.flac",
                f: "/Users/admin/Music/mi musica/Marco Bailey - Frostbite.flac"
            },
            { 
                id: 104, 
                title: "From My Mind (Hypnotic Mix)", 
                artist: "Marco Bailey", 
                bpm: 128, 
                key: "10A", 
                duration_sec: 375, 
                lufs: -7.9, 
                acoustic_role: "Bass Driver", 
                low_ratio: 49, 
                mid_ratio: 31, 
                high_ratio: 20,
                format: "FLAC",
                path: "/Users/admin/Music/mi musica/Marco Bailey - From My Mind.flac",
                f: "/Users/admin/Music/mi musica/Marco Bailey - From My Mind.flac"
            },
            { 
                id: 105, 
                title: "Jungle Laps (Rhythm Driver)", 
                artist: "Marco Bailey", 
                bpm: 129, 
                key: "10A", 
                duration_sec: 420, 
                lufs: -7.5, 
                acoustic_role: "Bass Driver", 
                low_ratio: 52, 
                mid_ratio: 30, 
                high_ratio: 18,
                format: "FLAC",
                path: "/Users/admin/Music/mi musica/Marco Bailey - Jungle Laps.flac",
                f: "/Users/admin/Music/mi musica/Marco Bailey - Jungle Laps.flac"
            },
            { 
                id: 106, 
                title: "Caliente (Outro Groove)", 
                artist: "Marco Bailey", 
                bpm: 126, 
                key: "9A", 
                duration_sec: 345, 
                lufs: -8.9, 
                acoustic_role: "Balanced Full-Range", 
                low_ratio: 35, 
                mid_ratio: 35, 
                high_ratio: 30,
                format: "FLAC",
                path: "/Users/admin/Music/mi musica/Marco Bailey - Caliente.flac",
                f: "/Users/admin/Music/mi musica/Marco Bailey - Caliente.flac"
            }
        ];
        setSetTracks(demo);
    };

    // Auto-Optimizar Pro: Algoritmo de Flujo Armónico y Progresión de BPM (Robusto y Determinista)
    const handleOptimizeHarmonicFlow = () => {
        if (!setTracks || setTracks.length < 2) return;

        let remaining = [...setTracks];
        // Orden inicial por BPM conocido ascendente
        remaining.sort((a, b) => {
            const bA = getTrackBpm(a) || 126;
            const bB = getTrackBpm(b) || 126;
            return bA - bB;
        });

        const optimized = [remaining.shift()];

        while (remaining.length > 0) {
            const current = optimized[optimized.length - 1];
            const curBpm = getTrackBpm(current) || 126;
            const curKey = getTrackKey(current) || '';

            let bestIdx = 0;
            let bestScore = -9999;

            for (let i = 0; i < remaining.length; i++) {
                const candidate = remaining[i];
                const candBpm = getTrackBpm(candidate) || curBpm || 126;
                const candKey = getTrackKey(candidate) || '';

                const harm = evaluateHarmonicTransition(curKey, candKey);
                const bpmDiff = Math.abs(candBpm - curBpm);

                const bpmScore = Math.max(0, 100 - bpmDiff * 15);

                const isCurBass = (current.low_ratio || 33) >= 45 || current.acoustic_role === 'Bass Driver';
                const isCandBass = (candidate.low_ratio || 33) >= 45 || candidate.acoustic_role === 'Bass Driver';
                const antiMuddyScore = (isCurBass && isCandBass) ? -20 : (isCurBass || isCandBass ? 20 : 0);

                const totalAffinity = (harm.score * 0.6) + (bpmScore * 0.3) + antiMuddyScore;

                if (totalAffinity > bestScore) {
                    bestScore = totalAffinity;
                    bestIdx = i;
                }
            }

            optimized.push(remaining.splice(bestIdx, 1)[0]);
        }

        setSetTracks(optimized);
        setExportStatus({ type: 'success', msg: '✓ ¡Set auto-optimizado! Progresión armónica y curva de BPM reorganizadas sin choques tonales.' });
        setTimeout(() => setExportStatus(null), 4500);
    };

    // Botón: Auditar en Lote Pistas del Set que no tengan BPM o Key
    const handleAuditSetTracks = async () => {
        const paths = setTracks.map(t => t.path || t.filepath || t.f).filter(p => Boolean(p));
        if (paths.length === 0) {
            alert("Las pistas del set no cuentan con una ruta de archivo local válida para auditar.");
            return;
        }

        setIsAuditingSet(true);
        setAuditSetProgress(15);
        setExportStatus({ type: 'loading', msg: `Iniciando auditoría acústica DSP de ${paths.length} pistas del set...` });

        try {
            if (window.eel && window.eel.iniciar_auditoria) {
                const res = await window.eel.iniciar_auditoria(paths)();
                if (res && res.tracks) {
                    const mapRes = {};
                    res.tracks.forEach(tr => {
                        if (tr.path) mapRes[tr.path] = tr;
                        if (tr.id) mapRes[String(tr.id)] = tr;
                    });
                    const updated = setTracks.map(st => {
                        const found = mapRes[st.path] || mapRes[String(st.id)];
                        return found ? { ...st, ...found } : st;
                    });
                    setSetTracks(updated);

                    if (setAuditTracks) {
                        setAuditTracks(prev => {
                            const merged = [...prev];
                            res.tracks.forEach(newTr => {
                                const exIdx = merged.findIndex(x => (x.path && x.path === newTr.path) || (x.id && String(x.id) === String(newTr.id)));
                                if (exIdx >= 0) merged[exIdx] = { ...merged[exIdx], ...newTr };
                                else merged.push(newTr);
                            });
                            return merged;
                        });
                    }
                    setExportStatus({ type: 'success', msg: `✓ Auditoría completada: ${res.tracks.length} pistas analizadas con BPM, Camelot Key, LUFS y Roles Espectrales.` });
                }
            } else {
                setExportStatus({ type: 'error', msg: 'Servicio de auditoría backend no disponible en este entorno.' });
            }
        } catch (err) {
            console.error("Error auditando pistas del set:", err);
            setExportStatus({ type: 'error', msg: `Error durante la auditoría: ${err.message || err}` });
        } finally {
            setIsAuditingSet(false);
            setAuditSetProgress(0);
            setTimeout(() => setExportStatus(null), 5000);
        }
    };

    // Auditar una única pista individual del set
    const handleAuditSingleTrack = async (track, e) => {
        if (e) e.stopPropagation();
        const pth = track.path || track.filepath || track.f;
        if (!pth) {
            alert("No se encontró la ruta del archivo de audio para auditar.");
            return;
        }
        setExportStatus({ type: 'loading', msg: `Auditando "${track.title || track.t || 'pista'}"...` });
        try {
            if (window.eel && window.eel.iniciar_auditoria) {
                const res = await window.eel.iniciar_auditoria([pth])();
                if (res && res.tracks && res.tracks.length > 0) {
                    const audited = res.tracks[0];
                    setSetTracks(prev => prev.map(t => (t.id === track.id || t.path === pth) ? { ...t, ...audited } : t));
                    if (setAuditTracks) {
                        setAuditTracks(prev => prev.map(t => (t.id === track.id || t.path === pth) ? { ...t, ...audited } : t));
                    }
                    setExportStatus({ type: 'success', msg: `✓ Pista auditada: ${audited.bpm || '--'} BPM | ${audited.key || '--'} Camelot` });
                }
            }
        } catch (err) {
            setExportStatus({ type: 'error', msg: `Error al auditar pista: ${err.message || err}` });
        } finally {
            setTimeout(() => setExportStatus(null), 4000);
        }
    };

    // Exportar Set M3U8
    const handleExportM3U = async () => {
        if (!setTracks || setTracks.length === 0) {
            alert("No hay pistas en el set para exportar.");
            return;
        }
        setIsExporting(true);
        setExportStatus({ type: 'loading', msg: 'Generando archivo M3U8...' });

        try {
            let res = null;
            if (window.eel && window.eel.exportar_set_m3u) {
                res = await window.eel.exportar_set_m3u(setTracks, setName, "/Users/admin/Music/mi musica")();
            } else {
                const resp = await fetch('/api/setbuilder/export_m3u', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tracks: setTracks, nombre_set: setName, destino_dir: "/Users/admin/Music/mi musica" })
                });
                if (resp.ok) res = await resp.json();
            }

            // Descarga de respaldo en el navegador mediante Blob
            const lines = ["#EXTM3U", `#PLAYLIST:${setName}`, `#EXTENC:UTF-8`, ""];
            setTracks.forEach(t => {
                const dur = parseInt(t.duration_sec || t.duration || 240, 10);
                const art = t.artist || t.a || 'Desconocido';
                const tit = t.title || t.t || 'Pista';
                const pth = t.path || t.filepath || t.f || t.filename || '';
                lines.push(`#EXTINF:${dur},${art} - ${tit}`);
                lines.push(pth);
            });
            const blob = new Blob([lines.join('\n')], { type: 'audio/x-mpegurl;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${setName.replace(/\s+/g, '_')}.m3u8`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            const savedPath = res && res.path ? res.path : 'Descargado en tu navegador';
            setExportStatus({ type: 'success', msg: `✓ Set exportado con éxito (${setTracks.length} pistas): ${savedPath}` });
        } catch (e) {
            setExportStatus({ type: 'error', msg: `Error al exportar set: ${e.message || e}` });
        } finally {
            setIsExporting(false);
            setTimeout(() => setExportStatus(null), 6000);
        }
    };

    // Helper para verificar con precisión si una pista dada es la que está sonando en cabina
    const isThisTrack = (trk) => {
        if (!nowPlayingTrack || !trk) return false;
        if (trk.id !== undefined && nowPlayingTrack.id !== undefined && String(nowPlayingTrack.id) === String(trk.id)) return true;
        if (trk.path && (nowPlayingTrack.path === trk.path || nowPlayingTrack.f === trk.path)) return true;
        if (trk.f && (nowPlayingTrack.f === trk.f || nowPlayingTrack.path === trk.f)) return true;
        if (trk.title && nowPlayingTrack.title && trk.title.toLowerCase() === nowPlayingTrack.title.toLowerCase()) return true;
        return false;
    };

    // Render del Canvas de Flujo de Energía & BPM (SVG Interactivo Sin NaNs)
    const renderFlowCanvas = () => {
        if (!setTracks || setTracks.length < 2) {
            return (
                <div className="h-32 flex flex-col items-center justify-center text-gray-500 font-mono text-xs border border-dashed border-djzinc-800 rounded-xl bg-djzinc-950/40">
                    <span>Añade al menos 2 pistas para visualizar la curva de BPM y flujo de energía.</span>
                </div>
            );
        }

        const width = 900;
        const height = 140;
        const padX = 55;
        const padY = 28;

        const validBpms = setTracks.map(getTrackBpm).filter(v => v !== null);
        const fallbackBpm = validBpms.length > 0 ? Math.round(validBpms.reduce((a, b) => a + b, 0) / validBpms.length) : 126;
        const minB = validBpms.length > 0 ? Math.max(60, Math.floor(Math.min(...validBpms)) - 2) : 122;
        const maxB = validBpms.length > 0 ? Math.min(180, Math.ceil(Math.max(...validBpms)) + 2) : 130;
        const bpmRange = Math.max(2, maxB - minB);

        const points = setTracks.map((t, idx) => {
            const x = padX + (idx / Math.max(1, setTracks.length - 1)) * (width - 2 * padX);
            const parsedBpm = getTrackBpm(t);
            const bpm = parsedBpm !== null ? parsedBpm : fallbackBpm;
            const y = height - padY - ((bpm - minB) / bpmRange) * (height - 2 * padY);
            return {
                x: isFinite(x) ? Math.round(x * 10) / 10 : padX,
                y: isFinite(y) ? Math.round(y * 10) / 10 : Math.round(height / 2),
                bpm,
                hasRealBpm: parsedBpm !== null,
                track: t,
                idx
            };
        });

        const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
        const areaPoints = `${padX},${height - padY} ` + polylinePoints + ` ${width - padX},${height - padY}`;

        return (
            <div className="relative w-full bg-gradient-to-b from-djzinc-900/95 to-[#07070a] border border-djzinc-800 rounded-2xl p-4 shadow-xl overflow-x-auto">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-djcyan-400 animate-ping"></span>
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-djcyan-300">
                            Lienzo de Curva de BPM & Flujo de Tensión Armónica
                        </h4>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-0.5 bg-djcyan-400 inline-block"></span> Progresión BPM ({stats.minBpm} → {stats.maxBpm})
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Tonalidad Camelot
                        </span>
                        <span className={`font-bold ${stats.harmonicScore >= 85 ? 'text-emerald-400' : stats.harmonicScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                            Score Armónico: {stats.harmonicScore}%
                        </span>
                    </div>
                </div>

                <div className="w-full overflow-hidden">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 sm:h-36 overflow-visible select-none">
                        <defs>
                            <linearGradient id="bpmCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#06b6d4" />
                                <stop offset="50%" stopColor="#a855f7" />
                                <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                            <linearGradient id="areaFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {/* Líneas horizontales de referencia con valores numéricos limpios */}
                        {[0, 0.5, 1].map((ratio, i) => {
                            const val = Math.round(minB + ratio * bpmRange);
                            const yPos = Math.round((height - padY - ratio * (height - 2 * padY)) * 10) / 10;
                            if (!isFinite(val) || !isFinite(yPos)) return null;
                            return (
                                <g key={i}>
                                    <line x1={padX} y1={yPos} x2={width - padX} y2={yPos} stroke="#27272a" strokeDasharray="3 3" />
                                    <text x={padX - 8} y={yPos + 3} fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="end">{val}</text>
                                </g>
                            );
                        })}

                        {/* Relleno bajo la curva */}
                        <polygon points={areaPoints} fill="url(#areaFillGrad)" />

                        {/* Curva de BPM continua */}
                        <polyline
                            points={polylinePoints}
                            fill="none"
                            stroke="url(#bpmCurveGrad)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Nodos interactivos de pistas: clic para reproducir audio y seleccionar */}
                        {points.map((p, idx) => {
                            const isSelected = selectedTrackIdx === idx;
                            const isCurPlaying = isThisTrack(p.track) && isPlaying;
                            const isHovered = hoveredFlowIdx === idx;
                            const keyStr = getTrackKey(p.track);
                            const nodeRadius = isSelected || isCurPlaying ? 11 : (isHovered ? 8.5 : 6.5);

                            return (
                                <g 
                                    key={idx} 
                                    className="cursor-pointer"
                                    onMouseEnter={() => setHoveredFlowIdx(idx)}
                                    onMouseLeave={() => setHoveredFlowIdx(prev => (prev === idx ? null : prev))}
                                    onClick={() => {
                                        setSelectedTrackIdx(idx);
                                        if (isThisTrack(p.track)) {
                                            if (onTogglePlay) onTogglePlay();
                                        } else if (onPlayTrack) {
                                            onPlayTrack(p.track, 0, true);
                                        }
                                    }}
                                >
                                    {/* Área de impacto fija: el hover no depende del tamaño animado del nodo */}
                                    <circle cx={p.x} cy={p.y} r="16" fill="transparent" />

                                    {/* Nodo visual: solo cambia el radio (sin transform CSS) para evitar el parpadeo */}
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={nodeRadius}
                                        fill={isCurPlaying ? "#ec4899" : isSelected ? "#06b6d4" : (p.hasRealBpm ? "#18181b" : "#27272a")}
                                        stroke={isCurPlaying ? "#ffffff" : (isSelected || isHovered) ? "#38bdf8" : (p.hasRealBpm ? "#a855f7" : "#f59e0b")}
                                        strokeWidth={isSelected || isCurPlaying ? "3" : (p.hasRealBpm ? "2" : "1.5")}
                                        strokeDasharray={p.hasRealBpm ? "none" : "2 2"}
                                        pointerEvents="none"
                                        style={{ transition: 'r 160ms ease, stroke 160ms ease' }}
                                    />

                                    {/* Indicador de Play/Pause integrado en el nodo */}
                                    {(isSelected || isCurPlaying) && (
                                        <text
                                            pointerEvents="none"
                                            x={p.x}
                                            y={p.y + 3}
                                            fill="#ffffff"
                                            fontSize="8"
                                            fontWeight="black"
                                            fontFamily="monospace"
                                            textAnchor="middle"
                                        >
                                            {isCurPlaying ? '⏸' : '▶'}
                                        </text>
                                    )}

                                    {/* Etiqueta de Track # sobre el nodo */}
                                    <text
                                        pointerEvents="none"
                                        x={p.x}
                                        y={p.y - 13}
                                        fill={isSelected ? "#38bdf8" : (p.hasRealBpm ? "#d4d4d8" : "#f59e0b")}
                                        fontSize="9.5"
                                        fontWeight="bold"
                                        fontFamily="monospace"
                                        textAnchor="middle"
                                    >
                                        #{idx + 1}
                                    </text>

                                    {/* Badge de Tonalidad Camelot bajo el nodo */}
                                    <text
                                        pointerEvents="none"
                                        x={p.x}
                                        y={height - padY + 14}
                                        fill={keyStr ? "#a855f7" : "#71717a"}
                                        fontSize="9"
                                        fontWeight="black"
                                        fontFamily="monospace"
                                        textAnchor="middle"
                                    >
                                        {keyStr || '--'}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Tooltip estable: se dibuja encima y nunca captura el puntero */}
                        {hoveredFlowIdx !== null && points[hoveredFlowIdx] && (() => {
                            const hp = points[hoveredFlowIdx];
                            const rawTitle = String(hp.track.title || hp.track.t || 'Pista');
                            const title = rawTitle.length > 30 ? `${rawTitle.slice(0, 29)}…` : rawTitle;
                            const tipW = 200;
                            const tipH = 38;
                            const tipX = Math.min(Math.max(hp.x - tipW / 2, 4), width - tipW - 4);
                            const tipY = hp.y - tipH - 22 < 0 ? hp.y + 18 : hp.y - tipH - 22;
                            const keyLabel = getTrackKey(hp.track) || '--';
                            return (
                                <g pointerEvents="none">
                                    <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="8" fill="#0e0e11" stroke="rgba(34,211,238,0.45)" />
                                    <text x={tipX + 10} y={tipY + 15} fill="#fafafa" fontSize="10" fontWeight="bold" fontFamily="monospace">
                                        {`#${hoveredFlowIdx + 1} ${title}`}
                                    </text>
                                    <text x={tipX + 10} y={tipY + 29} fill="#a1a1aa" fontSize="9" fontFamily="monospace">
                                        {`BPM ${hp.hasRealBpm ? hp.bpm : '--'} · Key ${keyLabel} · Clic: reproducir`}
                                    </text>
                                </g>
                            );
                        })()}
                    </svg>
                </div>
            </div>
        );
    };

    // Render de Graph Playlists (DJOID Inspired DAG Visualization)
    const renderGraphPlaylists = () => {
        if (!setTracks || setTracks.length === 0) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center border border-dashed border-djzinc-800 rounded-2xl bg-djzinc-950/40 p-6">
                    <div className="w-16 h-16 rounded-2xl bg-purple-950/50 border border-purple-800/60 flex items-center justify-center text-purple-400 mb-4 text-2xl">
                        <Icons.Radar size={14} className="inline-block align-[-2px]" />
                    </div>
                    <h3 className="text-base font-mono font-bold text-gray-200 uppercase">Grafo No Lineal Vacío</h3>
                    <p className="text-xs text-gray-400 max-w-md mt-1 mb-6 font-sans">
                        Añade canciones a tu set para construir el grafo de transiciones y ramificaciones con alternativas armónicas de tu biblioteca.
                    </p>
                    <button
                        type="button"
                        onClick={handleLoadDemoSet}
                        className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 cursor-pointer"
                    >
                        <Icons.Music size={14} className="inline-block align-[-2px]" /> Cargar Set de Demostración
                    </button>
                </div>
            );
        }

        const mainNodes = (graphData.nodes || []).filter(n => n.is_main_path);
        const altNodes = (graphData.nodes || []).filter(n => !n.is_main_path);

        return (
            <div className="flex flex-col gap-5">
                {/* Cabecera y Controles del Grafo */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-djzinc-900 to-[#0c0c14] border border-purple-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-purple-400 font-bold text-sm"><Icons.Radar size={14} className="inline-block align-[-2px]" /> DJOID Graph Playlists</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-200 border border-purple-700">
                                Grafo Dirigido Acíclico (DAG)
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 font-sans">
                            Estructura de sesión no lineal. Si tienes dudas en cabina, explora bifurcaciones y pistas alternativas compatibles calculadas armónicamente desde tu biblioteca.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleCargarGrafo}
                            disabled={isLoadingGraph}
                            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                        >
                            <span className={isLoadingGraph ? "animate-spin" : ""}><Icons.Refresh size={14} className="inline-block align-[-2px]" /></span>
                            <span>{isLoadingGraph ? "Calculando Grafo..." : "Regenerar Grafo"}</span>
                        </button>
                    </div>
                </div>

                {isLoadingGraph ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-mono text-purple-300">Explorando compatibilidades y ramificaciones en tu biblioteca musical...</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {/* Recorrido Paso a Paso con Nodos Principales y Bifurcaciones Alternativas */}
                        <div className="space-y-4">
                            {setTracks.map((trk, idx) => {
                                const nextTrack = (idx < setTracks.length - 1) ? setTracks[idx + 1] : null;
                                const trkKey = getTrackKey(trk) || '8A';
                                const trkBpm = getTrackBpm(trk) || 126;
                                const isCurPlaying = isThisTrack(trk) && isPlaying;

                                // Buscar alternativas para este paso desde altNodes
                                const stepAlts = altNodes.filter(an => an.step === idx + 1);
                                
                                // Borde de conexión hacia el siguiente paso
                                const mainEdge = (graphData.edges || []).find(e => 
                                    e.is_main && e.source.startsWith(`set_${idx}_`)
                                );

                                return (
                                    <div key={`dag_step_${idx}`} className="flex flex-col gap-3">
                                        {/* Tarjeta del Nodo Principal */}
                                        <div className="p-4 rounded-2xl bg-djzinc-900/90 border border-purple-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-md hover:border-purple-600/60 transition-all">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-700 flex items-center justify-center font-mono font-black text-xs text-purple-300 shrink-0">
                                                    #{idx + 1}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isThisTrack(trk)) {
                                                            if (onTogglePlay) onTogglePlay();
                                                        } else if (onPlayTrack) {
                                                            onPlayTrack(trk, 0, true);
                                                        }
                                                    }}
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border cursor-pointer ${
                                                        isCurPlaying
                                                            ? 'bg-pink-600 text-white border-pink-400 animate-pulse'
                                                            : 'bg-djzinc-800 hover:bg-djzinc-750 text-purple-300 border-djzinc-700'
                                                    }`}
                                                >
                                                    {isCurPlaying ? '⏸' : '▶'}
                                                </button>

                                                <div className="min-w-0 flex-1">
                                                    <div className="text-xs font-mono font-bold text-white truncate">
                                                        {trk.title || trk.t || trk.filename || 'Pista'}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 truncate">
                                                        {trk.artist || trk.a || 'Artista'} • {trk.genre || 'House'} • {trk.subgenre || 'Club'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="px-2.5 py-1 rounded-lg bg-djzinc-950 border border-djzinc-800 font-mono text-center">
                                                    <span className="text-[8px] text-gray-500 block uppercase">BPM</span>
                                                    <span className="text-xs font-bold text-white">{trkBpm ? Number(trkBpm).toFixed(1) : '126.0'}</span>
                                                </div>

                                                <div 
                                                    className="px-2.5 py-1 rounded-lg font-mono text-center text-black font-black text-xs shadow"
                                                    style={{ backgroundColor: MAP_CAMELOT_COLORS[trkKey.toUpperCase()] || '#06b6d4' }}
                                                >
                                                    <span className="text-[8px] opacity-80 block uppercase">KEY</span>
                                                    <span>{trkKey.toUpperCase()}</span>
                                                </div>

                                                <div className="px-2.5 py-1 rounded-lg bg-purple-950/50 border border-purple-800/60 font-mono text-center">
                                                    <span className="text-[8px] text-purple-300 block uppercase">ROL</span>
                                                    <span className="text-[11px] font-bold text-purple-200">{trk.acoustic_role || 'Balanced'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ramificaciones Alternativas (Branching Decisions) */}
                                        {stepAlts.length > 0 && (
                                            <div className="ml-6 sm:ml-12 pl-4 border-l-2 border-dashed border-purple-700/60 space-y-2 py-1">
                                                <div className="text-[10px] font-mono text-purple-300 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                                    <span><Icons.Sparkles size={14} className="inline-block align-[-2px]" /> Ramas Alternativas ({stepAlts.length} opciones desde tu biblioteca):</span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {stepAlts.map((alt, aIdx) => {
                                                        const isAltPlaying = isThisTrack(alt.track) && isPlaying;
                                                        return (
                                                            <div 
                                                                key={`alt_node_${idx}_${aIdx}`}
                                                                className="p-2.5 rounded-xl bg-[#0d0d16] border border-purple-900/60 hover:border-purple-600/80 flex items-center justify-between gap-2.5 transition-all"
                                                            >
                                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (isThisTrack(alt.track)) {
                                                                                if (onTogglePlay) onTogglePlay();
                                                                            } else if (onPlayTrack) {
                                                                                onPlayTrack(alt.track, 0, true);
                                                                            }
                                                                        }}
                                                                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border text-[11px] cursor-pointer ${
                                                                            isAltPlaying
                                                                                ? 'bg-pink-600 text-white border-pink-400'
                                                                                : 'bg-purple-950 text-purple-300 border-purple-800 hover:bg-purple-900'
                                                                        }`}
                                                                    >
                                                                        {isAltPlaying ? '⏸' : '▶'}
                                                                    </button>

                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="text-xs font-mono font-bold text-purple-200 truncate">
                                                                            {alt.title}
                                                                        </div>
                                                                        <div className="text-[10px] text-gray-400 truncate">
                                                                            {alt.artist} • {alt.bpm} BPM • <span className="font-bold text-purple-300">{alt.key}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const updated = [...setTracks];
                                                                            updated[idx] = alt.track;
                                                                            setSetTracks(updated);
                                                                            setExportStatus({ type: 'success', msg: `✓ Pista #${idx + 1} sustituida por "${alt.title}".` });
                                                                            setTimeout(() => setExportStatus(null), 3500);
                                                                        }}
                                                                        className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700 cursor-pointer shadow-sm"
                                                                        title="Sustituir pista del set por esta alternativa"
                                                                    >
                                                                        ⇄ Sustituir
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleInsertarPuente(idx, alt.track)}
                                                                        className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700 cursor-pointer"
                                                                        title="Insertar a continuación como pista puente"
                                                                    >
                                                                        + Puente
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Borde / Transición hacia el siguiente paso */}
                                        {nextTrack && (
                                            <div className="flex items-center justify-center my-1">
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0a10] border border-purple-900/50 text-[10px] font-mono">
                                                    <span className="text-purple-400 font-bold"><Icons.Download size={14} className="inline-block align-[-2px]" /> Transición #{idx + 1} ➔ #{idx + 2}</span>
                                                    {mainEdge ? (
                                                        <span className={`px-2 py-0.2 rounded-full font-bold ${
                                                            mainEdge.score >= 88 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                                            mainEdge.score >= 70 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                                            'bg-rose-950 text-rose-300 border border-rose-800'
                                                        }`}>
                                                            {mainEdge.label}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500">Paso armónico continuo</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render del Asesor de Calidad de Sesión con Google Gemini AI y Motor DSP
    const renderSessionAiAdvisor = () => {
        return (
            <div className="flex flex-col gap-6">
                {/* Cabecera del Asesor */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-[#0a0f12] border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold text-base"><Icons.Brain size={14} className="inline-block align-[-2px]" /> Asesor AI de Sesión & Calidad Acústica</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-200 border border-emerald-700">
                                Google Gemini 2.5 Flash + DSP Engine
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 font-sans">
                            Audita la calidad general de tu sesión, detecta choques tonales o de tempo, recibe críticas constructivas de cabina y explora propuestas automáticas de sesión.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleAuditarSesionAi}
                        disabled={isLoadingAiAudit || setTracks.length === 0}
                        className="px-4 py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-black shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0"
                    >
                        <span className={isLoadingAiAudit ? "animate-spin" : ""}><Icons.Zap size={14} className="inline-block align-[-2px]" /></span>
                        <span>{isLoadingAiAudit ? "Auditando con Gemini AI..." : "Auditar Calidad de Sesión"}</span>
                    </button>
                </div>

                {isLoadingAiAudit ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-center">
                            <h4 className="text-sm font-mono font-bold text-emerald-300">Consultando a Google Gemini AI y Analizando Transiciones...</h4>
                            <p className="text-xs text-gray-500 mt-1 font-sans">Evaluando compatibilidad Camelot, curvas de energía y buscando pistas puente en tu biblioteca.</p>
                        </div>
                    </div>
                ) : !aiAuditResult ? (
                    <div className="py-16 text-center border border-dashed border-djzinc-800 rounded-2xl bg-djzinc-950/40 p-6 flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-3 text-2xl">
                            <Icons.Sliders size={14} className="inline-block align-[-2px]" />
                        </div>
                        <h3 className="text-base font-mono font-bold text-gray-200">Auditoría no ejecutada aún</h3>
                        <p className="text-xs text-gray-400 max-w-md mt-1 mb-5 font-sans">
                            Haz clic en el botón superior para calcular la puntuación de calidad de tu sesión (0-100), generar consejos tácticos de mezcla y descubrir 3 propuestas de sesión completas.
                        </p>
                        <button
                            type="button"
                            onClick={handleAuditarSesionAi}
                            disabled={setTracks.length === 0}
                            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 cursor-pointer shadow"
                        >
                            Auditar Sesión Ahora
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* 1. Tarjeta de Puntuación Global de Calidad */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-[#0c1412] to-djzinc-950 border border-emerald-800/60 flex flex-col items-center justify-center text-center shadow-lg">
                                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Score de Flujo</span>
                                <div className="text-4xl font-mono font-black mt-2 mb-1" style={{
                                    color: (aiAuditResult.score_global || 85) >= 85 ? '#34d399' : (aiAuditResult.score_global || 85) >= 70 ? '#fbbf24' : '#f87171'
                                }}>
                                    {aiAuditResult.score_global || 85}%
                                </div>
                                <span className="text-xs font-mono font-bold text-gray-300">
                                    {(aiAuditResult.score_global || 85) >= 88 ? '🌟 Flujo Excepcional' : (aiAuditResult.score_global || 85) >= 75 ? '⚡ Flujo Bueno' : '⚠️ Requiere Ajustes'}
                                </span>
                            </div>

                            <div className="md:col-span-3 p-5 rounded-2xl bg-djzinc-900/90 border border-djzinc-800 flex flex-col justify-between gap-3 shadow-lg">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                                            <span><Icons.Sliders size={14} className="inline-block align-[-2px]" /> Diagnóstico Táctico Masterclass</span>
                                            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                                                {aiAuditResult.ai_consejos ? aiAuditResult.ai_consejos.origen : 'Motor DSP Acústico'}
                                            </span>
                                        </h4>
                                    </div>
                                    <p className="text-xs text-gray-300 mt-2 font-sans leading-relaxed">
                                        {aiAuditResult.ai_consejos ? aiAuditResult.ai_consejos.veredicto : 'La sesión presenta una sólida progresión general con transiciones armónicas equilibradas.'}
                                    </p>
                                </div>

                                {aiAuditResult.ai_consejos && aiAuditResult.ai_consejos.puntos_clave && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                        {aiAuditResult.ai_consejos.puntos_clave.map((pt, pIdx) => (
                                            <div key={pIdx} className="text-[11px] font-mono text-gray-400 flex items-start gap-1.5 bg-djzinc-950/60 p-2 rounded-lg border border-djzinc-800">
                                                <Icons.Check size={14} className="inline-block align-[-2px] text-emerald-400 shrink-0" />
                                                <span>{pt}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Choques Armónicos y Puentes Sugeridos */}
                        {aiAuditResult.puentes_recomendados && aiAuditResult.puentes_recomendados.length > 0 && (
                            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-800/40 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-rose-400 font-bold text-sm"><Icons.Warning size={14} className="inline-block align-[-2px]" /> Choques Armónicos Detectados & Soluciones Puente</span>
                                </div>
                                <p className="text-xs text-gray-400 font-sans">
                                    Hemos localizado pistas en tu biblioteca que pueden insertarse entre los temas con choque armónico para realizar una modulación limpia:
                                </p>
                                <div className="space-y-2">
                                    {aiAuditResult.puentes_recomendados.map((puenteItem, pIdx) => (
                                        <div key={pIdx} className="p-3 rounded-xl bg-djzinc-950/80 border border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <span className="text-[10px] font-mono text-rose-300 uppercase block">Para la transición:</span>
                                                <span className="text-xs font-mono font-bold text-white">{puenteItem.para_transicion}</span>
                                                <div className="text-[11px] text-gray-400 mt-0.5">
                                                    Pista puente: <span className="text-emerald-300 font-bold">{puenteItem.mejor_puente.track.title}</span> ({puenteItem.mejor_puente.clave} • {puenteItem.mejor_puente.bpm} BPM) — Compatibilidad: {puenteItem.mejor_puente.score_puente}%
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const parts = puenteItem.para_transicion.split(' ➔ ');
                                                    const idxFrom = setTracks.findIndex(t => (t.title || t.t) === parts[0]);
                                                    handleInsertarPuente(idxFrom >= 0 ? idxFrom : 0, puenteItem.mejor_puente.track);
                                                }}
                                                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 cursor-pointer shadow shrink-0"
                                            >
                                                <Icons.Plus size={14} className="inline-block align-[-2px]" /> Insertar Puente
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Tres Propuestas Alternativas de Sesión Generadas por el Algoritmo */}
                        {aiAuditResult.propuestas && aiAuditResult.propuestas.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                                        <span><Icons.Zap size={14} className="inline-block align-[-2px]" /> Propuestas de Estructuración Automática ({aiAuditResult.propuestas.length})</span>
                                        <span className="text-[10px] text-gray-500 font-normal">Reordena tu sesión según diferentes objetivos de club</span>
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {aiAuditResult.propuestas.map((prop, propIdx) => (
                                        <div key={prop.id || propIdx} className="p-4 rounded-2xl bg-djzinc-900/80 border border-djzinc-800 hover:border-emerald-700/60 transition-all flex flex-col justify-between gap-4 shadow-md">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                                                        OPCIÓN #{propIdx + 1}
                                                    </span>
                                                    <span className="text-xs font-mono text-gray-400">
                                                        {prop.tracks ? prop.tracks.length : 0} pistas
                                                    </span>
                                                </div>

                                                <h5 className="text-sm font-mono font-bold text-white mt-2">
                                                    {prop.titulo}
                                                </h5>
                                                <p className="text-xs text-gray-400 mt-1 font-sans">
                                                    {prop.descripcion}
                                                </p>

                                                <div className="mt-3 flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                                                    {(prop.tracks || []).slice(0, 5).map((pt, ptIdx) => (
                                                        <span 
                                                            key={ptIdx} 
                                                            className="text-[9px] font-mono px-1.5 py-0.5 rounded text-black font-black shrink-0"
                                                            style={{ backgroundColor: MAP_CAMELOT_COLORS[(pt.key || pt.k || '8A').toUpperCase()] || '#06b6d4' }}
                                                        >
                                                            {(pt.key || pt.k || '8A').toUpperCase()}
                                                        </span>
                                                    ))}
                                                    {(prop.tracks || []).length > 5 && (
                                                        <span className="text-[9px] font-mono text-gray-500 shrink-0">
                                                            +{(prop.tracks || []).length - 5}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleAplicarPropuesta(prop)}
                                                className="w-full py-2 rounded-xl text-xs font-mono font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 cursor-pointer transition-all active:scale-95 shadow"
                                            >
                                                <Icons.Zap size={14} className="inline-block align-[-2px]" /> Aplicar Esta Propuesta al Set
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div data-tour="tour-setbuilder" className="ws-module ws-mod-setbuilder flex-1 flex flex-col h-full bg-[#08080c] overflow-y-auto text-gray-200 pb-36 md:pb-8">
            {/* Header del Espacio de Set-Builder */}
            <div className="p-4 md:p-6 border-b border-djzinc-800/80 bg-gradient-to-b from-[#10101a] to-[#08080c] flex flex-col gap-4 shrink-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <SectionTitle icon={Icons.Flow} title="Sets" accent="Energy Flow" badge="PRO DJ SET ENGINE" />
                        <p className="text-xs text-gray-400 mt-1 max-w-2xl font-sans">
                            Estructura la progresión armónica de tu sesión en vivo. Visualiza curvas de BPM, transiciones Camelot (+1, -1, cambios modales), saltos de volumen LUFS y alertas Anti-Muddy en tiempo real.
                        </p>
                    </div>

                    {/* Acciones principales del Set */}
                    <div className="flex items-center gap-2 flex-wrap lg:justify-end py-1 shrink-0">
                        {/* BOTÓN PROMINENTE: GENERAR FLUJO DE SESIÓN (GRAPH PLAYLISTS ESTILO DJOID) */}
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode('graph');
                                if (!setTracks || setTracks.length === 0) {
                                    if (auditTracks && auditTracks.length > 0) {
                                        setSetTracks([...auditTracks.slice(0, 10)]);
                                    } else {
                                        handleLoadDemoSet();
                                    }
                                }
                                setTimeout(() => {
                                    handleCargarGrafo();
                                }, 80);
                            }}
                            className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.45)] border border-purple-400/80 transition-all active:scale-95 cursor-pointer shrink-0"
                            title="Generar flujo no lineal de sesión estilo DJOID Graph Playlists con alternativas y compatibilidad armónica"
                        >
                            <Icons.Radar size={14} className="inline-block align-[-2px]" />
                            <span>GENERAR FLUJO</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-purple-200 border border-purple-400/50">
                                GRAPH DAG
                            </span>
                        </button>

                        {/* Botón Auditar Pistas del Set si hay pistas sin auditar */}
                        {stats.pendingAuditCount > 0 && (
                            <button
                                type="button"
                                onClick={handleAuditSetTracks}
                                disabled={isAuditingSet}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/30 transition-all active:scale-95 disabled:opacity-40 cursor-pointer animate-pulse shrink-0"
                                title="Calcula BPM exacto, Tonalidad Camelot, LUFS y Roles Espectrales para las pistas del set sin auditar"
                            >
                                <Icons.Zap size={14} className="inline-block align-[-2px]" />
                                <span>{isAuditingSet ? 'Auditando...' : `Auditar (${stats.pendingAuditCount})`}</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleOptimizeHarmonicFlow}
                            disabled={setTracks.length < 2 || isAuditingSet}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-amber-300/50 transition-all active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
                            title="Reordena automáticamente las pistas para maximizar la compatibilidad armónica Camelot y progresión de BPM"
                        >
                            <Icons.Zap size={14} className="inline-block align-[-2px]" />
                            <span>Auto-Optimizar</span>
                        </button>

                        {/* Botón Acción Rápida: Random 25 */}
                        <button
                            type="button"
                            onClick={handleAddRandom25}
                            disabled={folderLoading}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-purple-950/70 hover:bg-purple-900/90 text-purple-300 border border-purple-700/60 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                            title="Selecciona y añade automáticamente 25 pistas aleatorias de tu biblioteca al Set"
                        >
                            <span>🎲 Random 25</span>
                        </button>

                        {/* Botón Cargar Carpeta Completa de Música */}
                        <button
                            type="button"
                            onClick={handleAddFolderToSet}
                            disabled={folderLoading}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                            title="Seleccionar y añadir una carpeta de música a este set con barra de estado"
                        >
                            <Icons.Folder size={14} className="inline-block align-[-2px]" />
                            <span>Cargar Carpeta</span>
                        </button>

                        {/* Botón Importar Colección */}
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => handleCargarColeccion()}
                                disabled={folderLoading}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-purple-700 hover:bg-purple-600 text-white shadow-sm transition-all cursor-pointer active:scale-95"
                                title="Importar colección de música guardada"
                            >
                                <Icons.Library size={14} className="inline-block align-[-2px]" />
                                <span>Importar Colección</span>
                            </button>
                            {customLibraries && customLibraries.length > 1 && (
                                <select
                                    onChange={(e) => handleCargarColeccion(e.target.value)}
                                    defaultValue=""
                                    className="bg-purple-950/80 border border-purple-600/70 text-purple-200 text-xs font-mono font-bold rounded-xl px-2.5 py-2 outline-none cursor-pointer"
                                    title="Seleccionar qué colección cargar"
                                >
                                    <option value="" disabled>Seleccionar biblioteca...</option>
                                    {customLibraries.map(lib => (
                                        <option key={lib.id} value={lib.id}>
                                            {lib.name} ({lib.folders?.reduce((acc, f) => acc + (f.tracks?.length || 0), 0) || 0} pistas)
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsAddDrawerOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-djzinc-850 hover:bg-djzinc-800 text-gray-200 border border-djzinc-700 transition-all cursor-pointer shrink-0"
                            title="Abrir panel para añadir o buscar pistas individuales"
                        >
                            <Icons.Plus size={14} className="inline-block align-[-2px]" />
                            <span>Añadir Pistas</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleExportM3U}
                            disabled={isExporting || setTracks.length === 0}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-gradient-to-r from-djcyan-400 to-djcyan-500 hover:from-djcyan-300 hover:to-djcyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.35)] border border-djcyan-300/50 transition-all active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
                            title="Exportar archivo M3U8 para Rekordbox, Serato, Traktor o VirtualDJ"
                        >
                            <Icons.Save size={14} className="inline-block align-[-2px]" />
                            <span>{isExporting ? 'Exportando...' : 'Exportar (.M3U8)'}</span>
                        </button>

                        {setTracks.length > 0 && (
                            <button
                                type="button"
                                onClick={handleClearSet}
                                className="px-2.5 py-2 rounded-xl text-xs font-mono text-rose-400 hover:bg-rose-950/50 border border-rose-900/40 transition-all cursor-pointer shrink-0"
                                title="Vaciar set"
                            >
                                <Icons.Trash size={14} className="inline-block align-[-2px]" />
                            </button>
                        )}
                    </div>
                </div>

                {/* BARRA DE ESTADO / PROGRESO AL CARGAR CARPETA O AUDITAR */}
                {folderLoading && (
                    <div className="p-3.5 rounded-xl border border-djcyan-500/40 bg-djcyan-950/80 backdrop-blur-md text-xs font-mono shadow-[0_0_20px_rgba(6,182,212,0.25)] flex flex-col gap-2 animate-fadeIn">
                        <div className="flex items-center justify-between text-djcyan-300 font-bold">
                            <span className="flex items-center gap-2">
                                <Icons.Gear size={15} className="animate-spin text-djcyan-400" />
                                <span>{folderProgress.msg || 'Cargando y procesando pistas de la carpeta...'}</span>
                            </span>
                            <span className="font-mono text-xs text-djcyan-200">{Math.round(folderProgress.pct)}%</span>
                        </div>
                        <div className="w-full bg-djzinc-900 rounded-full h-2 overflow-hidden border border-djzinc-800">
                            <div 
                                className="bg-gradient-to-r from-djcyan-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                                style={{ width: `${Math.max(5, folderProgress.pct)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Banner de Estado de Exportación y Auditoría */}
                {exportStatus && (
                    <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between animate-fadeIn ${
                        exportStatus.type === 'success' 
                            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300' 
                            : exportStatus.type === 'error'
                                ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                                : 'bg-djcyan-950/80 border-djcyan-700 text-djcyan-300'
                    }`}>
                        <div className="flex items-center gap-2">
                            {exportStatus.type === 'loading' && <Icons.Gear size={14} className="inline-block align-[-2px] animate-spin" />}
                            <span>{exportStatus.msg}</span>
                        </div>
                        <button type="button" onClick={() => setExportStatus(null)} className="text-gray-400 hover:text-white"><Icons.Close size={14} className="inline-block align-[-2px]" /></button>
                    </div>
                )}

                {/* Barra de Estadísticas del Set y Nombre */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2 border-t border-djzinc-800/60">
                    <div className="col-span-2 flex items-center gap-2 bg-djzinc-900/80 border border-djzinc-800 rounded-xl px-3 py-1.5">
                        <span className="text-[10px] font-mono text-gray-400 uppercase">Nombre:</span>
                        <input
                            type="text"
                            value={setName}
                            onChange={(e) => setSetName(e.target.value)}
                            className="bg-transparent text-xs font-mono text-white font-bold outline-none flex-1 focus:text-djcyan-300"
                            placeholder="Nombre del Set..."
                        />
                    </div>
                    <div className="bg-djzinc-900/60 border border-djzinc-800 rounded-xl p-2.5 flex flex-col items-center justify-center">
                        <span className="text-[9.5px] font-mono text-gray-400 uppercase">Pistas</span>
                        <span className="text-sm font-mono font-black text-djcyan-400">{setTracks.length}</span>
                    </div>
                    <div className="bg-djzinc-900/60 border border-djzinc-800 rounded-xl p-2.5 flex flex-col items-center justify-center">
                        <span className="text-[9.5px] font-mono text-gray-400 uppercase">Duración</span>
                        <span className="text-sm font-mono font-black text-purple-300">{formattedDuration}</span>
                    </div>
                    <div className="bg-djzinc-900/60 border border-djzinc-800 rounded-xl p-2.5 flex flex-col items-center justify-center">
                        <span className="text-[9.5px] font-mono text-gray-400 uppercase">Rango BPM</span>
                        <span className="text-sm font-mono font-black text-amber-300">
                            {stats.minBpm} - {stats.maxBpm}
                        </span>
                    </div>
                    <div className="bg-djzinc-900/60 border border-djzinc-800 rounded-xl p-2.5 flex flex-col items-center justify-center">
                        <span className="text-[9.5px] font-mono text-gray-400 uppercase">Score Armónico</span>
                        <span className={`text-sm font-mono font-black ${stats.harmonicScore >= 85 ? 'text-emerald-400' : stats.harmonicScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {stats.harmonicScore}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Selector de Modos de Vista del Set */}
            <div className="px-4 md:px-6 py-2.5 bg-[#0a0a10] border-b border-djzinc-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                        viewMode === 'list'
                            ? 'bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20'
                            : 'bg-djzinc-900 text-gray-400 hover:text-white hover:bg-djzinc-850'
                    }`}
                >
                    <span>☰</span>
                    <span>Secuencia Lineal</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setViewMode('graph');
                        if (!graphData.nodes || graphData.nodes.length === 0) {
                            handleCargarGrafo();
                        }
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                        viewMode === 'graph'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                            : 'bg-djzinc-900 text-gray-400 hover:text-white hover:bg-djzinc-850'
                    }`}
                >
                    <Icons.Radar size={14} className="inline-block align-[-2px]" />
                    <span>Graph Playlists (DJOID)</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        DAG
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setViewMode('ai_advisor');
                        if (!aiAuditResult) {
                            handleAuditarSesionAi();
                        }
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                        viewMode === 'ai_advisor'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/20'
                            : 'bg-djzinc-900 text-gray-400 hover:text-white hover:bg-djzinc-850'
                    }`}
                >
                    <Icons.Brain size={14} className="inline-block align-[-2px]" />
                    <span>Asesor AI & Calidad (Gemini)</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        PRO
                    </span>
                </button>
            </div>

            {/* Contenido Principal: Según Modo Activo */}
            <div className="p-3 sm:p-4 md:p-6 flex flex-col gap-5 flex-1 pb-36 md:pb-8">
                {viewMode === 'graph' ? (
                    renderGraphPlaylists()
                ) : viewMode === 'ai_advisor' ? (
                    renderSessionAiAdvisor()
                ) : (
                    <>
                        {/* 1. Lienzo de Curva de BPM y Energía */}
                        {renderFlowCanvas()}

                        {/* 2. Lista Secuencial con Tarjetas Puente de Transición */}
                        {setTracks.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center border border-dashed border-djzinc-800 rounded-2xl bg-djzinc-950/40 p-6">
                                <div className="w-14 h-14 rounded-2xl bg-djzinc-900 flex items-center justify-center text-djcyan-400 mb-4 border border-djzinc-800">
                                    <Icons.Flow />
                                </div>
                                <h3 className="text-base font-mono font-bold text-gray-300">Tu Set está vacío</h3>
                                <p className="text-xs text-gray-500 max-w-md mt-1 mb-5 font-sans">
                                    Agrega pistas desde el botón superior o carga una demostración para explorar el análisis armónico Camelot, compensación LUFS y Anti-Muddy en transiciones.
                                </p>
                                <div className="flex items-center gap-2.5 flex-wrap justify-center max-w-xl">
                                    <button
                                        type="button"
                                        onClick={handleAddRandom25}
                                        disabled={folderLoading}
                                        className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all active:scale-95 cursor-pointer"
                                        title="Seleccionar 25 pistas al azar de la biblioteca y agregarlas al set"
                                    >
                                        <span>🎲 25 Pistas Aleatorias</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleAddAllFromLibrary}
                                        disabled={folderLoading}
                                        className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-300 border border-djcyan-700/60 transition-all active:scale-95 cursor-pointer"
                                        title="Añadir todas las pistas disponibles en la biblioteca al set"
                                    >
                                        <span>✓ Añadir Todas de Biblioteca</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleAddFolderToSet}
                                        disabled={folderLoading}
                                        className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition-all active:scale-95 cursor-pointer"
                                        title="Cargar carpeta completa de música desde disco"
                                    >
                                        <Icons.Folder size={14} className="inline-block align-[-2px]" /> Cargar Carpeta de Música
                                    </button>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleCargarColeccion()}
                                            disabled={folderLoading}
                                            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-purple-700 hover:bg-purple-600 text-white shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                                            title="Importar colección de música guardada"
                                        >
                                            <Icons.Library size={14} className="inline-block align-[-2px]" />
                                            <span>Importar Colección</span>
                                        </button>
                                        {customLibraries && customLibraries.length > 1 && (
                                            <select
                                                onChange={(e) => handleCargarColeccion(e.target.value)}
                                                defaultValue=""
                                                className="bg-purple-950/80 border border-purple-600/70 text-purple-200 text-xs font-mono font-bold rounded-xl px-2.5 py-2.5 outline-none cursor-pointer"
                                                title="Seleccionar qué colección cargar"
                                            >
                                                <option value="" disabled>Seleccionar biblioteca...</option>
                                                {customLibraries.map(lib => (
                                                    <option key={lib.id} value={lib.id}>
                                                        {lib.name} ({lib.folders?.reduce((acc, f) => acc + (f.tracks?.length || 0), 0) || 0} pistas)
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleLoadDemoSet}
                                        className="px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-djzinc-850 hover:bg-djzinc-800 text-gray-300 border border-djzinc-700 transition-all cursor-pointer"
                                    >
                                        <Icons.Music size={14} className="inline-block align-[-2px]" /> Set de Demostración
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
                                    <span>SECUENCIA DE LA SESIÓN ({setTracks.length} PISTAS)</span>
                                    <span className="text-[10px] text-gray-500">Usa las flechas ▲ ▼ para reordenar pistas manualmente</span>
                                </div>

                                {setTracks.map((track, idx) => {
                                    const isCurPlaying = isThisTrack(track) && isPlaying;
                                    const isSelected = selectedTrackIdx === idx;
                                    const nextTrack = (idx < setTracks.length - 1) ? setTracks[idx + 1] : null;

                                    const trackBpm = getTrackBpm(track);
                                    const trackKey = getTrackKey(track);
                                    const trackLufs = getTrackLufs(track);

                                    // Evaluaciones de transición frente a la siguiente pista
                                    const harmTrans = nextTrack ? evaluateHarmonicTransition(trackKey, getTrackKey(nextTrack)) : null;
                                    const lufsTrans = nextTrack ? evaluateLufsTransition(trackLufs, getTrackLufs(nextTrack)) : null;
                                    const antiMuddyTrans = nextTrack ? evaluateAntiMuddyTransition(track, nextTrack) : null;

                                    return (
                                        <React.Fragment key={`set_trk_${track.id || idx}_${idx}`}>
                                            {/* Fila de la Pista */}
                                            <div 
                                                onClick={() => setSelectedTrackIdx(idx)}
                                                className={`p-3 md:p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                                                    isSelected 
                                                        ? 'bg-gradient-to-r from-[#141422] to-djzinc-900 border-djcyan-500/80 shadow-[0_0_18px_rgba(6,182,212,0.2)]' 
                                                        : isCurPlaying
                                                            ? 'bg-gradient-to-r from-pink-950/40 to-djzinc-900 border-pink-500 shadow-[0_0_18px_rgba(236,72,153,0.25)]'
                                                            : 'bg-djzinc-900/80 border-djzinc-800 hover:border-djzinc-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                    {/* Reordenador Vertical ▲ ▼ */}
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <button
                                                            type="button"
                                                            disabled={idx === 0}
                                                            onClick={(e) => { e.stopPropagation(); handleMoveTrack(idx, -1); }}
                                                            className="w-5 h-5 flex items-center justify-center rounded bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 disabled:opacity-20 text-[10px] cursor-pointer"
                                                            title="Mover arriba"
                                                        >
                                                            ▲
                                                        </button>
                                                        <span className="text-[10px] font-mono font-bold text-gray-500">#{idx + 1}</span>
                                                        <button
                                                            type="button"
                                                            disabled={idx === setTracks.length - 1}
                                                            onClick={(e) => { e.stopPropagation(); handleMoveTrack(idx, 1); }}
                                                            className="w-5 h-5 flex items-center justify-center rounded bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 disabled:opacity-20 text-[10px] cursor-pointer"
                                                            title="Mover abajo"
                                                        >
                                                            ▼
                                                        </button>
                                                    </div>

                                                    {/* Play button */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isThisTrack(track)) {
                                                                if (onTogglePlay) onTogglePlay();
                                                            } else if (onPlayTrack) {
                                                                onPlayTrack(track, 0, true);
                                                            }
                                                        }}
                                                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                                                            isCurPlaying 
                                                                ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.5)]' 
                                                                : 'bg-djzinc-850 hover:bg-djzinc-800 text-djcyan-400 border-djzinc-700'
                                                        }`}
                                                    >
                                                        {isCurPlaying ? '⏸' : '▶'}
                                                    </button>

                                                    {/* Info de la pista */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="text-xs font-mono font-bold text-white truncate">
                                                                {track.title || track.t || track.filename || 'Pista sin título'}
                                                            </h4>
                                                            {track.format && (
                                                                <span className="text-[9px] font-mono px-1 rounded bg-djzinc-800 text-gray-400">
                                                                    {track.format}
                                                                </span>
                                                            )}
                                                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 shadow-sm">
                                                                {track.genre || 'Tech House'}
                                                            </span>
                                                            {track.subgenre && track.subgenre !== track.genre && !['Pop', 'Electronic', 'Dance', 'Club', 'Other'].includes(track.subgenre) && (
                                                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-djzinc-850 text-gray-300 border border-djzinc-750">
                                                                    {track.subgenre}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-400 truncate font-sans">
                                                            {track.artist || track.a || 'Artista desconocido'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Metadatos Clave: BPM, Camelot Key, Rol Acústico, LUFS */}
                                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-between md:justify-end w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-djzinc-800/60">
                                                    {/* BPM */}
                                                    <div className="px-2 py-1 rounded-lg bg-djzinc-950 border border-djzinc-800 font-mono text-[11px] text-center min-w-[55px]">
                                                        <span className="text-gray-400 block text-[8px]">BPM</span>
                                                        <span className={`font-bold ${trackBpm ? 'text-white' : 'text-amber-400'}`}>
                                                            {trackBpm ? trackBpm.toFixed(1) : '--'}
                                                        </span>
                                                    </div>

                                                    {/* Camelot Key */}
                                                    <div className="px-2 py-1 rounded-lg bg-purple-950/60 border border-purple-800/80 font-mono text-[11px] text-center min-w-[50px]">
                                                        <span className="text-purple-300 block text-[8px]">KEY</span>
                                                        <span className={`font-black ${trackKey ? 'text-purple-200' : 'text-gray-500'}`}>
                                                            {trackKey || '--'}
                                                        </span>
                                                    </div>

                                                    {/* Rol Acústico (Anti-Muddy) */}
                                                    <div className={`px-2 py-1 rounded-lg border font-mono text-[10px] text-center min-w-[80px] ${
                                                        track.acoustic_role === 'Bass Driver'
                                                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                                                            : track.acoustic_role === 'Vocal / Lead'
                                                                ? 'bg-amber-950/60 text-amber-300 border-amber-800/80'
                                                                : track.acoustic_role === 'Percussive Tool'
                                                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                                                                    : 'bg-djzinc-950 text-gray-300 border-djzinc-800'
                                                    }`}>
                                                        <span className="text-gray-400 block text-[8px]">ROL DSP</span>
                                                        <span className="font-bold">
                                                            {track.acoustic_role === 'Bass Driver' ? '🔴 Bass Driver' : track.acoustic_role === 'Vocal / Lead' ? '🟡 Vocal / Lead' : track.acoustic_role === 'Percussive Tool' ? '🟢 Percussive' : '🔵 Balanced'}
                                                        </span>
                                                    </div>

                                                    {/* Duración */}
                                                    <div className="px-2 py-1 rounded-lg bg-djzinc-950 border border-djzinc-800 font-mono text-[11px] text-center min-w-[50px]">
                                                        <span className="text-gray-400 block text-[8px]">DUR</span>
                                                        <span className="font-bold text-purple-300">
                                                            {(() => {
                                                                const sec = parseDurationSec(track.duration_sec || track.duration || track.duracion);
                                                                if (!sec) return '--:--';
                                                                const m = Math.floor(sec / 60);
                                                                const s = Math.floor(sec % 60);
                                                                return `${m}:${s < 10 ? '0' : ''}${s}`;
                                                            })()}
                                                        </span>
                                                    </div>

                                                    {/* LUFS integrado */}
                                                    <div className="px-2 py-1 rounded-lg bg-djzinc-950 border border-djzinc-800 font-mono text-[11px] text-center min-w-[65px]">
                                                        <span className="text-gray-400 block text-[8px]">LUFS</span>
                                                        <span className="font-bold text-djcyan-400">
                                                            {trackLufs} dB
                                                        </span>
                                                    </div>

                                                    {/* Botón Auditar Individual si falta BPM o Key */}
                                                    {(!trackBpm || !trackKey) && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleAuditSingleTrack(track, e)}
                                                            className="px-2 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-[10px] font-mono font-bold cursor-pointer transition-all shadow"
                                                            title="Auditar acústicamente esta pista ahora para detectar BPM y Key"
                                                        >
                                                            <Icons.Zap size={14} className="inline-block align-[-2px]" /> Auditar
                                                        </button>
                                                    )}

                                                    {/* Botón Eliminar */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveTrack(idx); }}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer ml-1"
                                                        title="Quitar pista del set"
                                                    >
                                                        <Icons.Close size={14} className="inline-block align-[-2px]" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Puente de Transición Diagnóstico (#idx -> #idx+1) */}
                                            {nextTrack && (
                                                <div className="mx-1 sm:mx-4 md:mx-10 my-1 p-2 sm:p-2.5 rounded-xl bg-[#0b0b12] border border-djzinc-800/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-2.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[10px] font-mono text-gray-500 font-bold">
                                                            TRANSICIÓN #{idx + 1} ➔ #{idx + 2}:
                                                        </span>

                                                        {/* Badge Armónico Camelot */}
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${harmTrans.color}`} title={harmTrans.desc}>
                                                            {harmTrans.badge}
                                                        </span>

                                                        {/* Badge Alerta LUFS */}
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${lufsTrans.color}`} title={lufsTrans.advice}>
                                                            {lufsTrans.badge}
                                                        </span>

                                                        {/* Badge Anti-Muddy */}
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${antiMuddyTrans.color}`} title={antiMuddyTrans.advice}>
                                                            {antiMuddyTrans.badge}
                                                        </span>
                                                    </div>

                                                    {/* Consejos Proactivos para el DJ en Cabina */}
                                                    <div className="text-[9.5px] font-mono text-gray-400 flex items-center gap-2">
                                                        {harmTrans.type === 'UNKNOWN' ? (
                                                            <span className="text-amber-400 font-bold flex items-center gap-1">
                                                                <Icons.Warning size={14} className="inline-block align-[-2px]" /> <span>Tonalidad pendiente de auditoría</span>
                                                            </span>
                                                        ) : antiMuddyTrans.isCollision ? (
                                                            <span className="text-red-400 font-bold flex items-center gap-1">
                                                                <Icons.Warning size={14} className="inline-block align-[-2px]" /> <span>Cortar EQ Low canal saliente</span>
                                                            </span>
                                                        ) : lufsTrans.isAlert ? (
                                                            <span className="text-amber-400 font-bold flex items-center gap-1">
                                                                <Icons.Sliders size={14} className="inline-block align-[-2px]" /> <span>{lufsTrans.delta > 0 ? `Bajar Trim ~${Math.abs(lufsTrans.delta)}dB` : `Subir Trim ~${Math.abs(lufsTrans.delta)}dB`}</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-400">
                                                                <Icons.Sparkles size={14} className="inline-block align-[-2px]" /> Mezcla fluida garantizada
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal / Cajón Lateral: Añadir Pistas desde Auditoría */}
            {isAddDrawerOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0e0e16] border border-djzinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-djzinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icons.Plus size={14} className="inline-block align-[-2px] text-djcyan-400" />
                                <h3 className="text-sm font-mono font-bold text-white uppercase">Añadir Pistas al Set</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleAddFolderToSet}
                                    className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 cursor-pointer shadow-sm transition-all"
                                    title="Seleccionar y cargar una carpeta completa externa de música"
                                >
                                    <Icons.Folder size={14} className="inline-block align-[-2px]" /> Cargar Carpeta...
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddDrawerOpen(false)}
                                    className="text-gray-400 hover:text-white text-sm"
                                >
                                    <Icons.Close size={14} className="inline-block align-[-2px]" />
                                </button>
                            </div>
                        </div>

                        {/* Barra de Búsqueda rápida y Acciones Rápidas */}
                        <div className="p-3 border-b border-djzinc-800/80 bg-djzinc-950 flex flex-col sm:flex-row items-center gap-2.5">
                            <input
                                type="text"
                                value={searchAddQuery}
                                onChange={(e) => setSearchAddQuery(e.target.value)}
                                placeholder="Filtrar pistas por título, artista o BPM..."
                                className="w-full sm:flex-1 bg-djzinc-900 border border-djzinc-750 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-djcyan-500 font-mono"
                            />
                            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={handleAddRandom25}
                                    className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700/60 transition-all cursor-pointer shadow-sm active:scale-95"
                                    title="Añadir 25 pistas aleatorias al set"
                                >
                                    🎲 Random 25
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddAllFromLibrary}
                                    className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-300 border border-djcyan-700/60 transition-all cursor-pointer shadow-sm active:scale-95"
                                    title="Añadir todas las pistas de la biblioteca al set"
                                >
                                    ✓ Añadir Todas ({auditTracks ? auditTracks.length : 0})
                                </button>
                            </div>
                        </div>

                        {/* Lista de Pistas Disponibles */}
                        <div className="p-3 overflow-y-auto flex-1 space-y-2">
                            {auditTracks.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-xs font-mono flex flex-col items-center gap-3">
                                    <span>No hay pistas cargadas en memoria de Auditoría.</span>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (window.eel && window.eel.cargar_metadatos_directorio) {
                                                setExportStatus({ type: 'loading', msg: 'Cargando pistas de "mi musica"...' });
                                                try {
                                                    const res = await window.eel.cargar_metadatos_directorio("/Users/admin/Music/mi musica")();
                                                    if (res && res.tracks && setAuditTracks) {
                                                        setAuditTracks(res.tracks);
                                                        setExportStatus({ type: 'success', msg: `✓ ${res.tracks.length} pistas cargadas desde "mi musica".` });
                                                    }
                                                } catch (err) {
                                                    setExportStatus({ type: 'error', msg: `Error: ${err.message || err}` });
                                                } finally {
                                                    setTimeout(() => setExportStatus(null), 3500);
                                                }
                                            }
                                        }}
                                        className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-djcyan-600 to-blue-600 hover:from-djcyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                                    >
                                        <Icons.Folder size={14} className="inline-block align-[-2px]" /> Cargar Pistas de "mi musica"
                                    </button>
                                </div>
                            ) : (
                                auditTracks
                                    .filter(t => {
                                        const q = searchAddQuery.toLowerCase();
                                        return !q || (t.title || t.t || '').toLowerCase().includes(q) || (t.artist || t.a || '').toLowerCase().includes(q) || (t.bpm || t.b || '').toString().includes(q);
                                    })
                                    .map(t => {
                                        const isAlreadyInSet = setTracks.some(st => String(st.id) === String(t.id) || (st.path && t.path && st.path === t.path));
                                        const isTrkPlaying = isThisTrack(t) && isPlaying;

                                        return (
                                            <div
                                                key={`audit_add_${t.id || t.path}`}
                                                className="p-2.5 rounded-xl bg-djzinc-900/60 border border-djzinc-800/80 flex items-center justify-between gap-3 hover:border-djzinc-700"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isThisTrack(t)) {
                                                                if (onTogglePlay) onTogglePlay();
                                                            } else if (onPlayTrack) {
                                                                onPlayTrack(t, 0, true);
                                                            }
                                                        }}
                                                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border text-[11px] transition-all cursor-pointer ${
                                                            isTrkPlaying
                                                                ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white border-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                                                                : 'bg-djzinc-800 hover:bg-djzinc-750 text-djcyan-400 border-djzinc-700'
                                                        }`}
                                                        title="Preescuchar pista"
                                                    >
                                                        {isTrkPlaying ? '⏸' : '▶'}
                                                    </button>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs font-mono font-bold text-white truncate">
                                                            {t.title || t.t || t.filename || 'Pista'}
                                                        </div>
                                                        <div className="text-[11px] text-gray-400 truncate">
                                                            {t.artist || t.a || 'Artista'} • {t.bpm || t.b || '--'} BPM • {t.key || t.k || '--'} • {t.acoustic_role || 'Balanced'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddTrack(t)}
                                                    className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-300 border border-djcyan-700 transition-all cursor-pointer shadow shrink-0"
                                                >
                                                    {isAlreadyInSet ? '+ Añadir Otra Vez' : '+ Añadir'}
                                                </button>
                                            </div>
                                        );
                                    })
                            )}
                        </div>

                        <div className="p-3 border-t border-djzinc-800 bg-djzinc-950 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsAddDrawerOpen(false)}
                                className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold bg-djzinc-800 text-gray-200 hover:bg-djzinc-700 cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Unificada de Exploración de Bibliotecas & Archivos */}
            <UnifiedLibraryBrowserModal
                isOpen={fsBrowserOpen}
                onClose={() => setFsBrowserOpen(false)}
                title="Set Builder • Explorador de Biblioteca & Archivos"
                onSelectPath={(selectedPath) => handleCargarRutaAlSet(selectedPath)}
                onSelectMultiple={(allTargets) => handleCargarRutaAlSet(allTargets)}
                customLibraries={customLibraries}
                activeCustomLibId={activeCustomLibId}
                onImportCollection={handleCargarColeccion}
            />
        </div>
    );
};


