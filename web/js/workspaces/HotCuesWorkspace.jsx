const { useState, useEffect, useRef, useCallback, useMemo } = React;
import { Icons } from '../shell/icons.jsx';
import { ZoomableRekordboxWaveform, parseDurationMs, formatMsToTime, parseTimeToMs } from '../waveforms/index.js';
import { NV2_COLORS, getValidCover } from '../data/constants.js';
import { SectionTitle, InfoTip, RotaryKnob, getAudioEQNodes } from '../shell/workspace-ui.jsx';


// =========================================================================
// ESPACIO DE TRABAJO: ESTUDIO PROFESIONAL DE HOT CUES & BEATGRID (PESTAÑA DEDICADA)
// =========================================================================
export const HotCuesWorkspace = ({
    tracks = [],
    setTracks,
    selectedTrack,
    setSelectedTrack,
    onPlayTrack,
    nowPlayingTrack,
    isPlaying,
    onTogglePlay,
    playProgress = 0,
    onNavigateTab,
    onRemoveTrack,
    onRemoveMultipleTracks,
    lang = "es",
    t = (k) => k,
    currentFolder = "",
    setCurrentFolder,
    audioRef,
    studioMode: propsStudioMode = 'cues',
    onSetStudioMode
}) => {
    const [studioMode, setStudioMode] = useState(propsStudioMode || 'cues');
    useEffect(() => {
        if (propsStudioMode) setStudioMode(propsStudioMode);
    }, [propsStudioMode]);
    const [tapTimes, setTapTimes] = useState([]);

    const currentTrack = (tracks && tracks.length > 0)
        ? (tracks.find(t => String(t.id) === String(selectedTrack)) || tracks[0])
        : null;

    const audioDurMs = (audioRef && audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0.5)
        ? Math.round(audioRef.current.duration * 1000)
        : null;
    const durMs = audioDurMs || parseDurationMs(currentTrack?.duration || "05:00");
    const bpm = (currentTrack && (currentTrack.bpm || currentTrack.b)) ? Math.max(30.0, parseFloat(currentTrack.bpm || currentTrack.b) || 128.0) : 128.0;
    const beatMs = 60000.0 / bpm;
    const barMs = beatMs * 4.0;
    const downbeatMs = currentTrack && currentTrack.first_downbeat_ms ? parseFloat(currentTrack.first_downbeat_ms) : 0;
    const trimMs = currentTrack && currentTrack.trim_start_ms ? parseFloat(currentTrack.trim_start_ms) : 0;
    const trimEndMs = currentTrack && currentTrack.trim_end_ms ? parseFloat(currentTrack.trim_end_ms) : durMs;

    const handleRemoveTrackFromHotCues = (trackId, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (onRemoveTrack) {
            onRemoveTrack(trackId);
        } else if (setTracks) {
            setTracks(prev => prev.filter(t => String(t.id) !== String(trackId)));
        }
        if (String(selectedTrack) === String(trackId)) {
            const remaining = tracks.filter(t => String(t.id) !== String(trackId));
            setSelectedTrack(remaining.length > 0 ? remaining[0].id : null);
        }
    };

    const [zoom, setZoom] = useState(4); // 1, 2, 4, 8, 16
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [showBeatgrid, setShowBeatgrid] = useState(true);
    const [followPlayhead, setFollowPlayhead] = useState(true);
    const [selectedCueId, setSelectedCueId] = useState(1);
    const [isRegeneratingMood, setIsRegeneratingMood] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [isSavingBatch, setIsSavingBatch] = useState(false);
    const [filterQuery, setFilterQuery] = useState('');
    const [fsBrowserOpen, setFsBrowserOpen] = useState(false);
    const [carpetasSistema, setCarpetasSistema] = useState([]);
    const [rutaNavegacion, setRutaNavegacion] = useState(currentFolder || "");
    const [isLoadingDir, setIsLoadingDir] = useState(false);
    const [showTrackListDrawer, setShowTrackListDrawer] = useState(false);

    // Estado de Pitch Fader y Rango Tempo DJ
    const [pitchPercent, setPitchPercent] = useState(0.0);
    const [pitchRange, setPitchRange] = useState(8); // ±8% o ±16%

    // Estado del Ecualizador Hardware DJ de 3 Bandas (dB)
    const [eqBass, setEqBass] = useState(0.0);
    const [eqMid, setEqMid] = useState(0.0);
    const [eqTreble, setEqTreble] = useState(0.0);

    // Modo de visualización móvil de la consola
    const [mobileDeckMode, setMobileDeckMode] = useState('pads'); // 'pads', 'eq_pitch', 'vinyl'
    const [autoMappingStatus, setAutoMappingStatus] = useState('');

    // Estado y Control de Modos de Hot Cues (Estándar Performance vs Acústico Progresivo)
    const [cuesVersionMode, setCuesVersionMode] = useState('estandar'); // 'estandar', 'acustico', 'comparativa'
    const [cuesEstandar, setCuesEstandar] = useState(null);
    const [cuesAcustico, setCuesAcustico] = useState(null);
    const [isLoadingComparative, setIsLoadingComparative] = useState(false);
    const [showDiferenciasModal, setShowDiferenciasModal] = useState(false);
    const [diferenciasData, setDiferenciasData] = useState(null);

    // Cargar comparativa de Hot Cues (Estándar vs Acústico) desde backend
    const handleCargarComparativa = async (targetMode = 'comparativa') => {
        if (!currentTrack) return;
        setIsLoadingComparative(true);
        setSaveStatus("Calculando versiones Estándar y Acústica...");
        try {
            const trackPath = currentTrack.path || currentTrack.f || "";
            let res = null;
            if (window.eel && window.eel.calcular_comparativa_hot_cues) {
                res = await window.eel.calcular_comparativa_hot_cues(trackPath, currentTrack.id)();
            } else {
                const r = await fetch('/api/rpc/calcular_comparativa_hot_cues', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ args: [trackPath, currentTrack.id] })
                });
                const d = await r.json();
                res = d.result || d;
            }
            if (res && res.status === "ok") {
                setCuesEstandar(res.cues_estandar);
                setCuesAcustico(res.cues_acustico);
                setDiferenciasData(res.diferencias);
                setCuesVersionMode(targetMode);
                if (targetMode === 'estandar') {
                    updateCues(res.cues_estandar);
                } else if (targetMode === 'acustico') {
                    updateCues(res.cues_acustico);
                }
                setSaveStatus(targetMode === 'comparativa' ? "✓ Vista Dual Waveform cargada para comparar" : `✓ Modo ${targetMode.toUpperCase()} cargado`);
            } else {
                setSaveStatus("Error calculando comparativa de cues");
            }
        } catch (e) {
            console.error("Error comparativa cues:", e);
            setSaveStatus("Error de comunicación en comparativa");
        } finally {
            setIsLoadingComparative(false);
            setTimeout(() => setSaveStatus(''), 2500);
        }
    };

    // Guardar una versión específica (Estándar o Acústica) directamente en el archivo físico
    const handleGuardarModoCues = async (modo) => {
        if (!currentTrack) return;
        const modoStr = modo === 'acustico' ? 'Acústica' : 'Estándar';
        setSaveStatus(`Guardando versión ${modoStr} en disco...`);
        try {
            const trackPath = currentTrack.path || currentTrack.f || "";
            const cuesToSave = modo === 'acustico' ? (cuesAcustico || activeCues) : (cuesEstandar || activeCues);
            let res = null;
            if (window.eel && window.eel.guardar_modo_hot_cues) {
                res = await window.eel.guardar_modo_hot_cues(trackPath, modo, cuesToSave, currentTrack)();
            } else {
                const r = await fetch('/api/rpc/guardar_modo_hot_cues', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ args: [trackPath, modo, cuesToSave, currentTrack] })
                });
                const d = await r.json();
                res = d.result || d;
            }
            if (res && res.status === "ok") {
                setSaveStatus(`✓ Versión ${modoStr} inyectada en disco con éxito`);
                const updatedTrack = {
                    ...currentTrack,
                    cues: cuesToSave,
                    modo_cues: modo
                };
                if (setTracks) {
                    setTracks(prev => prev.map(t => String(t.id) === String(currentTrack.id) ? updatedTrack : t));
                }
            } else {
                setSaveStatus(res?.msg || `Error guardando versión ${modoStr}`);
            }
        } catch (e) {
            console.error(`Error guardando versión ${modo}:`, e);
            setSaveStatus("Error de comunicación al guardar versión");
        } finally {
            setTimeout(() => setSaveStatus(''), 3000);
        }
    };

    // Motor de Auto-Mapping con Plantillas de Estructura: Template A (Club Extended)
    const handleAutoGenerateClubTemplate = () => {
        if (!currentTrack) return;
        const durClean = durMs > 1000 ? durMs : 300000;
        const bpmClean = bpm > 20 ? bpm : 128.0;
        const beatMs = 60000.0 / bpmClean;
        const barMsCalc = beatMs * 4.0;
        const downbeatClean = downbeatMs || 0;
        const totalBars = Math.max(8.0, (durClean - downbeatClean) / barMsCalc);

        // Template A (Club Extended):
        // Pad 1 (Intro/Downbeat), Pad 2 (First Beat/Percussion 16/32b), Pad 3 (Breakdown principal),
        // Pad 4 (Drop Clímax), Pad 5/6 (Loop rítmico 16/32b sin melodía), Pad 7/8 (Outro mix & End)
        let barOffsets = [];
        if (totalBars >= 128) {
            barOffsets = [0, 32, 64, 80, 96, 112, Math.max(116, Math.floor(totalBars - 32)), Math.max(124, Math.floor(totalBars - 8))];
        } else if (totalBars >= 64) {
            barOffsets = [0, 16, 32, 40, 48, 56, Math.max(58, Math.floor(totalBars - 16)), Math.max(62, Math.floor(totalBars - 4))];
        } else {
            const step = Math.max(1.0, totalBars / 8.0);
            barOffsets = [0, 1, 2, 3, 4, 5, 6, 7].map(i => Math.floor(i * step));
        }

        const templateNames = [
            "Intro / Downbeat",
            "First Beat (Percussion)",
            "Breakdown Principal",
            "Drop (Climax)",
            "Loop Rítmico (16 Compases)",
            "Loop Rítmico (32 Compases)",
            "Outro Mix Point",
            "Outro End"
        ];

        const generatedCues = NV2_COLORS.map((cfg, idx) => {
            const bOffset = barOffsets[idx] !== undefined ? barOffsets[idx] : (idx * 16);
            const compas = bOffset + 1;
            const pMs = Math.min(durClean - 1000, Math.floor(downbeatClean + (bOffset * barMsCalc)));
            const sec = pMs / 1000.0;
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            const timeStr = `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
            const pctVal = durClean > 0 ? (pMs / durClean) : 0;

            return {
                id: idx + 1,
                name: `${templateNames[idx]} (Bar ${compas})`,
                short_name: templateNames[idx],
                time: timeStr,
                pos_ms: pMs,
                pct: pctVal,
                color: cfg.color,
                rgb: cfg.rgb,
                text: cfg.text,
                border: cfg.border,
                bg: cfg.bg
            };
        });

        // Actualizar pista actual en memoria y propagar
        const updatedTrack = { ...currentTrack, cues: generatedCues };
        if (setTracks) {
            setTracks(prev => prev.map(t => String(t.id) === String(currentTrack.id) ? updatedTrack : t));
        }
        setAutoMappingStatus("¡Plantilla Club Extended auto-generada con éxito en los 8 pads!");
        setTimeout(() => setAutoMappingStatus(''), 4000);
    };

    // Handlers de Calibración de Beatgrid 1.0.0 & Recorte Manual de Silencios
    const handleNudgeBeatgridMs = (deltaMs) => {
        if (!currentTrack) return;
        const currentDb = currentTrack.first_downbeat_ms ? parseFloat(currentTrack.first_downbeat_ms) : 0;
        const newDb = Math.max(0, Math.round((currentDb + deltaMs) * 10) / 10);
        updateCurrentTrackField('first_downbeat_ms', newDb);
        if (activeCues && activeCues.length > 0) {
            const newPct = durMs > 0 ? (newDb / durMs) : 0;
            updateCues(activeCues.map((c, i) => i === 0 ? { ...c, pos_ms: Math.round(newDb), time: formatMsToTime(newDb), pct: newPct } : c));
        }
        setSaveStatus(`✓ Ancla Beatgrid 1.0.0 desplazada a ${newDb.toFixed(1)} ms`);
        setTimeout(() => setSaveStatus(''), 2500);
    };

    const handleSetDownbeatAtPlayhead = () => {
        if (!currentTrack) return;
        const playheadMs = Math.round(playProgress * durMs * 10) / 10;
        updateCurrentTrackField('first_downbeat_ms', playheadMs);
        if (activeCues && activeCues.length > 0) {
            const newPct = durMs > 0 ? (playheadMs / durMs) : 0;
            updateCues(activeCues.map((c, i) => i === 0 ? { ...c, pos_ms: Math.round(playheadMs), time: formatMsToTime(playheadMs), pct: newPct } : c));
        }
        setSaveStatus(`🎯 Downbeat 1.0.0 anclado al transitorio en ${playheadMs.toFixed(1)} ms`);
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const handleNudgeBpm = (deltaBpm) => {
        if (!currentTrack) return;
        const currentB = (currentTrack.bpm || currentTrack.b) ? parseFloat(currentTrack.bpm || currentTrack.b) : 128.0;
        const newB = Math.max(40.0, Math.min(220.0, Math.round((currentB + deltaBpm) * 100) / 100));
        updateCurrentTrackField('bpm', newB);
        updateCurrentTrackField('b', newB);
        setSaveStatus(`✓ Tempo Beatgrid: ${newB.toFixed(2)} BPM`);
        setTimeout(() => setSaveStatus(''), 2000);
    };

    const handleTapTempo = () => {
        const now = performance.now();
        const newTaps = [...tapTimes, now].filter(t => now - t < 3000);
        setTapTimes(newTaps);
        if (newTaps.length >= 3) {
            const intervals = [];
            for (let i = 1; i < newTaps.length; i++) {
                intervals.push(newTaps[i] - newTaps[i - 1]);
            }
            const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            if (avgMs > 250 && avgMs < 1500) {
                const tappedBpm = Math.round((60000.0 / avgMs) * 10) / 10;
                updateCurrentTrackField('bpm', tappedBpm);
                updateCurrentTrackField('b', tappedBpm);
                setSaveStatus(`🥁 TAP Tempo: ${tappedBpm.toFixed(1)} BPM`);
                setTimeout(() => setSaveStatus(''), 2000);
            }
        }
    };

    const handleSetTrimStartAtPlayhead = () => {
        if (!currentTrack) return;
        const playheadMs = Math.round(playProgress * durMs * 10) / 10;
        updateCurrentTrackField('trim_start_ms', playheadMs);
        setSaveStatus(`✂️ Corte Inicio (Trim In) fijado en ${playheadMs.toFixed(1)} ms`);
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const handleResetTrimStart = () => {
        if (!currentTrack) return;
        updateCurrentTrackField('trim_start_ms', 0.0);
        setSaveStatus(`↺ Corte Inicio restablecido a 0 ms`);
        setTimeout(() => setSaveStatus(''), 2000);
    };

    const handleSetTrimEndAtPlayhead = () => {
        if (!currentTrack) return;
        const playheadMs = Math.round(playProgress * durMs * 10) / 10;
        updateCurrentTrackField('trim_end_ms', playheadMs);
        setSaveStatus(`✂️ Corte Cola (Trim Out) fijado en ${formatMsToTime(playheadMs)}`);
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const handleResetTrimEnd = () => {
        if (!currentTrack) return;
        updateCurrentTrackField('trim_end_ms', durMs);
        setSaveStatus(`↺ Corte Cola restablecido al final`);
        setTimeout(() => setSaveStatus(''), 2000);
    };

    // Ajuste en tiempo real de velocidad y tono (Pitch Shifting)
    const handlePitchChange = (newPitch) => {
        const clamped = Math.max(-pitchRange, Math.min(pitchRange, Math.round(newPitch * 100) / 100));
        setPitchPercent(clamped);
        const rate = 1.0 + (clamped / 100);
        const audio = audioRef?.current || window.__bwGlobalAudio;
        if (audio) {
            audio.playbackRate = Math.max(0.2, Math.min(2.0, rate));
        }
    };

    const handleNudgePitch = (delta) => {
        handlePitchChange(pitchPercent + delta);
    };

    // Ajuste en tiempo real de ecualización Web Audio API
    const handleEqChange = (band, val) => {
        const audio = audioRef?.current || window.__bwGlobalAudio;
        const nodes = getAudioEQNodes(audio);
        if (band === 'bass') {
            setEqBass(val);
            if (nodes && nodes.low) nodes.low.gain.value = val;
        } else if (band === 'mid') {
            setEqMid(val);
            if (nodes && nodes.mid) nodes.mid.gain.value = val;
        } else if (band === 'treble') {
            setEqTreble(val);
            if (nodes && nodes.high) nodes.high.gain.value = val;
        }
    };

    const handleResetEQ = () => {
        handleEqChange('bass', 0);
        handleEqChange('mid', 0);
        handleEqChange('treble', 0);
    };

    // Control Seguro y Robusto de Reproducción en Deck Hot Cues
    const handleDeckTogglePlay = () => {
        if (!currentTrack) return;
        if (isCurrentPlayingThis) {
            if (onTogglePlay) onTogglePlay();
        } else {
            if (onPlayTrack) {
                onPlayTrack(currentTrack, playProgress > 0 ? playProgress : 0, true);
            }
        }
    };

    const handleDeckCue = () => {
        if (!currentTrack) return;
        const firstCue = activeCues[0] || {};
        const cueMs = firstCue.pos_ms !== undefined ? firstCue.pos_ms : (downbeatMs || 0);
        const cuePct = durMs > 0 ? (cueMs / durMs) : 0;
        if (onPlayTrack) {
            onPlayTrack(currentTrack, cuePct, false);
        }
    };

    const CLUB_CUE_RATIOS = [0.005, 0.12, 0.25, 0.40, 0.55, 0.70, 0.85, 0.94];
    const CLUB_CUE_NAMES = [
        "Intro / Downbeat",
        "Percussion / Beat",
        "Bassline Groove",
        "Breakdown 1",
        "Drop 1 (Climax)",
        "Mid Breakdown",
        "Drop 2 (Re-Kick)",
        "Outro Mix Point"
    ];

    // Asegura que activeCues SIEMPRE contenga los 8 Hot Cues proporcionados a la duración real de la pista
    const activeCues = Array.from({ length: 8 }, (_, idx) => {
        const padNum = idx + 1;
        const existing = (currentTrack && currentTrack.cues && currentTrack.cues[idx]) ? currentTrack.cues[idx] : null;
        const defaultColor = NV2_COLORS[idx] ? NV2_COLORS[idx].color : '#06b6d4';
        const defaultName = CLUB_CUE_NAMES[idx] || `Cue ${padNum}`;
        const defaultPosMs = Math.round(durMs * CLUB_CUE_RATIOS[idx]);
        const defaultTime = formatMsToTime(defaultPosMs);

        if (existing) {
            let cuePos = existing.pos_ms !== undefined ? existing.pos_ms : parseTimeToMs(existing.time || defaultTime);
            // Si la posición de este cue guardado excede la duración real del archivo, recalcular proporcionalmente
            if (cuePos >= durMs - 250) {
                cuePos = defaultPosMs;
            }
            return {
                id: padNum,
                name: existing.name || defaultName,
                color: existing.color || defaultColor,
                time: formatMsToTime(cuePos),
                pos_ms: cuePos,
                pct: durMs > 0 ? (cuePos / durMs) : CLUB_CUE_RATIOS[idx],
                bar: existing.bar || Math.max(1, Math.floor((cuePos - downbeatMs) / barMs) + 1),
                bar_str: existing.bar_str || `Bar ${Math.max(1, Math.floor((cuePos - downbeatMs) / barMs) + 1)}`,
                is_empty: false
            };
        }
        const hasTrackCues = currentTrack && Array.isArray(currentTrack.cues) && currentTrack.cues.length > 0;
        if (hasTrackCues) {
            return {
                id: padNum,
                name: "Libre",
                short_name: "Libre",
                color: "#475569",
                time: "--:--.--",
                pos_ms: null,
                pct: null,
                bar: null,
                bar_str: "--",
                is_empty: true
            };
        }
        return {
            id: padNum,
            name: defaultName,
            color: defaultColor,
            time: defaultTime,
            pos_ms: defaultPosMs,
            pct: CLUB_CUE_RATIOS[idx],
            bar: Math.max(1, Math.floor((defaultPosMs - downbeatMs) / barMs) + 1),
            bar_str: `Bar ${Math.max(1, Math.floor((defaultPosMs - downbeatMs) / barMs) + 1)}`,
            is_empty: false
        };
    });
    const currentCue = activeCues.find(c => (c.id !== undefined ? c.id : 1) === selectedCueId) || activeCues[0] || {};

    const [cueNameInput, setCueNameInput] = useState(currentCue.name || "");
    const [cueTimeInput, setCueTimeInput] = useState(currentCue.time || "00:00.00");
    const [tacticalComment, setTacticalComment] = useState(currentTrack?.comment || "");

    useEffect(() => {
        if (currentTrack) {
            setTacticalComment(currentTrack.comment || "");
        }
    }, [currentTrack?.id, currentTrack?.comment]);

    useEffect(() => {
        setCueNameInput(currentCue.name || currentCue.short_name || `Cue ${selectedCueId}`);
        setCueTimeInput(currentCue.time || "00:00.00");
    }, [selectedCueId, currentCue.time, currentCue.name]);

    // Cálculo del Hot Cue activo dinámicamente según la posición de reproducción (Estilo Pioneer FLX10)
    const currentMs = playProgress * durMs;
    let activePlayingCueId = 1;
    if (activeCues && activeCues.length > 0) {
        for (let i = activeCues.length - 1; i >= 0; i--) {
            const c = activeCues[i];
            const pos = c.pos_ms !== undefined ? c.pos_ms : parseTimeToMs(c.time || '0');
            if (currentMs >= pos - 150) {
                activePlayingCueId = c.id !== undefined ? c.id : (i + 1);
                break;
            }
        }
    }

    // Actualiza campos de la pista seleccionada en el estado compartido
    const updateCurrentTrackField = (field, val) => {
        if (!currentTrack || !setTracks) return;
        const updated = tracks.map(t => {
            if (String(t.id) === String(currentTrack.id)) {
                return { ...t, [field]: val };
            }
            return t;
        });
        setTracks(updated);
    };

    // Actualiza la lista de Hot Cues de la pista actual
    const updateCues = (newCues) => {
        updateCurrentTrackField('cues', newCues);
    };

    // Actualiza un Cue individual por su id
    const updateSingleCue = (updatedFields) => {
        const targetId = currentCue.id !== undefined ? currentCue.id : selectedCueId;
        const newCues = activeCues.map((c, idx) => {
            const cid = c.id !== undefined ? c.id : (idx + 1);
            if (cid === targetId) {
                return { ...c, ...updatedFields };
            }
            return c;
        });
        updateCues(newCues);
    };

    // Ajuste directo del tiempo desde el input de texto
    const handleTimeInputChange = (e) => {
        const val = e.target.value;
        setCueTimeInput(val);
        const ms = parseTimeToMs(val);
        const newPct = durMs > 0 ? Math.max(0, Math.min(1, ms / durMs)) : 0;
        const barNum = Math.max(1, Math.floor((ms - downbeatMs) / barMs) + 1);
        updateSingleCue({
            time: val,
            pos_ms: Math.round(ms),
            pct: newPct,
            bar: barNum,
            bar_str: `Bar ${barNum}`
        });
    };

    // Nudge micro-ajustes (-10ms, +10ms, compases, tiempos)
    const handleNudgeMs = (deltaMs) => {
        const currentMs = currentCue.pos_ms !== undefined ? currentCue.pos_ms : parseTimeToMs(currentCue.time || "00:00.00");
        let newMs = Math.max(0, Math.min(durMs, currentMs + deltaMs));
        if (snapToGrid) {
            const beatOffset = Math.round((newMs - downbeatMs) / beatMs);
            newMs = Math.max(0, Math.min(durMs, downbeatMs + (beatOffset * beatMs)));
        }
        const timeStr = formatMsToTime(newMs);
        const newPct = durMs > 0 ? (newMs / durMs) : 0;
        const barNum = Math.max(1, Math.floor((newMs - downbeatMs) / barMs) + 1);
        setCueTimeInput(timeStr);
        updateSingleCue({
            time: timeStr,
            pos_ms: Math.round(newMs),
            pct: newPct,
            bar: barNum,
            bar_str: `Bar ${barNum}`
        });
    };

    // Salto directo en reproducción al Hot Cue pulsado con protección de duración y arranque instantáneo
    const handleJumpToCue = (cue) => {
        if (!currentTrack || !onPlayTrack) return;
        const audio = audioRef?.current;
        const audioDur = (audio && audio.duration && !isNaN(audio.duration) && audio.duration > 0.5)
            ? audio.duration
            : (durMs / 1000.0);
        let posMs = cue.pos_ms !== undefined ? cue.pos_ms : parseTimeToMs(cue.time || "00:00.00");
        let targetSec = posMs / 1000.0;
        // Si el archivo en reproducción es un preview corto o dura menos que posMs,
        // escalar proporcionalmente al ratio del pad para evitar salto fuera de rango (EOF)
        if (audioDur > 0 && targetSec >= (audioDur - 0.25)) {
            const cuePct = cue.pct !== undefined ? cue.pct : Math.min(0.95, posMs / (durMs || 300000));
            targetSec = Math.max(0, Math.min(audioDur - 0.25, audioDur * cuePct));
        }
        const pct = audioDur > 0 ? (targetSec / audioDur) : 0;
        onPlayTrack(currentTrack, pct, true, targetSec);

        // Disparo forzado e instantáneo de reproducción en el motor de audio
        if (audio) {
            try {
                audio.currentTime = targetSec;
                audio.play().catch(() => {});
            } catch (_) {}
        }
    };

    // Fijar el Hot Cue seleccionado exactamente en la aguja de reproducción actual
    const handleSetCueAtPlayhead = () => {
        if (!currentTrack) return;
        let currentPlayheadMs = playProgress * durMs;
        if (snapToGrid) {
            const beatOffset = Math.round((currentPlayheadMs - downbeatMs) / beatMs);
            currentPlayheadMs = Math.max(0, Math.min(durMs, downbeatMs + (beatOffset * beatMs)));
        }
        const timeStr = formatMsToTime(currentPlayheadMs);
        const newPct = durMs > 0 ? (currentPlayheadMs / durMs) : 0;
        const barNum = Math.max(1, Math.floor((currentPlayheadMs - downbeatMs) / barMs) + 1);
        setCueTimeInput(timeStr);
        updateSingleCue({
            time: timeStr,
            pos_ms: Math.round(currentPlayheadMs),
            pct: newPct,
            bar: barNum,
            bar_str: `Bar ${barNum}`
        });
        setSaveStatus(`✓ Pad ${selectedCueId} anclado en ${timeStr}`);
        setTimeout(() => setSaveStatus(''), 2500);
    };

    // Auto-Frasear 16/32b anclado al Beatgrid Rekordbox (Plantilla Club Extended)
    const handleAutoPhraseCues = async () => {
        if (!currentTrack) return;
        try {
            let calculated = null;
            if (window.eel && window.eel.calcular_hot_cues_fraseo) {
                try {
                    calculated = await window.eel.calcular_hot_cues_fraseo(durMs, bpm, Math.round(downbeatMs))();
                } catch (_) {}
            }
            if (!calculated || !Array.isArray(calculated) || calculated.length === 0) {
                calculated = CLUB_CUE_RATIOS.map((ratio, idx) => {
                    const padNum = idx + 1;
                    const posMs = Math.round(durMs * ratio);
                    const barNum = Math.max(1, Math.floor((posMs - downbeatMs) / barMs) + 1);
                    return {
                        id: padNum,
                        name: CLUB_CUE_NAMES[idx] || `Cue ${padNum}`,
                        color: NV2_COLORS[idx] ? NV2_COLORS[idx].color : '#06b6d4',
                        time: formatMsToTime(posMs),
                        pos_ms: posMs,
                        pct: ratio,
                        bar: barNum,
                        bar_str: `Bar ${barNum}`
                    };
                });
            }
            if (calculated && Array.isArray(calculated)) {
                updateCues(calculated);
                setSaveStatus("✓ 8 Hot Cues auto-mapeados (Plantilla Club Extended)");
                setTimeout(() => setSaveStatus(''), 2500);
            }
        } catch (e) {
            console.error("Error auto-fraseando:", e);
        }
    };

    // Guardar Pista Individual en Disco (ID3v2.4 / Vorbis GEOB:Serato Markers2)
    const handleGuardarPista = async () => {
        if (!currentTrack) return;
        setSaveStatus("Guardando marcas en disco...");
        try {
            const trackToSave = {
                ...currentTrack,
                cues: activeCues,
                comment: tacticalComment,
                first_downbeat_ms: downbeatMs,
                downbeat_ms: downbeatMs,
                trim_start_ms: trimMs,
                trim_end_ms: trimEndMs,
                bpm: bpm
            };
            let res = null;
            if (window.eel && window.eel.guardar_cambios_track) {
                res = await window.eel.guardar_cambios_track(trackToSave)();
            } else {
                const r = await fetch('/api/rpc/guardar_cambios_track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ args: [trackToSave] })
                });
                const d = await r.json();
                res = d.result || d;
            }
            if (res && (res.status === "ok" || res === true)) {
                setSaveStatus("✓ Pista y BeatGrid guardados en disco");
                if (setTracks) {
                    setTracks(prev => prev.map(t => String(t.id) === String(trackToSave.id) ? trackToSave : t));
                }
                if (typeof registrarEnBitacora === 'function') {
                    registrarEnBitacora({
                        action: "Guardado BeatGrid & Cues",
                        category: "beatgrid",
                        trackTitle: currentTrack.title || currentTrack.t || "Pista",
                        filePath: currentTrack.path || currentTrack.f || "",
                        detailsBefore: `BPM: ${currentTrack.bpm || currentTrack.b || "--"} • Downbeat: ${currentTrack.first_downbeat_ms || 0}ms`,
                        detailsAfter: `BPM: ${bpm.toFixed(2)} • Downbeat: ${downbeatMs.toFixed(1)}ms • Cues: ${activeCues.length} pads`,
                        status: "✓ Inyectado en Disco",
                        fullLog: `=== REGISTRO DE GUARDADO INDIVIDUAL ===\nPista: ${currentTrack.title || currentTrack.t}\nArtista: ${currentTrack.artist || currentTrack.a}\nRuta: ${currentTrack.path || currentTrack.f}\nBPM ajustado: ${bpm.toFixed(2)}\nDownbeat 1.0.0: ${downbeatMs.toFixed(1)} ms\nTrim Inicio: ${trimMs.toFixed(1)} ms\nTrim Fin: ${trimEndMs.toFixed(1)} ms\nHot Cues guardados: ${activeCues.map(c => `[PAD ${c.id}: ${c.name} @ ${c.time}]`).join(", ")}\nInyección: GEOB:Serato BeatGrid, GEOB:Serato Markers2, ID3v2.4 / Vorbis Comments`
                    });
                }
            } else {
                setSaveStatus(res?.msg || "Error al guardar pista");
            }
        } catch (e) {
            setSaveStatus("Error de comunicación al guardar");
        } finally {
            setTimeout(() => setSaveStatus(''), 3000);
        }
    };

    // Guardar Todo el Lote de pistas en disco
    const handleGuardarLote = async () => {
        if (!tracks || tracks.length === 0) return;
        setIsSavingBatch(true);
        setSaveStatus("Inyectando marcas en todas las pistas...");
        try {
            if (window.eel && window.eel.inyectar_lote_metadatos) {
                const res = await window.eel.inyectar_lote_metadatos(tracks)();
                if (res && res.status === "ok") {
                    setSaveStatus(`✓ ${tracks.length} pistas guardadas e inyectadas`);
                    if (typeof registrarEnBitacora === 'function') {
                        registrarEnBitacora({
                            action: "Inyección de Lote Cues & Grid",
                            category: "cues",
                            trackTitle: `Lote ${tracks.length} pistas`,
                            filePath: currentFolder || "Biblioteca activa",
                            detailsBefore: `${tracks.length} pistas en memoria`,
                            detailsAfter: `Marcas y Beatgrids inyectados en ${tracks.length} archivos`,
                            status: "✓ Lote Guardado",
                            fullLog: `=== INYECCIÓN DE METADATOS Y HOT CUES EN LOTE ===\nTotal de pistas inyectadas: ${tracks.length}\nCarpeta: ${currentFolder || "Biblioteca"}\nPads generados: Plantilla Club Extended 8 Pads Fraseados (32 compases)\nCompatibilidad: Serato DJ Pro (.crate & GEOB) + Pioneer Rekordbox XML`
                        });
                    }
                } else {
                    setSaveStatus("Guardado de lote completado con advertencias");
                }
            }
        } catch (e) {
            setSaveStatus("Error en guardado masivo");
        } finally {
            setIsSavingBatch(false);
            setTimeout(() => setSaveStatus(''), 3000);
        }
    };

    // Regenerar Mood & Comentario Táctico Profesional DJ con Inteligencia Acústica
    const handleRegenerarMood = async () => {
        if (!currentTrack) return;
        setIsRegeneratingMood(true);
        try {
            if (window.eel && window.eel.regenerar_mood_y_comentario) {
                const res = await window.eel.regenerar_mood_y_comentario(currentTrack, lang)();
                if (res && res.status === "ok") {
                    updateCurrentTrackField('mood', res.mood);
                    updateCurrentTrackField('mood_subtag', res.mood_subtag);
                    updateCurrentTrackField('valence', res.valence);
                    updateCurrentTrackField('arousal', res.arousal);
                    updateCurrentTrackField('comment', res.comment);
                    setTacticalComment(res.comment);
                    setSaveStatus(`✓ Mood: ${res.mood_subtag || res.mood}`);
                    setTimeout(() => setSaveStatus(''), 2500);
                }
            }
        } catch (e) {
            console.error("Error regenerando mood:", e);
        } finally {
            setIsRegeneratingMood(false);
        }
    };

    // Navegador de Carpetas del Sistema
    const handleAbrirNavegador = async (dir) => {
        const target = dir || currentFolder || "";
        setRutaNavegacion(target);
        setFsBrowserOpen(true);
        let res = null;
        try {
            const r = await fetch('/api/listar_subcarpetas?ruta=' + encodeURIComponent(target || ''));
            if (r.ok) res = await r.json();
        } catch (e) {}
        if (!res && window.eel && window.eel.listar_subcarpetas_sistema) {
            try {
                res = await window.eel.listar_subcarpetas_sistema(target)();
            } catch (err) {
                console.error("Error al listar carpetas Eel:", err);
            }
        }
        if (res) {
            if (res.current) setRutaNavegacion(res.current);
            if (Array.isArray(res.folders)) {
                setCarpetasSistema(res.folders);
            } else if (Array.isArray(res)) {
                setCarpetasSistema(res);
            } else {
                setCarpetasSistema([]);
            }
        } else {
            setCarpetasSistema([]);
        }
    };

    const handleCargarDirectorio = async (nuevaRuta) => {
        setFsBrowserOpen(false);
        if (setCurrentFolder) setCurrentFolder(nuevaRuta);
        setFilterQuery('');
        setSelectedCueId(1);
        setSaveStatus('');
        setAutoMappingStatus('');
        if (setTracks) setTracks([]);
        if (setSelectedTrack) setSelectedTrack(null);
        if (window.eel && window.eel.cargar_metadatos_directorio) {
            setIsLoadingDir(true);
            try {
                const res = await window.eel.cargar_metadatos_directorio(nuevaRuta)();
                if (res && Array.isArray(res.tracks)) {
                    if (setTracks) setTracks(res.tracks);
                    if (res.tracks.length > 0 && setSelectedTrack) {
                        setSelectedTrack(res.tracks[0].id);
                    }
                }
            } catch (e) {
                console.error("Error cargando carpeta:", e);
            } finally {
                setIsLoadingDir(false);
            }
        }
    };

    // Filtrado rápido de pistas
    const filteredTracks = (tracks || []).filter(t => {
        if (!filterQuery) return true;
        const q = filterQuery.toLowerCase();
        return (
            (t.title || t.t || '').toLowerCase().includes(q) ||
            (t.artist || t.a || '').toLowerCase().includes(q) ||
            (t.bpm || t.b || '').toLowerCase().includes(q) ||
            (t.key || t.k || '').toLowerCase().includes(q)
        );
    });

    const isCurrentPlayingThis = isPlaying && nowPlayingTrack && (
        String(nowPlayingTrack.id) === String(currentTrack?.id) ||
        nowPlayingTrack.path === currentTrack?.path ||
        nowPlayingTrack.f === currentTrack?.f
    );

    return (
        <div className="ws-module ws-mod-hotcues flex-1 min-h-0 w-full flex flex-col bg-[#07070a] overflow-hidden text-gray-200">
            {/* BARRA SUPERIOR: RUTA DE CARPETA, SELECTOR DE PISTAS Y ACCIONES */}
            <header className="border-b border-djzinc-800 bg-[#0a0a0f] px-3 md:px-4 py-2 md:py-0 md:h-14 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-2 md:gap-3 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <SectionTitle icon={Icons.Cue} title="Studio" accent={studioMode === 'beatgrid' ? "Beatgrid" : "Hot Cues"} />
                    <div className="flex items-center gap-1 bg-[#101018] p-1 rounded-xl border border-djzinc-750 shrink-0">
                        <button
                            type="button"
                            onClick={() => { setStudioMode('cues'); if (onSetStudioMode) onSetStudioMode('cues'); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                studioMode === 'cues'
                                    ? 'bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-md font-black'
                                    : 'text-gray-400 hover:text-white hover:bg-djzinc-800'
                            }`}
                            title="Modo 8 Hot Cues Tácticos"
                        >
                            <Icons.Cue size={13} />
                            <span>8 Hot Cues</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setStudioMode('beatgrid'); if (onSetStudioMode) onSetStudioMode('beatgrid'); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                studioMode === 'beatgrid'
                                    ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 text-black shadow-md font-black'
                                    : 'text-gray-400 hover:text-white hover:bg-djzinc-800'
                            }`}
                            title="Modo Calibración de Beatgrid 1.0.0 & Recorte Manual de Silencios"
                        >
                            <Icons.Grid size={13} />
                            <span>Beatgrid & Silencios</span>
                        </button>
                    </div>
                </div>
                {/* Directorio Actual & Botón Cambiar Carpeta (Versión Desktop) */}
                <div className="hidden md:flex items-center gap-2 min-w-0 shrink-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-djzinc-900 border border-djzinc-750 text-xs font-mono text-gray-300 truncate max-w-[200px]" title={currentFolder}>
                        <Icons.Folder />
                        <span className="truncate">
                            {currentFolder ? (currentFolder.split('/').pop() || currentFolder) : "Sin carpeta"}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleAbrirNavegador(currentFolder)}
                        className="px-3 py-1.5 text-xs font-mono font-black bg-djcyan-500 hover:bg-djcyan-400 text-black rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                        title="Seleccionar carpeta de música"
                    >
                        <Icons.Folder size={14} className="inline-block align-[-2px]" />
                        <span>{t('btn_change_dir') || 'Seleccionar'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCargarDirectorio(currentFolder)}
                        className="px-2.5 py-1.5 text-xs font-mono bg-djzinc-850 hover:bg-djzinc-800 text-gray-300 rounded-lg border border-djzinc-700 cursor-pointer shadow-sm transition-all shrink-0 active:scale-95"
                        title="Recargar directorio actual"
                    >
                        <Icons.Refresh size={14} className="inline-block align-[-2px]" />
                    </button>
                </div>

                {/* Selector de Pistas de la Carpeta (Dropdown) y Botón para Desplegar Listado Completo */}
                <div className="w-full md:flex-1 md:min-w-0 md:max-w-xl flex items-center gap-2">
                    {filteredTracks && filteredTracks.length > 0 ? (
                        <>
                            <div className="relative flex-1 min-w-0">
                                <select
                                    value={currentTrack ? String(currentTrack.id) : ''}
                                    onChange={(e) => {
                                        const targetId = e.target.value;
                                        setSelectedTrack(targetId);
                                        const found = tracks.find(t => String(t.id) === String(targetId));
                                        if (found && onPlayTrack) {
                                            onPlayTrack(found, 0, false);
                                        }
                                    }}
                                    className="w-full bg-djzinc-900 border border-djzinc-750 text-white text-xs font-mono rounded-lg px-2.5 py-1.5 outline-none focus:border-djcyan-500 cursor-pointer truncate shadow-sm"
                                    title="Selecciona la pista para editar sus Hot Cues"
                                >
                                    {filteredTracks.map((trk, idx) => (
                                        <option key={trk.id} value={trk.id}>
                                            {idx + 1}. {trk.artist || trk.a || 'Artista'} - {trk.title || trk.t || trk.filename} ({trk.bpm || trk.b || '--'} BPM • {trk.key || trk.k || '--'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTrackListDrawer(prev => !prev)}
                                className={`px-2.5 sm:px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow ${
                                    showTrackListDrawer
                                        ? 'bg-djcyan-500 text-black border-djcyan-400 font-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                                        : 'bg-djzinc-900 text-gray-300 border-djzinc-750 hover:bg-djzinc-850 hover:text-white'
                                }`}
                                title="Ver o esconder la tabla completa de pistas de la carpeta"
                            >
                                <Icons.Copy size={14} className="inline-block align-[-2px]" />
                                <span className="hidden sm:inline">{showTrackListDrawer ? 'Ocultar Lista' : `Ver Lista (${filteredTracks.length})`}</span>
                                <span className="sm:hidden">{filteredTracks.length}</span>
                            </button>
                            {/* Botón rápido Guardar Pista visible en móvil en la fila superior */}
                            <button
                                type="button"
                                onClick={handleGuardarPista}
                                className="flex md:hidden px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-black font-mono font-black text-xs rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-emerald-300/60 cursor-pointer transition-all active:scale-95 items-center gap-1 shrink-0"
                                title="Guardar pista en disco"
                            >
                                <Icons.Save size={14} className="inline-block align-[-2px]" />
                                <span className="text-[11px]">Guardar</span>
                            </button>
                        </>
                    ) : (
                        <span className="text-xs font-mono text-gray-500 italic">
                            No hay pistas cargadas en esta carpeta.
                        </span>
                    )}
                </div>

                {/* FILA DE BOTONES CON SCROLL HORIZONTAL EN MÓVIL (< 768px) */}
                <div className="flex md:hidden items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full whitespace-nowrap shrink-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-djzinc-900 border border-djzinc-750 text-xs font-mono text-gray-300 shrink-0 max-w-[160px] truncate" title={currentFolder}>
                        <Icons.Folder />
                        <span className="truncate">
                            {currentFolder ? (currentFolder.split('/').pop() || currentFolder) : "Sin carpeta"}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleAbrirNavegador(currentFolder)}
                        className="px-2.5 py-1 text-xs font-mono font-black bg-djcyan-500 hover:bg-djcyan-400 text-black rounded-lg shadow-sm transition-all flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer"
                        title="Seleccionar carpeta de música"
                    >
                        <Icons.Folder size={14} className="inline-block align-[-2px]" />
                        <span>{t('btn_change_dir') || 'Cambiar'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCargarDirectorio(currentFolder)}
                        className="px-2 py-1 text-xs font-mono bg-djzinc-850 hover:bg-djzinc-800 text-gray-300 rounded-lg border border-djzinc-700 cursor-pointer shadow-sm transition-all shrink-0 active:scale-95"
                        title="Recargar directorio actual"
                    >
                        <Icons.Refresh size={14} className="inline-block align-[-2px]" />
                    </button>
                    <button
                        type="button"
                        onClick={handleGuardarLote}
                        disabled={isSavingBatch}
                        className="px-2.5 py-1 bg-djzinc-800 hover:bg-djzinc-750 text-gray-200 hover:text-white border border-djzinc-700 font-mono font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1 shrink-0 disabled:opacity-50"
                        title="Inyectar y guardar todos los tracks del lote en disco"
                    >
                        <Icons.Package size={14} className="inline-block align-[-2px]" />
                        <span>{t('save_all_disk') || 'Guardar Lote'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleAutoGenerateClubTemplate}
                        className="px-2.5 py-1 bg-djzinc-800 hover:bg-djzinc-750 text-djcyan-400 border border-djcyan-500/40 font-mono font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1 shrink-0"
                        title="Auto-mapear los 8 pads con la Plantilla Club Extended"
                    >
                        <Icons.Zap size={14} className="inline-block align-[-2px]" />
                        <span>Auto-Cues Club</span>
                    </button>
                    {saveStatus && (
                        <span className="text-[11px] font-mono font-bold text-djcyan-400 animate-pulse bg-djcyan-950/80 px-2 py-0.5 rounded border border-djcyan-700/60 shadow shrink-0">
                            {saveStatus}
                        </span>
                    )}
                </div>

                {/* Acciones Globales de Guardado (Versión Desktop) */}
                <div className="hidden md:flex items-center gap-2 shrink-0">
                    {saveStatus && (
                        <span className="text-xs font-mono font-bold text-djcyan-400 animate-pulse bg-djcyan-950/80 px-2.5 py-1 rounded border border-djcyan-700/60 shadow">
                            {saveStatus}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={handleGuardarPista}
                        className="px-4 py-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-black font-mono font-black text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.45)] border border-emerald-300/60 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                        title="Guardar cues, downbeat y metadatos de esta pista en el archivo físico"
                    >
                        <Icons.Save size={14} className="inline-block align-[-2px]" />
                        <span>{t('save_track_disk') || 'Guardar Pista'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleGuardarLote}
                        disabled={isSavingBatch}
                        className="px-3 py-1.5 bg-djzinc-800 hover:bg-djzinc-750 text-gray-200 hover:text-white border border-djzinc-700 font-mono font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                        title="Inyectar y guardar todos los tracks del lote en disco"
                    >
                        <Icons.Package size={14} className="inline-block align-[-2px]" />
                        <span>{t('save_all_disk') || 'Guardar Lote'}</span>
                    </button>
                </div>
            </header>

            {/* LISTADO DE PISTAS DESPLEGABLE DE LA CARPETA */}
            {showTrackListDrawer && filteredTracks && filteredTracks.length > 0 && (
                <div className="bg-[#08080d] border-b border-djzinc-800 p-4 shadow-2xl animate-fadeIn max-h-72 overflow-hidden flex flex-col shrink-0">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-djzinc-800/80">
                        <div className="flex items-center gap-2">
                            <Icons.Music size={14} className="inline-block align-[-2px]" />
                            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                                Pistas en Carpeta: {filteredTracks.length} archivos
                            </h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={filterQuery}
                                onChange={(e) => setFilterQuery(e.target.value)}
                                placeholder="Filtrar por título, artista, BPM..."
                                className="w-56 bg-djzinc-900 border border-djzinc-750 rounded-lg px-2.5 py-1 text-xs text-gray-200 outline-none font-mono placeholder-gray-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowTrackListDrawer(false)}
                                className="text-gray-400 hover:text-white text-xs font-mono px-2 py-1 bg-djzinc-900 rounded border border-djzinc-750 cursor-pointer"
                            >
                                <Icons.Close size={14} className="inline-block align-[-2px]" /> Cerrar
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-djzinc-850/60 pr-1">
                        <table className="w-full text-left text-xs font-mono">
                            <thead>
                                <tr className="text-gray-500 border-b border-djzinc-800 text-[10px] uppercase">
                                    <th className="py-1 px-2 w-10">#</th>
                                    <th className="py-1 px-2 w-12">Cover</th>
                                    <th className="py-1 px-2">Título / Artista</th>
                                    <th className="py-1 px-2 w-24 text-center">{t('th_genre') || 'Género'}</th>
                                    <th className="py-1 px-2 w-28 text-center">{t('th_subgenre') || 'Subgénero'}</th>
                                    <th className="py-1 px-2 w-20">BPM</th>
                                    <th className="py-1 px-2 w-16">Tono</th>
                                    <th className="py-1 px-2 w-20">Duración</th>
                                    <th className="py-1 px-2 w-24 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTracks.map((trk, idx) => {
                                    const isSel = currentTrack && String(currentTrack.id) === String(trk.id);
                                    return (
                                        <tr
                                            key={trk.id}
                                            onClick={() => {
                                                setSelectedTrack(trk.id);
                                                if (onPlayTrack) onPlayTrack(trk, 0, false);
                                            }}
                                            className={`hover:bg-djzinc-900/80 cursor-pointer transition-colors ${
                                                isSel ? 'bg-djcyan-950/40 text-djcyan-300 font-bold' : 'text-gray-300'
                                            }`}
                                        >
                                            <td className="py-1.5 px-2 text-gray-500">{idx + 1}</td>
                                            <td className="py-1.5 px-2">
                                                <img
                                                    src={getValidCover(trk.cover || (trk.path ? `/cover?path=${encodeURIComponent(trk.path)}` : null))}
                                                    alt="Cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }}
                                                    className="w-7 h-7 rounded object-cover border border-djzinc-750"
                                                />
                                            </td>
                                            <td className="py-1.5 px-2">
                                                <div className="truncate max-w-xs sm:max-w-md font-bold text-white">
                                                    {trk.title || trk.t || trk.filename}
                                                </div>
                                                <div className="truncate max-w-xs text-[11px] text-gray-400">
                                                    {trk.artist || trk.a || 'Artista Desconocido'}
                                                </div>
                                            </td>
                                            <td className="py-1.5 px-2 text-center">
                                                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-purple-950/70 text-purple-300 border border-purple-800/60 truncate max-w-[85px] inline-block">
                                                    {trk.genre || 'House'}
                                                </span>
                                            </td>
                                            <td className="py-1.5 px-2 text-center">
                                                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono text-gray-300 bg-djzinc-850 border border-djzinc-750 truncate max-w-[95px] inline-block">
                                                    {trk.subgenre || (TAXONOMY_TREE[trk.genre || 'Tech House'] ? TAXONOMY_TREE[trk.genre || 'Tech House'][0] : 'Tech House')}
                                                </span>
                                            </td>
                                            <td className="py-1.5 px-2 font-mono text-gray-300">{trk.bpm || trk.b || '--'}</td>
                                            <td className="py-1.5 px-2 font-mono text-djcyan-400">{trk.key || trk.k || '--'}</td>
                                            <td className="py-1.5 px-2 text-gray-400">{trk.duration || '--'}</td>
                                            <td className="py-1.5 px-2 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedTrack(trk.id);
                                                            setShowTrackListDrawer(false);
                                                            if (onPlayTrack) onPlayTrack(trk, 0, true);
                                                        }}
                                                        className="px-2.5 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black text-[10px] font-mono font-bold rounded cursor-pointer shadow active:scale-95"
                                                    >
                                                        <Icons.Play size={14} className="inline-block align-[-2px]" /> Cargar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleRemoveTrackFromHotCues(trk.id, e)}
                                                        className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-950/50 border border-transparent hover:border-red-800/60 text-[11px] cursor-pointer transition-colors active:scale-90"
                                                        title="Quitar pista del análisis global"
                                                    >
                                                        <Icons.Trash size={14} className="inline-block align-[-2px]" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CUERPO DEL ESTUDIO: WAVEFORM EXPANDIDO, CONTROLES DE TRANSPORTE Y PADS */}
            {currentTrack ? (
                <div className="flex-1 min-h-0 flex flex-col p-4 overflow-y-auto custom-scrollbar gap-4">
                    {/* CONSOLA HARDWARE PERFORMANCE DECK & 8 HOT CUES */}
                    <div className="bg-gradient-to-b from-[#181826] via-[#101018] to-[#0a0a0f] border-2 border-djzinc-800 rounded-2xl p-4 shadow-2xl relative">
                        {/* Bisel Metálico Superior */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-djcyan-500/40 to-transparent"></div>

                        {/* CONTROLLER SEGMENTADO MÓVIL (< 768px): [ PADS | EQ & PITCH | VINILO ] */}
                        <div className="flex md:hidden items-center justify-between p-1 bg-[#090912] border border-djzinc-800 rounded-xl mb-4 gap-1">
                            <button
                                type="button"
                                onClick={() => setMobileDeckMode('pads')}
                                className={`flex-1 py-2 rounded-lg text-xs font-mono font-black transition-all text-center cursor-pointer ${
                                    mobileDeckMode === 'pads' 
                                        ? 'bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-md scale-[1.02]' 
                                        : 'text-gray-400 hover:text-white hover:bg-djzinc-850'
                                }`}
                            >
                                <Icons.Sliders size={14} className="inline-block align-[-2px]" /> 8 PADS
                            </button>
                            <button
                                type="button"
                                onClick={() => setMobileDeckMode('eq_pitch')}
                                className={`flex-1 py-2 rounded-lg text-xs font-mono font-black transition-all text-center cursor-pointer ${
                                    mobileDeckMode === 'eq_pitch' 
                                        ? 'bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-md scale-[1.02]' 
                                        : 'text-gray-400 hover:text-white hover:bg-djzinc-850'
                                }`}
                            >
                                <Icons.Sliders size={14} className="inline-block align-[-2px]" /> EQ & TEMPO
                            </button>
                            <button
                                type="button"
                                onClick={() => setMobileDeckMode('vinyl')}
                                className={`flex-1 py-2 rounded-lg text-xs font-mono font-black transition-all text-center cursor-pointer ${
                                    mobileDeckMode === 'vinyl' 
                                        ? 'bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-md scale-[1.02]' 
                                        : 'text-gray-400 hover:text-white hover:bg-djzinc-850'
                                }`}
                            >
                                <Icons.Disc size={14} className="inline-block align-[-2px]" /> VINILO 12"
                            </button>
                        </div>

                        <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                            {/* LADO IZQUIERDO: DECK DE TOCADISCOS DJ PROFESIONAL CON VINILO GIRATORIO DE ALTA RESOLUCIÓN */}
                            <div className={`flex-wrap sm:flex-nowrap items-center gap-5 shrink-0 ${mobileDeckMode === 'vinyl' ? 'flex' : 'hidden md:flex'}`}>
                                {/* PLATO GIRADISCOS DJ DIRECT DRIVE CON VINILO 12" A GRAN TAMAÑO */}
                                <div className="relative group shrink-0">
                                    {/* Chasis Metálico Exterior del Plato con Bisel Estroboscópico */}
                                    <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-full bg-gradient-to-tr from-[#0a0a0f] via-[#161622] to-[#0c0c14] border-4 border-[#2c2c3e] shadow-[0_12px_40px_rgba(0,0,0,0.85),inset_0_2px_6px_rgba(255,255,255,0.18)] p-2.5 flex items-center justify-center relative select-none">
                                        
                                        {/* Puntos de Luz Estroboscópica del Borde Technics 1200 */}
                                        <div className="absolute inset-1 rounded-full border border-dashed border-djzinc-650/40 pointer-events-none"></div>

                                        {/* Disco de Vinilo 12" con Surcos Microacústicos y Giro Continuo Ultraligero (Sin Scratch ni Aguja) */}
                                        <div 
                                            className="w-full h-full rounded-full relative overflow-hidden flex items-center justify-center shadow-2xl select-none pointer-events-none"
                                            title="Plato de Vinilo Direct-Drive (Visual)"
                                            style={{
                                                background: 'radial-gradient(circle, #22222a 0%, #121217 38%, #1a1a24 49%, #0d0d12 62%, #161620 78%, #08080c 100%)',
                                                boxShadow: 'inset 0 0 18px rgba(0,0,0,0.95), 0 0 15px rgba(0,0,0,0.8)',
                                                animation: isCurrentPlayingThis ? 'spinVinylContinuous 3s linear infinite' : 'none'
                                            }}
                                        >
                                            {/* Surcos de Pistas de Audio en Vinilo (Grooves) */}
                                            <div 
                                                className="absolute inset-0 rounded-full pointer-events-none opacity-40"
                                                style={{
                                                    background: 'repeating-radial-gradient(circle, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3.5px)'
                                                }}
                                            ></div>

                                            {/* Brillo Óptico de Refracción de Luz en el Vinilo */}
                                            <div 
                                                className="absolute inset-0 rounded-full pointer-events-none opacity-25"
                                                style={{
                                                    background: 'conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.12) 60deg, transparent 120deg, transparent 180deg, rgba(255,255,255,0.12) 240deg, transparent 300deg)'
                                                }}
                                            ></div>

                                            {/* Galleta Central del Vinilo con Carátula Oficial a Gran Tamaño */}
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-26 md:h-26 rounded-full border-2 border-djzinc-500/80 shadow-[0_0_12px_rgba(0,0,0,0.8),inset_0_0_8px_rgba(0,0,0,0.6)] relative overflow-hidden flex items-center justify-center z-10 bg-black">
                                                <img 
                                                    src={getValidCover(currentTrack.cover || (currentTrack.path ? `/cover?path=${encodeURIComponent(currentTrack.path)}` : null))}
                                                    alt="Vinyl Label Cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }}
                                                    className="w-full h-full object-cover rounded-full"
                                                />
                                                
                                                {/* Anillo Central y Agujero del Eje de Bronce (Spindle Hole) */}
                                                <div className="absolute w-4 h-4 rounded-full bg-gradient-to-tr from-amber-700 via-amber-400 to-amber-200 border border-black shadow-[inset_0_1px_3px_rgba(0,0,0,0.9),0_0_4px_rgba(0,0,0,0.8)] z-20 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Badge de Velocidad 33 RPM & Motor Direct Drive */}
                                        <div className="absolute bottom-1.5 left-2 bg-black/85 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-gray-300 border border-djzinc-750 flex items-center gap-1.5 shadow-lg">
                                            <span className={`w-1.5 h-1.5 rounded-full ${isCurrentPlayingThis ? 'bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse' : 'bg-gray-500'}`}></span>
                                            <span>33⅓ RPM</span>
                                        </div>

                                        {/* Formato del Archivo */}
                                        <div className="absolute bottom-1.5 right-2 bg-black/85 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-mono font-black text-djcyan-400 border border-djzinc-750 shadow-lg">
                                            {currentTrack.format || 'FLAC'}
                                        </div>
                                    </div>
                                </div>

                                {/* BOTONES CUE & PLAY TÁCTILES + METADATOS COMPLETOS DEL DECK */}
                                <div className="flex flex-col gap-3 min-w-0">
                                    <div className="flex items-center gap-3">
                                        {/* Botón Circular CUE (Pulsación Ámbar en Pausa / Sincro) */}
                                        <button
                                            type="button"
                                            onClick={handleDeckCue}
                                            className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center font-mono font-black text-xs cursor-pointer shadow-xl transition-all active:scale-90 select-none ${
                                                !isCurrentPlayingThis
                                                    ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse'
                                                    : 'bg-[#181824] border-amber-700/60 text-amber-500 hover:border-amber-400 hover:text-amber-300'
                                            }`}
                                            title="CUE: Regresar al punto de inicio maestro"
                                        >
                                            <span className="tracking-wider text-xs">CUE</span>
                                        </button>

                                        {/* Botón Circular PLAY/PAUSE (Verde Neón Brillante en Reproducción) */}
                                        <button
                                            type="button"
                                            onClick={handleDeckTogglePlay}
                                            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center cursor-pointer shadow-xl transition-all active:scale-90 select-none ${
                                                isCurrentPlayingThis
                                                    ? 'bg-emerald-500 border-white text-black font-black shadow-[0_0_25px_rgba(16,185,129,0.9)]'
                                                    : 'bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse'
                                            }`}
                                            title="PLAY/PAUSE: Iniciar o pausar reproducción"
                                        >
                                            {isCurrentPlayingThis ? (
                                                <span className="text-black font-black text-base">❚❚</span>
                                            ) : (
                                                <Icons.Play size={14} className="inline-block align-[-2px] text-emerald-400 font-black  ml-0.5" />
                                            )}
                                        </button>

                                        {/* Badge Master Deck */}
                                        <div className="flex flex-col gap-0.5">
                                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-600/50 text-[10px] font-mono font-black uppercase tracking-wider w-fit">
                                                DECK 1 • MASTER
                                            </span>
                                            <span className="text-[10px] font-mono text-gray-400">
                                                {isCurrentPlayingThis ? '● REPRODUCIENDO' : '○ EN ESPERA'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Metadatos Rápidos del Deck */}
                                    <div className="flex flex-col min-w-0 max-w-[240px]">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-djcyan-400 font-extrabold bg-[#0d0d16] px-2 py-0.5 rounded border border-djzinc-750">
                                                {bpm.toFixed(1)} BPM
                                            </span>
                                            <span className="text-xs font-mono text-purple-300 font-extrabold bg-[#130d1e] px-2 py-0.5 rounded border border-purple-800/60">
                                                {currentTrack.key || '8A'}
                                            </span>
                                        </div>
                                        <h3 className="text-sm sm:text-base font-black text-white truncate mt-1.5" title={currentTrack.title || currentTrack.t}>
                                            {currentTrack.title || currentTrack.t || 'Track'}
                                        </h3>
                                        <p className="text-xs text-djcyan-400 font-bold truncate" title={currentTrack.artist || currentTrack.a}>
                                            {currentTrack.artist || currentTrack.a || 'Artista'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5 text-xs font-mono font-bold">
                                            <span className="text-djcyan-300 bg-djcyan-950/60 px-2 py-0.5 rounded border border-djcyan-800/40">
                                                {formatMsToTime(playProgress * durMs)}
                                            </span>
                                            <span className="text-gray-500">/</span>
                                            <span className="text-gray-400">
                                                -{formatMsToTime(Math.max(0, durMs - (playProgress * durMs)))}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* MÓDULO HARDWARE EQ DE 3 BANDAS (BASS, MID, TREBLE) */}
                                <div className={`flex-col items-center justify-between bg-[#080811] p-2 rounded-xl border border-djzinc-800 shadow-inner shrink-0 ${mobileDeckMode === 'eq_pitch' ? 'flex w-full sm:w-auto' : 'hidden md:flex'}`}>
                                    <div className="flex items-center justify-between w-full border-b border-djzinc-800/80 pb-1 mb-1 text-[9px] font-mono font-bold">
                                        <span className="text-gray-400">EQ 3-BAND</span>
                                        <button
                                            type="button"
                                            onClick={handleResetEQ}
                                            className="text-[8px] font-mono text-gray-400 hover:text-djcyan-400 px-1 py-0.5 rounded hover:bg-djzinc-800 transition-colors"
                                            title="Resetear EQ a 0.0 dB"
                                        >
                                            FLAT
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RotaryKnob label="HI" value={eqTreble} onChange={(v) => handleEqChange('treble', v)} color="#06b6d4" />
                                        <RotaryKnob label="MID" value={eqMid} onChange={(v) => handleEqChange('mid', v)} color="#f59e0b" />
                                        <RotaryKnob label="LOW" value={eqBass} onChange={(v) => handleEqChange('bass', v)} color="#ef4444" />
                                    </div>
                                </div>
                            </div>

                            {/* LADO DERECHO: PIONEER DDJ 8-PADS + PITCH FADER HARDWARE */}
                            <div className="flex-1 min-w-0 max-w-3xl flex flex-col md:flex-row items-stretch gap-3 w-full">
                                <div data-tour="tour-hotcues-deck" className={`flex-1 min-w-0 bg-[#09090f] p-3 rounded-xl border border-djzinc-800 shadow-inner ${mobileDeckMode === 'pads' ? 'block' : 'hidden md:block'}`}>
                                {/* Barra Superior del Pad Mode */}
                                <div className="flex items-center justify-between border-b border-djzinc-800/80 pb-2 mb-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-[#12121c] px-2 py-0.5 rounded border border-djzinc-750">
                                            <span className="w-2 h-2 rounded-full bg-djcyan-400 shadow-[0_0_8px_#06b6d4]"></span>
                                            <span className="text-[10px] font-mono font-black text-white uppercase tracking-wider">
                                                HOT CUE MODE
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-400">
                                            8 Multi-Color Performance Pads • Halos RGB 1 a 1
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAutoGenerateClubTemplate}
                                            className="px-2.5 sm:px-3 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black rounded-lg text-xs font-mono font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 shrink-0"
                                            title="Auto-mapear los 8 pads con la Plantilla Club Extended (Intro, Beat, Break, Drop, Loops, Outro) cuantizados al beatgrid"
                                        >
                                            <Icons.Zap size={14} className="inline-block align-[-2px]" />
                                            <span className="hidden sm:inline">Auto-Generate Cues (Club Template)</span>
                                            <span className="sm:hidden">Auto-Cues Club</span>
                                        </button>
                                        <span className="text-[10px] font-mono text-djcyan-400 font-bold shrink-0">
                                            {isCurrentPlayingThis ? `● CUE ${activePlayingCueId}` : 'PAUSA'}
                                        </span>
                                    </div>
                                </div>
                                {autoMappingStatus && (
                                    <div className="mb-2 px-3 py-1 bg-emerald-950/80 border border-emerald-500/60 rounded text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-2 animate-fadeIn">
                                        <Icons.Check size={14} className="inline-block align-[-2px]" />
                                        <span>{autoMappingStatus}</span>
                                    </div>
                                )}

                                {/* Matriz Adaptativa: 2 columnas en móvil táctil, 4 en tablet/desktop */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {activeCues.map((cue, idx) => {
                                        const padNum = cue.id !== undefined ? cue.id : (idx + 1);
                                        const isSelected = (selectedCueId === padNum);
                                        const isPlayingThisCue = (activePlayingCueId === padNum && isCurrentPlayingThis);
                                        const color = cue.color || (NV2_COLORS[idx] ? NV2_COLORS[idx].color : '#ef4444');
                                        const cueMs = cue.pos_ms !== undefined ? cue.pos_ms : parseTimeToMs(cue.time || '00:00.00');
                                        const barNum = cue.bar || Math.max(1, Math.floor((cueMs - downbeatMs) / barMs) + 1);
                                        const staggerDelay = `${idx * 110}ms`;

                                        if (cue.is_empty) {
                                            return (
                                                <div
                                                    key={`${currentTrack?.id || 'cue'}_pad_${idx}`}
                                                    onClick={() => setSelectedCueId(padNum)}
                                                    className={`p-2 pt-2.5 select-none rounded-xl border border-dashed border-djzinc-800 bg-[#07070b]/60 flex flex-col justify-between min-h-[68px] opacity-40 hover:opacity-75 transition-all cursor-pointer ${isSelected ? 'ring-1 ring-gray-500 opacity-80' : ''}`}
                                                    title={`PAD ${padNum}: Libre (sin asignar)`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-mono text-gray-500 font-bold">PAD {padNum}</span>
                                                        <span className="w-2 h-2 rounded-full bg-gray-700/60"></span>
                                                    </div>
                                                    <div className="text-center my-1 text-[11px] font-mono text-gray-500 font-bold tracking-wider">
                                                        [ LIBRE ]
                                                    </div>
                                                    <div className="flex items-center justify-between text-[9px] font-mono text-gray-600 border-t border-djzinc-800/50 pt-1">
                                                        <span>--:--.--</span>
                                                        <span>Paso {padNum}</span>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={`${currentTrack?.id || 'cue'}_pad_${idx}`}
                                                onClick={() => {
                                                    setSelectedCueId(padNum);
                                                    handleJumpToCue(cue);
                                                }}
                                                className={`ws-pad p-2 pt-2.5 cursor-pointer select-none group min-h-[68px] ${isPlayingThisCue ? 'ws-pad-on ws-pad-live' : isSelected ? 'ws-pad-on' : 'ws-pad-set'}`}
                                                style={{
                                                    animation: 'padHaloIgnite 0.65s cubic-bezier(0.16, 1, 0.3, 1) both',
                                                    animationDelay: staggerDelay,
                                                    '--pad-color': color,
                                                    '--cue-color': color
                                                }}
                                            >
                                                

                                                {/* Resplandor ambiental de fondo del color del Cue */}
                                                

                                                <div className="flex items-center justify-between mt-0.5 relative z-10">
                                                    <span className={`ws-pad-num ${isPlayingThisCue ? 'ws-pad-num-on' : ''}`}>
                                                        PAD {padNum}
                                                    </span>
                                                    <span 
                                                        className={`w-2.5 h-2.5 rounded-full transition-all ${isPlayingThisCue ? 'scale-125 animate-ping' : 'shadow-[0_0_8px_currentColor]'}`}
                                                        style={{ backgroundColor: color, color: color }}
                                                    ></span>
                                                </div>

                                                <div className="my-1 truncate relative z-10">
                                                    <span className="text-[11px] font-bold text-gray-200 block truncate group-hover:text-white" title={cue.name || cue.short_name}>
                                                        {cue.name || cue.short_name || `Cue ${padNum}`}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-djzinc-800/80 relative z-10">
                                                    <span className="font-extrabold text-djcyan-300">{cue.time || "00:00.00"}</span>
                                                    <span className="text-gray-400 text-[9px] font-semibold">Bar {barNum}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* PITCH FADER HARDWARE PROFESIONAL CON NUDGE Y REGULACIÓN LIVE */}
                            <div className={`flex-col items-center bg-[#07070c] p-2.5 rounded-xl border border-djzinc-800 shadow-inner shrink-0 justify-between w-full md:w-28 ${mobileDeckMode === 'eq_pitch' ? 'flex' : 'hidden md:flex'}`}>
                                <div className="flex items-center justify-between w-full border-b border-djzinc-800/80 pb-1 mb-1 text-[9px] font-mono font-bold">
                                    <span className="text-gray-400">TEMPO</span>
                                    <button
                                        type="button"
                                        onClick={() => setPitchRange(r => r === 8 ? 16 : 8)}
                                        className="text-[8px] px-1 rounded bg-[#151522] border border-djzinc-700 text-djcyan-400 hover:text-white cursor-pointer"
                                        title="Alternar rango de pitch"
                                    >
                                        ±{pitchRange}%
                                    </button>
                                </div>

                                {/* Pitch Offset & Live Dynamic BPM */}
                                <div className="text-center my-0.5">
                                    <div className="text-[11px] font-mono font-black text-djcyan-300 tracking-tight">
                                        {pitchPercent > 0 ? `+${pitchPercent.toFixed(2)}` : pitchPercent.toFixed(2)}%
                                    </div>
                                    <div className="text-[10px] font-mono font-extrabold text-amber-400">
                                        {(bpm * (1 + pitchPercent / 100)).toFixed(1)} <span className="text-[7.5px] text-gray-500 font-normal">BPM</span>
                                    </div>
                                </div>

                                {/* Vertical Fader Track & Slider */}
                                <div className="relative flex items-center justify-center my-1 h-24">
                                    {/* Marcador Central 0% Detent */}
                                    <div className="absolute w-5 h-0.5 bg-djcyan-500/60 top-1/2 -translate-y-1/2 pointer-events-none z-10 shadow-[0_0_6px_#06b6d4]"></div>
                                    <input
                                        type="range"
                                        min={-pitchRange}
                                        max={pitchRange}
                                        step={0.05}
                                        value={pitchPercent}
                                        onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                                        className="pitch-slider-vertical"
                                        style={{
                                            writingMode: 'vertical-lr',
                                            direction: 'rtl',
                                            height: '95px',
                                            width: '18px',
                                            accentColor: '#06b6d4',
                                            cursor: 'pointer'
                                        }}
                                        title="Pitch Fader: Ajusta velocidad y tempo dinámicamente"
                                    />
                                </div>

                                {/* Micro-Nudge & Reset Buttons */}
                                <div className="flex items-center gap-1 w-full pt-1.5 border-t border-djzinc-800/80 justify-center">
                                    <button
                                        type="button"
                                        onClick={() => handleNudgePitch(-0.1)}
                                        className="w-6 h-5 rounded bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 font-mono font-black text-[10px] flex items-center justify-center border border-djzinc-700 active:scale-95 shadow cursor-pointer"
                                        title="Nudge BPM -"
                                    >
                                        -
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePitchChange(0)}
                                        className="px-1.5 h-5 rounded bg-[#141420] hover:bg-djcyan-950 text-gray-400 hover:text-djcyan-300 font-mono font-bold text-[8px] flex items-center justify-center border border-djzinc-750 active:scale-95 shadow cursor-pointer"
                                        title="Reset Tempo (0.0%)"
                                    >
                                        0%
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleNudgePitch(+0.1)}
                                        className="w-6 h-5 rounded bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 font-mono font-black text-[10px] flex items-center justify-center border border-djzinc-700 active:scale-95 shadow cursor-pointer"
                                        title="Nudge BPM +"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                    {/* BARRA DE HERRAMIENTAS DEL WAVEFORM (ZOOM HORIZONTAL, SNAP, BEATGRID, PLAYHEAD) */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-djzinc-950/80 border border-djzinc-850 px-2.5 sm:px-3 py-2 rounded-lg gap-2 overflow-hidden">
                        {/* Selector de Nivel de Zoom Horizontal con Scroll Táctil */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap shrink-0">
                            <span className="text-xs font-bold font-mono text-gray-300 uppercase flex items-center gap-1.5 shrink-0">
                                <Icons.ZoomIn />
                                <span className="hidden sm:inline">{t('zoom_level') || 'Zoom'}:</span>
                            </span>
                            <div className="flex items-center bg-djzinc-900 p-0.5 rounded-lg border border-djzinc-800 text-xs font-mono shrink-0">
                                {[
                                    { z: 1, label: "1x (Total)" },
                                    { z: 2, label: "2x" },
                                    { z: 4, label: "4x (DJ)" },
                                    { z: 8, label: "8x (Beat)" },
                                    { z: 16, label: "16x (Micro)" }
                                ].map(lvl => (
                                    <button
                                        key={lvl.z}
                                        type="button"
                                        onClick={() => setZoom(lvl.z)}
                                        className={`px-2 sm:px-2.5 py-1 rounded cursor-pointer font-bold transition-all shrink-0 text-[11px] sm:text-xs ${
                                            zoom === lvl.z
                                            ? 'bg-djcyan-500 text-black shadow'
                                            : 'text-gray-400 hover:text-white hover:bg-djzinc-800'
                                        }`}
                                    >
                                        {lvl.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Toggles de Rejilla y Seguimiento de Reproducción con Scroll Táctil */}
                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap shrink-0">
                            <button
                                type="button"
                                onClick={() => setSnapToGrid(prev => !prev)}
                                className={`px-2.5 sm:px-3 py-1 text-xs font-mono font-bold rounded-lg border cursor-pointer transition-all flex items-center gap-1 shadow-sm shrink-0 ${
                                    snapToGrid
                                    ? 'bg-djzinc-800 text-djcyan-400 border-djcyan-500/60 font-black shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                                    : 'bg-djzinc-900 text-gray-400 border-djzinc-750 hover:text-white'
                                }`}
                                title="Alinear marcadores automáticamente a los tiempos del compás"
                            >
                                <Icons.Link size={14} className="inline-block align-[-2px]" />
                                <span>{snapToGrid ? 'Snap: ON' : 'Snap: OFF'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowBeatgrid(prev => !prev)}
                                className={`px-2.5 sm:px-3 py-1 text-xs font-mono font-bold rounded-lg border cursor-pointer transition-all flex items-center gap-1 shadow-sm shrink-0 ${
                                    showBeatgrid
                                    ? 'bg-djzinc-800 text-djcyan-400 border-djcyan-500/60 font-black shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                                    : 'bg-djzinc-900 text-gray-400 border-djzinc-750 hover:text-white'
                                }`}
                                title="Mostrar líneas de compás y frases de 16 compases"
                            >
                                <Icons.Grid size={14} className="inline-block align-[-2px]" />
                                <span>{showBeatgrid ? 'Grid: ON' : 'Grid: OFF'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFollowPlayhead(prev => !prev)}
                                className={`px-2.5 sm:px-3 py-1 text-xs font-mono font-bold rounded-lg border cursor-pointer transition-all flex items-center gap-1 shadow-sm shrink-0 ${
                                    followPlayhead
                                    ? 'bg-djzinc-800 text-djcyan-400 border-djcyan-500/60 font-black shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                                    : 'bg-djzinc-900 text-gray-400 border-djzinc-750 hover:text-white'
                                }`}
                                title="Centrar automáticamente el scroll horizontal en la aguja de reproducción"
                            >
                                <Icons.Target size={14} className="inline-block align-[-2px]" />
                                <span>{followPlayhead ? 'Seguir: ON' : 'Seguir: OFF'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleAutoPhraseCues}
                                className="px-2.5 sm:px-3.5 py-1 bg-djzinc-850 hover:bg-djzinc-750 text-gray-200 hover:text-white font-mono font-bold text-xs rounded-lg border border-djzinc-700 cursor-pointer shadow-sm transition-all active:scale-95 flex items-center gap-1 shrink-0"
                                title="Calcular automáticamente 8 Hot Cues por frases musicales (16/32 compases)"
                            >
                                <Icons.Zap size={14} className="inline-block align-[-2px]" />
                                <span>{t('auto_phrase') || 'Auto-Frasear 16/32b'}</span>
                            </button>

                            {/* SELECTOR DE ALGORITMO HOT CUES: ESTÁNDAR VS ACÚSTICO VS COMPARATIVA DUAL */}
                            <div className="flex items-center bg-djzinc-900 p-0.5 rounded-lg border border-djzinc-750 text-xs font-mono shrink-0 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCuesVersionMode('estandar');
                                        if (cuesEstandar) updateCues(cuesEstandar);
                                        else handleCargarComparativa('estandar');
                                    }}
                                    className={`px-2.5 py-1 rounded cursor-pointer font-bold transition-all shrink-0 text-[11px] flex items-center gap-1 ${
                                        cuesVersionMode === 'estandar'
                                            ? 'bg-amber-500 text-black shadow font-black'
                                            : 'text-gray-400 hover:text-white hover:bg-djzinc-800'
                                    }`}
                                    title="Modo Estándar (Performance / Slam Mix con retroceso de 16 compases al Drop)"
                                >
                                    <span>⚡ Estándar</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCuesVersionMode('acustico');
                                        if (cuesAcustico) updateCues(cuesAcustico);
                                        else handleCargarComparativa('acustico');
                                    }}
                                    className={`px-2.5 py-1 rounded cursor-pointer font-bold transition-all shrink-0 text-[11px] flex items-center gap-1 ${
                                        cuesVersionMode === 'acustico'
                                            ? 'bg-djcyan-500 text-black shadow font-black'
                                            : 'text-gray-400 hover:text-white hover:bg-djzinc-800'
                                    }`}
                                    title="Modo Acústico (Detección de Sub-Bass y evolución tímbrica de capas)"
                                >
                                    <span>🌊 Acústico</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCargarComparativa('comparativa')}
                                    disabled={isLoadingComparative}
                                    className={`px-2.5 py-1 rounded cursor-pointer font-bold transition-all shrink-0 text-[11px] flex items-center gap-1 ${
                                        cuesVersionMode === 'comparativa'
                                            ? 'bg-purple-600 text-white shadow font-black'
                                            : 'text-gray-400 hover:text-white hover:bg-djzinc-800'
                                    }`}
                                    title="Comparativa Dual: Carga ambos waveforms uno debajo del otro para comparar compás a compás"
                                >
                                    <span>⚖️ Comparar (Dual)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDiferenciasModal(true)}
                                    className="px-2 py-1 text-gray-400 hover:text-djcyan-400 transition-colors text-xs font-bold"
                                    title="Ver diferencias técnicas y guía de uso entre Estándar y Acústico"
                                >
                                    <span>ℹ️ Diferencias</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* WAVEFORM PRINCIPAL AMPLIADO CON SCROLL HORIZONTAL Y MINIMAPA OVERVIEW */}
                    <div className="bg-[#09090e] border border-djzinc-800 rounded-xl p-3 shadow-xl">
                        {cuesVersionMode === 'comparativa' ? (
                            <div className="flex flex-col gap-3">
                                {/* WAVEFORM 1 (SUPERIOR): MODO ESTÁNDAR PERFORMANCE */}
                                <div className="border border-amber-500/50 rounded-lg p-2.5 bg-[#07070b]">
                                    <div className="flex flex-wrap items-center justify-between pb-1.5 mb-1.5 border-b border-djzinc-800 gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse"></span>
                                            <h4 className="text-xs font-black font-mono text-amber-300 uppercase tracking-wider">
                                                Versión 1: Modo Estándar (Performance / Slam Mix)
                                            </h4>
                                            <span className="text-[10px] font-mono text-gray-400 hidden sm:inline">
                                                • Ancla Drop 1 + Retroceso -16b + Escalera Salida (Pads 6-8)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleGuardarModoCues('estandar')}
                                            className="px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-mono font-black text-xs rounded-lg shadow-[0_0_12px_rgba(245,158,11,0.4)] transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                                            title="Guardar versión Estándar en el archivo físico"
                                        >
                                            <Icons.Save size={13} className="inline-block" />
                                            <span>Guardar Versión Estándar</span>
                                        </button>
                                    </div>
                                    <ZoomableRekordboxWaveform
                                        track={currentTrack}
                                        cues={cuesEstandar || activeCues}
                                        duration={currentTrack.duration || "05:00"}
                                        onSeekTrack={onPlayTrack}
                                        playProgress={isCurrentPlayingThis ? playProgress : 0}
                                        isCurrentPlaying={isCurrentPlayingThis}
                                        onUpdateCues={(newCues) => setCuesEstandar(newCues)}
                                        selectedCueId={selectedCueId}
                                        onSelectCue={setSelectedCueId}
                                        snapToGrid={snapToGrid}
                                        showBeatgrid={showBeatgrid}
                                        zoom={zoom}
                                        followPlayhead={followPlayhead}
                                        height={120}
                                        lang={lang}
                                    />
                                </div>

                                {/* WAVEFORM 2 (INFERIOR): MODO ACÚSTICO PROGRESIVO */}
                                <div className="border border-cyan-500/50 rounded-lg p-2.5 bg-[#07070b]">
                                    <div className="flex flex-wrap items-center justify-between pb-1.5 mb-1.5 border-b border-djzinc-800 gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse"></span>
                                            <h4 className="text-xs font-black font-mono text-cyan-300 uppercase tracking-wider">
                                                Versión 2: Modo Acústico (Sub-Bass Transients)
                                            </h4>
                                            <span className="text-[10px] font-mono text-gray-400 hidden sm:inline">
                                                • Detección física de bombos, platos y evoluciones tímbricas de capas
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleGuardarModoCues('acustico')}
                                            className="px-3 py-1 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black font-mono font-black text-xs rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                                            title="Guardar versión Acústica en el archivo físico"
                                        >
                                            <Icons.Save size={13} className="inline-block" />
                                            <span>Guardar Versión Acústica</span>
                                        </button>
                                    </div>
                                    <ZoomableRekordboxWaveform
                                        track={currentTrack}
                                        cues={cuesAcustico || activeCues}
                                        duration={currentTrack.duration || "05:00"}
                                        onSeekTrack={onPlayTrack}
                                        playProgress={isCurrentPlayingThis ? playProgress : 0}
                                        isCurrentPlaying={isCurrentPlayingThis}
                                        onUpdateCues={(newCues) => setCuesAcustico(newCues)}
                                        selectedCueId={selectedCueId}
                                        onSelectCue={setSelectedCueId}
                                        snapToGrid={snapToGrid}
                                        showBeatgrid={showBeatgrid}
                                        zoom={zoom}
                                        followPlayhead={followPlayhead}
                                        height={120}
                                        lang={lang}
                                    />
                                </div>
                            </div>
                        ) : (
                            <ZoomableRekordboxWaveform
                                track={currentTrack}
                                cues={cuesVersionMode === 'estandar' ? (cuesEstandar || activeCues) : (cuesAcustico || activeCues)}
                                duration={currentTrack.duration || "05:00"}
                                onSeekTrack={onPlayTrack}
                                playProgress={isCurrentPlayingThis ? playProgress : 0}
                                isCurrentPlaying={isCurrentPlayingThis}
                                onUpdateCues={updateCues}
                                selectedCueId={selectedCueId}
                                onSelectCue={setSelectedCueId}
                                snapToGrid={snapToGrid}
                                showBeatgrid={showBeatgrid}
                                zoom={zoom}
                                followPlayhead={followPlayhead}
                                height={160}
                                lang={lang}
                            />
                        )}

                        {/* Leyenda Espectral de Frecuencias */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-2 border-t border-djzinc-800/80 mt-2">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_6px_#22d3ee]"></span> <span className="inline-block w-2 h-2 rounded-full bg-rose-500 " aria-hidden="true" /> Sub/Bass (&lt;150Hz)</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_6px_#dc2626]"></span> <span className="inline-block w-2 h-2 rounded-full bg-orange-400 " aria-hidden="true" /> Low-Mid / Drums (150-800Hz)</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]"></span> <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 " aria-hidden="true" /> Mid-High / Vocales (800-4kHz)</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]"></span> <span className="inline-block w-2 h-2 rounded-full bg-sky-400 " aria-hidden="true" /> Treble / Platos (&gt;4kHz)</span>
                            </div>
                            <span className="text-gray-500 font-mono">Desplazamiento horizontal milimétrico • Rejilla Serato/Rekordbox</span>
                        </div>
                    </div>

                    {/* BARRA DE MICRO-AJUSTE (NUDGE) & EDICIÓN DEL CUE O CALIBRACIÓN DE BEATGRID SEGÚN MODO */}
                    {studioMode === 'beatgrid' ? (
                        <div className="bg-[#0b0f19] border-2 border-cyan-500/50 rounded-xl p-3 shadow-xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 text-xs font-mono">
                            {/* BLOQUE 1: CALIBRACIÓN FASE & DOWNBEAT 1.0.0 */}
                            <div className="flex items-center gap-2 bg-[#060911] p-2 rounded-lg border border-cyan-800/60 shrink-0">
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                        Ancla 1.0.0 Kick
                                    </span>
                                    <span className="text-sm font-black text-white font-mono">
                                        {downbeatMs > 0 ? `${downbeatMs.toFixed(1)} ms` : '0.0 ms'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSetDownbeatAtPlayhead}
                                    className="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-md shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                                    title="Fijar el transitorio 1.0.0 exactamente en el cabezal de reproducción actual"
                                >
                                    <Icons.Pin size={13} />
                                    <span>Fijar 1.0.0</span>
                                </button>
                                <div className="flex items-center gap-0.5 ml-1">
                                    <button
                                        type="button"
                                        onClick={() => handleNudgeBeatgridMs(-10)}
                                        className="px-1.5 py-1 bg-djzinc-850 hover:bg-djzinc-750 text-gray-200 rounded border border-djzinc-700 font-bold active:scale-95 cursor-pointer"
                                        title="Mover rejilla -10ms"
                                    >
                                        -10ms
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleNudgeBeatgridMs(-1)}
                                        className="px-1.5 py-1 bg-djzinc-850 hover:bg-djzinc-750 text-cyan-300 rounded border border-cyan-800/80 font-bold active:scale-95 cursor-pointer"
                                        title="Mover rejilla -1ms (micro-fase)"
                                    >
                                        -1ms
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleNudgeBeatgridMs(1)}
                                        className="px-1.5 py-1 bg-djzinc-850 hover:bg-djzinc-750 text-cyan-300 rounded border border-cyan-800/80 font-bold active:scale-95 cursor-pointer"
                                        title="Mover rejilla +1ms (micro-fase)"
                                    >
                                        +1ms
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleNudgeBeatgridMs(10)}
                                        className="px-1.5 py-1 bg-djzinc-850 hover:bg-djzinc-750 text-gray-200 rounded border border-djzinc-700 font-bold active:scale-95 cursor-pointer"
                                        title="Mover rejilla +10ms"
                                    >
                                        +10ms
                                    </button>
                                </div>
                            </div>

                            {/* BLOQUE 2: TEMPO / GRID STRETCH (BPM FINO & TAP) */}
                            <div className="flex items-center gap-2 bg-[#060911] p-2 rounded-lg border border-djzinc-800 shrink-0">
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-amber-400">Tempo Grid</span>
                                    <span className="text-sm font-black text-amber-300 font-mono">
                                        {bpm.toFixed(2)} <span className="text-[9px] text-gray-400 font-normal">BPM</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    <button
                                        type="button"
                                        onClick={() => handleNudgeBpm(-0.1)}
                                        className="px-1.5 py-1 bg-djzinc-850 hover:bg-djzinc-750 text-gray-200 rounded border border-djzinc-700 font-bold active:scale-95 cursor-pointer"
                                        title="Reducir BPM -0.1"
                                    >
                                        -0.1
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleNudgeBpm(-0.01)}
                                        className="px-1.5 py-1 bg-djzinc-850 hover:bg-djzinc-750 text-amber-300 rounded border border-amber-900/60 font-bold active:scale-95 cursor-pointer"
                                        title="Micro-estiramiento BPM -0.01"
                                    >
                                        -0.01
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleNudgeBpm(0.01)}
                                        className="px-1.5 py-1 bg-djzinc-850 hover:bg-djzinc-750 text-amber-300 rounded border border-amber-900/60 font-bold active:scale-95 cursor-pointer"
                                        title="Micro-estiramiento BPM +0.01"
                                    >
                                        +0.01
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleNudgeBpm(0.1)}
                                        className="px-1.5 py-1 bg-djzinc-850 hover:bg-djzinc-750 text-gray-200 rounded border border-djzinc-700 font-bold active:scale-95 cursor-pointer"
                                        title="Aumentar BPM +0.1"
                                    >
                                        +0.1
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleTapTempo}
                                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded font-black text-xs active:scale-90 cursor-pointer shadow-sm"
                                    title="Pulsa repetidamente al ritmo de la música para calcular el tempo"
                                >
                                    🥁 TAP
                                </button>
                            </div>

                            {/* BLOQUE 3: RECORTE MANUAL DE SILENCIOS (AUTO-TRIM IN / OUT) */}
                            <div className="flex items-center gap-2 bg-[#060911] p-2 rounded-lg border border-red-900/40 shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-bold text-red-400">Trim In</span>
                                        <span className="text-xs font-mono font-bold text-white">
                                            {trimMs > 0 ? `-${Math.round(trimMs)}ms` : '0ms'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSetTrimStartAtPlayhead}
                                        className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-200 border border-red-700/70 rounded text-[11px] font-bold cursor-pointer active:scale-95"
                                        title="Fijar corte de silencio inicial en el cabezal actual"
                                    >
                                        ✂️ Cortar In
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResetTrimStart}
                                        className="p-1 text-gray-400 hover:text-white rounded hover:bg-djzinc-800 text-[10px] cursor-pointer"
                                        title="Restablecer Trim In a 0ms"
                                    >
                                        ↺
                                    </button>
                                </div>

                                <div className="w-[1px] h-6 bg-djzinc-800 mx-0.5"></div>

                                <div className="flex items-center gap-1.5">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-bold text-red-400">Trim Out</span>
                                        <span className="text-xs font-mono font-bold text-white">
                                            {trimEndMs > 0 && trimEndMs < durMs ? formatMsToTime(trimEndMs) : 'Fin'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSetTrimEndAtPlayhead}
                                        className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-200 border border-red-700/70 rounded text-[11px] font-bold cursor-pointer active:scale-95"
                                        title="Fijar corte de silencio final (cola) en el cabezal actual"
                                    >
                                        ✂️ Cortar Out
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResetTrimEnd}
                                        className="p-1 text-gray-400 hover:text-white rounded hover:bg-djzinc-800 text-[10px] cursor-pointer"
                                        title="Restablecer Trim Out al final del archivo"
                                    >
                                        ↺
                                    </button>
                                </div>
                            </div>

                            {/* BLOQUE 4: ACCIÓN INYECTAR EN DISCO */}
                            <button
                                type="button"
                                onClick={handleGuardarPista}
                                className="px-3.5 py-2 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-black font-black text-xs rounded-lg shadow-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                                title="Inyectar y guardar beatgrid 1.0.0, Serato Markers2 y silencios recortados en disco"
                            >
                                <Icons.Save size={14} className="inline-block align-[-2px]" />
                                <span>Guardar en Disco</span>
                            </button>
                        </div>
                    ) : (
                        <div className="bg-[#0a0a10] border border-djzinc-800 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shadow-md overflow-x-auto no-scrollbar whitespace-nowrap">
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-bold text-djcyan-400 font-mono bg-djcyan-950/80 px-2 py-1 rounded border border-djcyan-700/60 shrink-0">
                                    PAD {selectedCueId}
                                </span>
                                <input
                                    type="text"
                                    value={cueNameInput}
                                    onChange={(e) => {
                                        setCueNameInput(e.target.value);
                                        updateSingleCue({ name: e.target.value, short_name: e.target.value });
                                    }}
                                    placeholder="Nombre del punto (ej. Drop A)"
                                    className="w-32 sm:w-48 bg-djzinc-900 border border-djzinc-750 rounded-lg px-2.5 py-1 text-xs text-white font-mono outline-none shrink-0"
                                />
                                <input
                                    type="text"
                                    value={cueTimeInput}
                                    onChange={handleTimeInputChange}
                                    placeholder="00:00.00"
                                    className="w-20 sm:w-24 bg-djzinc-900 border border-djzinc-750 rounded-lg px-2.5 py-1 text-xs text-djcyan-400 font-mono font-bold outline-none text-center shrink-0"
                                />
                            </div>

                            {/* Botones de Micro-Ajuste Nudge con Scroll Táctil */}
                            <div className="flex items-center gap-1 font-mono text-xs overflow-x-auto no-scrollbar whitespace-nowrap py-0.5 shrink-0">
                                <span className="text-[10px] text-gray-400 font-bold uppercase mr-1 shrink-0">Nudge:</span>
                                <button
                                    type="button"
                                    onClick={() => handleNudgeMs(-barMs)}
                                    className="px-2 sm:px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 hover:text-white rounded border border-djzinc-750 font-bold cursor-pointer shadow-sm active:scale-95 transition-colors shrink-0"
                                    title="Retroceder 1 compás (4 beats)"
                                >
                                    -1c
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNudgeMs(-beatMs)}
                                    className="px-2 sm:px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 hover:text-white rounded border border-djzinc-750 font-bold cursor-pointer shadow-sm active:scale-95 transition-colors shrink-0"
                                    title="Retroceder 1 beat (negra)"
                                >
                                    -1b
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNudgeMs(-10)}
                                    className="px-2 sm:px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 hover:text-white rounded border border-djzinc-750 font-bold cursor-pointer shadow-sm active:scale-95 transition-colors shrink-0"
                                    title="Retroceder 10 milisegundos"
                                >
                                    -10ms
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNudgeMs(10)}
                                    className="px-2 sm:px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 hover:text-white rounded border border-djzinc-750 font-bold cursor-pointer shadow-sm active:scale-95 transition-colors shrink-0"
                                    title="Avanzar 10 milisegundos"
                                >
                                    +10ms
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNudgeMs(beatMs)}
                                    className="px-2 sm:px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 hover:text-white rounded border border-djzinc-750 font-bold cursor-pointer shadow-sm active:scale-95 transition-colors shrink-0"
                                    title="Avanzar 1 beat (negra)"
                                >
                                    +1b
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNudgeMs(barMs)}
                                    className="px-2 sm:px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 hover:text-white rounded border border-djzinc-750 font-bold cursor-pointer shadow-sm active:scale-95 transition-colors shrink-0"
                                    title="Avanzar 1 compás (4 beats)"
                                >
                                    +1c
                                </button>
                            </div>

                            {/* Botón Anclar en Playhead actual */}
                            <button
                                type="button"
                                onClick={handleSetCueAtPlayhead}
                                className="px-3 sm:px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-xs rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                                title="Fijar el Pad seleccionado en la posición actual de reproducción"
                            >
                                <Icons.Pin size={14} className="inline-block align-[-2px]" />
                                <span className="hidden sm:inline">Fijar Pad {selectedCueId} en Playhead</span>
                                <span className="sm:hidden">Fijar en Playhead</span>
                            </button>
                        </div>
                    )}

                    {/* SECCIÓN DE INTELIGENCIA ACÚSTICA: ATMÓSFERA (MOOD) Y COMENTARIO TÁCTICO PROFESIONAL */}
                    <div className="bg-[#0c0c14] border border-djzinc-800 rounded-xl p-4 shadow-lg space-y-3">
                        <div className="flex items-center justify-between border-b border-djzinc-800 pb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]"></span>
                                    {t('tactical_comment_title') || 'Comentario Táctico DJ & Inteligencia Acústica'}
                                </span>
                                <InfoTip
                                    title="Motor de Inteligencia Acústica"
                                    text="Clasifica la atmósfera sonora (Mood) analizando la energía armónica Camelot y genera comentarios tácticos de mezcla inyectables en el tag ID3 COMM visible en las pantallas de la mesa de mezclas."
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleRegenerarMood}
                                disabled={isRegeneratingMood}
                                className="px-3 py-1 bg-djzinc-800 hover:bg-djzinc-750 text-gray-200 hover:text-white border border-djzinc-700 rounded-lg text-xs font-mono font-bold shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                                title="Recalcular métricas de atmósfera sonora y comentario táctico con IA acústica"
                            >
                                <span>{isRegeneratingMood ? '⏳' : '✨'}</span>
                                <span>{t('regenerate_mood_btn') || 'Regenerar con IA Acústica'}</span>
                            </button>
                        </div>

                        {/* Tarjetas informativas de Mood, Positividad (Valence) e Intensidad (Arousal) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                            <div className="bg-djzinc-950 p-2.5 rounded-lg border border-djzinc-800 flex flex-col justify-between">
                                <span className="text-[10px] text-gray-400 uppercase font-mono">Atmósfera Sonora</span>
                                <span className="text-xs font-bold text-amber-300 font-mono mt-1">
                                    {currentTrack.mood_subtag || currentTrack.mood || "Peak Time / Driving"}
                                </span>
                            </div>
                            <div className="bg-djzinc-950 p-2.5 rounded-lg border border-djzinc-800 flex flex-col justify-between">
                                <span className="text-[10px] text-gray-400 uppercase font-mono">Positividad (Valence)</span>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs font-bold text-djcyan-400 font-mono">
                                        {currentTrack.valence || 55}%
                                    </span>
                                    <div className="w-20 bg-djzinc-800 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-djcyan-400 h-full rounded-full"
                                            style={{ width: `${currentTrack.valence || 55}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-djzinc-950 p-2.5 rounded-lg border border-djzinc-800 flex flex-col justify-between">
                                <span className="text-[10px] text-gray-400 uppercase font-mono">Intensidad (Arousal)</span>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs font-bold text-emerald-400 font-mono">
                                        {currentTrack.arousal || currentTrack.energy || 85}%
                                    </span>
                                    <div className="w-20 bg-djzinc-800 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-emerald-400 h-full rounded-full"
                                            style={{ width: `${currentTrack.arousal || currentTrack.energy || 85}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-djzinc-950 p-2.5 rounded-lg border border-djzinc-800 flex flex-col justify-between">
                                <span className="text-[10px] text-gray-400 uppercase font-mono">Mix Armónico Camelot</span>
                                <span className="text-xs font-bold text-white font-mono mt-1 truncate">
                                    {currentTrack.key || '8A'}: neutral | rel {(currentTrack.key || '8A').endsWith('A') ? (currentTrack.key || '8A').replace('A','B') : (currentTrack.key || '8A').replace('B','A')}
                                </span>
                            </div>
                        </div>

                        {/* Textarea editable del comentario táctico */}
                        <div>
                            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mb-1">
                                <span>Texto que se inyectará en el tag ID3 COMM de la pista:</span>
                                <span className="text-[10px] text-djcyan-400">Editable manualmente</span>
                            </div>
                            <textarea
                                value={tacticalComment}
                                onChange={(e) => {
                                    setTacticalComment(e.target.value);
                                    updateCurrentTrackField('comment', e.target.value);
                                }}
                                rows="3"
                                className="w-full bg-djzinc-950 border border-djzinc-750 rounded-lg p-2.5 text-xs text-gray-200 outline-none font-mono resize-none focus:border-djcyan-500 transition-colors shadow-inner"
                                placeholder="Escribe aquí el comentario estratégico para cabina DJ..."
                            ></textarea>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex flex-col p-6 overflow-y-auto custom-scrollbar gap-6 items-center justify-center">
                    {/* CONSOLA PIONEER HOT CUES STUDIO STANDBY */}
                    <div className="max-w-4xl w-full bg-gradient-to-b from-[#181828] via-[#10101a] to-[#08080f] border-2 border-djzinc-800 rounded-2xl p-6 shadow-2xl relative flex flex-col items-center">
                        {/* Bisel Metálico con Resplandor Neón */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-djcyan-400 to-pink-500 rounded-t-2xl"></div>

                        {/* Encabezado Hardware Pioneer DJ */}
                        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-djzinc-800 pb-4 mb-4 gap-3">
                            <div className="flex items-center gap-3">
                                <Icons.Sliders size={14} className="inline-block align-[-2px]" />
                                <div>
                                    <h2 className="text-base font-black text-white font-mono tracking-wider flex items-center gap-2">
                                        PIONEER DJ • HOT CUES STUDIO
                                        <span className="px-2 py-0.5 rounded text-[10px] bg-djcyan-950 text-djcyan-300 border border-djcyan-700/60 font-bold">
                                            LISTO
                                        </span>
                                    </h2>
                                    <p className="text-xs text-gray-400 font-mono">
                                        Mapeo de 8 Hot Cues por frases musicales, beatgrid milimétrico y compatibilidad Rekordbox & Serato
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleAbrirNavegador(currentFolder)}
                                className="px-4 py-2 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-xs rounded-lg shadow-lg hover:shadow-djcyan-500/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
                            >
                                <Icons.Folder size={14} className="inline-block align-[-2px]" />
                                <span>Cargar Carpeta de Música</span>
                            </button>
                        </div>

                        {/* Si hay pistas en la carpeta pero ninguna seleccionada, muestra la tabla para seleccionar */}
                        {tracks && tracks.length > 0 ? (
                            <div className="w-full bg-[#09090f] p-4 rounded-xl border border-djzinc-800 shadow-inner my-2">
                                <div className="flex items-center justify-between border-b border-djzinc-800/80 pb-2 mb-3">
                                    <span className="text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        <Icons.Music size={14} className="inline-block align-[-2px]" /> Pistas disponibles en la carpeta ({tracks.length})
                                    </span>
                                    <span className="text-xs font-mono text-gray-400">
                                        Haz clic en cualquier pista para cargarla en el Deck
                                    </span>
                                </div>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar divide-y divide-djzinc-850">
                                    {tracks.map((trk, idx) => (
                                        <div
                                            key={trk.id}
                                            onClick={() => {
                                                setSelectedTrack(trk.id);
                                                if (onPlayTrack) onPlayTrack(trk, 0, false);
                                            }}
                                            className="p-2.5 hover:bg-djzinc-900 cursor-pointer flex items-center justify-between text-xs font-mono transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-gray-500 w-6">{idx + 1}</span>
                                                <img
                                                    src={getValidCover(trk.cover || (trk.path ? `/cover?path=${encodeURIComponent(trk.path)}` : null))}
                                                    alt="Cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }}
                                                    className="w-8 h-8 rounded object-cover border border-djzinc-750 shrink-0"
                                                />
                                                <div className="truncate">
                                                    <span className="font-bold text-white block truncate">{trk.title || trk.t || trk.filename}</span>
                                                    <span className="text-gray-400 text-[11px] block truncate">{trk.artist || trk.a || 'Artista'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-gray-400 text-[11px]">{trk.bpm || trk.b || '--'} BPM</span>
                                                <span className="text-djcyan-400 text-[11px] font-bold">{trk.key || trk.k || '--'}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTrack(trk.id);
                                                        if (onPlayTrack) onPlayTrack(trk, 0, true);
                                                    }}
                                                    className="px-3 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black text-[10px] font-bold rounded cursor-pointer shadow active:scale-95"
                                                >
                                                    <Icons.Play size={14} className="inline-block align-[-2px]" /> Cargar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleRemoveTrackFromHotCues(trk.id, e)}
                                                    className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-950/50 border border-transparent hover:border-red-800/60 text-[11px] cursor-pointer transition-colors active:scale-90"
                                                    title="Quitar pista del análisis global"
                                                >
                                                    <Icons.Trash size={14} className="inline-block align-[-2px]" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* MATRIZ DE 8 PADS PERFORMANCE INTERACTIVOS EN STANDBY (FILA 1-4 Y FILA 5-8 COMPLETAMENTE VISIBLES) */}
                        <div className="w-full max-w-2xl bg-[#09090f] p-4 rounded-xl border border-djzinc-800 shadow-inner mt-2">
                            <div className="flex items-center justify-between border-b border-djzinc-800/80 pb-2 mb-3">
                                <span className="text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    8 Hot Cues Performance • Código de Colores Oficial
                                </span>
                                <span className="text-xs font-mono text-gray-400">
                                    Pads 1-4 (Superior) • Pads 5-8 (Inferior)
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {NV2_COLORS.slice(0, 8).map((cue, idx) => {
                                    const padNum = idx + 1;
                                    const isSelected = (selectedCueId === padNum);
                                    const color = cue.color || '#ef4444';
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedCueId(padNum)}
                                            className={`ws-pad p-2.5 pt-3 cursor-pointer select-none group min-h-[66px] ${isSelected ? 'ws-pad-on' : 'ws-pad-set'}`}
                                            style={{ '--pad-color': color }}
                                        >
                                            <div className="flex items-center justify-between mt-0.5">
                                                <span className={`ws-pad-num ${isSelected ? 'ws-pad-num-on' : ''}`}>
                                                    PAD {padNum}
                                                </span>
                                                <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: color }}></span>
                                            </div>
                                            <div className="mt-1.5 text-left">
                                                <p className="text-[11px] font-bold text-white truncate">{cue.name}</p>
                                                <p className="text-[10px] font-mono font-semibold" style={{ color: color }}>
                                                    {cue.time}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Botones de Acción para Carga */}
                        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => handleAbrirNavegador(currentFolder)}
                                className="px-5 py-2.5 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-xs rounded-lg shadow-xl cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Icons.Folder size={14} className="inline-block align-[-2px]" />
                                <span>Explorar y Cargar Carpeta</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onNavigateTab && onNavigateTab('auditoria')}
                                className="px-5 py-2.5 bg-djzinc-850 hover:bg-djzinc-800 text-gray-200 border border-djzinc-700 font-mono font-bold text-xs rounded-lg shadow cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Icons.Copy size={14} className="inline-block align-[-2px]" />
                                <span>Ir a Auditoría de Archivos</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DEL NAVEGADOR DE CARPETAS DEL SISTEMA */}
            {fsBrowserOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-[#0e0e16] border border-djzinc-700 rounded-xl max-w-xl w-full p-4 shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between border-b border-djzinc-800 pb-3 mb-3">
                            <div className="flex items-center gap-2">
                                <Icons.Folder size={14} className="inline-block align-[-2px]" />
                                <h3 className="text-sm font-bold text-white font-mono">Seleccionar Carpeta para Hot Cues</h3>
                            </div>
                            <button
                                onClick={() => setFsBrowserOpen(false)}
                                className="text-gray-400 hover:text-white text-sm cursor-pointer"
                            >
                                <Icons.Close size={14} className="inline-block align-[-2px]" />
                            </button>
                        </div>

                        <div className="text-xs font-mono text-gray-400 mb-2 truncate bg-djzinc-950 p-2 rounded border border-djzinc-800">
                            Ruta: {rutaNavegacion}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar border border-djzinc-800 rounded-lg p-1 divide-y divide-djzinc-850 max-h-60 bg-djzinc-950">
                            {(Array.isArray(carpetasSistema) ? carpetasSistema : []).map((folder, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleAbrirNavegador(folder.path)}
                                    className="p-2 hover:bg-djzinc-900 cursor-pointer flex items-center justify-between text-xs font-mono text-gray-300 transition-colors"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <Icons.Folder size={14} className="inline-block align-[-2px]" />
                                        <span className="truncate">{folder.name}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500">Subir / Entrar →</span>
                                </div>
                            ))}
                            {(!carpetasSistema || (Array.isArray(carpetasSistema) && carpetasSistema.length === 0)) && (
                                <div className="p-4 text-center text-xs text-gray-500 font-mono">
                                    No hay subcarpetas en este directorio.
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-djzinc-800">
                            <button
                                type="button"
                                onClick={() => {
                                    const parent = rutaNavegacion.substring(0, rutaNavegacion.lastIndexOf('/')) || '/';
                                    handleAbrirNavegador(parent);
                                }}
                                className="px-3 py-1.5 bg-djzinc-900 hover:bg-djzinc-850 text-gray-300 text-xs font-mono rounded border border-djzinc-800 cursor-pointer"
                            >
                                <Icons.Upload size={14} className="inline-block align-[-2px]" /> Carpeta Superior
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFsBrowserOpen(false)}
                                    className="px-3 py-1.5 bg-djzinc-850 hover:bg-djzinc-800 text-gray-300 text-xs font-mono rounded border border-djzinc-750 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCargarDirectorio(rutaNavegacion)}
                                    className="px-4 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black text-xs font-mono font-bold rounded shadow cursor-pointer transition-transform active:scale-95"
                                >
                                    <Icons.Check size={14} className="inline-block align-[-2px]" /> Cargar Esta Carpeta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EXPLICATIVO: DIFERENCIAS TÉCNICAS ESTÁNDAR VS ACÚSTICO */}
            {showDiferenciasModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-[#0e0e18] border-2 border-djzinc-700 rounded-2xl max-w-3xl w-full p-5 shadow-2xl flex flex-col max-h-[88vh] text-xs font-mono">
                        <div className="flex items-center justify-between border-b border-djzinc-800 pb-3 mb-4">
                            <div className="flex items-center gap-2.5">
                                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-cyan-400 animate-pulse"></span>
                                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                                    Comparativa Técnica: Hot Cues Estándar vs Acústico
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDiferenciasModal(false)}
                                className="text-gray-400 hover:text-white text-base cursor-pointer px-2 py-1 bg-djzinc-900 rounded border border-djzinc-750"
                            >
                                <Icons.Close size={15} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                            {/* Resumen conceptual */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-amber-950/20 border border-amber-600/40 rounded-xl p-3.5 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-xs font-black text-amber-300 uppercase flex items-center gap-1.5 mb-1.5">
                                            <span>⚡</span> Modo Estándar (Performance / Slam Mix)
                                        </h4>
                                        <p className="text-[11px] text-gray-300 leading-relaxed">
                                            Diseñado para <strong>cabina de club y festivales</strong>. Calcula los saltos clave hacia atrás desde el clímax:
                                            permite saltar intros largas entrando directamente a 16 compases del drop (Pad 2), meter slam mixes al Drop 1 (Pad 3)
                                            y gestionar la transición de salida con una escalera de 3 fases (Pads 6, 7 y 8 con loop de seguridad).
                                        </p>
                                    </div>
                                    <div className="mt-2.5 pt-2 border-t border-amber-800/40 text-[10px] text-amber-400 font-bold">
                                        Ideal para: Sets enérgicos, transiciones rápidas y cambio de tema inmediato.
                                    </div>
                                </div>

                                <div className="bg-cyan-950/20 border border-cyan-600/40 rounded-xl p-3.5 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-xs font-black text-cyan-300 uppercase flex items-center gap-1.5 mb-1.5">
                                            <span>🌊</span> Modo Acústico (Sub-Bass Transients)
                                        </h4>
                                        <p className="text-[11px] text-gray-300 leading-relaxed">
                                            Diseñado para <strong>mezcla progresiva y deconstrucción de capas</strong>. Detecta físicamente la evolución
                                            tímbrica de la pista: entrada de platos (Pad 2 Hi-Hats), entrada de bajo (Pad 3 Bassline) y desglosa el
                                            flujo melódico según la física del espectro en bajas frecuencias.
                                        </p>
                                    </div>
                                    <div className="mt-2.5 pt-2 border-t border-cyan-800/40 text-[10px] text-cyan-400 font-bold">
                                        Ideal para: Warm-up, Melodic Techno, Progressive House y mezclas largas por capas.
                                    </div>
                                </div>
                            </div>

                            {/* Tabla comparativa pad por pad */}
                            <div className="bg-[#090910] border border-djzinc-800 rounded-xl overflow-hidden">
                                <div className="px-3.5 py-2 bg-djzinc-900 border-b border-djzinc-800 flex items-center justify-between">
                                    <span className="text-[11px] font-black text-white uppercase tracking-wider">
                                        Mapeo de los 8 Pads Performance
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        Compatibilidad nativa Numark / Pioneer / Serato
                                    </span>
                                </div>
                                <div className="divide-y divide-djzinc-850 overflow-x-auto">
                                    <table className="w-full text-left text-[11px]">
                                        <thead>
                                            <tr className="text-gray-400 bg-djzinc-950/60 uppercase text-[10px]">
                                                <th className="py-2 px-3 w-16">Pad</th>
                                                <th className="py-2 px-3 text-amber-300">Modo Estándar</th>
                                                <th className="py-2 px-3 text-cyan-300">Modo Acústico</th>
                                                <th className="py-2 px-3 text-gray-400 hidden sm:table-cell">Función en Sesión</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-djzinc-850/60">
                                            {[
                                                { pad: "Pad 1", est: "Primer Golpe (Intro)", ac: "Kick / Intro", fn: "Punto de partida principal (Downbeat 1.1)", color: "#ef4444" },
                                                { pad: "Pad 2", est: "Entrada Rápida (-16b Drop)", ac: "Hi-Hats In", fn: "Saltar intro larga vs añadir platos progresivos", color: "#f97316" },
                                                { pad: "Pad 3", est: "Drop 1 (Clímax Principal)", ac: "Bassline In", fn: "Slam mix de golpe vs meter groove de subgraves", color: "#eab308" },
                                                { pad: "Pad 4", est: "Break 1 (Parón / Vocal)", ac: "Main Break", fn: "Bajar energía o lanzar acapella sobre la base", color: "#06b6d4" },
                                                { pad: "Pad 5", est: "Drop 2 (Segundo Clímax)", ac: "Drop 1 (Climax)", fn: "Saltar directamente al momento álgido final", color: "#22c55e" },
                                                { pad: "Pad 6", est: "Aviso Salida (-16b Fin)", ac: "Mid Break", fn: "Aviso visual en cabina para preparar la siguiente pista", color: "#3b82f6" },
                                                { pad: "Pad 7", est: "Inicio Outro (Salida)", ac: "Drop 2 (Re-Kick)", fn: "Se apaga la melodía y queda solo la base rítmica", color: "#a855f7" },
                                                { pad: "Pad 8", est: "Loop Seguridad (Outro Loop)", ac: "Outro Mix Point", fn: "Bucle automático 4/8 compases para no quedarse sin pista", color: "#ec4899" }
                                            ].map((row, i) => (
                                                <tr key={i} className="hover:bg-djzinc-900/50 transition-colors">
                                                    <td className="py-2 px-3 font-bold flex items-center gap-1.5">
                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }}></span>
                                                        <span className="text-white">{row.pad}</span>
                                                    </td>
                                                    <td className="py-2 px-3 text-amber-200 font-semibold">{row.est}</td>
                                                    <td className="py-2 px-3 text-cyan-200 font-semibold">{row.ac}</td>
                                                    <td className="py-2 px-3 text-gray-400 text-[10px] hidden sm:table-cell">{row.fn}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-djzinc-800">
                            <span className="text-[10px] text-gray-500 font-mono">
                                Puedes alternar entre ambos modos o usar la vista Dual para comparar compás a compás.
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowDiferenciasModal(false)}
                                className="px-4 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black text-xs font-mono font-black rounded-lg shadow transition-transform active:scale-95 cursor-pointer"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


