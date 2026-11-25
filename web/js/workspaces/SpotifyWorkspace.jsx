const { useState, useEffect, useRef, useCallback, useMemo } = React;
import { Icons } from '../shell/icons.jsx';
import { apiClient } from '../services/apiClient.js';
import { TableHarmonicWaveform, formatMsToTime, parseDurationMs } from '../waveforms/index.js';
import { DEFAULT_VINYL_SVG, getValidCover, DEFAULT_POOL_COLUMNS, POOL_COLUMN_CATEGORIES } from '../data/constants.js';
import { useDrawerResize } from '../shell/hooks.js';
import { SectionTitle } from '../shell/workspace-ui.jsx';
import { UnifiedLibraryBrowserModal } from '../modals/index.js';

// Espacio de Trabajo: Record Pool Ingest
export const SpotifyWorkspace = ({ 
    tracks: externalTracks, 
    setTracks: externalSetTracks, 
    onPlayTrack, 
    nowPlayingTrack, 
    isPlaying, 
    onTogglePlay, 
    lang = "es", 
    t = (k) => k,
    customLibraries = [],
    activeCustomLibId = null,
    onSaveCustomLibraries = null
}) => {
    const [internalTracks, setInternalTracks] = useState([]);
    const tracks = externalTracks !== undefined ? externalTracks : internalTracks;
    const setTracks = externalSetTracks !== undefined ? externalSetTracks : setInternalTracks;

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
                        colTracks.push({
                            ...tr,
                            id: tr.id || `pool_col_${Date.now()}_${colTracks.length}`,
                            title: tr.title || tr.t || tr.filename || 'Pista Colección',
                            artist: tr.artist || tr.a || 'Artista',
                            bpm: tr.bpm || tr.b,
                            key: tr.key || tr.k,
                            status: 'listo'
                        });
                    }
                });
            });
        }
        if (colTracks.length > 0) {
            setTracks(colTracks);
        }
    };

    const [spotifyUrl, setSpotifyUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [destDir, setDestDir] = useState('/Users/admin/Music/mi musica');

    useEffect(() => {
        // Sincronizar directorio de descargas con el backend y sanitizar
        fetch('/api/directorio_descarga')
            .then(r => r.json())
            .then(data => {
                if (data && data.path && typeof data.path === 'string' && data.path.startsWith('/') && !data.path.includes('"') && !data.path.includes(':')) {
                    setDestDir(data.path);
                }
            })
            .catch(() => {});
    }, []);

    const [selectedFormat, setSelectedFormat] = useState('flac');
    const [downloadingMsg, setDownloadingMsg] = useState('');
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isAuditingFft, setIsAuditingFft] = useState(false);
    const [fftProgress, setFftProgress] = useState(0);
    const [fftMsg, setFftMsg] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [spInspectorOpen, setSpInspectorOpen] = useState(false);
    const { width: spInspectorWidth, onPointerDown: onSpResizeDown, resetWidth: onSpResetWidth } = useDrawerResize('bw_sp_inspector_drawer_width', 540);
    const { width: poolColumnsDrawerWidth, onPointerDown: onPoolColumnsResizeDown, resetWidth: onPoolColumnsResetWidth } = useDrawerResize('bw_pool_columns_drawer_width', 540);
    const [downloadSession, setDownloadSession] = useState({ downloaded: [], failed: [] });
    const [spSubView, setSpSubView] = useState('catalog'); // 'catalog' | 'downloaded'
    const [selectedDownloadedIds, setSelectedDownloadedIds] = useState(new Set());
    const [isExportingXls, setIsExportingXls] = useState(false);
    const [xlsToast, setXlsToast] = useState('');
    const [deleteOriginalsOnUpgrade, setDeleteOriginalsOnUpgrade] = useState(() => {
        try {
            return localStorage.getItem('dj_metatagger_delete_originals') === 'true';
        } catch (e) {
            return false;
        }
    });

    const handleToggleDeleteOriginals = (checked) => {
        setDeleteOriginalsOnUpgrade(checked);
        try {
            localStorage.setItem('dj_metatagger_delete_originals', checked ? 'true' : 'false');
        } catch (e) {}
    };

    // Modal de Verificación de Fidelidad y Selección de Versiones / Búsqueda Manual
    const [candidateModal, setCandidateModal] = useState({
        open: false,
        targetTrack: null,
        candidates: [],
        searchQuery: '',
        isSearching: false,
        searchMsg: ''
    });

    const handleAbrirVerificacionCandidatos = (track) => {
        if (!track) return;
        const candidates = track.todos_candidatos && track.todos_candidatos.length > 0
            ? track.todos_candidatos
            : (track.candidatos_alternativos && track.candidatos_alternativos.length > 0
                ? [track, ...track.candidatos_alternativos]
                : [track]);

        setCandidateModal({
            open: true,
            targetTrack: track,
            candidates: candidates,
            searchQuery: `${track.original_artist || track.artist || ''} ${track.original_title || track.title || ''}`.trim(),
            isSearching: false,
            searchMsg: ''
        });
    };

    const handleBuscarCandidatosManuales = async (customQuery = null) => {
        const query = customQuery !== null ? customQuery : candidateModal.searchQuery;
        if (!query || !query.trim()) return;

        setCandidateModal(prev => ({ ...prev, isSearching: true, searchMsg: 'Buscando versiones en Catálogo Oficial...' }));
        try {
            const pistaOrigen = candidateModal.targetTrack ? {
                artist: candidateModal.targetTrack.original_artist || candidateModal.targetTrack.artist,
                title: candidateModal.targetTrack.original_title || candidateModal.targetTrack.title,
                duration: candidateModal.targetTrack.original_duration || candidateModal.targetTrack.duration,
                bpm: candidateModal.targetTrack.bpm
            } : null;

            let res = null;
            if (true) {
                res = await apiClient.rpc('buscar_candidatos_manuales_spotify', query, pistaOrigen);
            } else {
                const resp = await fetch('/api/buscar_candidatos_manuales_spotify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, pista_origen: pistaOrigen })
                });
                res = await resp.json();
            }

            if (res && Array.isArray(res.candidatos)) {
                setCandidateModal(prev => ({
                    ...prev,
                    candidates: res.candidatos,
                    isSearching: false,
                    searchMsg: res.candidatos.length > 0 ? `✓ ${res.candidatos.length} versiones encontradas.` : 'No se encontraron resultados para esta búsqueda.'
                }));
            } else {
                setCandidateModal(prev => ({ ...prev, isSearching: false, searchMsg: 'No se encontraron resultados.' }));
            }
        } catch (err) {
            console.error("Error buscando candidatos manuales:", err);
            setCandidateModal(prev => ({ ...prev, isSearching: false, searchMsg: 'Error al buscar versiones alternativas.' }));
        }
    };

    const handleSeleccionarVersionCandidato = (candidato) => {
        if (!candidato || !candidateModal.targetTrack) return;
        const targetId = candidateModal.targetTrack.id;

        setTracks(prev => prev.map(t => {
            if (String(t.id) === String(targetId)) {
                const isVerified = (candidato.match_score !== undefined ? candidato.match_score >= 80 : true);
                return {
                    ...t,
                    title: candidato.title || t.title,
                    artist: candidato.artist || t.artist,
                    album: candidato.album || t.album,
                    duration: candidato.duration || t.duration,
                    cover: candidato.cover || t.cover,
                    preview_url: candidato.preview_url || t.preview_url,
                    spotify_url: candidato.spotify_url || t.spotify_url,
                    apple_url: candidato.apple_url || t.apple_url,
                    isrc: candidato.isrc || t.isrc,
                    match_score: candidato.match_score !== undefined ? candidato.match_score : 100,
                    match_confianza: candidato.match_confianza || 'ALTA',
                    match_badge_color: candidato.match_badge_color || 'emerald',
                    match_recomendacion: candidato.match_recomendacion || 'Seleccionado manualmente por el usuario',
                    alerta_version: candidato.alerta_version || null,
                    alerta_duracion: candidato.alerta_duracion || null,
                    es_misma_pista: true,
                    confirmado_manualmente: true,
                    status: 'Listo para Descarga (Match Verificado Manualmente)',
                    selected: true // Marcar para descarga porque el DJ lo eligió explícitamente
                };
            }
            return t;
        }));

        setCandidateModal(prev => ({ ...prev, open: false }));
    };


    // Navegador de Carpetas Web Integrado para Destino (Cero popups del SO)
    const [fsBrowserOpen, setFsBrowserOpen] = useState(false);
    const [fsCurrentPath, setFsCurrentPath] = useState('');
    const [fsParentPath, setFsParentPath] = useState('');
    const [fsFolders, setFsFolders] = useState([]);
    const [fsLoading, setFsLoading] = useState(false);

    useEffect(() => {
        if (true) {
            const updateDownload = (pct, msg) => {
                if (!msg || msg.includes('detenid') || msg.includes('cancelad') || msg.includes('CANCELAD')) {
                    setDownloadProgress(0);
                    setFftProgress(0);
                    setIsDownloading(false);
                    setIsAuditingFft(false);
                    setDownloadingMsg('');
                    return;
                }
                setDownloadProgress(pct);
                setDownloadingMsg(msg || '');
                setIsDownloading(true);
            };
            const updateFft = (pct, msg) => {
                setIsAuditingFft(true);
                setFftProgress(pct);
                setFftMsg(msg || '');
            };
            const notifyFftResult = (res) => {
                if (res && res.id) {
                    setTracks(prev => {
                        const trk = prev.find(t => String(t.id) === String(res.id));
                        const completedItem = {
                            id: res.id,
                            title: trk ? (trk.title || res.name || res.title || 'Desconocido') : (res.name || res.title || 'Desconocido'),
                            artist: trk ? (trk.artist || res.artist || 'Desconocido') : (res.artist || 'Desconocido'),
                            album: trk ? (trk.album || res.album || '') : (res.album || ''),
                            format: res.format || (selectedFormat ? selectedFormat.toUpperCase() : 'FLAC'),
                            cutoff_khz: res.cutoff_khz !== undefined ? res.cutoff_khz : null,
                            corte: res.corte || '--',
                            calidad: res.calidad || 'Pendiente de Auditoría',
                            status: res.status || res.estado || 'Descargado',
                            sample_rate_khz: res.sample_rate_khz || null,
                            bitrate_kbps: res.bitrate_kbps || null,
                            perdida: res.perdida || '--',
                            path: res.path || trk?.path || '',
                            audit_status: res.audit_status || 'pendiente',
                            consejo: res.consejo || 'Pendiente de análisis FFT',
                            sugerencia_formato: res.sugerencia_formato || null,
                            es_fake: res.es_fake || false,
                            badge_color: res.badge_color || 'gray',
                            spotify_url: trk?.spotify_url || res.spotify_url || '',
                            cover: trk?.cover || trk?.cover_url || res.cover || '',
                            selected: true
                        };
                        setDownloadSession(sPrev => ({
                            ...sPrev,
                            downloaded: [...sPrev.downloaded.filter(x => String(x.id) !== String(res.id) && String(x.path) !== String(completedItem.path)), completedItem]
                        }));
                        setSelectedDownloadedIds(prevIds => new Set(prevIds).add(String(res.id || completedItem.path)));
                        return prev.filter(t => String(t.id) !== String(res.id));
                    });
                    if (res.audit_msg) {
                        setFftMsg(res.audit_msg);
                    }
                }
            };

            const notifyPostDownloadAudit = (auditData) => {
                if (!auditData) return;
                setDownloadSession(prev => ({
                    ...prev,
                    downloaded: prev.downloaded.map(item => {
                        if (String(item.id) === String(auditData.id) || (item.path && auditData.path && item.path === auditData.path)) {
                            return {
                                ...item,
                                ...auditData,
                                audit_status: 'completada'
                            };
                        }
                        return item;
                    })
                }));

                // Auto-registrar en Cuaderno de Bitácora
                try {
                    const nowStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    const bEntry = {
                        id: `b-fft-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        timestamp: nowStr,
                        category: 'download',
                        action: 'Auditoría FFT Post-Descarga & Diagnóstico Espectral',
                        trackTitle: `${auditData.artist || 'Artista'} - ${auditData.title || 'Pista'}`,
                        filePath: auditData.path || '',
                        detailsBefore: `Formato descargado: ${auditData.format || 'FLAC'} • Sin certificar`,
                        detailsAfter: `Corte: ${auditData.corte || '--'} • Calidad: ${auditData.calidad || '--'} • ${auditData.consejo || 'Óptimo'}`,
                        status: auditData.es_fake ? '⚠️ Fake Detectado' : '✓ Certificado'
                    };
                    const raw = localStorage.getItem('bw_audit_bitacora');
                    let cur = raw ? JSON.parse(raw) : [];
                    const nextB = [bEntry, ...cur].slice(0, 500);
                    localStorage.setItem('bw_audit_bitacora', JSON.stringify(nextB));
                    window.dispatchEvent(new CustomEvent('bw_bitacora_updated', { detail: nextB }));
                } catch (e) {}
            };

            const finishPostDownloadAudit = (results) => {
                setIsAuditingFft(false);
                setFftProgress(100);
                setFftMsg('✅ Auditoría FFT finalizada.');
                setTimeout(() => {
                    setFftProgress(0);
                    setFftMsg('');
                }, 2000);
            };

            const notifyDownloadFailure = (errData) => {
                if (errData && errData.id) {
                    setTracks(prev => {
                        const trk = prev.find(t => String(t.id) === String(errData.id));
                        if (trk) {
                            setDownloadSession(sPrev => ({
                                ...sPrev,
                                failed: [...sPrev.failed.filter(x => String(x.id) !== String(errData.id)), {
                                    ...trk,
                                    error: errData.error || 'Error en descarga',
                                    title: errData.title || trk.title,
                                    artist: errData.artist || trk.artist
                                }]
                            }));
                        }
                        return prev.map(t => {
                            if (String(t.id) === String(errData.id)) {
                                return {
                                    ...t,
                                    status: 'Fallo de Descarga',
                                    badge_color: 'red',
                                    download_error: errData.error,
                                    selected: true
                                };
                            }
                            return t;
                        });
                    });
                }
            };

            const finishBatch = (msg) => {
                setIsDownloading(false);
                setIsAuditingFft(false);
                setDownloadProgress(100);
                setDownloadingMsg(msg || 'Lote completado con éxito.');
                setTimeout(() => {
                    setDownloadProgress(0);
                    setFftProgress(0);
                    setIsAuditingFft(false);
                    setDownloadingMsg('');
                }, 1500);
                setSpSubView('downloaded');
            };

            const notifyOriginalPurged = (info) => {
                if (info && info.filename) {
                    setDownloadingMsg(`🗑️ [PURGADO] Original de baja calidad eliminado del disco: ${info.filename}`);
                }
            };

            window.actualizar_estado_descarga = updateDownload;
            window.actualizar_progreso_descarga = updateDownload;
            window.actualizar_estado_fft = updateFft;
            window.notificar_resultado_auditoria = notifyFftResult;
            window.notificar_resultado_auditoria_post_descarga = notifyPostDownloadAudit;
            window.notificar_fin_auditoria_post_descarga = finishPostDownloadAudit;
            window.notificar_fallo_descarga = notifyDownloadFailure;
            window.notificar_fin_lote = finishBatch;
            window.notificar_archivo_original_eliminado = notifyOriginalPurged;

            apiClient.registerCallback("actualizar_estado_descarga", window.actualizar_estado_descarga);
            apiClient.registerCallback("actualizar_progreso_descarga", window.actualizar_progreso_descarga);
            apiClient.registerCallback("actualizar_estado_fft", window.actualizar_estado_fft);
            apiClient.registerCallback("notificar_resultado_auditoria", window.notificar_resultado_auditoria);
            apiClient.registerCallback("notificar_resultado_auditoria_post_descarga", window.notificar_resultado_auditoria_post_descarga);
            apiClient.registerCallback("notificar_fin_auditoria_post_descarga", window.notificar_fin_auditoria_post_descarga);
            apiClient.registerCallback("notificar_fallo_descarga", window.notificar_fallo_descarga);
            apiClient.registerCallback("notificar_fin_lote", window.notificar_fin_lote);
            apiClient.registerCallback("notificar_archivo_original_eliminado", window.notificar_archivo_original_eliminado);
        }
    }, []);

    const handleCancelarDescargas = async () => {
        try {
            fetch('/api/cancelar_procesos', { method: 'POST' }).catch(() => {});
        } catch (e) {}
        if (true) {
            try {
                await apiClient.rpc('cancelar_procesos_activos');
            } catch (e) {
                console.error("Error al cancelar procesos:", e);
            }
        }
        setIsAnalyzing(false);
        setIsDownloading(false);
        setIsAuditingFft(false);
        setDownloadProgress(0);
        setFftProgress(0);
        setDownloadingMsg(lang === 'en' ? '[CANCELLED] Process stopped by user.' : '[CANCELADO] Proceso detenido por el usuario.');
        setTimeout(() => setDownloadingMsg(''), 3000);
    };

    const handleDescargarReporteXLS = async () => {
        if (downloadSession.downloaded.length === 0 && downloadSession.failed.length === 0) {
            alert("No hay descargas ni fallos registrados en esta sesión todavía para exportar.");
            return;
        }
        setIsExportingXls(true);
        try {
            let res = null;
            if (true) {
                res = await apiClient.rpc('exportar_reporte_descargas_xls', downloadSession, destDir);
            } else {
                const resp = await fetch('/api/descargar_reporte_xls', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ report_data: downloadSession, destino_dir: destDir })
                });
                res = await resp.json();
            }

            if (res && res.status === 'ok') {
                if (res.b64) {
                    const byteChars = atob(res.b64);
                    const byteNums = new Array(byteChars.length);
                    for (let i = 0; i < byteChars.length; i++) {
                        byteNums[i] = byteChars.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNums);
                    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = res.filename || `Reporte_Descargas_Pool_${Date.now()}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
                setXlsToast(`✓ Reporte Excel generado (${res.descargadas} descargadas, ${res.fallidas} fallidas) en: ${res.path}`);
                setTimeout(() => setXlsToast(''), 6000);
            } else {
                alert(`Error al generar reporte: ${res?.msg || 'Error desconocido'}`);
            }
        } catch (err) {
            console.error("Error exportando reporte XLS:", err);
            alert(`Error de comunicación al generar XLS: ${err.message || err}`);
        } finally {
            setIsExportingXls(false);
        }
    };

    const handleAbrirNavegadorCarpetas = async (initialPath = "") => {
        setFsBrowserOpen(true);
        setFsLoading(true);
        const startPath = initialPath || destDir || "";
        let res = null;
        try {
            const resp = await fetch(`/api/listar_subcarpetas?ruta=${encodeURIComponent(startPath)}`);
            if (resp.ok) res = await resp.json();
        } catch (httpErr) {}
        if (!res && true) {
            try {
                res = await apiClient.rpc('listar_subcarpetas_sistema', startPath);
            } catch (err) {
                console.warn("[EXPLORADOR] Fallo llamada Eel, recurriendo a HTTP:", err);
            }
        }
        if (!res || (!res.folders?.length && !res.files?.length && !res.current)) {
            try {
                const resp = await fetch('/api/listar_subcarpetas?ruta=' + encodeURIComponent('/Users/admin/Music'));
                if (resp.ok) res = await resp.json();
            } catch (e) {}
        }
        if (res) {
            setFsCurrentPath(res.current || "/Users/admin/Music");
            setFsParentPath(res.parent || "/Users/admin");
            setFsFolders(res.folders || []);
        } else {
            setFsCurrentPath("/Users/admin/Music");
        }
        setFsLoading(false);
    };

    const handleNavegarACarpeta = async (targetPath) => {
        setFsLoading(true);
        let res = null;
        try {
            const resp = await fetch(`/api/listar_subcarpetas?ruta=${encodeURIComponent(targetPath)}`);
            if (resp.ok) res = await resp.json();
        } catch (httpErr) {}
        if (!res && true) {
            try {
                res = await apiClient.rpc('listar_subcarpetas_sistema', targetPath);
            } catch (err) {
                console.warn("[EXPLORADOR] Fallo llamada Eel al navegar:", err);
            }
        }
        if (res) {
            setFsCurrentPath(res.current || targetPath);
            setFsParentPath(res.parent || "");
            setFsFolders(res.folders || []);
        }
        setFsLoading(false);
    };

    const handleSeleccionarCarpetaDestino = (targetPath) => {
        const finalPath = targetPath || fsCurrentPath;
        setDestDir(finalPath);
        setFsBrowserOpen(false);
        // Notificar al backend la actualización del directorio de descargas
        try {
            fetch('/api/directorio_descarga', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: finalPath })
            }).catch(() => {});
        } catch (_) {}
    };

    // Personalización y Visibilidad de Columnas en Record Pool
    const [poolVisibleColumns, setPoolVisibleColumns] = useState(() => {
        try {
            const saved = localStorage.getItem('bw_pool_visible_columns');
            if (saved) return { ...DEFAULT_POOL_COLUMNS, ...JSON.parse(saved) };
        } catch (_) {}
        return DEFAULT_POOL_COLUMNS;
    });
    const [poolColumnSelectorOpen, setPoolColumnSelectorOpen] = useState(false);
    const [poolColumnSearchText, setPoolColumnSearchText] = useState('');

    useEffect(() => {
        if (!poolColumnSelectorOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setPoolColumnSelectorOpen(false);
                setPoolColumnSearchText('');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [poolColumnSelectorOpen]);

    const setPoolColumnPreset = (preset) => {
        let next = { ...DEFAULT_POOL_COLUMNS };
        if (preset === 'all') {
            Object.keys(next).forEach(k => { next[k] = true; });
        } else if (preset === 'none') {
            Object.keys(next).forEach(k => { next[k] = false; });
            next.select = true;
            next.title = true;
        } else if (preset === 'dj') {
            Object.keys(next).forEach(k => { next[k] = false; });
            ['select', 'play', 'title', 'artist', 'genre', 'subgenre', 'bpm', 'key', 'energy', 'danceability', 'status'].forEach(k => { next[k] = true; });
        } else if (preset === 'quality') {
            Object.keys(next).forEach(k => { next[k] = false; });
            ['select', 'play', 'title', 'artist', 'match_score', 'pre_quality_tier', 'format', 'sample_rate_khz', 'bitrate_kbps', 'calidad', 'cutoff_khz', 'status'].forEach(k => { next[k] = true; });
        } else if (preset === 'essential') {
            Object.keys(next).forEach(k => { next[k] = false; });
            ['select', 'play', 'title', 'artist', 'origin', 'match_score', 'format', 'status'].forEach(k => { next[k] = true; });
        } else if (preset === 'reset') {
            next = { ...DEFAULT_POOL_COLUMNS };
        }
        setPoolVisibleColumns(next);
        try { localStorage.setItem('bw_pool_visible_columns', JSON.stringify(next)); } catch (_) {}
    };

    const togglePoolColumnVisibility = (colKey) => {
        setPoolVisibleColumns(prev => {
            const next = { ...prev, [colKey]: !prev[colKey] };
            try { localStorage.setItem('bw_pool_visible_columns', JSON.stringify(next)); } catch (_) {}
            return next;
        });
    };

    // Ordenación y Filtros para TODAS las Columnas en Record Pool Workspace
    const [spSortField, setSpSortField] = useState('title');
    const [spSortDir, setSpSortDir] = useState('asc');
    const [spFilterSearch, setSpFilterSearch] = useState('');
    const [spFilterArtist, setSpFilterArtist] = useState('');
    const [spFilterGenre, setSpFilterGenre] = useState('ALL');
    const [spFilterSubgenre, setSpFilterSubgenre] = useState('');
    const [spFilterOrigin, setSpFilterOrigin] = useState('ALL');
    const [spFilterMatch, setSpFilterMatch] = useState('ALL');
    const [spFilterPreQuality, setSpFilterPreQuality] = useState('ALL');
    const [spFilterFormat, setSpFilterFormat] = useState('ALL');
    const [spFilterKhz, setSpFilterKhz] = useState('ALL');
    const [spFilterKbps, setSpFilterKbps] = useState('ALL');
    const [spFilterQuality, setSpFilterQuality] = useState('ALL');
    const [spFilterCutoff, setSpFilterCutoff] = useState('ALL');
    const [spFilterDuration, setSpFilterDuration] = useState('');
    const [spFilterBpm, setSpFilterBpm] = useState('');
    const [spFilterKey, setSpFilterKey] = useState('ALL');
    const [spFilterEnergy, setSpFilterEnergy] = useState('ALL');
    const [spFilterDance, setSpFilterDance] = useState('ALL');
    const [spFilterStatus, setSpFilterStatus] = useState('ALL');

    const poolUniqueGenres = useMemo(() => {
        const set = new Set();
        (tracks || []).forEach(t => {
            if (t.genre && typeof t.genre === 'string') set.add(t.genre.trim());
        });
        return Array.from(set).sort();
    }, [tracks]);

    const handleClearAllPoolFilters = () => {
        setSpFilterSearch('');
        setSpFilterArtist('');
        setSpFilterGenre('ALL');
        setSpFilterSubgenre('');
        setSpFilterOrigin('ALL');
        setSpFilterMatch('ALL');
        setSpFilterPreQuality('ALL');
        setSpFilterFormat('ALL');
        setSpFilterKhz('ALL');
        setSpFilterKbps('ALL');
        setSpFilterQuality('ALL');
        setSpFilterCutoff('ALL');
        setSpFilterDuration('');
        setSpFilterBpm('');
        setSpFilterKey('ALL');
        setSpFilterEnergy('ALL');
        setSpFilterDance('ALL');
        setSpFilterStatus('ALL');
    };

    const hasActivePoolFilters = Boolean(
        spFilterSearch || spFilterArtist || spFilterGenre !== 'ALL' || spFilterSubgenre ||
        spFilterOrigin !== 'ALL' || spFilterMatch !== 'ALL' || spFilterPreQuality !== 'ALL' ||
        spFilterFormat !== 'ALL' || spFilterKhz !== 'ALL' || spFilterKbps !== 'ALL' ||
        spFilterQuality !== 'ALL' || spFilterCutoff !== 'ALL' || spFilterDuration ||
        spFilterBpm || spFilterKey !== 'ALL' || spFilterEnergy !== 'ALL' ||
        spFilterDance !== 'ALL' || spFilterStatus !== 'ALL'
    );

    const handleSortSp = (field) => {
        if (spSortField === field) {
            setSpSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSpSortField(field);
            if (['match_score', 'match', 'bitrate_kbps', 'sample_rate_khz', 'energy', 'danceability', 'intensity', 'valence'].includes(field)) {
                setSpSortDir('desc');
            } else {
                setSpSortDir('asc');
            }
        }
    };

    const renderSortArrowSp = (field) => {
        if (spSortField !== field) return <span className="text-gray-600 ml-1 text-[9px]">↕</span>;
        return <span className="text-djcyan-400 ml-1 font-bold text-[10px]">{spSortDir === 'asc' ? '▲' : '▼'}</span>;
    };

    const tracksFiltradosSp = useMemo(() => {
        let result = tracks.filter(t => {
            if (spFilterSearch) {
                const term = spFilterSearch.toLowerCase();
                const m = (t.title || '').toLowerCase().includes(term) || 
                          (t.album || '').toLowerCase().includes(term);
                if (!m) return false;
            }
            if (spFilterArtist) {
                const term = spFilterArtist.toLowerCase();
                if (!(t.artist || '').toLowerCase().includes(term)) return false;
            }
            if (spFilterGenre !== 'ALL') {
                if ((t.genre || 'House').toLowerCase() !== spFilterGenre.toLowerCase()) return false;
            }
            if (spFilterSubgenre) {
                const term = spFilterSubgenre.toLowerCase();
                const sub = (t.subgenre || (TAXONOMY_TREE[t.genre || 'Tech House'] ? TAXONOMY_TREE[t.genre || 'Tech House'][0] : 'Tech House')).toLowerCase();
                if (!sub.includes(term)) return false;
            }
            if (spFilterOrigin !== 'ALL') {
                const o = t.origin || 'spotify';
                if (o !== spFilterOrigin) return false;
            }
            if (spFilterFormat !== 'ALL') {
                const fmt = (t.format || selectedFormat || '').toUpperCase();
                if (fmt !== spFilterFormat) return false;
            }
            if (spFilterKhz !== 'ALL') {
                const khz = String(t.sample_rate_khz || t.khz || '');
                if (!khz.includes(spFilterKhz)) return false;
            }
            if (spFilterKbps !== 'ALL') {
                const kbps = Number(t.bitrate_kbps || t.kbps || 0);
                if (spFilterKbps === 'LOSSLESS' && kbps > 0 && kbps < 800) return false;
                if (spFilterKbps === '320' && kbps > 0 && kbps !== 320) return false;
            }
            if (spFilterQuality !== 'ALL') {
                if (!String(t.calidad || '').toLowerCase().includes(spFilterQuality.toLowerCase())) return false;
            }
            if (spFilterCutoff !== 'ALL') {
                const c = Number(t.cutoff_khz || t.corte || 0);
                if (spFilterCutoff === 'HIGH' && c > 0 && c < 20) return false;
                if (spFilterCutoff === 'MED' && (c < 18 || c >= 20)) return false;
                if (spFilterCutoff === 'LOW' && c > 0 && c >= 18) return false;
            }
            if (spFilterDuration) {
                if (!String(t.duration || '').includes(spFilterDuration)) return false;
            }
            if (spFilterBpm) {
                if (!String(t.bpm || '').includes(spFilterBpm)) return false;
            }
            if (spFilterKey !== 'ALL') {
                const k = String(t.key || t.k || '').trim().toUpperCase();
                if (!k.includes(spFilterKey.trim().toUpperCase())) return false;
            }
            if (spFilterPreQuality !== 'ALL') {
                if (spFilterPreQuality === 'RECOMMENDED' && t.pre_worth_it === false) return false;
                if (spFilterPreQuality === 'HI_RES' && t.pre_quality_tier !== 'HI_RES_24B') return false;
                if (spFilterPreQuality === 'LOSSLESS' && !['HI_RES_24B', 'LOSSLESS_16B'].includes(t.pre_quality_tier)) return false;
            }
            if (spFilterStatus !== 'ALL') {
                const isFake = Boolean(t.es_fake || String(t.status || '').includes('Fake'));
                if (spFilterStatus === 'FAKE' && !isFake) return false;
                if (spFilterStatus === 'DOWNLOADED' && !t.downloaded) return false;
                if (spFilterStatus === 'PENDING' && t.downloaded) return false;
                if (spFilterStatus === 'LOSSLESS' && (!t.downloaded || isFake || String(t.format || selectedFormat).toLowerCase() === 'mp3')) return false;
            }
            if (spFilterEnergy !== 'ALL') {
                const eVal = Number(t.energy || t.e || 80);
                if (spFilterEnergy === 'HIGH' && eVal < 80) return false;
                if (spFilterEnergy === 'MED' && (eVal < 65 || eVal >= 80)) return false;
                if (spFilterEnergy === 'LOW' && eVal >= 65) return false;
            }
            if (spFilterDance !== 'ALL') {
                const dVal = Number(t.danceability || t.dance || 80);
                if (spFilterDance === 'HIGH' && dVal < 80) return false;
                if (spFilterDance === 'MED' && (dVal < 65 || dVal >= 80)) return false;
                if (spFilterDance === 'LOW' && dVal >= 65) return false;
            }
            if (spFilterMatch !== 'ALL') {
                const mScore = t.match_score !== undefined ? Number(t.match_score) : (t.origin === 'audit_upgrade' ? 0 : 100);
                if (spFilterMatch === 'VERIFIED' && mScore < 80) return false;
                if (spFilterMatch === 'DOUBTFUL' && mScore >= 80) return false;
                if (spFilterMatch === 'CRITICAL' && mScore >= 50) return false;
            }
            return true;
        });

        result.sort((a, b) => {
            let valA = a[spSortField];
            let valB = b[spSortField];
            if (spSortField === 'match_score' || spSortField === 'match') {
                valA = a.match_score !== undefined ? Number(a.match_score) : (a.origin === 'audit_upgrade' ? 0 : 100);
                valB = b.match_score !== undefined ? Number(b.match_score) : (b.origin === 'audit_upgrade' ? 0 : 100);
            } else if (spSortField === 'duration') {
                const parseSec = (d) => {
                    if (!d || !d.includes(':')) return 0;
                    const p = d.split(':');
                    return parseInt(p[0]) * 60 + parseFloat(p[1]);
                };
                valA = parseSec(a.duration);
                valB = parseSec(b.duration);
            } else if (['id', 'sample_rate_khz', 'bitrate_kbps', 'cutoff_khz', 'bpm', 'energy', 'danceability'].includes(spSortField)) {
                valA = Number(valA || a.energy || a.danceability) || 0;
                valB = Number(valB || b.energy || b.danceability) || 0;
            } else if (spSortField === 'intensity') {
                valA = Number(a.arousal || a.intensity || Math.round((a.energy || a.e || 75) * 0.95)) || 0;
                valB = Number(b.arousal || b.intensity || Math.round((b.energy || b.e || 75) * 0.95)) || 0;
            } else if (spSortField === 'valence') {
                valA = Number(a.valence != null ? a.valence : (a.key && a.key.includes('B') ? 65 : 45)) || 0;
                valB = Number(b.valence != null ? b.valence : (b.key && b.key.includes('B') ? 65 : 45)) || 0;
            } else if (spSortField === 'origin') {
                valA = a.origin || 'spotify';
                valB = b.origin || 'spotify';
            } else if (spSortField === 'genre') {
                valA = a.genre || 'House';
                valB = b.genre || 'House';
            } else if (spSortField === 'subgenre') {
                valA = a.subgenre || (TAXONOMY_TREE[a.genre || 'Tech House'] ? TAXONOMY_TREE[a.genre || 'Tech House'][0] : 'Tech House');
                valB = b.subgenre || (TAXONOMY_TREE[b.genre || 'Tech House'] ? TAXONOMY_TREE[b.genre || 'Tech House'][0] : 'Tech House');
            }

            if (typeof valA === 'number' && typeof valB === 'number') {
                return spSortDir === 'asc' ? valA - valB : valB - valA;
            }
            return spSortDir === 'asc' 
                ? String(valA || '').localeCompare(String(valB || '')) 
                : String(valB || '').localeCompare(String(valA || ''));
        });

        return result;
    }, [tracks, spFilterSearch, spFilterArtist, spFilterGenre, spFilterSubgenre, spFilterOrigin, spFilterMatch, spFilterPreQuality, spFilterFormat, spFilterKhz, spFilterKbps, spFilterQuality, spFilterCutoff, spFilterDuration, spFilterBpm, spFilterKey, spFilterEnergy, spFilterDance, spFilterStatus, spSortField, spSortDir, selectedFormat]);

    const currentTrack = tracks.find(t => t.id === selectedId) || tracks[0] || {};
    const selectedCount = tracks.filter(t => t.selected).length;
    const allSelected = tracksFiltradosSp.length > 0 && tracksFiltradosSp.every(t => t.selected);

    const handleToggleSelectAll = () => {
        const targetState = !allSelected;
        const idsToToggle = new Set(tracksFiltradosSp.map(t => t.id));
        setTracks(prev => prev.map(t => idsToToggle.has(t.id) ? { ...t, selected: targetState } : t));
    };

    const handleToggleRow = (id) => {
        setSelectedId(id);
        setTracks(prev => prev.map(t => t.id === id ? ({ ...t, selected: !t.selected }) : t));
    };

    const handlePlayPreview = async (track, e, seekPct = null) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setSelectedId(track.id);

        // Si ya está sonando esta misma pista exacta, alternar pausa o buscar seek
        const isCurrentSameTrack = nowPlayingTrack && (
            String(nowPlayingTrack.id) === String(track.id) || 
            (!nowPlayingTrack.is_local_preview && nowPlayingTrack.title === track.title && nowPlayingTrack.artist === track.artist)
        );

        if (isCurrentSameTrack) {
            if (seekPct !== null && onPlayTrack) {
                const durSec = parseDurationToSeconds(track.duration || 210);
                onPlayTrack(nowPlayingTrack, seekPct, true, seekPct * durSec);
                return;
            }
            if (onTogglePlay) {
                onTogglePlay();
                return;
            }
        }

        let streamUrl = track.preview_url;
        let coverHd = track.cover;
        if (!streamUrl) {
            setDownloadingMsg(`[PRE-ESCUCHA] Resolviendo stream para: ${track.artist} - ${track.title}...`);
            if (true) {
                try {
                    const res = await apiClient.rpc('resolver_stream_preescucha', track.title, track.artist);
                    if (res && res.stream_url) {
                        streamUrl = res.stream_url;
                        if (res.cover) coverHd = res.cover;
                    }
                } catch (err) {}
            }
            if (!streamUrl) {
                try {
                    const resp = await fetch(`/api/resolver_stream_preescucha?titulo=${encodeURIComponent(track.title)}&artista=${encodeURIComponent(track.artist)}`);
                    if (resp.ok) {
                        const res = await resp.json();
                        if (res && res.stream_url) {
                            streamUrl = res.stream_url;
                            if (res.cover) coverHd = res.cover;
                        }
                    }
                } catch (httpErr) {}
            }
            if (streamUrl) {
                track.preview_url = streamUrl;
                if (coverHd) track.cover = coverHd;
                setDownloadingMsg(`[PRE-ESCUCHA] Reproduciendo: ${track.artist} - ${track.title}`);
                setTimeout(() => setDownloadingMsg(''), 3500);
            } else {
                setDownloadingMsg(`[AVISO] No se encontró stream de preescucha oficial para: ${track.artist} - ${track.title}`);
                setTimeout(() => setDownloadingMsg(''), 4000);
            }
        }
        if (streamUrl && onPlayTrack) {
            const durSec = parseDurationToSeconds(track.duration || 210);
            const startSec = (seekPct !== null && seekPct > 0) ? seekPct * durSec : 0;
            onPlayTrack({ 
                id: track.id, 
                t: track.title, 
                title: track.title, 
                a: track.artist, 
                artist: track.artist, 
                album: track.album, 
                b: track.bpm, 
                k: track.key, 
                duration: track.duration, 
                cover: coverHd || track.cover, 
                preview_url: streamUrl,
                path: streamUrl 
            }, seekPct || 0, true, startSec);
        }
    };

    const isTrackLocalPlaying = (targetTrack) => {
        if (!nowPlayingTrack || !isPlaying || !targetTrack) return false;
        const localPath = targetTrack.original_path || targetTrack.path || targetTrack.filepath || targetTrack.f;
        if (localPath && (nowPlayingTrack.path === localPath || nowPlayingTrack.f === localPath)) return true;
        const localTitle = targetTrack.original_title || targetTrack.title || '';
        return Boolean(nowPlayingTrack.is_local_preview && localTitle && nowPlayingTrack.title && nowPlayingTrack.title.includes(localTitle));
    };

    const isTrackCandPlaying = (cand) => {
        if (!nowPlayingTrack || !isPlaying || !cand) return false;
        if (cand.preview_url && (nowPlayingTrack.path === cand.preview_url || nowPlayingTrack.preview_url === cand.preview_url)) return true;
        if (cand.id && String(nowPlayingTrack.id) === String(cand.id)) return true;
        return Boolean(nowPlayingTrack.title === `[DESCARGA] ${cand.title}` || nowPlayingTrack.title === cand.title);
    };

    const handlePlayLocalTrack = (targetTrack, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!targetTrack) return;
        const localPath = targetTrack.original_path || targetTrack.path || targetTrack.filepath || targetTrack.f;
        if (!localPath) {
            alert("No se encontró la ruta del archivo local en disco para esta pista.");
            return;
        }
        if (isTrackLocalPlaying(targetTrack)) {
            if (onTogglePlay) onTogglePlay();
            return;
        }
        if (onPlayTrack) {
            onPlayTrack({
                id: `local_prev_${Date.now()}`,
                path: localPath,
                f: localPath,
                title: `[LOCAL] ${targetTrack.original_title || targetTrack.title || 'Pista Local'}`,
                artist: targetTrack.original_artist || targetTrack.artist || 'Local',
                album: 'Biblioteca Local',
                duration: targetTrack.original_duration || targetTrack.duration || '04:00',
                bpm: targetTrack.bpm || 128,
                key: targetTrack.key || '8A',
                is_local_preview: true
            }, 0, true);
        }
    };

    const handlePlayCandidateTrack = async (cand, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!cand) return;
        if (isTrackCandPlaying(cand)) {
            if (onTogglePlay) onTogglePlay();
            return;
        }

        let streamUrl = cand.preview_url;
        let coverHd = cand.cover;
        if (!streamUrl) {
            setCandidateModal(prev => ({ ...prev, searchMsg: `Resolviendo audio de preescucha para: ${cand.title}...` }));
            try {
                if (true) {
                    const res = await apiClient.rpc('resolver_stream_preescucha', cand.title, cand.artist);
                    if (res && res.stream_url) {
                        streamUrl = res.stream_url;
                        if (res.cover) coverHd = res.cover;
                    }
                }
                if (!streamUrl) {
                    const resp = await fetch(`/api/resolver_stream_preescucha?titulo=${encodeURIComponent(cand.title)}&artista=${encodeURIComponent(cand.artist)}`);
                    if (resp.ok) {
                        const res = await resp.json();
                        if (res && res.stream_url) {
                            streamUrl = res.stream_url;
                            if (res.cover) coverHd = res.cover;
                        }
                    }
                }
            } catch (err) {
                console.warn("Fallo resolviendo stream para candidato:", err);
            }
            if (streamUrl) {
                cand.preview_url = streamUrl;
                if (coverHd) cand.cover = coverHd;
                setCandidateModal(prev => ({ ...prev, searchMsg: `✓ Reproduciendo versión: ${cand.artist} - ${cand.title}` }));
                setTimeout(() => setCandidateModal(prev => ({ ...prev, searchMsg: '' })), 4000);
            } else {
                setCandidateModal(prev => ({ ...prev, searchMsg: `⚠️ No se encontró audio de preescucha para "${cand.title}".` }));
            }
        }

        if (streamUrl && onPlayTrack) {
            onPlayTrack({
                id: cand.id || `cand_${Date.now()}`,
                path: streamUrl,
                preview_url: streamUrl,
                title: `[DESCARGA] ${cand.title}`,
                artist: cand.artist,
                album: cand.album || 'Oficial HD',
                cover: coverHd || cand.cover,
                duration: cand.duration || '03:45',
                bpm: cand.bpm || 128,
                key: cand.key || '8A',
                is_cand_preview: true
            }, 0, true);
        }
    };

    const handleAnalizar = async (queryOverride = null) => {
        const queryToSearch = (typeof queryOverride === 'string' ? queryOverride : spotifyUrl).trim();
        if (!queryToSearch) {
            setDownloadingMsg("[AVISO] Introduce un artista, tema o URL, o pulsa en una de las sugerencias rápidas.");
            return;
        }
        if (typeof queryOverride === 'string') {
            setSpotifyUrl(queryOverride);
        }
        if (isAnalyzing) return;
        setIsAnalyzing(true);
        setDownloadProgress(20);
        setDownloadingMsg(`[ANALIZANDO] Extrayendo metadatos para: "${queryToSearch}"...`);
        try {
            setDownloadProgress(45);
            let res = null;

            // 1. Intento primario vía Eel con timeout de seguridad (8 segundos)
            if (true) {
                try {
                    const eelCall = apiClient.rpc('analizar_catalogo_spotify', queryToSearch);
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Eel timeout")), 8000)
                    );
                    res = await Promise.race([eelCall, timeoutPromise]);
                } catch (eelErr) {
                    console.warn("[SPOTIFY] Llamada Eel lenta o con error, usando fallback HTTP:", eelErr);
                }
            }

            // 2. Fallback HTTP directo si Eel no respondió o falló
            if (!res || !res.tracks) {
                setDownloadProgress(65);
                try {
                    const resp = await fetch('/api/analizar_spotify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: queryToSearch })
                    });
                    if (resp.ok) {
                        res = await resp.json();
                    }
                } catch (httpErr) {
                    console.error("[SPOTIFY] Fallback HTTP también falló:", httpErr);
                }
            }

            setDownloadProgress(95);
            if (res && res.tracks && res.tracks.length > 0) {
                const mapped = res.tracks.map((t, i) => ({ 
                    ...t, 
                    selected: i === 0,
                    origin: t.origin || 'spotify',
                    energy: t.energy || 80,
                    danceability: t.danceability || 80
                }));
                setTracks(prev => {
                    const existingTax = (prev || []).filter(item => item.origin === 'taxonomy' || item.origin === 'audit_upgrade');
                    return [...existingTax, ...mapped];
                });
                setSelectedId(mapped[0].id);
                setDownloadProgress(100);
                setDownloadingMsg(`[LISTO] ${mapped.length} pistas cargadas con carátulas oficiales.`);
            } else {
                setDownloadProgress(0);
                setDownloadingMsg("[AVISO] No se encontraron pistas para este enlace o búsqueda.");
            }
        } catch (e) {
            setDownloadProgress(0);
            setDownloadingMsg(`[ERROR] Fallo al analizar catálogo: ${e.message || e}`);
        } finally {
            setTimeout(() => {
                setIsAnalyzing(false);
                setDownloadProgress(0);
            }, 1200);
        }
    };

    const lanzarDescargaReal = async (listaPistas, formatoOverride = null) => {
        if (!listaPistas || listaPistas.length === 0) return;
        const fmt = (formatoOverride || selectedFormat || 'flac').toLowerCase();

        // Comprobación de fidelidad DJ previa a la descarga
        let pistasADescargar = [...listaPistas];
        const dudosas = pistasADescargar.filter(t => t.match_score !== undefined && t.match_score < 75 && !t.confirmado_manualmente);
        if (dudosas.length > 0) {
            const confirmMsg = `⚠️ AVISO DE FIDELIDAD DJ:\n\nSe detectaron ${dudosas.length} pista(s) con posible variación de versión, Remix o duración (<75%).\n\n¿Deseas descargar de todas formas todo el lote seleccionado (${pistasADescargar.length} pistas)?\n\n• [Aceptar]: Descargar todas las pistas seleccionadas ahora.\n• [Cancelar]: Detener para revisar o cambiar versiones individualmente.`;
            if (!window.confirm(confirmMsg)) {
                return;
            }
        }

        setIsDownloading(true);
        setDownloadProgress(10);
        const purgeTag = deleteOriginalsOnUpgrade ? " (🗑️ Con purga de baja calidad)" : "";
        setDownloadingMsg(`[DESCARGANDO] Iniciando lote de ${pistasADescargar.length} pista(s) en formato .${fmt.toUpperCase()}${purgeTag}...`);
        let descargadoVíaEel = false;
        if (true) {
            try {
                await apiClient.rpc('descargar_pistas_spotify_seleccionadas', pistasADescargar, fmt, destDir, deleteOriginalsOnUpgrade);
                descargadoVíaEel = true;
            } catch (e) {
                console.warn("[SPOTIFY] Error en llamada Eel de descarga, recurriendo a HTTP:", e);
            }
        }
        if (!descargadoVíaEel) {
            try {
                const resp = await fetch('/api/descargar_spotify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tracks: pistasADescargar,
                        formato: fmt,
                        custom_dir: destDir,
                        eliminar_originales: deleteOriginalsOnUpgrade
                    })
                });
                const res = await resp.json();
                if (res && (res.status === 'ok' || res.status === 'iniciado')) {
                    setDownloadingMsg(`[DESCARGANDO] Lote en segundo plano (${pistasADescargar.length} pistas) hacia: ${res.dest || destDir}`);
                    setDownloadProgress(35);
                } else {
                    setDownloadingMsg(`[ERROR] ${res?.msg || 'Error al iniciar descarga'}`);
                    setIsDownloading(false);
                    setDownloadProgress(0);
                }
            } catch (httpErr) {
                console.error("[SPOTIFY] Fallo HTTP de descarga:", httpErr);
                setIsDownloading(false);
                setDownloadProgress(0);
                setDownloadingMsg(`[ERROR] Conexión fallida: ${httpErr.message || httpErr}`);
            }
        }
    };

    const handleAuditarDescargas = async (pistasAAuditar = null) => {
        const targetList = pistasAAuditar && pistasAAuditar.length > 0 ? pistasAAuditar : downloadSession.downloaded;
        if (!targetList || targetList.length === 0) {
            alert("No hay pistas descargadas disponibles para auditar.");
            return;
        }
        setIsAuditingFft(true);
        setFftProgress(5);
        setFftMsg(`[AUDITORÍA FFT] Iniciando certificación espectral de ${targetList.length} pista(s)...`);

        let auditadoVíaEel = false;
        if (true) {
            try {
                await apiClient.rpc('auditar_descargas_fft', targetList);
                auditadoVíaEel = true;
            } catch (e) {
                console.warn("[SPOTIFY] Error en llamada Eel de auditoría, recurriendo a HTTP:", e);
            }
        }
        if (!auditadoVíaEel) {
            try {
                const resp = await fetch('/api/auditar_descargas_fft', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tracks: targetList })
                });
                const res = await resp.json();
                if (res && res.status === 'iniciado') {
                    setFftProgress(15);
                }
            } catch (err) {
                console.error("Error al iniciar auditoría FFT:", err);
                setIsAuditingFft(false);
                setFftProgress(0);
                setFftMsg("Error de conexión al iniciar auditoría FFT.");
            }
        }
    };

    const handleRedescargarFormato = (pistas, formato = 'mp3') => {
        if (!pistas || pistas.length === 0) return;
        const confirmMsg = `¿Deseas descargar ${pistas.length} pista(s) en formato .${formato.toUpperCase()} (Calidad Garantizada 320 kbps CBR)?\n\n${deleteOriginalsOnUpgrade ? '✓ Se sustituirá el archivo anterior eliminando el duplicado de baja calidad.' : '• Se conservará el archivo anterior en la carpeta.'}`;
        if (!window.confirm(confirmMsg)) return;

        const normalizadas = pistas.map(p => ({
            id: p.id || `sp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            title: p.title || p.name || 'Track',
            name: p.title || p.name || 'Track',
            artist: p.artist || 'Artista',
            album: p.album || '',
            cover: p.cover || p.cover_url || '',
            cover_url: p.cover || p.cover_url || '',
            original_path: p.path,
            origin: 'audit_upgrade',
            spotify_url: p.spotify_url || (p.id && String(p.id).length === 22 ? `https://open.spotify.com/track/${p.id}` : '')
        }));
        setSpSubView('catalog');
        lanzarDescargaReal(normalizadas, formato);
    };

    const handleToggleSelectAllDownloaded = () => {
        if (selectedDownloadedIds.size === downloadSession.downloaded.length && downloadSession.downloaded.length > 0) {
            setSelectedDownloadedIds(new Set());
        } else {
            setSelectedDownloadedIds(new Set(downloadSession.downloaded.map(t => String(t.id || t.path))));
        }
    };

    const handleToggleSelectDownloaded = (id) => {
        setSelectedDownloadedIds(prev => {
            const next = new Set(prev);
            const strId = String(id);
            if (next.has(strId)) next.delete(strId);
            else next.add(strId);
            return next;
        });
    };

    const handleCambiarCarpeta = () => {
        handleAbrirNavegadorCarpetas(destDir);
    };

    return (
        <div className="ws-module ws-mod-spotify flex w-full h-full max-w-full bg-[#09090c] text-gray-300 font-sans select-none overflow-x-hidden">
            <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
                <div className="p-3 border-b border-djzinc-800 bg-[#0c0c10] flex flex-col gap-2.5 shrink-0 w-full max-w-full">
                    {/* Header Institucional: Título y Contexto de Ingesta */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-800/60">
                        <SectionTitle icon={Icons.Download} title="Record Pool" accent="& Ingesta" badge="AUDIO HQ" />
                        <span className="text-xs text-zinc-400 font-sans hidden md:inline">
                            Búsqueda, descarga de alta fidelidad y extracción automática de stems
                        </span>
                    </div>

                    {/* Fila 1: Barra de Búsqueda Prominente y Acciones Principales de Descarga */}
                    <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5 w-full">
                        {/* Input de Búsqueda: Máxima prioridad y amplitud visual */}
                        <div className="flex items-center gap-2 flex-1 min-w-[320px] max-w-full lg:max-w-2xl">
                            <div className="flex-1 min-w-0 bg-[#060609] border border-djzinc-750 focus-within:border-djcyan-500 rounded-lg flex items-center overflow-hidden shadow-inner">
                                <span className="px-3 py-1.5 text-xs font-mono text-djcyan-400 bg-[#0e0e13] border-r border-djzinc-800 font-bold shrink-0 flex items-center gap-1.5">
                                    <Icons.Search size={14} className="inline-block align-[-2px]" />
                                    <span>BÚSQUEDA</span>
                                </span>
                                <input 
                                    type="text" 
                                    value={spotifyUrl} 
                                    onChange={(e) => setSpotifyUrl(e.target.value)} 
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAnalizar();
                                        }
                                    }}
                                    placeholder="Pega enlace de audio o busca por artista, álbum, canción, género..." 
                                    className="bg-transparent px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none flex-1 min-w-[160px] font-mono" 
                                />
                                {spotifyUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setSpotifyUrl('')}
                                        className="px-2.5 text-gray-500 hover:text-white text-xs cursor-pointer"
                                        title="Borrar texto"
                                    >
                                        <Icons.Close size={14} className="inline-block align-[-2px]" />
                                    </button>
                                )}
                            </div>
                            <button 
                                onClick={() => handleAnalizar()} 
                                disabled={isAnalyzing} 
                                className="px-3.5 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono rounded-lg text-xs font-bold cursor-pointer transition-colors shadow flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                            >
                                {isAnalyzing ? 'Buscando...' : 'Buscar / Analizar'}
                            </button>

                            {(isAnalyzing || isDownloading || isAuditingFft || downloadProgress > 0) && (
                                <button 
                                    type="button"
                                    onClick={handleCancelarDescargas} 
                                    className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg font-bold font-mono text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95 shrink-0"
                                    title="Detener y cancelar la búsqueda o descarga activa inmediatamente"
                                >
                                    <Icons.Close size={14} className="inline-block align-[-2px]" />
                                    <span>{lang === 'en' ? 'Cancel' : 'Cancelar'}</span>
                                </button>
                            )}
                        </div>

                        {/* Selector de Sub-Vistas: Catálogo / Búsqueda vs Descargadas & Auditoría FFT */}
                        <div className="flex items-center gap-1.5 bg-[#060609] border border-djzinc-750 p-1 rounded-lg shrink-0">
                            <button
                                type="button"
                                onClick={() => setSpSubView('catalog')}
                                className={`px-3 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    spSubView === 'catalog'
                                        ? 'bg-djcyan-500 text-black shadow-sm font-black'
                                        : 'text-gray-400 hover:text-white hover:bg-djzinc-850'
                                }`}
                            >
                                <Icons.Search size={14} className="inline-block align-[-2px]" />
                                <span>Catálogo</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${spSubView === 'catalog' ? 'bg-black/20 text-black' : 'bg-djzinc-800 text-djcyan-400'}`}>
                                    {tracks.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSpSubView('downloaded')}
                                className={`px-3 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    spSubView === 'downloaded'
                                        ? 'bg-emerald-500 text-black shadow-sm font-black'
                                        : 'text-gray-400 hover:text-white hover:bg-djzinc-850'
                                }`}
                            >
                                <Icons.Download size={14} className="inline-block align-[-2px]" />
                                <span>Descargadas & FFT</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${spSubView === 'downloaded' ? 'bg-black/20 text-black' : 'bg-djzinc-800 text-emerald-400'}`}>
                                    {downloadSession.downloaded.length}
                                </span>
                            </button>
                        </div>

                        {/* Botones de Acción Primarios */}
                        <div className="flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
                            <button 
                                onClick={() => {
                                    const seleccionadas = tracks.filter(t => t.selected);
                                    if (seleccionadas.length === 0) {
                                        if (tracks.length > 0) {
                                            const confirmarTodos = window.confirm(`No hay pistas marcadas con casilla. ¿Deseas descargar todas las ${tracks.length} pistas del catálogo?`);
                                            if (confirmarTodos) {
                                                setTracks(prev => prev.map(t => ({ ...t, selected: true })));
                                                lanzarDescargaReal(tracks);
                                                return;
                                            }
                                        } else {
                                            alert("Por favor marca al menos una casilla de la tabla para descargar.");
                                            return;
                                        }
                                        return;
                                    }
                                    lanzarDescargaReal(seleccionadas);
                                }}
                                disabled={isDownloading || tracks.length === 0}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 shrink-0 ${
                                    selectedCount > 0 
                                        ? 'bg-djcyan-500 hover:bg-djcyan-400 text-black shadow-djcyan-500/20' 
                                        : 'bg-djzinc-800 text-gray-400 hover:text-white border border-djzinc-700'
                                }`}
                            >
                                <span><Icons.Download size={14} className="inline-block align-[-2px]" /> Descargar ({selectedCount})</span>
                            </button>

                            {tracks.length > 0 && (
                                <button
                                    onClick={() => {
                                        setTracks(prev => prev.map(t => ({
                                            ...t,
                                            selected: t.pre_worth_it !== false
                                        })));
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-djzinc-850 hover:bg-djzinc-800 text-djcyan-300 hover:text-white border border-djcyan-700/60 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 shrink-0"
                                    title="Marcar automáticamente solo las pistas con Master Hi-Res 24b o Lossless 16b y desmarcar las que no merecen la pena"
                                >
                                    <Icons.Star size={14} className="inline-block align-[-2px]" />
                                    <span>Recomendadas ({tracks.filter(t => t.pre_worth_it !== false).length})</span>
                                </button>
                            )}

                            {tracks.length > 0 && (downloadSession.downloaded.length > 0 || downloadSession.failed.length > 0) && (
                                <button
                                    onClick={() => lanzarDescargaReal(tracks)}
                                    disabled={isDownloading}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 shrink-0"
                                    title="Reintentar descarga de todas las pistas pendientes/fallidas restantes"
                                >
                                    <span><Icons.Refresh size={14} className="inline-block align-[-2px]" /> Reintentar ({tracks.length})</span>
                                </button>
                            )}

                            <button
                                onClick={handleDescargarReporteXLS}
                                disabled={isExportingXls || (downloadSession.downloaded.length === 0 && downloadSession.failed.length === 0)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                                    (downloadSession.downloaded.length > 0 || downloadSession.failed.length > 0)
                                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20 font-black'
                                        : 'bg-djzinc-900 text-gray-500 border border-djzinc-800 cursor-not-allowed'
                                }`}
                                title="Descargar informe Excel con las pistas descargadas con certificación FFT y las que fallaron"
                            >
                                <Icons.Excel size={14} className="inline-block align-[-2px]" />
                                <span>
                                    {isExportingXls 
                                        ? 'Generando...' 
                                        : (downloadSession.downloaded.length > 0 || downloadSession.failed.length > 0)
                                            ? `Excel (${downloadSession.downloaded.length}✓ | ${downloadSession.failed.length}✕)`
                                            : 'Excel'
                                    }
                                </span>
                            </button>

                            {/* Botón de Ordenación Rápida por Match */}
                            {tracks.some(t => t.match_score !== undefined || t.origin === 'audit_upgrade') && (
                                <button
                                    type="button"
                                    onClick={() => handleSortSp('match_score')}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 shrink-0 border ${
                                        spSortField === 'match_score'
                                            ? 'bg-djcyan-950 text-djcyan-300 border-djcyan-500 font-black shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                            : 'bg-djzinc-850 hover:bg-djzinc-800 text-gray-400 hover:text-white border-djzinc-750'
                                    }`}
                                    title="Ordenar tabla por fidelidad de coincidencia (Match %)"
                                >
                                    <Icons.Target size={14} className="inline-block align-[-2px]" />
                                    <span>Match {spSortField === 'match_score' ? (spSortDir === 'desc' ? '▼ (100%→0%)' : '▲ (0%→100%)') : '↕'}</span>
                                </button>
                            )}

                            {/* Checkbox para purgar pistas originales de baja calidad tras descargar la versión HD */}
                            <label 
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all border shrink-0 select-none ${
                                    deleteOriginalsOnUpgrade 
                                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)]' 
                                        : 'bg-[#12121a] hover:bg-djzinc-850 border-djzinc-750 text-gray-400 hover:text-gray-200'
                                }`}
                                title="Al descargar pistas de reemplazo para mejorar la calidad, elimina automáticamente el archivo original de baja calidad de tu disco duro para no dejar duplicados malos."
                            >
                                <input 
                                    type="checkbox" 
                                    checked={deleteOriginalsOnUpgrade} 
                                    onChange={(e) => handleToggleDeleteOriginals(e.target.checked)} 
                                    className="w-3.5 h-3.5 accent-rose-500 cursor-pointer rounded"
                                />
                                <span className="flex items-center gap-1">
                                    <Icons.Trash size={14} className="inline-block align-[-2px]" />
                                    <span>Borrar malas del disco</span>
                                </span>
                                {deleteOriginalsOnUpgrade && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Fila 2: Sugerencias a la izquierda, Configuración y Formatos a la derecha */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 w-full pt-1 border-t border-djzinc-800/60">
                        {/* Pills de Búsqueda Rápida Determinista */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap py-0.5">
                            <span className="text-[10px] font-mono text-gray-500 shrink-0">Sugerencias:</span>
                            {[
                                "Marco Bailey", 
                                "Charlotte de Witte", 
                                "Tech House Peak", 
                                "Melodic Techno 126", 
                                "Amelie Lens", 
                                "Carl Cox"
                            ].map(sug => (
                                <button
                                    key={sug}
                                    type="button"
                                    onClick={() => handleAnalizar(sug)}
                                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#14141d] hover:bg-djcyan-950 text-gray-400 hover:text-djcyan-300 border border-djzinc-800 hover:border-djcyan-700/60 transition-colors cursor-pointer shrink-0"
                                >
                                    + {sug}
                                </button>
                            ))}
                        </div>

                        {/* Controles de Destino, Formato de Audio e Inspector */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* Botón Importar Colección */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleCargarColeccion()}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-700 hover:bg-purple-600 text-white shadow-sm transition-all cursor-pointer active:scale-95"
                                    title="Importar pistas de la colección para análisis y descarga"
                                >
                                    <Icons.Library size={13} className="inline-block align-[-2px]" />
                                    <span>Importar Colección</span>
                                </button>
                                {customLibraries && customLibraries.length > 1 && (
                                    <select
                                        onChange={(e) => handleCargarColeccion(e.target.value)}
                                        defaultValue=""
                                        className="bg-purple-950/80 border border-purple-600/70 text-purple-200 text-xs font-mono font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
                                        title="Seleccionar qué colección cargar"
                                    >
                                        <option value="" disabled>Biblioteca...</option>
                                        {customLibraries.map(lib => (
                                            <option key={lib.id} value={lib.id}>
                                                {lib.name} ({lib.folders?.reduce((acc, f) => acc + (f.tracks?.length || 0), 0) || 0} pistas)
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400 bg-[#060609] border border-djzinc-800 px-2.5 py-1 rounded-lg">
                                <span className="text-gray-500">Destino:</span>
                                <span className="text-gray-200 truncate max-w-[120px] font-semibold" title={(!destDir || !destDir.startsWith('/') || destDir.includes('"')) ? '/Users/admin/Music/mi musica' : destDir}>
                                    {(!destDir || !destDir.startsWith('/') || destDir.includes('"') || destDir.includes(':')) ? 'mi musica' : (destDir.split('/').filter(Boolean).pop() || 'mi musica')}
                                </span>
                                <button onClick={handleCambiarCarpeta} className="text-djcyan-400 hover:text-djcyan-300 px-1.5 py-0.5 hover:bg-djzinc-800 rounded text-[10px] font-mono cursor-pointer transition-colors">Cambiar</button>
                            </div>

                            <div className="flex items-center gap-1 bg-[#060609] border border-djzinc-750 rounded-lg p-0.5">
                                {[
                                    { id: 'flac', label: 'FLAC Hi-Res', badge: '24b' },
                                    { id: 'wav', label: 'WAV', badge: '24b' },
                                    { id: 'aiff', label: 'AIFF', badge: 'Club' },
                                    { id: 'mp3', label: 'MP3', badge: '320k' }
                                ].map(f => (
                                    <button 
                                        key={f.id} 
                                        onClick={() => setSelectedFormat(f.id)} 
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                            selectedFormat === f.id 
                                                ? 'bg-djcyan-500 text-black shadow-sm font-black' 
                                                : 'text-gray-400 hover:text-white hover:bg-djzinc-850'
                                        }`}
                                        title={`Descargar en formato ${f.label} (${f.badge})`}
                                    >
                                        <span>{f.label}</span>
                                        <span className={`text-[8px] px-1 rounded font-normal ${selectedFormat === f.id ? 'bg-black/25 text-black font-bold' : 'bg-djzinc-800 text-djcyan-400'}`}>
                                            {f.badge}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Selector de Columnas Visibles del Record Pool */}
                            <button
                                type="button"
                                onClick={() => setPoolColumnSelectorOpen(true)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 ${
                                    poolColumnSelectorOpen 
                                        ? 'bg-djcyan-950 text-djcyan-300 border-djcyan-600/70 shadow-inner' 
                                        : 'bg-djzinc-900 text-gray-300 border-djzinc-750 hover:text-white hover:border-djzinc-650'
                                }`}
                                title="Personalizar columnas visibles de la tabla de Pool / Catálogo"
                            >
                                <Icons.Gear size={14} className="inline-block align-[-2px]" />
                                <span>Columnas</span>
                                <span className="text-[10px] text-djcyan-400 font-mono font-bold">
                                    ({Object.values(poolVisibleColumns).filter(Boolean).length}/{Object.keys(poolVisibleColumns).length})
                                </span>
                            </button>

                            <button 
                                onClick={() => setSpInspectorOpen(prev => !prev)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                                    spInspectorOpen 
                                        ? 'bg-djzinc-800 text-white border-djcyan-500 shadow-sm' 
                                        : 'bg-djzinc-900 text-gray-400 border-djzinc-750 hover:text-white'
                                }`}
                                title={spInspectorOpen ? "Ocultar panel inspector" : "Mostrar panel inspector"}
                            >
                                <Icons.PanelLeft size={14} aria-hidden="true" className="rotate-180" />
                                <span>{t('btn_inspector') || 'Inspector'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Banner de Confirmación Descarga Reporte XLS */}
                {xlsToast && (
                    <div className="mx-4 mt-2 p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded-lg text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg animate-fadeIn">
                        <div className="flex items-center gap-2">
                            <Icons.Excel size={14} className="inline-block align-[-2px]" />
                            <span>{xlsToast}</span>
                        </div>
                        <button onClick={() => setXlsToast('')} className="text-emerald-400 hover:text-white px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700 text-[10px] cursor-pointer"><Icons.Close size={14} className="inline-block align-[-2px]" /></button>
                    </div>
                )}

                {/* Franja de Estado y Barras de Progreso Dinámicas (Descarga + Auditoría FFT Independientes) */}
                <div className="px-4 py-2.5 bg-[#09090c] border-b border-djzinc-850 flex flex-col gap-2 shrink-0">
                    {/* Barra Fase 1: Descarga FLAC */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-djcyan-400 font-semibold flex items-center gap-1.5 truncate">
                                <span className={`w-2 h-2 rounded-full ${isAnalyzing || isDownloading ? 'bg-djcyan-400 animate-pulse' : tracks.length > 0 ? 'bg-djgreen-400' : 'bg-gray-500'}`}></span>
                                <span>{downloadingMsg || (tracks.length === 0 ? '[STANDBY] Listo para buscar o importar pistas desde Auditoría DJ.' : `[LISTO] ${tracks.length} pista(s) en catálogo.`)}</span>
                            </span>
                            <div className="flex items-center gap-3">
                                {(isDownloading || isAnalyzing || downloadProgress > 0) && (
                                    <span className="text-djcyan-300 font-mono font-bold text-xs">{downloadProgress}%</span>
                                )}
                                {(isAnalyzing || isDownloading || isAuditingFft || downloadProgress > 0) && (
                                    <button
                                        onClick={handleCancelarDescargas}
                                        className="px-2 py-0.5 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[10px] font-mono font-bold cursor-pointer transition-colors shadow flex items-center gap-1"
                                        title="Cancelar búsqueda, descarga y procesos activos"
                                    >
                                        <Icons.Close size={14} className="inline-block align-[-2px]" />
                                        <span>{t('btn_cancel') || 'Cancelar'}</span>
                                    </button>
                                )}
                                <span className="text-gray-400 text-[11px] font-mono font-bold">
                                    {downloadSession.downloaded.length > 0 
                                        ? `${downloadSession.downloaded.length} descargadas (${tracks.length} pendientes)` 
                                        : `${tracks.length} Pistas detectadas`
                                    }
                                </span>
                            </div>
                        </div>
                        {(downloadProgress > 0 || isAnalyzing || isDownloading) && (
                            <div className="w-full bg-[#121217] h-2 rounded-full overflow-hidden border border-djzinc-800 shadow-inner">
                                <div 
                                    className={`h-full transition-all duration-300 ease-out shadow-lg shadow-djcyan-500/50 ${
                                        isAnalyzing && downloadProgress <= 25
                                            ? 'bg-gradient-to-r from-djcyan-500 via-djpurple-500 to-djcyan-500 animate-pulse'
                                            : downloadProgress >= 100
                                                ? 'bg-emerald-400'
                                                : 'bg-gradient-to-r from-djcyan-500 to-djgreen-400'
                                    }`} 
                                    style={{ width: `${Math.max(5, Math.min(100, downloadProgress))}%` }}
                                ></div>
                            </div>
                        )}
                    </div>

                    {/* Barra Fase 2: Auditoría FFT Acústica Post-Descarga */}
                    {(isAuditingFft || fftProgress > 0) && (
                        <div className="pt-2 border-t border-djzinc-850/80 flex flex-col gap-1 transition-all">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 truncate">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>{fftMsg || "Auditoría FFT Certificando corte espectral..."}</span>
                                </span>
                                <span className="text-emerald-300 font-mono font-bold text-xs">{fftProgress}%</span>
                            </div>
                            <div className="w-full bg-[#121217] h-2 rounded-full overflow-hidden border border-emerald-950 shadow-inner">
                                <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 via-djcyan-400 to-emerald-400 transition-all duration-300 ease-out shadow-lg shadow-emerald-500/50" 
                                    style={{ width: `${Math.max(5, Math.min(100, fftProgress))}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Banner de Pistas Importadas para Reemplazo HD */}
                {tracks.some(t => t.origin === 'audit_upgrade') && (
                    <div className="px-4 py-2 bg-gradient-to-r from-amber-950/70 via-emerald-950/40 to-djzinc-950 border-b border-amber-600/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <Icons.Refresh size={14} className="inline-block align-[-2px] text-amber-400 font-bold" />
                            <span className="text-gray-200">
                                <strong className="text-amber-300 font-semibold">{tracks.filter(t => t.origin === 'audit_upgrade').length} reemplazo(s) HD</strong> importado(s) desde Auditoría para sustituir pistas de baja calidad.
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <label 
                                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer select-none transition-all border ${
                                    deleteOriginalsOnUpgrade 
                                        ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.4)]' 
                                        : 'bg-black/60 border-amber-600/50 text-amber-200 hover:border-amber-400'
                                }`}
                                title="Eliminar automáticamente del disco duro los archivos originales de baja calidad al terminar con éxito la descarga en alta calidad"
                            >
                                <input 
                                    type="checkbox" 
                                    checked={deleteOriginalsOnUpgrade} 
                                    onChange={(e) => handleToggleDeleteOriginals(e.target.checked)} 
                                    className="w-3.5 h-3.5 accent-rose-500 cursor-pointer rounded"
                                />
                                <span className="flex items-center gap-1.5">
                                    <Icons.Trash size={14} className="inline-block align-[-2px]" />
                                    <span>Borrar pistas malas del disco al descargar</span>
                                </span>
                            </label>
                            <span className="text-[11px] text-gray-400 font-mono">Formato: <strong className="text-djcyan-400 font-bold">{selectedFormat.toUpperCase()}</strong></span>
                        </div>
                    </div>
                )}

                {spSubView === 'downloaded' ? (
                    <div className="flex-1 flex flex-col min-h-0 bg-[#08080b] overflow-hidden select-none">
                        {/* Barra Superior de Herramientas de Auditoría y Consejos */}
                        <div className="px-4 py-2.5 bg-[#0c0c12] border-b border-djzinc-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const seleccion = downloadSession.downloaded.filter(t => selectedDownloadedIds.has(String(t.id || t.path)));
                                        handleAuditarDescargas(seleccion.length > 0 ? seleccion : downloadSession.downloaded);
                                    }}
                                    disabled={isAuditingFft || downloadSession.downloaded.length === 0}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                                        isAuditingFft 
                                            ? 'bg-emerald-800 text-emerald-200 animate-pulse' 
                                            : 'bg-emerald-500 hover:bg-emerald-400 text-black font-black shadow-emerald-500/20'
                                    } disabled:opacity-50`}
                                    title="Ejecutar análisis espectral FFT sobre las pistas seleccionadas o todas para certificar corte kHz y descartar falsos upsamples"
                                >
                                    <Icons.ZoomIn size={14} className="inline-block align-[-2px]" />
                                    <span>
                                        {selectedDownloadedIds.size > 0 && selectedDownloadedIds.size < downloadSession.downloaded.length 
                                            ? `Auditar Selección (${selectedDownloadedIds.size})` 
                                            : `Auditar Todo (${downloadSession.downloaded.length})`}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const seleccion = downloadSession.downloaded.filter(t => selectedDownloadedIds.has(String(t.id || t.path)));
                                        handleRedescargarFormato(seleccion.length > 0 ? seleccion : downloadSession.downloaded, 'mp3');
                                    }}
                                    disabled={isDownloading || downloadSession.downloaded.length === 0}
                                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                                    title="Descargar versión garantizada en MP3 320 kbps CBR para evitar peso artificial en CDJs"
                                >
                                    <Icons.Zap size={14} className="inline-block align-[-2px]" />
                                    <span>
                                        {selectedDownloadedIds.size > 0 && selectedDownloadedIds.size < downloadSession.downloaded.length 
                                            ? `Descargar Selección en MP3 320 (${selectedDownloadedIds.size})` 
                                            : `Descargar Todo en MP3 320`}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDescargarReporteXLS}
                                    disabled={isExportingXls || (downloadSession.downloaded.length === 0 && downloadSession.failed.length === 0)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#14141d] hover:bg-emerald-950 text-emerald-300 border border-emerald-600/60 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                    title="Exportar informe Excel completo con cortes FFT y consejos de optimización"
                                >
                                    <Icons.Excel size={14} className="inline-block align-[-2px]" />
                                    <span>Exportar Excel ({downloadSession.downloaded.length}✓)</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-gray-400">
                                    <strong className="text-emerald-400">{downloadSession.downloaded.filter(t => t.audit_status === 'completada').length}</strong> de {downloadSession.downloaded.length} auditadas
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm("¿Deseas vaciar la lista de pistas descargadas de esta sesión?")) {
                                            setDownloadSession(prev => ({ ...prev, downloaded: [] }));
                                            setSelectedDownloadedIds(new Set());
                                        }
                                    }}
                                    className="px-2 py-1 rounded text-[10px] font-mono text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 border border-djzinc-800 transition-colors cursor-pointer"
                                    title="Vaciar listado de descargadas"
                                >
                                    <Icons.Trash size={14} className="inline-block align-[-2px]" /> Limpiar
                                </button>
                            </div>
                        </div>

                        {downloadSession.downloaded.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#08080b] select-none text-center">
                                <div className="max-w-md w-full p-6 rounded-2xl bg-[#0c0c12] border border-djzinc-800 flex flex-col items-center gap-3 shadow-xl">
                                    <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-xl">
                                        <Icons.Download size={14} className="inline-block align-[-2px]" />
                                    </div>
                                    <h4 className="text-sm font-bold text-white uppercase font-mono">Sin Descargas En Esta Sesión</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Las pistas descargadas aparecerán en este listado para que puedas ejecutar el análisis espectral FFT post-descarga y certificar su fidelidad acústica.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setSpSubView('catalog')}
                                        className="px-4 py-2 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-xs rounded-lg transition-colors cursor-pointer mt-1"
                                    >
                                        ← Ir a Catálogo / Búsqueda
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto bg-[#08080b] pb-36 md:pb-6">
                                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                                    <thead className="sticky top-0 z-10 bg-[#0d0d12] border-b border-djzinc-800 text-[10px] font-mono uppercase text-gray-400">
                                        <tr>
                                            <th className="py-2.5 px-3 w-8 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDownloadedIds.size === downloadSession.downloaded.length && downloadSession.downloaded.length > 0}
                                                    onChange={handleToggleSelectAllDownloaded}
                                                    className="accent-djcyan-500 cursor-pointer"
                                                />
                                            </th>
                                            <th className="py-2.5 px-2 w-10 text-center">PLAY</th>
                                            <th className="py-2.5 px-3 min-w-[220px]">TÍTULO / ÁLBUM</th>
                                            <th className="py-2.5 px-3 min-w-[140px]">ARTISTA</th>
                                            <th className="py-2.5 px-2 text-center w-24">FORMATO</th>
                                            <th className="py-2.5 px-3 text-center min-w-[200px]">AUDITORÍA FFT (ESPECTRO)</th>
                                            <th className="py-2.5 px-3 min-w-[260px]">CONSEJO / OPTIMIZACIÓN DJ</th>
                                            <th className="py-2.5 px-3 text-center min-w-[140px]">ACCIÓN / RE-DESCARGA</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-djzinc-850/60 font-mono text-[11px]">
                                        {downloadSession.downloaded.map((row, idx) => {
                                            const isRowSelected = selectedDownloadedIds.has(String(row.id || row.path));
                                            const isAudited = row.audit_status === 'completada';
                                            return (
                                                <tr
                                                    key={row.id || `dl_${idx}`}
                                                    onClick={() => handleToggleSelectDownloaded(row.id || row.path)}
                                                    className={`transition-colors cursor-pointer ${
                                                        isRowSelected ? 'bg-djcyan-950/20 hover:bg-djcyan-950/30' : 'hover:bg-djzinc-900/60'
                                                    }`}
                                                >
                                                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isRowSelected}
                                                            onChange={() => handleToggleSelectDownloaded(row.id || row.path)}
                                                            className="accent-djcyan-500 cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => onPlayTrack && onPlayTrack(row)}
                                                            className="w-7 h-7 rounded-full bg-djzinc-800 hover:bg-djcyan-500 hover:text-black text-gray-300 flex items-center justify-center transition-all cursor-pointer text-xs"
                                                            title="Reproducir archivo descargado"
                                                        >
                                                            <Icons.Play size={14} className="inline-block align-[-2px]" />
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <div className="flex flex-col max-w-[240px]">
                                                            <span className="font-bold text-gray-200 truncate">{row.title || 'Desconocido'}</span>
                                                            <span className="text-[10px] text-gray-500 truncate">{row.album || 'CleanDJmix Ingest'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-300 truncate max-w-[140px]">
                                                        {row.artist || 'Desconocido'}
                                                    </td>
                                                    <td className="py-2 px-2 text-center">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-djzinc-800 text-djcyan-300 border border-djzinc-700">
                                                            {row.format || 'FLAC'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        {isAudited ? (
                                                            row.es_fake ? (
                                                                <div className="flex flex-col items-center gap-0.5">
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                                                                        <Icons.Warning size={14} className="inline-block align-[-2px]" /> Fake Upsample ({row.corte})
                                                                    </span>
                                                                    <span className="text-[9.5px] text-gray-400">
                                                                        {row.sample_rate_khz ? `${row.sample_rate_khz} kHz` : ''} • {row.perdida || 'Pérdida'}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-0.5">
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">
                                                                        <Icons.Check size={14} className="inline-block align-[-2px]" /> Lossless Real ({row.corte})
                                                                    </span>
                                                                    <span className="text-[9.5px] text-emerald-400/80">
                                                                        {row.sample_rate_khz ? `${row.sample_rate_khz} kHz` : ''} • Sin Pérdida
                                                                    </span>
                                                                </div>
                                                            )
                                                        ) : isAuditingFft ? (
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-djcyan-950 text-djcyan-300 border border-djcyan-700 animate-pulse">
                                                                <Icons.ZoomIn size={14} className="inline-block align-[-2px]" /> Analizando FFT...
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded text-[10px] text-gray-400 bg-djzinc-850 border border-djzinc-750">
                                                                <Icons.Clock size={14} className="inline-block align-[-2px]" /> Pendiente de Auditoría
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 whitespace-normal">
                                                        {row.consejo ? (
                                                            row.es_fake ? (
                                                                <div className="p-1.5 rounded bg-amber-950/60 border border-amber-600/70 text-amber-200 text-[10.5px] font-sans leading-tight">
                                                                    {row.consejo}
                                                                </div>
                                                            ) : isAudited ? (
                                                                <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-600/50 text-emerald-300 text-[10.5px] font-sans leading-tight">
                                                                    {row.consejo}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 text-[10.5px] font-sans italic">
                                                                    {row.consejo}
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-500 text-[10.5px] font-sans italic">
                                                                Pendiente de análisis FFT
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAuditarDescargas([row])}
                                                                disabled={isAuditingFft}
                                                                className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
                                                                title="Ejecutar auditoría acústica FFT en esta pista"
                                                            >
                                                                {isAudited ? 'Re-auditar' : '🔬 Auditar'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRedescargarFormato([row], 'mp3')}
                                                                disabled={isDownloading}
                                                                className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                                                                title="Descargar versión garantizada en MP3 320 kbps CBR"
                                                            >
                                                                <Icons.Download size={14} className="inline-block align-[-2px]" /> MP3 320
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                tracks.length === 0 && !isAnalyzing ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#08080b] select-none overflow-y-auto">
                        <div className="max-w-xl w-full mx-auto flex flex-col items-center justify-center gap-3.5 p-6 sm:p-8 rounded-2xl bg-[#0c0c12] border border-djzinc-800 shadow-2xl text-center">
                            <div className="w-14 h-14 rounded-full bg-emerald-950/70 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                <Icons.Spotify />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                                Record Pool • Modo Standby
                            </h3>
                            <p className="text-xs text-gray-400 max-w-lg mx-auto text-center leading-relaxed whitespace-normal break-words px-2">
                                Escribe una búsqueda (artista, tema o género) o pega un enlace de audio en la barra superior. También puedes importar pistas de baja calidad desde <strong className="text-amber-400 font-semibold">Auditoría & DSP</strong> usando el botón "📥 Reemplazos HD".
                            </p>
                            <div className="flex items-center gap-2 pt-2 text-[11px] font-mono text-gray-500 whitespace-normal">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                <span>Descargas Lossless FLAC / WAV • Certificación Espectral FFT</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto bg-[#08080b] pb-36 md:pb-6">
                        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                            <thead className="sticky top-0 z-10 bg-[#0d0d12] border-b border-djzinc-800 text-[10px] font-mono uppercase text-gray-400">
                                <tr>
                                    {poolVisibleColumns.select !== false && (
                                        <th className="py-2.5 px-3 w-8 text-center"><input type="checkbox" checked={allSelected} onChange={handleToggleSelectAll} className="accent-djcyan-500 cursor-pointer" /></th>
                                    )}
                                    {poolVisibleColumns.play !== false && (
                                        <th className="py-2.5 px-2 w-10 text-center">PLAY</th>
                                    )}
                                    {poolVisibleColumns.title !== false && (
                                        <th onClick={() => handleSortSp('title')} className="py-2.5 px-3 min-w-[260px] cursor-pointer hover:text-white transition-colors">{t('th_title') || 'TÍTULO'} / {t('th_album') || 'ÁLBUM'} {renderSortArrowSp('title')}</th>
                                    )}
                                    {poolVisibleColumns.match_score !== false && (
                                        <th onClick={() => handleSortSp('match_score')} className="py-2.5 px-2.5 text-center min-w-[105px] cursor-pointer hover:text-white transition-colors" title="Ordenar por porcentaje de coincidencia acústica (Match %)"><Icons.Target size={14} className="inline-block align-[-2px]" /> MATCH {renderSortArrowSp('match_score')}</th>
                                    )}
                                    {poolVisibleColumns.artist !== false && (
                                        <th onClick={() => handleSortSp('artist')} className="py-2.5 px-3 min-w-[150px] cursor-pointer hover:text-white transition-colors">{t('th_artist') || 'ARTISTA'} {renderSortArrowSp('artist')}</th>
                                    )}
                                    {poolVisibleColumns.genre !== false && (
                                        <th onClick={() => handleSortSp('genre')} className="py-2.5 px-2 text-center w-24 cursor-pointer hover:text-white transition-colors">{t('th_genre') || 'GÉNERO'} {renderSortArrowSp('genre')}</th>
                                    )}
                                    {poolVisibleColumns.subgenre !== false && (
                                        <th onClick={() => handleSortSp('subgenre')} className="py-2.5 px-2 text-center w-28 cursor-pointer hover:text-white transition-colors">{t('th_subgenre') || 'SUBGÉNERO'} {renderSortArrowSp('subgenre')}</th>
                                    )}
                                    {poolVisibleColumns.origin !== false && (
                                        <th onClick={() => handleSortSp('origin')} className="py-2.5 px-2.5 text-center min-w-[105px] cursor-pointer hover:text-white transition-colors">ORIGEN {renderSortArrowSp('origin')}</th>
                                    )}
                                    {poolVisibleColumns.pre_quality_tier !== false && (
                                        <th onClick={() => handleSortSp('pre_quality_tier')} className="py-2.5 px-3 text-center min-w-[170px] cursor-pointer hover:text-white transition-colors" title="Pre-Auditoría de calidad antes de descargar: determina si el release es Master 24-bit, Lossless 16-bit o Baja Calidad y aconseja si merece la pena"><Icons.Gem size={14} className="inline-block align-[-2px]" /> PRE-AUDITORÍA (VALOR) {renderSortArrowSp('pre_quality_tier')}</th>
                                    )}
                                    {poolVisibleColumns.format !== false && (
                                        <th onClick={() => handleSortSp('format')} className="py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors">{t('th_format') || 'FORMATO'} {renderSortArrowSp('format')}</th>
                                    )}
                                    {poolVisibleColumns.sample_rate_khz !== false && (
                                        <th onClick={() => handleSortSp('sample_rate_khz')} className="py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors">{t('th_khz') || 'KHZ'} {renderSortArrowSp('sample_rate_khz')}</th>
                                    )}
                                    {poolVisibleColumns.bitrate_kbps !== false && (
                                        <th onClick={() => handleSortSp('bitrate_kbps')} className="py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white transition-colors">{t('th_kbps') || 'KBPS'} {renderSortArrowSp('bitrate_kbps')}</th>
                                    )}
                                    {poolVisibleColumns.calidad !== false && (
                                        <th onClick={() => handleSortSp('calidad')} className="py-2.5 px-2 text-center w-24 cursor-pointer hover:text-white transition-colors">{t('th_quality') || 'CALIDAD'} {renderSortArrowSp('calidad')}</th>
                                    )}
                                    {poolVisibleColumns.cutoff_khz !== false && (
                                        <th onClick={() => handleSortSp('cutoff_khz')} className="py-2.5 px-3 text-center min-w-[170px] cursor-pointer hover:text-white transition-colors">{t('th_loss') || 'PÉRDIDA / CORTE'} {renderSortArrowSp('cutoff_khz')}</th>
                                    )}
                                    {poolVisibleColumns.duration !== false && (
                                        <th onClick={() => handleSortSp('duration')} className="py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors">{t('th_duration') || 'DURACIÓN'} {renderSortArrowSp('duration')}</th>
                                    )}
                                    {poolVisibleColumns.bpm !== false && (
                                        <th onClick={() => handleSortSp('bpm')} className="py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors">BPM {renderSortArrowSp('bpm')}</th>
                                    )}
                                    {poolVisibleColumns.key !== false && (
                                        <th onClick={() => handleSortSp('key')} className="py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors">KEY {renderSortArrowSp('key')}</th>
                                    )}
                                    {poolVisibleColumns.energy !== false && (
                                        <th onClick={() => handleSortSp('energy')} className="py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white transition-colors"><Icons.Zap size={14} className="inline-block align-[-2px]" /> ENERGÍA {renderSortArrowSp('energy')}</th>
                                    )}
                                    {poolVisibleColumns.danceability !== false && (
                                        <th onClick={() => handleSortSp('danceability')} className="py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white transition-colors"><Icons.Activity size={14} className="inline-block align-[-2px]" /> DANCE {renderSortArrowSp('danceability')}</th>
                                    )}
                                    {poolVisibleColumns.intensity !== false && (
                                        <th onClick={() => handleSortSp('intensity')} className="py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white transition-colors text-emerald-400" title="Intensidad y excitación acústica (Arousal)">
                                            🔥 INTENSIDAD {renderSortArrowSp('intensity')}
                                        </th>
                                    )}
                                    {poolVisibleColumns.valence !== false && (
                                        <th onClick={() => handleSortSp('valence')} className="py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white transition-colors text-cyan-400" title="Positividad emocional (Valence)">
                                            ✨ POSITIVIDAD {renderSortArrowSp('valence')}
                                        </th>
                                    )}
                                    {poolVisibleColumns.status !== false && (
                                        <th onClick={() => handleSortSp('status')} className="py-2.5 px-3 text-center min-w-[140px] cursor-pointer hover:text-white transition-colors">{t('th_status') || 'ESTADO'} / {t('download_btn') || 'ACCIÓN'} {renderSortArrowSp('status')}</th>
                                    )}
                                </tr>
                                <tr className="bg-[#07070a] border-b border-djzinc-800 text-[10px] lowercase font-sans">
                                    {poolVisibleColumns.select !== false && (
                                        <th className="p-1 text-center font-mono text-[9px] text-gray-500">
                                            {hasActivePoolFilters ? (
                                                <button 
                                                    onClick={handleClearAllPoolFilters}
                                                    title="Limpiar todos los filtros de Pool"
                                                    className="text-amber-400 hover:text-white cursor-pointer font-bold px-1 py-0.5 rounded bg-amber-950/40 border border-amber-700/60"
                                                ><Icons.Close size={14} className="inline-block align-[-2px]" /> Reset</button>
                                            ) : 'filtro'}
                                        </th>
                                    )}
                                    {poolVisibleColumns.play !== false && (
                                        <th className="p-1 text-center font-mono text-[9px] text-gray-600"><Icons.Play size={14} className="inline-block align-[-2px]" /></th>
                                    )}
                                    {poolVisibleColumns.title !== false && (
                                        <th className="p-1">
                                            <input 
                                                type="text" 
                                                value={spFilterSearch} 
                                                onChange={(e) => setSpFilterSearch(e.target.value)} 
                                                placeholder="Filtrar por título o álbum..." 
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1.5 py-0.5 text-[11px] text-gray-200 outline-none focus:border-djcyan-400 font-sans"
                                            />
                                        </th>
                                    )}
                                    {poolVisibleColumns.match_score !== false && (
                                        <th className="p-1 text-center">
                                            <select 
                                                value={spFilterMatch} 
                                                onChange={(e) => setSpFilterMatch(e.target.value)}
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                                title="Filtrar por coincidencia Match"
                                            >
                                                <option value="ALL">Todos Match</option>
                                                <option value="VERIFIED">🎯 ≥80%</option>
                                                <option value="DOUBTFUL">⚠️ &lt;80%</option>
                                                <option value="CRITICAL">🚨 &lt;50%</option>
                                            </select>
                                        </th>
                                    )}
                                    {poolVisibleColumns.artist !== false && (
                                        <th className="p-1">
                                            <input 
                                                type="text" 
                                                value={spFilterArtist} 
                                                onChange={(e) => setSpFilterArtist(e.target.value)} 
                                                placeholder="Artista..." 
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1.5 py-0.5 text-[11px] text-gray-200 outline-none focus:border-djcyan-400 font-sans"
                                            />
                                        </th>
                                    )}
                                    {poolVisibleColumns.genre !== false && (
                                        <th className="p-1 text-center">
                                            <select 
                                                value={spFilterGenre} 
                                                onChange={(e) => setSpFilterGenre(e.target.value)}
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                            >
                                                <option value="ALL">Todos Géneros</option>
                                                {poolUniqueGenres.map(g => (
                                                    <option key={g} value={g}>{g}</option>
                                                ))}
                                            </select>
                                        </th>
                                    )}
                                    {poolVisibleColumns.subgenre !== false && (
                                        <th className="p-1">
                                            <input 
                                                type="text" 
                                                value={spFilterSubgenre} 
                                                onChange={(e) => setSpFilterSubgenre(e.target.value)} 
                                                placeholder="Subgénero..." 
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                            />
                                        </th>
                                    )}
                                    {poolVisibleColumns.origin !== false && (
                                        <th className="p-1 text-center">
                                            <select 
                                                value={spFilterOrigin} 
                                                onChange={(e) => setSpFilterOrigin(e.target.value)}
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                            >
                                                <option value="ALL">Todos Origen</option>
                                                <option value="spotify">🔍 Búsqueda</option>
                                                <option value="audit_upgrade">🔄 Reemplazo HD</option>
                                                <option value="taxonomy">🏷️ Taxonomía</option>
                                                <option value="shazam">⚡ Radar</option>
                                            </select>
                                        </th>
                                    )}
                                    {poolVisibleColumns.pre_quality_tier !== false && (
                                        <th className="p-1 text-center">
                                            <select 
                                                value={spFilterPreQuality} 
                                                onChange={(e) => setSpFilterPreQuality(e.target.value)}
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                                title="Filtrar por pre-calificación de valor acústico"
                                            >
                                                <option value="ALL">Todas</option>
                                                <option value="RECOMMENDED">⭐ Recomendadas</option>
                                                <option value="HI_RES">💎 24b Hi-Res</option>
                                                <option value="LOSSLESS">💽 Lossless (16/24b)</option>
                                            </select>
                                        </th>
                                    )}
                                    {poolVisibleColumns.format !== false && (
                                        <th className="p-1 text-center">
                                            <select 
                                                value={spFilterFormat} 
                                                onChange={(e) => setSpFilterFormat(e.target.value)}
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                            >
                                                <option value="ALL">Todos</option>
                                                <option value="FLAC">FLAC</option>
                                                <option value="WAV">WAV</option>
                                                <option value="AIFF">AIFF</option>
                                                <option value="MP3">MP3</option>
                                            </select>
                                        </th>
                                    )}
                                    {poolVisibleColumns.sample_rate_khz !== false && (
                                        <th className="p-1 text-center">
                                            <select 
                                                value={spFilterKhz} 
                                                onChange={(e) => setSpFilterKhz(e.target.value)}
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                            >
                                                <option value="ALL">kHz...</option>
                                                <option value="44">44.1 kHz</option>
                                                <option value="48">48 kHz</option>
                                                <option value="88">88.2 kHz</option>
                                                <option value="96">96 kHz</option>
                                            </select>
                                        </th>
                                    )}
                                    {poolVisibleColumns.bitrate_kbps !== false && (
                                        <th className="p-1 text-center">
                                            <select 
                                                value={spFilterKbps} 
                                                onChange={(e) => setSpFilterKbps(e.target.value)}
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                            >
                                                <option value="ALL">kbps...</option>
                                                <option value="LOSSLESS">Lossless</option>
                                                <option value="320">320k</option>
                                            </select>
                                        </th>
                                    )}
                                    {poolVisibleColumns.calidad !== false && (
                                        <th className="p-1 text-center">
                                            <select 
                                                value={spFilterQuality} 
                                                onChange={(e) => setSpFilterQuality(e.target.value)}
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                            >
                                                <option value="ALL">Todas</option>
                                                <option value="Alta">Alta</option>
                                                <option value="Media">Media</option>
                                                <option value="Baja">Baja</option>
                                            </select>
                                        </th>
                                    )}
                                    {poolVisibleColumns.cutoff_khz !== false && (
                                        <th className="p-1 text-center">
                                            <select 
                                                value={spFilterCutoff} 
                                                onChange={(e) => setSpFilterCutoff(e.target.value)}
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                            >
                                                <option value="ALL">Corte...</option>
                                                <option value="HIGH">&gt;20 kHz</option>
                                                <option value="MED">18-20 kHz</option>
                                                <option value="LOW">&lt;18 kHz</option>
                                            </select>
                                        </th>
                                    )}
                                    {poolVisibleColumns.duration !== false && (
                                        <th className="p-1">
                                            <input 
                                                type="text" 
                                                value={spFilterDuration} 
                                                onChange={(e) => setSpFilterDuration(e.target.value)} 
                                                placeholder="Tiempo..." 
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                            />
                                        </th>
                                    )}
                                    {poolVisibleColumns.bpm !== false && (
                                        <th className="p-1">
                                            <input 
                                                type="text" 
                                                value={spFilterBpm} 
                                                onChange={(e) => setSpFilterBpm(e.target.value)} 
                                                placeholder="BPM..." 
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                            />
                                        </th>
                                    )}
                                    {poolVisibleColumns.key !== false && (
                                        <th className="p-1">
                                            <input 
                                                type="text" 
                                                value={spFilterKey} 
                                                onChange={(e) => setSpFilterKey(e.target.value)} 
                                                placeholder="Key (8A)..." 
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                            />
                                        </th>
                                    )}
                                    {poolVisibleColumns.energy !== false && (
                                        <th className="p-1 text-center">
                                            <select 
                                                value={spFilterEnergy} 
                                                onChange={(e) => setSpFilterEnergy(e.target.value)}
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                            >
                                                <option value="ALL">Todas</option>
                                                <option value="HIGH">&gt;80%</option>
                                                <option value="MED">65-80%</option>
                                                <option value="LOW">&lt;65%</option>
                                            </select>
                                        </th>
                                    )}
                                    {poolVisibleColumns.danceability !== false && (
                                        <th className="p-1 text-center">
                                            <select 
                                                value={spFilterDance} 
                                                onChange={(e) => setSpFilterDance(e.target.value)}
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                            >
                                                <option value="ALL">Todas</option>
                                                <option value="HIGH">&gt;80%</option>
                                                <option value="MED">65-80%</option>
                                                <option value="LOW">&lt;65%</option>
                                            </select>
                                        </th>
                                    )}
                                    {poolVisibleColumns.intensity !== false && (
                                        <th className="p-1 text-center font-mono text-[10px] text-emerald-400 font-bold" title="Filtro Intensidad">🔥</th>
                                    )}
                                    {poolVisibleColumns.valence !== false && (
                                        <th className="p-1 text-center font-mono text-[10px] text-cyan-400 font-bold" title="Filtro Positividad">✨</th>
                                    )}
                                    {poolVisibleColumns.status !== false && (
                                        <th className="p-1 text-center">
                                            <select 
                                                value={spFilterStatus} 
                                                onChange={(e) => setSpFilterStatus(e.target.value)}
                                                className="w-full bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                            >
                                                <option value="ALL">Todos</option>
                                                <option value="DOWNLOADED">Descargado</option>
                                                <option value="PENDING">Pendiente</option>
                                                <option value="LOSSLESS">Lossless</option>
                                                <option value="FAKE">FLAC Fake</option>
                                            </select>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-djzinc-850/60 font-sans">
                                {tracksFiltradosSp.length === 0 && (
                                    <tr>
                                        <td colSpan={Object.values(poolVisibleColumns).filter(Boolean).length || 20} className="py-12 text-center text-gray-500 font-mono text-xs whitespace-normal">
                                            No hay pistas que coincidan con los filtros aplicados en el Record Pool.
                                        </td>
                                    </tr>
                                )}
                            {tracksFiltradosSp.map((row) => {
                                const isSelectedRow = row.id === selectedId;
                                const isRowPlaying = nowPlayingTrack && String(nowPlayingTrack.id) === String(row.id) && isPlaying;
                                const isFake = Boolean(row.es_fake || String(row.status || '').includes('Fake'));
                                const isTaxonomy = row.origin === 'taxonomy';
                                const isAuditUpgrade = row.origin === 'audit_upgrade';
                                const isPendingTaxonomy = isTaxonomy && !row.downloaded;

                                return (
                                    <tr 
                                        key={row.id} 
                                        onClick={() => { setSelectedId(row.id); setSpInspectorOpen(true); }} 
                                        className={`cursor-pointer select-none transition-colors ${
                                            isSelectedRow 
                                                ? (isAuditUpgrade ? 'bg-amber-950/50 border-l-2 border-amber-400' : isTaxonomy ? 'bg-emerald-950/50 border-l-2 border-emerald-400' : 'bg-djcyan-950/35 border-l-2 border-djcyan-400') 
                                                : (isAuditUpgrade ? 'bg-amber-950/20 border-l-2 border-amber-500/60 hover:bg-amber-950/40' : isTaxonomy ? 'bg-emerald-950/20 border-l-2 border-emerald-500/60 hover:bg-emerald-950/40' : 'hover:bg-[#101015]')
                                        }`}
                                    >
                                        {poolVisibleColumns.select !== false && (
                                            <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={row.selected} onChange={() => handleToggleRow(row.id)} className="accent-djcyan-500 cursor-pointer" /></td>
                                        )}
                                        {poolVisibleColumns.play !== false && (
                                            <td className="py-2 px-2 text-center" onClick={(e) => handlePlayPreview(row, e)}>
                                                <button className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isRowPlaying ? 'bg-djcyan-500 text-black font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-[#181820] text-gray-400 hover:text-white hover:bg-djzinc-800'}`}>
                                                    {isRowPlaying ? '❚❚' : '▶'}
                                                </button>
                                            </td>
                                        )}
                                        {poolVisibleColumns.title !== false && (
                                            <td className="py-2 px-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={getValidCover(row.cover)} alt="Cover" onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} className="w-9 h-9 rounded object-cover border border-djzinc-700 shrink-0 shadow-sm" />
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            {isAuditUpgrade && (
                                                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" title="Pista de reemplazo HD para audio de baja calidad"></span>
                                                            )}
                                                            {isTaxonomy && (
                                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Pista importada desde Taxonomía"></span>
                                                            )}
                                                            <span className={`text-xs truncate max-w-sm ${isAuditUpgrade ? 'font-bold text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]' : isTaxonomy ? 'font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]' : 'font-semibold text-djcyan-400'}`} title={row.title}>
                                                                {row.title}
                                                            </span>
                                                            {isAuditUpgrade && (
                                                                <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-900/90 text-amber-200 border border-amber-600/80 shrink-0">
                                                                    REEMPLAZO HD
                                                                </span>
                                                            )}
                                                            {isTaxonomy && (
                                                                <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-600/70 shrink-0">
                                                                    TAXONOMÍA
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 font-mono truncate max-w-sm" title={row.album}>{row.album}</span>
                                                        {row.reemplazo_de && (
                                                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                                                <span className="text-[9px] text-amber-400/90 font-mono truncate max-w-[200px] flex items-center gap-1" title={row.reemplazo_de}>
                                                                    <span>Sustituye a:</span> <span className="underline decoration-amber-500/50">{row.reemplazo_de}</span>
                                                                </span>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handlePlayLocalTrack(row, e)}
                                                                        className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold flex items-center gap-0.5 cursor-pointer transition-colors ${
                                                                            isTrackLocalPlaying(row)
                                                                                ? 'bg-amber-400 text-black shadow-sm font-black'
                                                                                : 'bg-djzinc-800 hover:bg-amber-950/80 text-amber-300 border border-amber-700/50'
                                                                        }`}
                                                                        title="Escuchar audio de tu pista local en disco"
                                                                    >
                                                                        <span>{isTrackLocalPlaying(row) ? '⏸️' : '🎧'}</span>
                                                                        <span>Local</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handlePlayPreview(row, e)}
                                                                        className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold flex items-center gap-0.5 cursor-pointer transition-colors ${
                                                                            (nowPlayingTrack && (String(nowPlayingTrack.id) === String(row.id) || nowPlayingTrack.title === row.title) && isPlaying)
                                                                                ? 'bg-djcyan-400 text-black shadow-sm font-black'
                                                                                : 'bg-djzinc-800 hover:bg-djcyan-950/80 text-djcyan-300 border border-djcyan-700/50'
                                                                        }`}
                                                                        title="Escuchar audio oficial a descargar"
                                                                    >
                                                                        <span>{(nowPlayingTrack && (String(nowPlayingTrack.id) === String(row.id) || nowPlayingTrack.title === row.title) && isPlaying) ? '⏸️' : '☁️'}</span>
                                                                        <span>Catálogo</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {row.match_score !== undefined && (
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                {row.match_score >= 80 ? (
                                                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-600/70 inline-flex items-center gap-1 shadow-sm">
                                                                        <Icons.Target size={14} className="inline-block align-[-2px]" /> <span>{row.match_score}% Match Verificado</span>
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); handleAbrirVerificacionCandidatos(row); }}
                                                                        className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/80 hover:bg-amber-900 inline-flex items-center gap-1 cursor-pointer shadow animate-pulse"
                                                                        title={row.match_recomendacion || "Coincidencia dudosa. Clic para cambiar versión o buscar manualmente"}
                                                                    >
                                                                        <Icons.Warning size={14} className="inline-block align-[-2px]" /> <span>{row.match_score}% Match Dudoso • Cambiar</span>
                                                                    </button>
                                                                )}
                                                                {row.candidatos_alternativos && row.candidatos_alternativos.length > 0 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); handleAbrirVerificacionCandidatos(row); }}
                                                                        className="text-[9px] font-mono text-gray-400 hover:text-white underline cursor-pointer"
                                                                        title="Ver otras versiones encontradas en el Catálogo Oficial"
                                                                    >
                                                                        ({row.candidatos_alternativos.length} opciones)
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* MATCH % */}
                                        {poolVisibleColumns.match_score !== false && (
                                            <td className="py-2 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                {row.match_score !== undefined ? (
                                                    row.match_score >= 80 ? (
                                                        <span 
                                                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/80 shadow-[0_0_8px_rgba(16,185,129,0.3)] inline-flex items-center gap-1 cursor-pointer hover:border-emerald-400 transition-colors"
                                                            onClick={() => handleAbrirVerificacionCandidatos(row)}
                                                            title={`Coincidencia alta (${row.match_score}%). Clic para abrir verificador de fidelidad.`}
                                                        >
                                                            <Icons.Target size={14} className="inline-block align-[-2px]" />
                                                            <span>{row.match_score}%</span>
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAbrirVerificacionCandidatos(row)}
                                                            className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-amber-950 text-amber-300 border border-amber-600 hover:bg-amber-900 inline-flex items-center gap-1 cursor-pointer shadow animate-pulse"
                                                            title={row.match_recomendacion || "Coincidencia dudosa (<80%). Clic para cambiar versión o buscar manualmente."}
                                                        >
                                                            <Icons.Warning size={14} className="inline-block align-[-2px]" />
                                                            <span>{row.match_score}%</span>
                                                            <span className="text-[8px] underline">Cambiar</span>
                                                        </button>
                                                    )
                                                ) : (
                                                    <span className="text-[10px] text-gray-500 font-mono">100%</span>
                                                )}
                                            </td>
                                        )}

                                        {poolVisibleColumns.artist !== false && (
                                            <td className="py-2 px-3 text-gray-300 text-xs truncate max-w-xs">{row.artist}</td>
                                        )}

                                        {/* GÉNERO */}
                                        {poolVisibleColumns.genre !== false && (
                                            <td className="py-2 px-2 text-center">
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/70 text-purple-300 border border-purple-800/60 truncate max-w-[95px] inline-block shadow-sm" title={row.genre || 'House'}>
                                                    {row.genre || 'House'}
                                                </span>
                                            </td>
                                        )}

                                        {/* SUBGÉNERO */}
                                        {poolVisibleColumns.subgenre !== false && (
                                            <td className="py-2 px-2 text-center">
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-djzinc-850 text-gray-300 border border-djzinc-750 truncate max-w-[110px] inline-block" title={(!row.subgenre || ['Pop', 'Electronic', 'Dance', 'Club', 'Other'].includes(row.subgenre)) ? (row.genre || 'Tech House') : row.subgenre}>
                                                    {(!row.subgenre || ['Pop', 'Electronic', 'Dance', 'Club', 'Other'].includes(row.subgenre)) ? (row.genre || 'Tech House') : row.subgenre}
                                                </span>
                                            </td>
                                        )}

                                        {/* ORIGEN: SPOTIFY -> BÚSQUEDA */}
                                        {poolVisibleColumns.origin !== false && (
                                            <td className="py-2 px-2.5 text-center">
                                                {row.origin === 'audit_upgrade' ? (
                                                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600/80 shadow-[0_0_8px_rgba(245,158,11,0.35)] inline-flex items-center gap-1">
                                                        <Icons.Refresh size={14} className="inline-block align-[-2px]" />
                                                        <span>Reemplazo HD</span>
                                                    </span>
                                                ) : row.origin === 'taxonomy' ? (
                                                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/80 shadow-[0_0_8px_rgba(16,185,129,0.35)] inline-flex items-center gap-1">
                                                        <Icons.Tag size={14} className="inline-block align-[-2px]" />
                                                        <span>Taxonomía</span>
                                                    </span>
                                                ) : row.origin === 'shazam' ? (
                                                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-blue-950 text-cyan-400 border border-blue-600 inline-flex items-center gap-1">
                                                        <Icons.Zap size={14} className="inline-block align-[-2px]" />
                                                        <span>Radar</span>
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-djzinc-850 text-djcyan-300 border border-djzinc-750 inline-flex items-center gap-1">
                                                        <Icons.Search size={14} className="inline-block align-[-2px]" />
                                                        <span>Búsqueda</span>
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        
                                        {/* PRE-AUDITORÍA Y DICTAMEN DE DESCARGA */}
                                        {poolVisibleColumns.pre_quality_tier !== false && (
                                            <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex flex-col items-center justify-center gap-1 max-w-[170px] mx-auto" title={row.pre_detail || 'Diagnóstico preventivo de calidad acústica'}>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border inline-flex items-center gap-1 shadow-sm ${
                                                        (row.pre_quality_tier === 'HI_RES_24B' || (!row.pre_quality_tier && String(row.title || '').toLowerCase().includes('extended')))
                                                            ? 'bg-djcyan-950 text-djcyan-300 border-djcyan-500/70 shadow-[0_0_8px_rgba(6,182,212,0.35)]'
                                                            : (row.pre_quality_tier === 'LOW_RES' || row.pre_worth_it === false)
                                                                ? 'bg-red-950/70 text-red-300 border-red-800'
                                                                : 'bg-emerald-950/70 text-emerald-300 border-emerald-600/70'
                                                    }`}>
                                                        <span>{row.pre_badge || (String(row.title || '').toLowerCase().includes('extended') ? '💎 Hi-Res 24b' : '💽 Lossless 16b')}</span>
                                                    </span>
                                                    <span className={`text-[9.5px] font-mono font-bold flex items-center gap-1 ${
                                                        row.pre_worth_it === false ? 'text-amber-400' : 'text-emerald-400'
                                                    }`}>
                                                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: row.pre_worth_it === false ? '#f59e0b' : '#10b981' }}></span>
                                                        <span>{row.pre_verdict_short || (row.pre_worth_it === false ? 'No vale la pena' : '¡Vale la pena!')}</span>
                                                    </span>
                                                </div>
                                            </td>
                                        )}

                                        {/* FORMATO */}
                                        {poolVisibleColumns.format !== false && (
                                            <td className="py-2 px-2 text-center">
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-djzinc-850 text-djcyan-400 border border-djzinc-750">
                                                    {row.format || (selectedFormat || 'flac').toUpperCase()}
                                                </span>
                                            </td>
                                        )}

                                        {/* KHZ */}
                                        {poolVisibleColumns.sample_rate_khz !== false && (
                                            <td className="py-2 px-2 text-center font-mono text-[10px] text-gray-300">
                                                {row.sample_rate_khz ? `${row.sample_rate_khz} kHz` : (row.downloaded ? '44.1 kHz' : '--')}
                                            </td>
                                        )}

                                        {/* KBPS */}
                                        {poolVisibleColumns.bitrate_kbps !== false && (
                                            <td className="py-2 px-2 text-center font-mono text-[10px] text-gray-300">
                                                {row.bitrate_kbps ? `${row.bitrate_kbps} kbps` : (row.downloaded ? (selectedFormat === 'mp3' ? '320 kbps' : '1062 kbps') : '--')}
                                            </td>
                                        )}

                                        {/* CALIDAD */}
                                        {poolVisibleColumns.calidad !== false && (
                                            <td className="py-2 px-2 text-center">
                                                {row.downloaded ? (
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                                                        isFake ? 'bg-red-950 text-red-400 border-red-800' :
                                                        (String(row.calidad || '').includes('Alta') || String(row.calidad || '').includes('Hi-Res')) ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' :
                                                        String(row.calidad || '').includes('Media') ? 'bg-amber-950/80 text-amber-400 border-amber-800' :
                                                        'bg-red-950/80 text-red-400 border-red-800'
                                                    }`}>
                                                        {row.calidad || (isFake ? 'Baja' : 'Alta')}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-mono text-gray-500">Pendiente</span>
                                                )}
                                            </td>
                                        )}

                                        {/* PÉRDIDA / CORTE */}
                                        {poolVisibleColumns.cutoff_khz !== false && (
                                            <td className="py-2 px-3 text-center">
                                                {row.downloaded ? (
                                                    isFake ? (
                                                        <span className="text-[10px] font-mono text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800" title={`Corte espectral a ${row.cutoff_khz || '--'}kHz`}>
                                                            <Icons.Warning size={14} className="inline-block align-[-2px]" /> Transcode ({row.perdida_pct || 0}%)
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/60" title={`Corte a ${row.cutoff_khz || 22.05}kHz`}>
                                                            {row.perdida === 'Sin Pérdida' ? 'Sin Pérdida' : (row.perdida || 'Sin Pérdida')}
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-[10px] font-mono text-gray-500">--</span>
                                                )}
                                            </td>
                                        )}

                                        {poolVisibleColumns.duration !== false && (
                                            <td className="py-2 px-2 text-center font-mono text-gray-400 text-xs">{row.duration}</td>
                                        )}
                                        {poolVisibleColumns.bpm !== false && (
                                            <td className="py-2 px-2 text-center"><span className="bg-[#14141c] text-gray-200 px-1.5 py-0.5 rounded text-[11px] font-mono border border-djzinc-800">{row.bpm}</span></td>
                                        )}
                                        {poolVisibleColumns.key !== false && (
                                            <td className="py-2 px-2 text-center"><span className="text-djcyan-400 font-mono font-bold text-xs">{row.key}</span></td>
                                        )}

                                        {/* ENERGÍA */}
                                        {poolVisibleColumns.energy !== false && (
                                            <td className="py-2 px-2 text-center">
                                                <div className="flex flex-col items-center justify-center gap-0.5 w-16 mx-auto">
                                                    <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                        <Icons.Zap size={14} className="inline-block align-[-2px] text-gray-400" />
                                                        <span className={`font-bold ${(row.energy || row.e || 75) >= 82 ? 'text-red-400' : (row.energy || row.e || 75) >= 68 ? 'text-amber-400' : 'text-djcyan-400'}`}>
                                                            {row.energy || row.e || 75}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750">
                                                        <div 
                                                            className={`h-full rounded-full ${(row.energy || row.e || 75) >= 82 ? 'bg-gradient-to-r from-amber-500 to-red-500' : (row.energy || row.e || 75) >= 68 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`} 
                                                            style={{ width: `${Math.min(100, Math.max(10, row.energy || row.e || 75))}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* DANCEABILITY */}
                                        {poolVisibleColumns.danceability !== false && (
                                            <td className="py-2 px-2 text-center">
                                                <div className="flex flex-col items-center justify-center gap-0.5 w-16 mx-auto">
                                                    <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                        <Icons.Activity size={14} className="inline-block align-[-2px] text-gray-400" />
                                                        <span className="font-bold text-purple-300">{row.danceability || row.dance || 82}%</span>
                                                    </div>
                                                    <div className="w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750">
                                                        <div 
                                                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" 
                                                            style={{ width: `${Math.min(100, Math.max(10, row.danceability || row.dance || 82))}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* INTENSIDAD */}
                                        {poolVisibleColumns.intensity !== false && (
                                            <td className="py-2 px-2 text-center">
                                                <div className="flex flex-col items-center justify-center gap-0.5 w-16 mx-auto">
                                                    <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                        <span className="text-[10px]">🔥</span>
                                                        <span className="font-bold text-emerald-400">{row.arousal || row.intensity || Math.round((row.energy || row.e || 75) * 0.95)}%</span>
                                                    </div>
                                                    <div className="w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750">
                                                        <div 
                                                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" 
                                                            style={{ width: `${Math.min(100, Math.max(10, row.arousal || row.intensity || Math.round((row.energy || row.e || 75) * 0.95)))}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* POSITIVIDAD */}
                                        {poolVisibleColumns.valence !== false && (
                                            <td className="py-2 px-2 text-center">
                                                <div className="flex flex-col items-center justify-center gap-0.5 w-16 mx-auto">
                                                    <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                        <span className="text-[10px]">✨</span>
                                                        <span className="font-bold text-cyan-300">{row.valence != null ? row.valence : (row.key && row.key.includes('B') ? 65 : 45)}%</span>
                                                    </div>
                                                    <div className="w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750">
                                                        <div 
                                                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]" 
                                                            style={{ width: `${Math.min(100, Math.max(10, row.valence != null ? row.valence : (row.key && row.key.includes('B') ? 65 : 45)))}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* ESTADO / ACCIÓN */}
                                        {poolVisibleColumns.status !== false && (
                                            <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {row.downloaded ? (
                                                        isFake ? (
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-red-950 text-red-400 border border-red-700 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" title="¡Alerta! Falso FLAC con corte lossy previo">
                                                                FLAC FAKE
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 shadow" title={`Corte detectado: ${row.cutoff_khz || 22.05}kHz`}>
                                                                {row.status || 'FLAC VERDADERO'}
                                                            </span>
                                                        )
                                                    ) : row.download_error ? (
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800" title={row.download_error}>
                                                                <Icons.Warning size={14} className="inline-block align-[-2px]" /> Error
                                                            </span>
                                                            <button 
                                                                onClick={() => lanzarDescargaReal([row])} 
                                                                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black cursor-pointer shadow"
                                                                title="Reintentar descarga de esta pista"
                                                            >
                                                                Reintentar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAbrirVerificacionCandidatos(row)}
                                                                className="px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-400 hover:text-white bg-djzinc-850 hover:bg-djzinc-800 border border-djzinc-750 cursor-pointer"
                                                                title="Buscar versión alternativa"
                                                            >
                                                                <Icons.Search size={14} className="inline-block align-[-2px]" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <button 
                                                                onClick={() => lanzarDescargaReal([row])} 
                                                                className={`px-3 py-1 rounded text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
                                                                    isPendingTaxonomy 
                                                                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                                                                        : 'bg-[#14141c] hover:bg-djcyan-600 hover:text-black text-gray-300 border-djzinc-750'
                                                                }`}
                                                            >
                                                                {`${t('download_btn') || 'Descargar'} .${selectedFormat}`}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAbrirVerificacionCandidatos(row)}
                                                                className="px-2 py-1 rounded text-[10px] font-mono font-bold text-gray-400 hover:text-djcyan-300 bg-djzinc-850 hover:bg-djzinc-800 border border-djzinc-750 cursor-pointer transition-colors"
                                                                title="Verificar candidatos o buscar versión alternativa manualmente"
                                                            >
                                                                <Icons.Search size={14} className="inline-block align-[-2px]" /> Versiones
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                )
                )}
            </div>

            {spInspectorOpen && currentTrack && (
                <>
                    <div 
                        onClick={() => setSpInspectorOpen(false)} 
                        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-fadeIn" 
                        style={{ zIndex: 99998 }}
                        aria-hidden="true" 
                    />
                    <aside 
                        key={currentTrack ? currentTrack.id : "sp_none"} 
                        style={{ width: '100%', maxWidth: `${spInspectorWidth}px`, zIndex: 99999 }}
                        className="fixed top-0 bottom-0 right-0 h-full bg-[#0a0b14] border-l-4 border-l-amber-400 shadow-[-25px_0_60px_rgba(0,0,0,1)] flex flex-col font-sans text-gray-200 animate-slideInRight"
                    >
                    {/* Manija táctil de redimensión (Drag to Resize) para Desktop */}
                    <div 
                        onPointerDown={onSpResizeDown}
                        onDoubleClick={onSpResetWidth}
                        className="hidden md:flex absolute top-0 bottom-0 -left-2 w-4 cursor-ew-resize items-center justify-center z-50 group select-none hover:bg-amber-500/10 transition-colors"
                        title="Arrastra para redimensionar el inspector (Doble clic para restablecer a 500px)"
                    >
                        <div className="w-1 h-12 rounded-full bg-zinc-600 group-hover:bg-amber-400 group-hover:scale-y-125 transition-all shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                    </div>
                    <div className="px-5 py-3.5 border-b border-djzinc-800 bg-[#0d0e1c] flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black text-lg shadow-[0_0_15px_rgba(245,158,11,0.4)] shrink-0 font-black">
                                <Icons.Spotify size={16} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xs sm:text-sm font-mono font-black uppercase text-white tracking-wider">
                                        RECORD POOL INSPECTOR
                                    </h3>
                                    <span className="text-[9.5px] bg-amber-950/90 text-amber-300 border border-amber-500/60 px-2 py-0.5 rounded-full font-mono font-black">
                                        ID #{currentTrack.id || '--'}
                                    </span>
                                </div>
                                <p className="text-[10.5px] text-gray-400 font-mono truncate max-w-[280px] sm:max-w-[400px]">
                                    INSPECCIÓN DE PISTA & DESCARGA FLAC
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button 
                                onClick={() => setSpInspectorOpen(false)}
                                title="Cerrar inspector"
                                className="h-8 px-2.5 sm:px-2 rounded-xl bg-[#14162a] hover:bg-amber-950/60 text-gray-300 hover:text-amber-300 flex items-center justify-center gap-1.5 border border-djzinc-700 hover:border-amber-400/80 transition-colors cursor-pointer text-xs font-mono font-bold"
                            >
                                <Icons.Close size={15} />
                                <span className="sm:hidden font-mono text-[11px]">Cerrar</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="w-full aspect-video bg-[#050508] rounded-lg border border-djzinc-800 overflow-hidden relative shadow-inner flex items-center justify-center">
                            <img src={getValidCover(currentTrack.cover)} alt="Cover" onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} className="w-full h-full object-cover" />
                            <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-gray-300 font-mono border border-djzinc-700">HD Cover 640px</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <h4 className="font-bold text-sm text-djcyan-400 truncate" title={currentTrack.title}>{currentTrack.title || 'Selecciona una pista'}</h4>
                                <p className="text-xs text-gray-400 truncate">{currentTrack.artist || '--'}</p>
                            </div>
                            <button onClick={(e) => handlePlayPreview(currentTrack, e)} className="px-3 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-[10px] rounded shadow cursor-pointer shrink-0">
                                {nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack.id) || nowPlayingTrack.title === currentTrack.title) && isPlaying ? '❚❚ PAUSE' : '▶ PRE-ESCUCHA'}
                            </button>
                        </div>

                        {/* Waveform Rekordbox Estructural en Spotify Ingest */}
                        <CopilotSeratoWaveform track={currentTrack} duration={currentTrack.duration || "03:30"} onSeekTrack={(trk, pct) => handlePlayPreview(trk, null, pct)} />

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <div className="bg-[#050508] p-2.5 rounded border border-djzinc-800">
                                <span className="text-[10px] text-gray-500 block uppercase">Tempo</span>
                                <span className="text-white font-bold">{currentTrack.bpm ? `${currentTrack.bpm} BPM` : '--'}</span>
                            </div>
                            <div className="bg-[#050508] p-2.5 rounded border border-djzinc-800">
                                <span className="text-[10px] text-gray-500 block uppercase">Clave Camelot</span>
                                <span className="text-djcyan-400 font-bold">{currentTrack.key || '--'}</span>
                            </div>
                        </div>

                        {/* Pre-Auditoría de Calidad y Dictamen de Descarga */}
                        <div className="bg-[#050508] p-3 rounded-xl border border-djzinc-800 space-y-2 text-xs">
                            <div className="flex items-center justify-between border-b border-djzinc-800/80 pb-1.5">
                                <span className="font-mono font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Icons.Gem size={14} className="inline-block align-[-2px]" /> Pre-Auditoría Acústica
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold border ${
                                    (currentTrack.pre_quality_tier === 'HI_RES_24B' || (!currentTrack.pre_quality_tier && String(currentTrack.title || '').toLowerCase().includes('extended')))
                                        ? 'bg-djcyan-950 text-djcyan-300 border-djcyan-500 shadow-[0_0_8px_rgba(6,182,212,0.35)]'
                                        : currentTrack.pre_worth_it === false
                                            ? 'bg-red-950/70 text-red-300 border-red-800'
                                            : 'bg-emerald-950/70 text-emerald-300 border-emerald-600/70'
                                }`}>
                                    {currentTrack.pre_badge || (String(currentTrack.title || '').toLowerCase().includes('extended') ? '💎 Hi-Res 24b' : '💽 Lossless 16b')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-mono">
                                <span className="text-gray-400">¿Vale la pena?:</span>
                                <span className={`font-bold flex items-center gap-1 ${currentTrack.pre_worth_it === false ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    <span>{currentTrack.pre_worth_it === false ? '🟡' : '🟢'}</span>
                                    <span>{currentTrack.pre_verdict || (currentTrack.pre_worth_it === false ? 'Calidad estándar' : '⭐ IMPRESCINDIBLE')}</span>
                                </span>
                            </div>
                            <div className="flex justify-between text-[11px] font-mono">
                                <span className="text-gray-400">Corte Previsto:</span>
                                <span className="text-djcyan-300 font-bold">{currentTrack.pre_cutoff_est || '> 24.0 kHz (FLAC)'}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed font-sans pt-1 border-t border-djzinc-850">
                                {currentTrack.pre_detail || 'Master de estudio oficial sin pérdidas destructivas. 100% apto para directo y sistemas de alta potencia.'}
                            </p>
                        </div>

                        <div className="bg-[#050508] p-3 rounded border border-djzinc-800 space-y-2 text-xs">
                            <div className="flex justify-between"><span className="text-gray-400">Álbum:</span><span className="text-gray-200 truncate max-w-[200px]">{currentTrack.album || '--'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">ISRC:</span><span className="font-mono text-gray-300">{currentTrack.isrc || 'Auto-Tag'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Formato Destino:</span><span className="font-mono text-djcyan-400 font-bold uppercase">.{selectedFormat} Lossless</span></div>
                        </div>
                    </div>
                    <div className="p-3 bg-djzinc-950 border-t border-djzinc-800 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSpInspectorOpen(false)}
                            className="px-3.5 py-2 rounded-xl bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 font-bold text-xs sm:hidden transition-colors cursor-pointer"
                        >
                            Cerrar
                        </button>
                        <button onClick={() => lanzarDescargaReal(selectedCount > 0 ? tracks.filter(t => t.selected) : [currentTrack])} className="flex-1 py-2 bg-djcyan-600 hover:bg-djcyan-500 text-black rounded font-bold text-xs shadow-md cursor-pointer transition-colors">
                            Descargar {selectedCount > 1 ? `(${selectedCount})` : 'Pista Actual'} .{selectedFormat.toUpperCase()}
                        </button>
                    </div>
                    </aside>
                </>
            )}

            {/* Modal Unificada de Exploración de Bibliotecas & Archivos */}
            <UnifiedLibraryBrowserModal
                isOpen={fsBrowserOpen}
                onClose={() => setFsBrowserOpen(false)}
                title="Record Pool • Carpeta de Destino & Biblioteca"
                initialPath={destDir}
                onSelectPath={(selectedPath) => handleSeleccionarCarpetaDestino(selectedPath)}
                customLibraries={customLibraries}
                activeCustomLibId={activeCustomLibId}
                onImportCollection={handleCargarColeccion}
            />

            {/* Modal de Verificación de Fidelidad y Selección de Versiones / Búsqueda Manual */}
            {candidateModal.open && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-djzinc-900 border border-djzinc-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
                        {/* Header */}
                        <div className="p-4 bg-djzinc-950/80 border-b border-djzinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-djcyan-500/20 to-emerald-500/20 border border-djcyan-500/40 flex items-center justify-center text-xl shadow-inner">
                                    <Icons.Target size={14} className="inline-block align-[-2px]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        Verificador de Fidelidad y Selector de Versión DJ
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-djcyan-950 text-djcyan-400 border border-djcyan-800">
                                            100% Precisión
                                        </span>
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        Compara el track de tu biblioteca con las versiones disponibles en streaming para evitar descargar Radio Edits o temas incorrectos.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCandidateModal(prev => ({ ...prev, open: false }))}
                                className="w-8 h-8 rounded-lg bg-djzinc-800 hover:bg-djzinc-700 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
                            >
                                <Icons.Close size={14} className="inline-block align-[-2px]" />
                            </button>
                        </div>

                        {/* Pista de Referencia / Origen */}
                        {candidateModal.targetTrack && (
                            <div className="p-3.5 bg-djzinc-950/70 border-b border-djzinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="px-2 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
                                        <Icons.Folder size={14} className="inline-block align-[-2px]" /> <span>Tu Pista Local</span>
                                    </span>
                                    <div className="min-w-0">
                                        <span className="font-bold text-white truncate inline-block max-w-[280px]">
                                            {candidateModal.targetTrack.original_artist || candidateModal.targetTrack.artist || 'Desconocido'}
                                        </span>
                                        <span className="text-gray-400 mx-1.5">—</span>
                                        <span className="text-djcyan-300 font-medium truncate inline-block max-w-[320px]">
                                            {candidateModal.targetTrack.original_title || candidateModal.targetTrack.title || 'Sin Título'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 shrink-0 text-[11px] font-mono text-gray-400">
                                    {candidateModal.targetTrack.bpm && (
                                        <span className="px-2 py-0.5 rounded bg-djzinc-800/80 text-gray-300">
                                            <Icons.Wave size={14} className="inline-block align-[-2px]" /> {candidateModal.targetTrack.bpm} BPM
                                        </span>
                                    )}
                                    {candidateModal.targetTrack.original_duration && (
                                        <span className="px-2 py-0.5 rounded bg-djzinc-800/80 text-gray-300">
                                            <Icons.Clock size={14} className="inline-block align-[-2px]" /> {Math.floor(candidateModal.targetTrack.original_duration / 60)}:{(Math.floor(candidateModal.targetTrack.original_duration % 60)).toString().padStart(2, '0')}
                                        </span>
                                    )}
                                    {candidateModal.targetTrack.calidad && (
                                        <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                                            Calidad: {candidateModal.targetTrack.calidad}
                                        </span>
                                    )}
                                    {/* Botón de Preescucha de la Pista Local del Usuario */}
                                    <button
                                        type="button"
                                        onClick={(e) => handlePlayLocalTrack(candidateModal.targetTrack, e)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow active:scale-95 ${
                                            isTrackLocalPlaying(candidateModal.targetTrack)
                                                ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse font-black'
                                                : 'bg-djzinc-850 hover:bg-amber-950/80 text-amber-300 border border-amber-600/60'
                                        }`}
                                        title="Reproducir archivo local de tu biblioteca para comparar acústicamente"
                                    >
                                        <span>{isTrackLocalPlaying(candidateModal.targetTrack) ? '⏸️' : '🎧'}</span>
                                        <span>{isTrackLocalPlaying(candidateModal.targetTrack) ? 'Pausar Local (A)' : 'Oír Local (Deck A)'}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Barra de Control y Comparativa A/B Rápida */}
                        {candidateModal.targetTrack && (
                            <div className="px-4 py-2 bg-[#090912] border-b border-djzinc-800/90 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Comparador A/B:</span>
                                    <button
                                        type="button"
                                        onClick={(e) => handlePlayLocalTrack(candidateModal.targetTrack, e)}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                            isTrackLocalPlaying(candidateModal.targetTrack)
                                                ? 'bg-amber-400 text-black font-black shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                                                : 'bg-djzinc-900 text-amber-400 border border-amber-800/50 hover:bg-djzinc-800'
                                        }`}
                                        title="Escuchar tu archivo original de baja calidad (Deck A)"
                                    >
                                        <span>🅰️</span> <span>Pista Local (Disco)</span>
                                        {isTrackLocalPlaying(candidateModal.targetTrack) && <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            const currentOrTop = candidateModal.candidates?.find(c => candidateModal.targetTrack && (candidateModal.targetTrack.spotify_url === c.spotify_url || candidateModal.targetTrack.title === c.title)) || candidateModal.candidates?.[0];
                                            if (currentOrTop) handlePlayCandidateTrack(currentOrTop, e);
                                        }}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                            candidateModal.candidates?.some(c => isTrackCandPlaying(c))
                                                ? 'bg-djcyan-400 text-black font-black shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                                                : 'bg-djzinc-900 text-djcyan-300 border border-djcyan-800/50 hover:bg-djzinc-800'
                                        }`}
                                        title="Escuchar la versión oficial encontrada para descargar (Deck B)"
                                    >
                                        <span>🅱️</span> <span>Versión Descarga (Catálogo Oficial)</span>
                                        {candidateModal.candidates?.some(c => isTrackCandPlaying(c)) && <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />}
                                    </button>
                                </div>
                                <div className="text-[10px] text-gray-500 hidden md:block">
                                    <Icons.Bulb size={14} className="inline-block align-[-2px]" /> Compara A vs B para comprobar que intro, remix y mezcla sean exactamente iguales
                                </div>
                            </div>
                        )}

                        {/* Barra de Búsqueda Manual / Filtro de Candidatos */}
                        <div className="p-3 bg-djzinc-900 border-b border-djzinc-800 flex items-center gap-2">
                            <div className="relative flex-1">
                                <Icons.Search size={14} className="inline-block align-[-2px] absolute left-3 top-2.5 text-gray-500" />
                                <input
                                    type="text"
                                    value={candidateModal.searchQuery}
                                    onChange={(e) => setCandidateModal(prev => ({ ...prev, searchQuery: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleBuscarCandidatosManuales(); }}
                                    placeholder="Buscar versión específica (ej. 'Space 92 The Door Extended Mix' o remixer)..."
                                    className="w-full bg-djzinc-950 border border-djzinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-djcyan-500 font-mono"
                                />
                            </div>
                            <button
                                onClick={() => handleBuscarCandidatosManuales()}
                                disabled={candidateModal.isSearching}
                                className="px-4 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                            >
                                {candidateModal.isSearching ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        <span>Buscando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Buscar Versiones</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Mensaje de estado de búsqueda */}
                        {candidateModal.searchMsg && (
                            <div className="px-4 py-1.5 bg-djzinc-950/70 border-b border-djzinc-800 text-[11px] font-mono text-gray-400 flex items-center gap-2">
                                <Icons.Info size={14} className="inline-block align-[-2px]" />
                                <span>{candidateModal.searchMsg}</span>
                            </div>
                        )}

                        {/* Lista de Versiones / Candidatos Evaluados */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                            {candidateModal.candidates && candidateModal.candidates.length > 0 ? (
                                candidateModal.candidates.map((cand, idx) => {
                                    const score = cand.match_score !== undefined ? cand.match_score : (cand.score || 0);
                                    const conf = cand.match_confianza || (score >= 80 ? 'ALTA' : (score >= 50 ? 'MEDIA' : 'BAJA'));
                                    const hasAlert = !!cand.alerta_version;
                                    const targetDur = candidateModal.targetTrack?.original_duration || candidateModal.targetTrack?.duration || 0;
                                    const candDur = cand.duration || 0;
                                    const durDiff = Math.abs(candDur - targetDur);
                                    const isCurrentlySelected = candidateModal.targetTrack && (
                                        candidateModal.targetTrack.spotify_url === cand.spotify_url ||
                                        candidateModal.targetTrack.apple_url === cand.apple_url ||
                                        (candidateModal.targetTrack.title === cand.title && candidateModal.targetTrack.artist === cand.artist)
                                    );

                                    return (
                                        <div
                                            key={idx}
                                            className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                                                isCurrentlySelected
                                                    ? 'bg-djcyan-950/30 border-djcyan-500/60 shadow-lg shadow-djcyan-950/40'
                                                    : score >= 80
                                                        ? 'bg-djzinc-950/60 border-emerald-900/40 hover:border-emerald-700/60'
                                                        : score >= 50
                                                            ? 'bg-djzinc-950/60 border-amber-900/40 hover:border-amber-700/60'
                                                            : 'bg-djzinc-950/40 border-rose-950/60 hover:border-rose-800/60'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                {/* Cover */}
                                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-djzinc-800 shrink-0 border border-djzinc-700/50 shadow">
                                                    {cand.cover ? (
                                                        <img src={cand.cover} alt="Cover" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-lg text-gray-500"><Icons.Music size={14} className="inline-block align-[-2px]" /></div>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePlayCandidateTrack(cand, e);
                                                        }}
                                                        title="Reproducir preview oficial (Deck B)"
                                                        className="absolute inset-0 bg-black/50 hover:bg-black/30 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-xs"
                                                    >
                                                        {isTrackCandPlaying(cand) ? '❚❚' : '▶'}
                                                    </button>
                                                </div>

                                                {/* Track info */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-bold text-white truncate max-w-[260px]">
                                                            {cand.artist}
                                                        </span>
                                                        <span className="text-gray-500 text-xs">—</span>
                                                        <span className="text-xs font-medium text-djcyan-300 truncate max-w-[300px]">
                                                            {cand.title}
                                                        </span>
                                                        {isCurrentlySelected && (
                                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-djcyan-500 text-black">
                                                                SELECCIONADA ACTUALMENTE
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 font-mono flex-wrap">
                                                        {cand.album && (
                                                            <span className="truncate max-w-[200px]" title={cand.album}>
                                                                <Icons.Disc size={14} className="inline-block align-[-2px]" /> {cand.album}
                                                            </span>
                                                        )}
                                                        {cand.duration > 0 && (
                                                            <span className="text-gray-300">
                                                                <Icons.Clock size={14} className="inline-block align-[-2px]" /> {Math.floor(cand.duration / 60)}:{(Math.floor(cand.duration % 60)).toString().padStart(2, '0')}
                                                            </span>
                                                        )}
                                                        {targetDur > 0 && candDur > 0 && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                                durDiff <= 5
                                                                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                                                    : durDiff <= 25
                                                                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                                                                        : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                                                            }`}>
                                                                {durDiff <= 5 ? '✓ Misma duración' : `Δ ${durDiff > 0 ? (candDur > targetDur ? '+' : '-') : ''}${Math.round(durDiff)}s`}
                                                            </span>
                                                        )}
                                                        {cand.bpm && (
                                                            <span><Icons.Wave size={14} className="inline-block align-[-2px]" /> {cand.bpm} BPM</span>
                                                        )}
                                                        {cand.isrc && (
                                                            <span className="text-[10px] text-gray-500">ISRC: {cand.isrc}</span>
                                                        )}
                                                    </div>

                                                    {/* Alert / Warning badge */}
                                                    {hasAlert && (
                                                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/30">
                                                            <Icons.Warning size={14} className="inline-block align-[-2px]" />
                                                            <span>{cand.alerta_version}</span>
                                                        </div>
                                                    )}
                                                    {cand.match_recomendacion && !hasAlert && (
                                                        <div className="mt-1 text-[10px] text-gray-400 italic">
                                                            {cand.match_recomendacion}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Score & Action Button */}
                                            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                                                {/* Score Badge */}
                                                <div className={`px-2.5 py-1 rounded-lg border text-center ${
                                                    score >= 80
                                                        ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                                                        : score >= 50
                                                            ? 'bg-amber-950/50 border-amber-700/60 text-amber-300'
                                                            : 'bg-rose-950/50 border-rose-700/60 text-rose-300'
                                                }`}>
                                                    <div className="text-xs font-black font-mono">
                                                        {score}%
                                                    </div>
                                                    <div className="text-[8px] font-bold tracking-wider uppercase">
                                                        {conf}
                                                    </div>
                                                </div>

                                                {/* Preescucha de la Versión Candidata */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => handlePlayCandidateTrack(cand, e)}
                                                    className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                                                        isTrackCandPlaying(cand)
                                                            ? 'bg-djcyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)] animate-pulse font-black'
                                                            : 'bg-djzinc-850 hover:bg-djcyan-950/80 text-djcyan-300 border border-djcyan-700/60'
                                                    }`}
                                                    title="Escuchar audio de preescucha oficial de esta versión (Deck B)"
                                                >
                                                    <span>{isTrackCandPlaying(cand) ? '⏸️' : '▶'}</span>
                                                    <span>{isTrackCandPlaying(cand) ? 'Pausar (B)' : 'Oír (B)'}</span>
                                                </button>

                                                {/* Seleccionar Button */}
                                                <button
                                                    onClick={() => handleSeleccionarVersionCandidato(cand)}
                                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${
                                                        isCurrentlySelected
                                                            ? 'bg-djzinc-800 text-gray-400 hover:text-white border border-djzinc-700'
                                                            : score >= 80
                                                                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-950/30'
                                                                : 'bg-djcyan-500 hover:bg-djcyan-400 text-black shadow-djcyan-950/30'
                                                    }`}
                                                >
                                                    <span>{isCurrentlySelected ? '✓ Seleccionada' : 'Seleccionar Esta'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-gray-500 text-xs">
                                    <Icons.Search size={14} className="inline-block align-[-2px] block mb-2" />
                                    No hay versiones alternativas precargadas. Utiliza el buscador superior para encontrar la versión exacta (ej. Extended Mix, Club Mix o Remix).
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3.5 bg-djzinc-950/90 border-t border-djzinc-800 flex items-center justify-between">
                            <span className="text-[11px] text-gray-500">
                                <Icons.Bulb size={14} className="inline-block align-[-2px]" /> Tip: Si la pista de tu biblioteca es una sesión de DJ o Extended Mix, asegúrate de que la duración coincida.
                            </span>
                            <button
                                onClick={() => setCandidateModal(prev => ({ ...prev, open: false }))}
                                className="px-4 py-1.5 rounded-lg text-xs bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Centro de Columnas & Vistas de Record Pool (Columna / Drawer Lateral Derecho) */}
            {poolColumnSelectorOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 overflow-hidden select-none pointer-events-none" style={{ zIndex: 99998 }}>
                    <div 
                        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-fadeIn pointer-events-auto"
                        style={{ zIndex: 99998 }}
                        onClick={() => { setPoolColumnSelectorOpen(false); setPoolColumnSearchText(''); }}
                    />
                    <aside 
                        style={{ width: '100%', maxWidth: `${poolColumnsDrawerWidth}px`, zIndex: 99999 }}
                        className="fixed top-0 bottom-0 right-0 h-full bg-[#0a0b14] border-l-4 border-l-cyan-400 shadow-[-25px_0_60px_rgba(0,0,0,1)] flex flex-col font-sans text-gray-200 animate-slideInRight pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Manija táctil de redimensión para Desktop */}
                        <div 
                            onPointerDown={onPoolColumnsResizeDown}
                            onDoubleClick={onPoolColumnsResetWidth}
                            className="hidden md:flex absolute top-0 bottom-0 -left-2 w-4 cursor-ew-resize items-center justify-center z-50 group select-none hover:bg-cyan-500/10 transition-colors"
                            title="Arrastra para redimensionar (Doble clic para restablecer a 540px)"
                        >
                            <div className="w-1 h-12 rounded-full bg-zinc-600 group-hover:bg-cyan-400 group-hover:scale-y-125 transition-all shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                        </div>

                        {/* Cabecera */}
                        <div className="px-5 py-4 border-b border-djzinc-800 flex items-center justify-between bg-gradient-to-r from-[#0e0f1d] to-[#080910] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-djcyan-950/80 text-djcyan-400 border border-djcyan-500/50 flex items-center justify-center shadow-inner shrink-0">
                                    <Icons.Sliders size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-syne font-black text-base sm:text-lg text-white uppercase tracking-wider">
                                            Columnas de Record Pool & Catálogo
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full bg-djcyan-950 border border-djcyan-600/60 text-djcyan-300 font-mono text-[11px] font-black">
                                            {Object.values(poolVisibleColumns).filter(Boolean).length} de {Object.keys(poolVisibleColumns).length} activas
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                                        Personaliza las columnas visibles en la tabla del Record Pool según tu flujo de búsqueda, pre-auditoría o descarga DJ.
                                    </p>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => { setPoolColumnSelectorOpen(false); setPoolColumnSearchText(''); }}
                                className="w-9 h-9 rounded-xl bg-djzinc-900 hover:bg-djzinc-800 text-gray-400 hover:text-white border border-djzinc-750 flex items-center justify-center cursor-pointer transition-colors text-sm font-bold shadow-sm"
                                title="Cerrar modal (Esc)"
                            >
                                <Icons.Close size={14} className="inline-block align-[-2px]" />
                            </button>
                        </div>

                        {/* Buscador & Presets */}
                        <div className="p-4 border-b border-djzinc-800/80 bg-[#080910] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                            <div className="relative flex-1 max-w-md">
                                <Icons.Search size={14} className="inline-block align-[-2px] absolute left-3 top-2.5  text-gray-400" />
                                <input 
                                    type="text" 
                                    value={poolColumnSearchText}
                                    onChange={(e) => setPoolColumnSearchText(e.target.value)}
                                    placeholder="Buscar columna en Pool (ej. match, bpm, origen, formato)..."
                                    className="w-full pl-8 pr-8 py-2 bg-djzinc-900 border border-djzinc-750 rounded-xl text-xs font-mono text-gray-200 placeholder-gray-500 outline-none focus:border-djcyan-500/70 focus:ring-1 focus:ring-djcyan-500/40 transition-all"
                                />
                                {poolColumnSearchText && (
                                    <button 
                                        type="button" 
                                        onClick={() => setPoolColumnSearchText('')}
                                        className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-white cursor-pointer"
                                    ><Icons.Close size={14} className="inline-block align-[-2px]" /></button>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold shrink-0">Presets:</span>
                                <button 
                                    type="button" 
                                    onClick={() => setPoolColumnPreset('all')}
                                    className="px-2.5 py-1 rounded-lg bg-djzinc-900 hover:bg-djzinc-850 text-djcyan-300 border border-djzinc-750 hover:border-djcyan-500/50 text-[11px] font-mono font-bold cursor-pointer transition-all active:scale-95"
                                >
                                    <Icons.Eye size={14} className="inline-block align-[-2px]" /> Ver Todas ({Object.keys(DEFAULT_POOL_COLUMNS).length})
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setPoolColumnPreset('dj')}
                                    className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-700/60 text-[11px] font-mono font-bold cursor-pointer transition-all active:scale-95"
                                >
                                    <Icons.Zap size={14} className="inline-block align-[-2px]" /> Cabina DJ
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setPoolColumnPreset('quality')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-700/60 text-[11px] font-mono font-bold cursor-pointer transition-all active:scale-95"
                                >
                                    <Icons.ZoomIn size={14} className="inline-block align-[-2px]" /> Pureza Sonora
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setPoolColumnPreset('essential')}
                                    className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border border-amber-700/60 text-[11px] font-mono font-bold cursor-pointer transition-all active:scale-95"
                                >
                                    <Icons.Tag size={14} className="inline-block align-[-2px]" /> Esencial
                                </button>
                            </div>
                        </div>

                        {/* Categorías & Columnas */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
                            {POOL_COLUMN_CATEGORIES.map(cat => {
                                const q = (poolColumnSearchText || '').trim().toLowerCase();
                                const matchingCols = cat.columns.filter(col => {
                                    if (!q) return true;
                                    return col.label.toLowerCase().includes(q) || col.key.toLowerCase().includes(q) || col.desc.toLowerCase().includes(q);
                                });
                                if (q && matchingCols.length === 0) return null;

                                const activeInCat = matchingCols.filter(c => poolVisibleColumns[c.key]).length;

                                return (
                                    <div key={cat.id} className="p-3.5 rounded-xl bg-djzinc-900/60 border border-djzinc-800 flex flex-col gap-2.5">
                                        <div className="flex items-center justify-between border-b border-djzinc-800/80 pb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">{cat.icon}</span>
                                                <span className={`font-mono text-xs font-black uppercase tracking-wider ${cat.color}`}>
                                                    {cat.name}
                                                </span>
                                                <span className="text-[10px] font-mono text-gray-500 font-bold">
                                                    ({activeInCat}/{matchingCols.length})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const next = { ...poolVisibleColumns };
                                                        matchingCols.forEach(c => { next[c.key] = true; });
                                                        setPoolVisibleColumns(next);
                                                        try { localStorage.setItem('bw_pool_visible_columns', JSON.stringify(next)); } catch (_) {}
                                                    }}
                                                    className="text-djcyan-400 hover:text-djcyan-300 cursor-pointer hover:underline"
                                                >
                                                    Todas
                                                </button>
                                                <span className="text-gray-600">/</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const next = { ...poolVisibleColumns };
                                                        matchingCols.forEach(c => { next[c.key] = false; });
                                                        setPoolVisibleColumns(next);
                                                        try { localStorage.setItem('bw_pool_visible_columns', JSON.stringify(next)); } catch (_) {}
                                                    }}
                                                    className="text-gray-500 hover:text-gray-300 cursor-pointer hover:underline"
                                                >
                                                    Ninguna
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            {matchingCols.map(col => {
                                                const isChecked = Boolean(poolVisibleColumns[col.key]);
                                                return (
                                                    <label 
                                                        key={col.key}
                                                        className={`flex items-start justify-between p-2 rounded-lg border transition-all cursor-pointer select-none ${
                                                            isChecked 
                                                                ? 'bg-djzinc-850/80 border-djzinc-700/80 text-white' 
                                                                : 'bg-djzinc-950/40 border-djzinc-850/60 text-gray-500 hover:border-djzinc-800'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col pr-2">
                                                            <span className={`text-xs font-mono font-bold ${isChecked ? 'text-white' : 'text-gray-400'}`}>
                                                                {col.label}
                                                            </span>
                                                            <span className="text-[10.5px] text-gray-400 font-sans leading-tight mt-0.5">
                                                                {col.desc}
                                                            </span>
                                                        </div>
                                                        <input 
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => togglePoolColumnVisibility(col.key)}
                                                            className="accent-djcyan-400 w-4 h-4 rounded cursor-pointer mt-0.5 shrink-0"
                                                        />
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3.5 border-t border-djzinc-800 bg-[#07080e] flex items-center justify-between flex-wrap gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setPoolColumnPreset('reset')}
                                    className="px-3 py-1.5 rounded-lg bg-djzinc-900 hover:bg-djzinc-850 text-gray-300 border border-djzinc-750 text-xs font-mono font-bold cursor-pointer transition-all active:scale-95"
                                >
                                    ↺ Restablecer por Defecto
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setPoolColumnPreset('none')}
                                    className="px-3 py-1.5 rounded-lg bg-djzinc-900 hover:bg-djzinc-850 text-gray-400 hover:text-white border border-djzinc-750 text-xs font-mono cursor-pointer transition-all active:scale-95"
                                >
                                    Deseleccionar Todas
                                </button>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => { setPoolColumnSelectorOpen(false); setPoolColumnSearchText(''); }}
                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-djcyan-400 to-djcyan-500 hover:from-djcyan-300 hover:to-djcyan-400 text-black font-mono font-black text-xs shadow-md shadow-djcyan-500/20 cursor-pointer transition-all active:scale-95"
                            >
                                <Icons.Check size={14} className="inline-block align-[-2px]" /> Aplicar y Guardar ({Object.values(poolVisibleColumns).filter(Boolean).length} Activas)
                            </button>
                        </div>
                    </aside>
                </div>,
                document.body
            )}

        </div>
    );
};

