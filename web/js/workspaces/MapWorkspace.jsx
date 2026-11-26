const { useState, useEffect, useRef, useMemo, useCallback } = React;
import { Icons, ShellIcons } from '../shell/icons.jsx';
import { useWorkspaceActive } from '../shell/WorkspaceSlot.jsx';
import { MapCamelotOverlay, MapNavOverlay, MapStatsHud, MapAcousticConsole, MAP_ZOOM_MIN, MAP_ZOOM_MAX } from '../shell/map-overlays.jsx';
import { DEFAULT_VINYL_SVG, getValidCover } from '../data/constants.js';
import { useDrawerResize } from '../shell/hooks.js';
import { SectionTitle } from '../shell/workspace-ui.jsx';
import { UnifiedLibraryBrowserModal } from '../modals/index.js';

// =========================================================================
// ESPACIO DE TRABAJO: SCATTER MAP (PAISAJE ESPACIAL 2D DE COMPATIBILIDAD MUSICAL)
// =========================================================================

const MAP_CAMELOT_COLORS = {
    "1A": "#00e5ff", "1B": "#00b4d8",
    "2A": "#00a6fb", "2B": "#0077b6",
    "3A": "#22d3ee", "3B": "#1d4ed8",
    "4A": "#8b5cf6", "4B": "#7c3aed",
    "5A": "#d946ef", "5B": "#c026d3",
    "6A": "#ef4444", "6B": "#dc2626",
    "7A": "#f97316", "7B": "#ea580c",
    "8A": "#f59e0b", "8B": "#d97706",
    "9A": "#eab308", "9B": "#ca8a04",
    "10A": "#84cc16", "10B": "#65a30d",
    "11A": "#10b981", "11B": "#059669",
    "12A": "#14b8a6", "12B": "#0d9488"
};

const MAP_GENRE_COLORS = {
    "Tech House": "#10b981",
    "Melodic Techno": "#06b6d4",
    "Afro House": "#f59e0b",
    "Peak Time Techno": "#a855f7",
    "Techno": "#9333ea",
    "Deep House": "#22d3ee",
    "House": "#38bdf8",
    "Indie Dance": "#ec4899",
    "Drum & Bass": "#ef4444",
    "Trance": "#6366f1",
    "Hard Dance": "#f43f5e",
    "Minimal": "#94a3b8"
};

const DEMO_MAP_TRACKS = [
    { id: "demo_1", title: "Astral Projection (Extended Mix)", artist: "Artbat & CamelPhat", bpm: 126.0, key: "8A", energy: 88, danceability: 82, genre: "Melodic Techno", subgenre: "Peak Melodic", calidad: "FLAC 24-bit", duration: "06:45" },
    { id: "demo_2", title: "Consciousness", artist: "Anyma & Chris Avantgarde", bpm: 126.0, key: "9A", energy: 92, danceability: 79, genre: "Melodic Techno", subgenre: "Afterlife Sound", calidad: "FLAC Lossless", duration: "05:48" },
    { id: "demo_3", title: "Rumble (Club Mix)", artist: "Skrillex & Fred again..", bpm: 140.0, key: "11A", energy: 95, danceability: 90, genre: "Drum & Bass", subgenre: "Bassline / UKG", calidad: "320 kbps MP3", duration: "03:50" },
    { id: "demo_4", title: "Drugs From Amsterdam", artist: "Mau P", bpm: 125.0, key: "4A", energy: 94, danceability: 96, genre: "Tech House", subgenre: "Club Banger", calidad: "FLAC Lossless", duration: "05:24" },
    { id: "demo_5", title: "Move", artist: "Adam Port & Stryv", bpm: 121.0, key: "7A", energy: 74, danceability: 89, genre: "Afro House", subgenre: "Keinemusik Deep", calidad: "FLAC Lossless", duration: "05:12" },
    { id: "demo_6", title: "Rhyme Dust", artist: "MK & Dom Dolla", bpm: 128.0, key: "8A", energy: 91, danceability: 92, genre: "Tech House", subgenre: "Mainstage Tech", calidad: "FLAC Lossless", duration: "05:30" },
    { id: "demo_7", title: "Miracle", artist: "Calvin Harris & Ellie Goulding", bpm: 143.0, key: "2A", energy: 96, danceability: 84, genre: "Trance", subgenre: "Eurodance Revival", calidad: "FLAC Lossless", duration: "04:15" },
    { id: "demo_8", title: "The Age Of Love (Charlotte de Witte Remix)", artist: "Age Of Love", bpm: 132.0, key: "4A", energy: 98, danceability: 85, genre: "Peak Time Techno", subgenre: "Acid Techno", calidad: "FLAC Lossless", duration: "08:10" },
    { id: "demo_9", title: "World Hold On (Fisher Rework)", artist: "Bob Sinclar & Fisher", bpm: 127.0, key: "9B", energy: 90, danceability: 94, genre: "Tech House", subgenre: "Summer Groove", calidad: "FLAC Lossless", duration: "05:34" },
    { id: "demo_10", title: "Neverender", artist: "Justice & Tame Impala", bpm: 118.0, key: "5A", energy: 70, danceability: 86, genre: "Indie Dance", subgenre: "Electro French", calidad: "FLAC Lossless", duration: "04:26" },
    { id: "demo_11", title: "Eternity", artist: "Anyma", bpm: 125.0, key: "8A", energy: 85, danceability: 76, genre: "Melodic Techno", subgenre: "Atmospheric", calidad: "FLAC Lossless", duration: "06:12" },
    { id: "demo_12", title: "Losing It", artist: "Fisher", bpm: 125.0, key: "8A", energy: 95, danceability: 95, genre: "Tech House", subgenre: "Club Peak", calidad: "FLAC Lossless", duration: "04:08" },
    { id: "demo_13", title: "Baddadan", artist: "Chase & Status & Bou", bpm: 174.0, key: "1A", energy: 99, danceability: 88, genre: "Drum & Bass", subgenre: "Jump Up DnB", calidad: "320 kbps MP3", duration: "03:40" },
    { id: "demo_14", title: "Mwaki", artist: "Zerb & Sofiya Nzau", bpm: 122.0, key: "6A", energy: 76, danceability: 91, genre: "Afro House", subgenre: "Tribal Vocal", calidad: "FLAC Lossless", duration: "04:45" },
    { id: "demo_15", title: "Fine Day Anthem", artist: "Skrillex & Boys Noize", bpm: 130.0, key: "7A", energy: 93, danceability: 88, genre: "Tech House", subgenre: "Acid House", calidad: "FLAC Lossless", duration: "03:15" },
    { id: "demo_16", title: "Take It Off", artist: "Fisher & Aatig", bpm: 126.0, key: "3A", energy: 92, danceability: 94, genre: "Tech House", subgenre: "Club Vocal", calidad: "FLAC Lossless", duration: "05:14" }
];

const parseMapCamelot = (k) => {
    if (!k) return null;
    const m = String(k).trim().toUpperCase().match(/^(1[0-2]|[1-9])([AB])$/);
    if (!m) return null;
    return { num: parseInt(m[1], 10), letter: m[2], full: `${m[1]}${m[2]}` };
};

const calcHarmonicMixMatch = (k1, k2, bpm1 = 126, bpm2 = 126) => {
    const c1 = parseMapCamelot(k1);
    const c2 = parseMapCamelot(k2);
    if (!c1 || !c2) return { score: 50, label: "Tonalidad Desconocida", color: "#64748b", isMatch: false };
    
    let baseScore = 40;
    let label = "Tonalidad Distante";
    let color = "#ef4444";

    if (c1.full === c2.full) {
        baseScore = 100;
        label = "Misma Clave (Match 100%)";
        color = "#10b981";
    } else if (c1.num === c2.num && c1.letter !== c2.letter) {
        baseScore = 92;
        label = "Cambio Mayor/Menor";
        color = "#06b6d4";
    } else {
        const diff = Math.min(Math.abs(c1.num - c2.num), 12 - Math.abs(c1.num - c2.num));
        if (diff === 1 && c1.letter === c2.letter) {
            const isBoost = (c2.num === (c1.num % 12) + 1);
            baseScore = 95;
            label = isBoost ? "Paso Armónico +1 (Boost)" : "Paso Armónico -1 (Descenso)";
            color = "#10b981";
        } else if (diff === 1 && c1.letter !== c2.letter) {
            baseScore = 84;
            label = "Diagonal Armónica";
            color = "#f59e0b";
        } else if (diff === 2 && c1.letter === c2.letter) {
            baseScore = 74;
            label = "Modulación +2";
            color = "#eab308";
        }
    }

    const b1 = parseFloat(bpm1) || 126;
    const b2 = parseFloat(bpm2) || 126;
    const bpmDiff = Math.abs(b1 - b2) / Math.max(1, b1);
    let bpmMod = 0;
    if (bpmDiff <= 0.03) bpmMod = 5;
    else if (bpmDiff <= 0.06) bpmMod = 0;
    else bpmMod = -15;

    const total = Math.max(20, Math.min(100, baseScore + bpmMod));
    return { score: total, label, color, isMatch: total >= 78 };
};

const mapHashInt = (str) => {
    let h = 0;
    for (let i = 0; i < (str || '').length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
};

export const MapWorkspace = ({
    tracks: rawTracks = [],
    setTracks = null,
    onPlayTrack,
    nowPlayingTrack,
    isPlaying,
    onTogglePlay,
    onNavigateTab,
    onAddTracksToSet,
    onSelectDirectory,
    lang = "es",
    customLibraries = [],
    activeCustomLibId = null,
    onSaveCustomLibraries = null
}) => {
    const isWorkspaceActive = useWorkspaceActive();
    // Si no hay pistas cargadas en audit, ofrecer catálogo demo interactivo
    const [useDemo, setUseDemo] = useState(false);
    const activeTracks = (rawTracks && rawTracks.length > 0) ? rawTracks : (useDemo ? DEMO_MAP_TRACKS : []);
    const [fsBrowserOpen, setFsBrowserOpen] = useState(false);

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
            if (setTracks) setTracks(colTracks);
            setUseDemo(false);
        }
    };

    const handleCargarDirectorio = async (targets) => {
        setFsBrowserOpen(false);
        const targetPath = Array.isArray(targets) ? targets[0] : targets;
        try {
            const resp = await fetch('/api/escanear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ruta: targetPath })
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data && Array.isArray(data.tracks) && data.tracks.length > 0) {
                    if (setTracks) setTracks(data.tracks);
                    setUseDemo(false);
                    return;
                }
            }
        } catch (e) {}
        if (onSelectDirectory) {
            onSelectDirectory(targetPath);
        }
    };

    const [projectionMode, setProjectionMode] = useState('energy_dance'); // 'energy_dance' | 'bpm_energy' | 'camelot_wheel' | 'acoustic_clusters'
    const [colorMode, setColorMode] = useState('genre'); // 'genre' | 'camelot' | 'energy' | 'quality'
    const [toolMode, setToolMode] = useState('pan'); // 'pan' | 'lasso' | 'box'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedKeyFilter, setSelectedKeyFilter] = useState('ALL');
    const [showHarmonicPaths, setShowHarmonicPaths] = useState(true);

    const [selectedTrack, setSelectedTrack] = useState(null);
    const [selectedMapTracks, setSelectedMapTracks] = useState([]);
    const [hoveredTrack, setHoveredTrack] = useState(null);
    const tooltipRef = useRef(null);
    const mousePosRef = useRef({ x: -100, y: -100 });
    const zoomThrottleRef = useRef(null);
    const zoomTrailingRef = useRef(null);
    const [isCamelotWheelOpen, setIsCamelotWheelOpen] = useState(true);
    const [isNavOverlayOpen, setIsNavOverlayOpen] = useState(true);
    const [zoomDisplay, setZoomDisplay] = useState(1.0);
    const [isPanning, setIsPanning] = useState(false);

    // Consola Acústica Unificada (50% del drawer maestro = 270px)
    const [isMapConsoleOpen, setIsMapConsoleOpen] = useState(true);
    const { 
        width: mapConsoleWidth, 
        onPointerDown: onMapConsoleResizeDown, 
        resetWidth: onResetMapConsoleWidth 
    } = useDrawerResize('bw_map_console_width', 270, 220, 520, true);

    // Filtros Acústicos en Tiempo Real (Mixer DJ)
    const [filterMinEnergy, setFilterMinEnergy] = useState(0);
    const [filterMinDance, setFilterMinDance] = useState(0);
    const [filterMinIntensity, setFilterMinIntensity] = useState(0);
    const [filterMinValence, setFilterMinValence] = useState(0);
    const [filterQualityMode, setFilterQualityMode] = useState('ALL'); // 'ALL' | 'lossless' | 'nofake'

    const handleResetAcousticFilters = useCallback(() => {
        setFilterMinEnergy(0);
        setFilterMinDance(0);
        setFilterMinIntensity(0);
        setFilterMinValence(0);
        setFilterQualityMode('ALL');
        setSelectedKeyFilter('ALL');
    }, []);

    // Limpieza de temporizadores de throttling del zoom al desmontar
    useEffect(() => {
        return () => {
            if (zoomThrottleRef.current) clearTimeout(zoomThrottleRef.current);
            if (zoomTrailingRef.current) clearTimeout(zoomTrailingRef.current);
        };
    }, []);

    const hasActiveFilters = filterMinEnergy > 0 || filterMinDance > 0 || filterMinIntensity > 0 || filterMinValence > 0 || filterQualityMode !== 'ALL' || selectedKeyFilter !== 'ALL' || Boolean(searchQuery);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const animRef = useRef(null);
    const imageCacheRef = useRef(new Map());
    const panTimerRef = useRef(null);
    const spatialGridRef = useRef(new Map());
    const mouseRafRef = useRef(null);
    const activeLoadingCountRef = useRef(0);
    const pendingLoadQueueRef = useRef([]);

    const processCoverQueue = () => {
        const MAX_CONCURRENT = 8;
        while (activeLoadingCountRef.current < MAX_CONCURRENT && pendingLoadQueueRef.current.length > 0) {
            const coverSrc = pendingLoadQueueRef.current.shift();
            if (!coverSrc || imageCacheRef.current.has(coverSrc)) continue;

            imageCacheRef.current.set(coverSrc, 'loading');
            activeLoadingCountRef.current++;

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = coverSrc;
            img.onload = () => {
                try {
                    const size = 64;
                    const oc = document.createElement('canvas');
                    oc.width = size;
                    oc.height = size;
                    const octx = oc.getContext('2d');
                    octx.beginPath();
                    octx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                    octx.clip();
                    octx.drawImage(img, 0, 0, size, size);
                    imageCacheRef.current.set(coverSrc, oc);
                } catch (e) {
                    imageCacheRef.current.set(coverSrc, img);
                }
                activeLoadingCountRef.current = Math.max(0, activeLoadingCountRef.current - 1);
                processCoverQueue();
            };
            img.onerror = () => {
                imageCacheRef.current.set(coverSrc, false);
                activeLoadingCountRef.current = Math.max(0, activeLoadingCountRef.current - 1);
                processCoverQueue();
            };
        }
    };

    const requestCoverThumbnail = (src, priority = false) => {
        if (!src || imageCacheRef.current.has(src)) return;
        if (priority) {
            pendingLoadQueueRef.current.unshift(src);
        } else if (pendingLoadQueueRef.current.length < 400) {
            pendingLoadQueueRef.current.push(src);
        }
        processCoverQueue();
    };

    const radialView = projectionMode === 'camelot_wheel' || projectionMode === 'acoustic_clusters';

    // Transformación espacial cinemática (Pan & Zoom Lerp 60fps)
    const transformRef = useRef({
        scale: 1.0,
        panX: 0,
        panY: 0,
        targetScale: 1.0,
        targetPanX: 0,
        targetPanY: 0,
        isContinuousPanning: false,
        continuousDx: 0,
        continuousDy: 0,
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0
    });

    // Navegación continua y ultra fluida por el mapa con cinemática 60fps (sin saltos ni tirones)
    const startPan = (dx, dy) => {
        transformRef.current.isContinuousPanning = true;
        transformRef.current.continuousDx = dx * 0.45;
        transformRef.current.continuousDy = dy * 0.45;
        transformRef.current.targetPanX += dx * 2.5;
        transformRef.current.targetPanY += dy * 2.5;
    };

    const stopPan = () => {
        transformRef.current.isContinuousPanning = false;
        transformRef.current.continuousDx = 0;
        transformRef.current.continuousDy = 0;
    };

    const handleFaderZoom = (val) => {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) {
            const tr = transformRef.current;
            const clamped = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, parsed));
            tr.targetScale = clamped;
            
            const canvas = canvasRef.current;
            const rect = canvas ? canvas.getBoundingClientRect() : null;
            const w = rect ? rect.width : 1000;
            const h = rect ? rect.height : 700;
            const side = radialView ? Math.min(w, h) : null;
            const spanX = side || w;
            const spanY = side || h;

            // CENTRADO INTELIGENTE: Recentrar exactamente en el track seleccionado/hovered o en el centroide de todos los nodos
            const nodes = nodesRef.current || [];
            if (nodes.length > 0) {
                let focusX = 0.5;
                let focusY = 0.5;
                const activeRef = hoveredTrack || selectedTrack;
                const refNode = activeRef ? nodes.find(n => n.id === activeRef.id || (n.track && n.track.id === activeRef.id)) : null;
                if (refNode) {
                    focusX = refNode.currX || refNode.targetX || 0.5;
                    focusY = refNode.currY || refNode.targetY || 0.5;
                } else {
                    let minX = 1, maxX = 0, minY = 1, maxY = 0;
                    nodes.forEach(n => {
                        const nx = n.currX || n.targetX || 0.5;
                        const ny = n.currY || n.targetY || 0.5;
                        if (nx < minX) minX = nx;
                        if (nx > maxX) maxX = nx;
                        if (ny < minY) minY = ny;
                        if (ny > maxY) maxY = ny;
                    });
                    focusX = (minX + maxX) / 2;
                    focusY = (minY + maxY) / 2;
                }
                
                // Mantiene el punto de enfoque siempre en el centro exacto de la pantalla sin importar el zoom (hasta 20X)
                tr.targetPanX = (0.5 - focusX) * spanX * clamped;
                tr.targetPanY = (0.5 - focusY) * spanY * clamped;
            } else {
                tr.targetPanX = 0;
                tr.targetPanY = 0;
            }
            setZoomDisplay(clamped);
        }
    };

    // RECENTRADO Y AUTO-ENMARCADO INTELIGENTE DE TRACKS ACTIVOS (Anti-pantalla en blanco)
    const handleAutoFrame = useCallback((targetZoom = null) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width || 1000;
        const h = rect.height || 700;
        const side = radialView ? Math.min(w, h) : null;
        const spanX = side || w;
        const spanY = side || h;

        const nodes = nodesRef.current || [];
        const visibleNodes = nodes.filter(n => {
            if (selectedKeyFilter !== 'ALL' && n.keyStr !== selectedKeyFilter) return false;
            const t = n.track || {};
            const eVal = n.energy;
            const dVal = n.danceability;
            const iVal = Number(t.arousal || t.intensity || Math.round(eVal * 0.95)) || 0;
            const vVal = Number(t.valence != null ? t.valence : (n.keyStr.includes('B') ? 65 : 45)) || 0;
            if (eVal < filterMinEnergy || dVal < filterMinDance || iVal < filterMinIntensity || vVal < filterMinValence) return false;
            if (filterQualityMode === 'lossless') {
                const isLossless = ['flac', 'wav', 'aiff'].includes((t.extension || t.tipo || '').toLowerCase()) || (t.bitrate_kbps && t.bitrate_kbps > 1000);
                if (!isLossless) return false;
            } else if (filterQualityMode === 'nofake') {
                const isBad = t.es_fake || (t.calidad && String(t.calidad).includes('Baja'));
                if (isBad) return false;
            }
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const m = (t.title || '').toLowerCase().includes(q) || (t.artist || '').toLowerCase().includes(q);
                if (!m) return false;
            }
            return true;
        });

        const targetList = visibleNodes.length > 0 ? visibleNodes : nodes;

        if (targetList.length === 0) {
            transformRef.current.targetScale = 1.0;
            transformRef.current.targetPanX = 0;
            transformRef.current.targetPanY = 0;
            setZoomDisplay(1.0);
            return;
        }

        const activeRef = hoveredTrack || selectedTrack;
        const refNode = activeRef ? targetList.find(n => n.id === activeRef.id || (n.track && n.track.id === activeRef.id)) : null;

        let focusX = 0.5;
        let focusY = 0.5;
        let autoScale = targetZoom;

        if (refNode) {
            focusX = refNode.currX || refNode.targetX || 0.5;
            focusY = refNode.currY || refNode.targetY || 0.5;
        } else {
            let minX = 1, maxX = 0, minY = 1, maxY = 0;
            targetList.forEach(n => {
                const nx = n.currX || n.targetX || 0.5;
                const ny = n.currY || n.targetY || 0.5;
                if (nx < minX) minX = nx;
                if (nx > maxX) maxX = nx;
                if (ny < minY) minY = ny;
                if (ny > maxY) maxY = ny;
            });
            focusX = (minX + maxX) / 2;
            focusY = (minY + maxY) / 2;

            if (autoScale === null) {
                const rangeX = Math.max(0.10, maxX - minX);
                const rangeY = Math.max(0.10, maxY - minY);
                const fitScaleX = 0.72 / rangeX;
                const fitScaleY = 0.72 / rangeY;
                autoScale = Math.max(MAP_ZOOM_MIN, Math.min(2.5, Math.min(fitScaleX, fitScaleY)));
            }
        }

        const finalScale = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, autoScale !== null ? autoScale : 1.0));
        const tr = transformRef.current;
        tr.targetScale = finalScale;
        tr.targetPanX = (0.5 - focusX) * spanX * finalScale;
        tr.targetPanY = (0.5 - focusY) * spanY * finalScale;
        tr.isContinuousPanning = false;
        setZoomDisplay(finalScale);
    }, [radialView, selectedKeyFilter, searchQuery, hoveredTrack, selectedTrack, filterMinEnergy, filterMinDance, filterMinIntensity, filterMinValence, filterQualityMode]);

    // Puntos para herramienta de Selección (Lasso / Box)
    const selectionRef = useRef({
        isSelecting: false,
        points: [],
        boxStart: null
    });

    // Nodos calculados en memoria con interpolación suave de coordenadas
    const nodesRef = useRef([]);

    // Actualizar coordenadas de proyección
    useEffect(() => {
        const bpms = activeTracks.map(t => parseFloat(t.bpm || t.b) || 126).filter(b => b > 40 && b < 250);
        const minBpm = bpms.length > 0 ? Math.min(...bpms) : 120;
        const maxBpm = bpms.length > 0 ? Math.max(...bpms) : 150;

        const genreAngleMap = {
            "Tech House": 0.25,
            "Melodic Techno": 1.15,
            "Afro House": 2.10,
            "Peak Time Techno": 3.30,
            "Techno": 3.65,
            "Deep House": 4.50,
            "House": 4.90,
            "Indie Dance": 5.40,
            "Drum & Bass": 0.80,
            "Trance": 1.80
        };

        const existingMap = new Map(nodesRef.current.map(n => [n.id, n]));

        const updatedNodes = activeTracks.map(t => {
            const id = t.id || t.path || t.filename || `${t.artist}_${t.title}`;
            const existing = existingMap.get(id);

            const energy = Math.max(10, Math.min(100, parseInt(t.energy !== undefined ? t.energy : (t.e || 75), 10)));
            const dance = Math.max(10, Math.min(100, parseInt(t.danceability !== undefined ? t.danceability : (t.dance || 80), 10)));
            const bpm = parseFloat(t.bpm || t.b) || 126.0;
            const keyStr = (t.key || t.k || '8A').toUpperCase();
            const genre = t.genre || t.genero || 'Tech House';

            const jX = ((mapHashInt(String(id)) % 80) - 40) * 0.0007;
            const jY = ((mapHashInt(String(t.artist || '')) % 80) - 40) * 0.0007;

            let targetX = 0.5;
            let targetY = 0.5;

            if (projectionMode === 'energy_dance') {
                targetX = 0.10 + 0.80 * (energy / 100.0) + jX;
                targetY = 0.90 - 0.80 * (dance / 100.0) + jY;
            } else if (projectionMode === 'bpm_energy') {
                const bpmNorm = (bpm - minBpm) / Math.max(1, maxBpm - minBpm);
                targetX = 0.10 + 0.80 * Math.max(0, Math.min(1, bpmNorm)) + jX;
                targetY = 0.90 - 0.80 * (energy / 100.0) + jY;
            } else if (projectionMode === 'camelot_wheel') {
                const ck = parseMapCamelot(keyStr);
                if (ck) {
                    const ang = ((ck.num - 1) / 12.0) * Math.PI * 2 - Math.PI / 2;
                    const r = (ck.letter === 'A' ? 0.32 : 0.44) + ((energy - 50) * 0.0008);
                    targetX = 0.5 + r * Math.cos(ang) + jX;
                    targetY = 0.5 + r * Math.sin(ang) + jY;
                } else {
                    targetX = 0.5 + jX;
                    targetY = 0.5 + jY;
                }
            } else if (projectionMode === 'acoustic_clusters') {
                const baseAng = genreAngleMap[genre] !== undefined ? genreAngleMap[genre] : ((mapHashInt(genre) % 360) * Math.PI / 180);
                const ck = parseMapCamelot(keyStr);
                const keyOffset = ck ? (ck.num / 12.0) * 0.15 : 0;
                const r = 0.22 + 0.20 * (energy / 100.0) + keyOffset;
                targetX = 0.5 + r * Math.cos(baseAng) + jX;
                targetY = 0.5 + r * Math.sin(baseAng) + jY;
            }

            // Clamping para no salirse de la zona de lienzo
            targetX = Math.max(0.04, Math.min(0.96, targetX));
            targetY = Math.max(0.04, Math.min(0.96, targetY));

            return {
                id,
                track: t,
                currX: existing ? existing.currX : targetX,
                currY: existing ? existing.currY : targetY,
                targetX,
                targetY,
                energy,
                danceability: dance,
                bpm,
                keyStr,
                genre
            };
        });

        if (!['camelot_wheel', 'acoustic_clusters'].includes(projectionMode) && updatedNodes.length > 1) {
            const xs = updatedNodes.map(n => n.targetX);
            const ys = updatedNodes.map(n => n.targetY);
            const x0 = Math.min(...xs), x1 = Math.max(...xs);
            const y0 = Math.min(...ys), y1 = Math.max(...ys);
            const fit = (v, a, b) => (b - a < 0.02 ? 0.5 : 0.07 + 0.86 * ((v - a) / (b - a)));
            updatedNodes.forEach(n => {
                n.targetX = fit(n.targetX, x0, x1);
                n.targetY = fit(n.targetY, y0, y1);
            });
        }

        // Construir cuadrícula de indexación espacial (Spatial Hash Grid) para Hit-Testing O(1) con 5.000+ pistas
        const grid = new Map();
        const GRID_DIVS = 32;
        updatedNodes.forEach(node => {
            const gx = Math.max(0, Math.min(GRID_DIVS - 1, Math.floor(node.targetX * GRID_DIVS)));
            const gy = Math.max(0, Math.min(GRID_DIVS - 1, Math.floor(node.targetY * GRID_DIVS)));
            const key = `${gx}_${gy}`;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key).push(node);
        });
        spatialGridRef.current = grid;
        nodesRef.current = updatedNodes;
    }, [activeTracks, projectionMode]);

    // Bucle de renderizado Canvas en 60 FPS
    useEffect(() => {
        if (!isWorkspaceActive) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let isRunning = true;

        const render = () => {
            if (!isRunning) return;

            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const w = rect.width;
            const h = rect.height;

            if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
                canvas.width = Math.floor(w * dpr);
                canvas.height = Math.floor(h * dpr);
            }

            ctx.save();
            ctx.scale(dpr, dpr);

            // Fondo espacial oscuro con gradiente
            const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
            bgGrad.addColorStop(0, '#111114');
            bgGrad.addColorStop(1, '#09090b');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            // Cinemática suave y continua a 60fps (sin tirones)
            const t = transformRef.current;
            if (t.isContinuousPanning) {
                t.targetPanX += t.continuousDx;
                t.targetPanY += t.continuousDy;
            }
            // CLAMPING CINEMÁTICO INTELIGENTE ANTI-VACÍO:
            // Asegura que el cluster de pistas SIEMPRE permanezca visible en pantalla y nunca quede en negro
            const side = radialView ? Math.min(w, h) : null;
            const spanX = side || w;
            const spanY = side || h;
            const effScale = t.targetScale || 1.0;
            const currentNodes = nodesRef.current || [];

            if (currentNodes.length > 0 && Number.isFinite(effScale) && effScale > 0) {
                let minNx = 1.0, maxNx = 0.0, minNy = 1.0, maxNy = 0.0;
                let validCount = 0;
                for (let i = 0; i < currentNodes.length; i++) {
                    const cn = currentNodes[i];
                    if (Number.isFinite(cn.currX) && Number.isFinite(cn.currY)) {
                        if (cn.currX < minNx) minNx = cn.currX;
                        if (cn.currX > maxNx) maxNx = cn.currX;
                        if (cn.currY < minNy) minNy = cn.currY;
                        if (cn.currY > maxNy) maxNy = cn.currY;
                        validCount++;
                    }
                }

                if (validCount > 0 && minNx <= maxNx && minNy <= maxNy) {
                    const focusNx = (minNx + maxNx) * 0.5;
                    const focusNy = (minNy + maxNy) * 0.5;

                    // Margen dinámico para garantizar siempre pistas visibles
                    const marginX = Math.min(w * 0.35, 160);
                    const marginY = Math.min(h * 0.35, 160);

                    const minAllowedPanX = marginX - w * 0.5 - (maxNx - 0.5) * spanX * effScale;
                    const maxAllowedPanX = w * 0.5 - marginX - (minNx - 0.5) * spanX * effScale;
                    const minAllowedPanY = marginY - h * 0.5 - (maxNy - 0.5) * spanY * effScale;
                    const maxAllowedPanY = h * 0.5 - marginY - (minNy - 0.5) * spanY * effScale;

                    if (minAllowedPanX <= maxAllowedPanX) {
                        t.targetPanX = Math.max(minAllowedPanX, Math.min(maxAllowedPanX, t.targetPanX));
                    } else {
                        t.targetPanX = (0.5 - focusNx) * spanX * effScale;
                    }

                    if (minAllowedPanY <= maxAllowedPanY) {
                        t.targetPanY = Math.max(minAllowedPanY, Math.min(maxAllowedPanY, t.targetPanY));
                    } else {
                        t.targetPanY = (0.5 - focusNy) * spanY * effScale;
                    }
                }
            } else if (currentNodes.length === 0) {
                t.targetPanX = 0;
                t.targetPanY = 0;
            }

            if (!Number.isFinite(t.targetPanX)) t.targetPanX = 0;
            if (!Number.isFinite(t.targetPanY)) t.targetPanY = 0;
            if (!Number.isFinite(t.targetScale) || t.targetScale <= 0) t.targetScale = 1.0;
            if (!Number.isFinite(t.panX)) t.panX = t.targetPanX;
            if (!Number.isFinite(t.panY)) t.panY = t.targetPanY;
            if (!Number.isFinite(t.scale) || t.scale <= 0) t.scale = t.targetScale;

            t.panX += (t.targetPanX - t.panX) * 0.22;
            t.panY += (t.targetPanY - t.panY) * 0.22;
            t.scale += (t.targetScale - t.scale) * 0.22;
            const scale = t.scale;
            const panX = t.panX;
            const panY = t.panY;

            // Función para transformar coord normalizada [0..1] a pixel de pantalla
            const toScreen = (nx, ny) => {
                const cx = w / 2 + panX;
                const cy = h / 2 + panY;
                const sx = cx + (nx - 0.5) * (radialView ? Math.min(w, h) : w) * scale;
                const sy = cy + (ny - 0.5) * (radialView ? Math.min(w, h) : h) * scale;
                return { x: sx, y: sy };
            };

            // DIBUJAR CUADRÍCULA Y GUÍAS DE LA PROYECCIÓN
            ctx.lineWidth = 1;
            if (projectionMode === 'energy_dance') {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                // Líneas divisorias de cuadrantes
                const pCenter = toScreen(0.5, 0.5);
                ctx.beginPath();
                ctx.moveTo(toScreen(0.1, 0.5).x, pCenter.y);
                ctx.lineTo(toScreen(0.9, 0.5).x, pCenter.y);
                ctx.moveTo(pCenter.x, toScreen(0.5, 0.1).y);
                ctx.lineTo(pCenter.x, toScreen(0.5, 0.9).y);
                ctx.stroke();

                // Etiquetas sutiles de cuadrantes
                ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
                ctx.fillStyle = 'rgba(250, 250, 250, 0.16)';
                ctx.fillText('PEAK TIME  ·  E alta  ·  D alta', toScreen(0.60, 0.15).x, toScreen(0.60, 0.15).y);
                ctx.fillText('WARM-UP  ·  E baja  ·  D media', toScreen(0.12, 0.85).x, toScreen(0.12, 0.85).y);
                ctx.fillText('STEADY GROOVE  ·  E media  ·  D alta', toScreen(0.12, 0.15).x, toScreen(0.12, 0.15).y);
                ctx.fillText('DARK / HEAVY  ·  E alta  ·  D media', toScreen(0.58, 0.85).x, toScreen(0.58, 0.85).y);

                // Ejes
                ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
                ctx.fillText('ENERGÍA →', toScreen(0.85, 0.94).x, toScreen(0.85, 0.94).y);
                ctx.fillText('↑ BAILABILIDAD', toScreen(0.06, 0.08).x, toScreen(0.06, 0.08).y);
            } else if (projectionMode === 'bpm_energy') {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                [0.2, 0.4, 0.6, 0.8].forEach(pct => {
                    const sp = toScreen(pct, 0.5);
                    ctx.beginPath();
                    ctx.moveTo(sp.x, toScreen(pct, 0.1).y);
                    ctx.lineTo(sp.x, toScreen(pct, 0.9).y);
                    ctx.stroke();
                });
                ctx.font = '10px monospace';
                ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
                ctx.fillText('TEMPO (BPM) →', toScreen(0.82, 0.94).x, toScreen(0.82, 0.94).y);
                ctx.fillText('↑ ENERGÍA', toScreen(0.06, 0.08).x, toScreen(0.06, 0.08).y);
            } else if (projectionMode === 'camelot_wheel') {
                const cCenter = toScreen(0.5, 0.5);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
                // Círculos concéntricos de anillos Minor (A) y Major (B)
                const rInner = 0.32 * Math.min(w, h) * scale;
                const rOuter = 0.44 * Math.min(w, h) * scale;
                ctx.beginPath();
                ctx.arc(cCenter.x, cCenter.y, rInner, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cCenter.x, cCenter.y, rOuter, 0, Math.PI * 2);
                ctx.stroke();

                // 12 radios con etiquetas Camelot
                ctx.font = 'bold 9px monospace';
                for (let i = 1; i <= 12; i++) {
                    const ang = ((i - 1) / 12.0) * Math.PI * 2 - Math.PI / 2;
                    const cosA = Math.cos(ang);
                    const sinA = Math.sin(ang);
                    ctx.beginPath();
                    ctx.moveTo(cCenter.x + cosA * (rInner * 0.4), cCenter.y + sinA * (rInner * 0.4));
                    ctx.lineTo(cCenter.x + cosA * (rOuter * 1.15), cCenter.y + sinA * (rOuter * 1.15));
                    ctx.stroke();

                    const lblX = cCenter.x + cosA * (rOuter * 1.12);
                    const lblY = cCenter.y + sinA * (rOuter * 1.12);
                    const kColor = MAP_CAMELOT_COLORS[`${i}A`] || '#fff';
                    ctx.fillStyle = kColor;
                    ctx.fillText(`${i}A/B`, lblX - 10, lblY + 3);
                }
            }

            // ACTUALIZAR INTERPOLACIÓN SUAVE DE LOS NODOS
            const nodes = nodesRef.current;
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                n.currX += (n.targetX - n.currX) * 0.16;
                n.currY += (n.targetY - n.currY) * 0.16;
            }

            // TRAYECTORIAS ARMÓNICAS (ENLACES ENTRE COMPATIBLES)
            const activeRefTrack = hoveredTrack || selectedTrack;
            if (showHarmonicPaths && activeRefTrack && nodes.length > 0) {
                const refNode = nodes.find(n => n.id === activeRefTrack.id || n.track.id === activeRefTrack.id);
                if (refNode) {
                    const pRef = toScreen(refNode.currX, refNode.currY);
                    let drawnCount = 0;
                    const maxPaths = nodes.length > 400 ? 30 : 60;
                    for (let i = 0; i < nodes.length; i++) {
                        const n = nodes[i];
                        if (n.id === refNode.id) continue;
                        const match = calcHarmonicMixMatch(refNode.keyStr, n.keyStr, refNode.bpm, n.bpm);
                        if (match.isMatch) {
                            const pTarget = toScreen(n.currX, n.currY);
                            // Viewport culling de trayectoria
                            if (pTarget.x < -40 || pTarget.x > w + 40 || pTarget.y < -40 || pTarget.y > h + 40) continue;
                            ctx.beginPath();
                            ctx.moveTo(pRef.x, pRef.y);
                            ctx.lineTo(pTarget.x, pTarget.y);
                            ctx.strokeStyle = match.score >= 90 ? 'rgba(16, 185, 129, 0.45)' : 'rgba(6, 182, 212, 0.35)';
                            ctx.lineWidth = match.score >= 90 ? 2 : 1;
                            ctx.setLineDash([4, 4]);
                            ctx.stroke();
                            ctx.setLineDash([]);
                            drawnCount++;
                            if (drawnCount >= maxPaths) break;
                        }
                    }
                }
            }

            // DIBUJAR LOS NODOS (PISTAS) - MOTOR LOD (LEVEL OF DETAIL) & BATCH PARTICLES A 60 FPS
            const nowPlayingId = nowPlayingTrack ? (nowPlayingTrack.id || nowPlayingTrack.path || nowPlayingTrack.title) : null;
            const searchLower = searchQuery.trim().toLowerCase();
            const selectedIdsSet = new Set(selectedMapTracks.map(t => t.id || t.path || t.title));
            const isCrowded = nodes.length > 100;

            // FUNCIÓN DE RENDERIZADO EN ALTA DEFINICIÓN (CABINA / ZOOM DETALLADO)
            const renderDetailedNode = (node, pt, isNowPlaying, isHovered, isSelectedNode, opacity) => {
                const t = node.track;
                let nodeColor = '#06b6d4';
                if (colorMode === 'genre') {
                    nodeColor = MAP_GENRE_COLORS[node.genre] || '#38bdf8';
                } else if (colorMode === 'camelot') {
                    nodeColor = MAP_CAMELOT_COLORS[node.keyStr] || '#a855f7';
                } else if (colorMode === 'energy') {
                    const e = node.energy;
                    nodeColor = e >= 90 ? '#ef4444' : (e >= 75 ? '#f59e0b' : (e >= 50 ? '#06b6d4' : '#22d3ee'));
                } else if (colorMode === 'quality') {
                    const isFakeOrBad = t.es_fake || (t.calidad && String(t.calidad).includes('Baja'));
                    nodeColor = isFakeOrBad ? '#ef4444' : '#10b981';
                }

                const baseRadius = 10 + (node.energy / 100.0) * 7;

                // Radar Sonar pulsante en la pista que está reproduciéndose
                if (isNowPlaying) {
                    const pulseTime = (Date.now() % 1400) / 1400;
                    const pulseRadius = baseRadius + pulseTime * 28;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, pulseRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(6, 182, 212, ${1.0 - pulseTime})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Segundo pulso desfasado
                    const pulseTime2 = ((Date.now() + 700) % 1400) / 1400;
                    const pulseRadius2 = baseRadius + pulseTime2 * 28;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, pulseRadius2, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(245, 158, 11, ${1.0 - pulseTime2})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Halo de selección o hover
                if (isHovered || isSelectedNode) {
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, baseRadius + 6, 0, Math.PI * 2);
                    ctx.fillStyle = isSelectedNode ? 'rgba(251, 191, 36, 0.35)' : 'rgba(6, 182, 212, 0.4)';
                    ctx.fill();
                    ctx.strokeStyle = isSelectedNode ? '#fbbf24' : '#06b6d4';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Radio del círculo de la pista optimizado para visibilidad nítida de carátulas
                const zoomGain = Math.min(2.5, Math.max(0.85, Math.sqrt(scale)));
                const nodeRadius = (isHovered || isSelectedNode) ? (baseRadius + 6) * zoomGain : baseRadius * zoomGain;

                // Brillo radial enfocado en nodos prioritarios o de alta energía
                if (opacity === 1 && (isHovered || isSelectedNode || isNowPlaying || scale >= 1.5)) {
                    const glow = ctx.createRadialGradient(pt.x, pt.y, nodeRadius * 0.6, pt.x, pt.y, nodeRadius * 2.2);
                    glow.addColorStop(0, `${nodeColor}55`);
                    glow.addColorStop(1, `${nodeColor}00`);
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, nodeRadius * 2.2, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Carga progresiva por cola y visualización de carátulas para todos los nodos visibles
                const coverSrc = t.cover || t.cover_url || (t.path ? `/cover?path=${encodeURIComponent(t.path)}&thumb=96` : null);
                if (coverSrc && !imageCacheRef.current.has(coverSrc)) {
                    requestCoverThumbnail(coverSrc, isNowPlaying || isSelectedNode || isHovered);
                }

                const cachedAvatar = coverSrc ? imageCacheRef.current.get(coverSrc) : null;
                const hasAvatar = cachedAvatar && (cachedAvatar.width > 0 || cachedAvatar.naturalWidth > 0);

                if (hasAvatar) {
                    ctx.save();
                    ctx.globalAlpha = opacity;
                    // Blitting directo acelerado por GPU (textura pre-recortada circular a 60 FPS sin ctx.clip)
                    ctx.drawImage(cachedAvatar, pt.x - nodeRadius, pt.y - nodeRadius, nodeRadius * 2, nodeRadius * 2);
                    ctx.restore();

                    // Borde exterior coloreado según Camelot / Género / Calidad
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, nodeRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = isNowPlaying ? '#38bdf8' : (isSelectedNode ? '#fbbf24' : nodeColor);
                    ctx.lineWidth = isNowPlaying ? 2.8 : (isSelectedNode ? 2.5 : 1.6);
                    ctx.stroke();
                } else {
                    // Disco estilizado mientras carga la carátula o si no tiene
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, nodeRadius, 0, Math.PI * 2);
                    ctx.fillStyle = nodeColor;
                    ctx.globalAlpha = opacity;
                    ctx.fill();
                    ctx.lineWidth = isNowPlaying ? 2.8 : (isSelectedNode ? 2.5 : 1.4);
                    ctx.strokeStyle = isNowPlaying ? '#ffffff' : (isSelectedNode ? '#fbbf24' : 'rgba(0, 0, 0, 0.6)');
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;

                    // Núcleo vinilo estilizado
                    if (nodeRadius >= 9) {
                        ctx.beginPath();
                        ctx.arc(pt.x, pt.y, nodeRadius * 0.35, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
                        ctx.fill();
                    }
                }

                // Insignia táctica de texto para la pista activa o en reproducción
                if (isNowPlaying || isSelectedNode) {
                    ctx.font = 'bold 10px ui-monospace, SFMono-Regular, Menlo, monospace';
                    ctx.fillStyle = isNowPlaying ? '#22d3ee' : '#fbbf24';
                    const labelText = `${isNowPlaying ? '▶ ' : '★ '}${t.artist ? t.artist.slice(0, 14) : ''} - ${t.title ? t.title.slice(0, 18) : ''}`;
                    ctx.fillText(labelText, pt.x + nodeRadius + 5, pt.y + 3);
                }
            };

            // SELECCIÓN DE NIVEL DE DETALLE (LOD) SEGÚN ESCALA Y CANTIDAD DE PISTAS
            const isLODDistant = scale <= 1.25 || (scale <= 1.45 && nodes.length > 250);

            if (isLODDistant) {
                // NIVEL 1 (MACRO / CONSTELACIÓN): Renderizado en lotes agrupados por paleta
                const particleBuckets = {};
                const heroNodes = [];

                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];
                    const pt = toScreen(node.currX, node.currY);
                    if (pt.x < -20 || pt.x > w + 20 || pt.y < -20 || pt.y > h + 20) continue;

                    const t = node.track;
                    const isNowPlaying = Boolean(nowPlayingTrack && (
                        nowPlayingTrack.id === t.id ||
                        (nowPlayingTrack.path && t.path && nowPlayingTrack.path === t.path) ||
                        (nowPlayingTrack.title === t.title && nowPlayingTrack.artist === t.artist)
                    ));
                    const isHovered = hoveredTrack && (hoveredTrack.id === t.id || hoveredTrack.title === t.title);
                    const isSelectedNode = (selectedTrack && (selectedTrack.id === t.id || selectedTrack.title === t.title)) || selectedIdsSet.has(node.id);

                    if (isNowPlaying || isHovered || isSelectedNode) {
                        heroNodes.push({ node, pt, isNowPlaying, isHovered, isSelectedNode });
                        continue;
                    }

                    // Filtros
                    if (searchLower) {
                        const textContent = `${t.title} ${t.artist} ${node.genre} ${node.keyStr}`.toLowerCase();
                        if (!textContent.includes(searchLower)) continue;
                    }
                    if (selectedKeyFilter !== 'ALL' && node.keyStr !== selectedKeyFilter) {
                        continue;
                    }
                    const eValLOD = node.energy;
                    const dValLOD = node.danceability;
                    const iValLOD = Number(t.arousal || t.intensity || Math.round(eValLOD * 0.95)) || 0;
                    const vValLOD = Number(t.valence != null ? t.valence : (node.keyStr.includes('B') ? 65 : 45)) || 0;
                    if (eValLOD < filterMinEnergy || dValLOD < filterMinDance || iValLOD < filterMinIntensity || vValLOD < filterMinValence) {
                        continue;
                    }
                    if (filterQualityMode === 'lossless') {
                        const isLossless = ['flac', 'wav', 'aiff'].includes((t.extension || t.tipo || '').toLowerCase()) || (t.bitrate_kbps && t.bitrate_kbps > 1000);
                        if (!isLossless) continue;
                    } else if (filterQualityMode === 'nofake') {
                        const isBad = t.es_fake || (t.calidad && String(t.calidad).includes('Baja'));
                        if (isBad) continue;
                    }

                    let nodeColor = '#06b6d4';
                    if (colorMode === 'genre') {
                        nodeColor = MAP_GENRE_COLORS[node.genre] || '#38bdf8';
                    } else if (colorMode === 'camelot') {
                        nodeColor = MAP_CAMELOT_COLORS[node.keyStr] || '#a855f7';
                    } else if (colorMode === 'energy') {
                        const e = node.energy;
                        nodeColor = e >= 90 ? '#ef4444' : (e >= 75 ? '#f59e0b' : (e >= 50 ? '#06b6d4' : '#22d3ee'));
                    } else if (colorMode === 'quality') {
                        const isFakeOrBad = t.es_fake || (t.calidad && String(t.calidad).includes('Baja'));
                        nodeColor = isFakeOrBad ? '#ef4444' : '#10b981';
                    }

                    // Modulación de tamaño según energía acústica
                    const eNorm = (node.energy || 50) / 100.0;
                    let r = 2.0 + eNorm * 2.8;

                    // Pulso dinámico en temas Clímax (Energía >= 85%) para localizarlos a simple vista
                    if (node.energy >= 85) {
                        const pulse = 1.0 + Math.sin(Date.now() * 0.004 + (node.id || 0)) * 0.28;
                        r *= pulse;
                    }

                    if (!particleBuckets[nodeColor]) particleBuckets[nodeColor] = [];
                    particleBuckets[nodeColor].push({ x: pt.x, y: pt.y, r });
                }

                // Dibujado ultra-rápido en lotes (1 única llamada fill por color)
                for (const [color, pList] of Object.entries(particleBuckets)) {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    for (let j = 0; j < pList.length; j++) {
                        const p = pList[j];
                        ctx.moveTo(p.x + p.r, p.y);
                        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    }
                    ctx.fill();
                }

                // Renderizar los nodos "Hero" (activos, seleccionados o con hover) en alta definición sobre el lienzo
                heroNodes.forEach(item => {
                    renderDetailedNode(item.node, item.pt, item.isNowPlaying, item.isHovered, item.isSelectedNode, 1.0);
                });
            } else {
                // NIVEL 2 (CABINA / DETALLE): Renderizado en alta definición con viewport culling
                nodes.forEach(node => {
                    const pt = toScreen(node.currX, node.currY);
                    if (pt.x < -30 || pt.x > w + 30 || pt.y < -30 || pt.y > h + 30) return;

                    const t = node.track;
                    const isNowPlaying = Boolean(nowPlayingTrack && (
                        nowPlayingTrack.id === t.id ||
                        (nowPlayingTrack.path && t.path && nowPlayingTrack.path === t.path) ||
                        (nowPlayingTrack.title === t.title && nowPlayingTrack.artist === t.artist)
                    ));
                    const isHovered = hoveredTrack && (hoveredTrack.id === t.id || hoveredTrack.title === t.title);
                    const isSelectedNode = (selectedTrack && (selectedTrack.id === t.id || selectedTrack.title === t.title)) || selectedIdsSet.has(node.id);

                    // Filtros
                    let matchesSearch = true;
                    if (searchLower) {
                        const textContent = `${t.title} ${t.artist} ${node.genre} ${node.keyStr}`.toLowerCase();
                        matchesSearch = textContent.includes(searchLower);
                    }
                    let matchesKey = true;
                    if (selectedKeyFilter !== 'ALL') {
                        matchesKey = node.keyStr === selectedKeyFilter;
                    }
                    const eVal = node.energy;
                    const dVal = node.danceability;
                    const iVal = Number(t.arousal || t.intensity || Math.round(eVal * 0.95)) || 0;
                    const vVal = Number(t.valence != null ? t.valence : (node.keyStr.includes('B') ? 65 : 45)) || 0;
                    let matchesQuality = true;
                    if (filterQualityMode === 'lossless') {
                        matchesQuality = ['flac', 'wav', 'aiff'].includes((t.extension || t.tipo || '').toLowerCase()) || (t.bitrate_kbps && t.bitrate_kbps > 1000);
                    } else if (filterQualityMode === 'nofake') {
                        matchesQuality = !t.es_fake && !(t.calidad && String(t.calidad).includes('Baja'));
                    }
                    const matchesAcoustics = (eVal >= filterMinEnergy) &&
                                             (dVal >= filterMinDance) &&
                                             (iVal >= filterMinIntensity) &&
                                             (vVal >= filterMinValence) &&
                                             matchesQuality;

                    const opacity = (matchesSearch && matchesKey && matchesAcoustics) ? 1.0 : 0.08;

                    renderDetailedNode(node, pt, isNowPlaying, isHovered, isSelectedNode, opacity);
                });
            }

            // DIBUJAR TRAZADO DE SELECCIÓN (LASSO O CAJA)
            const sel = selectionRef.current;
            if (sel.isSelecting) {
                if (toolMode === 'lasso' && sel.points.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(sel.points[0].x, sel.points[0].y);
                    for (let i = 1; i < sel.points.length; i++) {
                        ctx.lineTo(sel.points[i].x, sel.points[i].y);
                    }
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([4, 3]);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
                    ctx.fill();
                    ctx.setLineDash([]);
                } else if (toolMode === 'box' && sel.boxStart && sel.points.length > 0) {
                    const start = sel.boxStart;
                    const end = sel.points[sel.points.length - 1];
                    const bx = Math.min(start.x, end.x);
                    const by = Math.min(start.y, end.y);
                    const bw = Math.abs(end.x - start.x);
                    const bh = Math.abs(end.y - start.y);
                    ctx.beginPath();
                    ctx.rect(bx, by, bw, bh);
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([4, 3]);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
                    ctx.fill();
                    ctx.setLineDash([]);
                }
            }

            ctx.restore();
            animRef.current = requestAnimationFrame(render);
        };

        animRef.current = requestAnimationFrame(render);
        return () => {
            isRunning = false;
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [isWorkspaceActive, projectionMode, colorMode, toolMode, hoveredTrack, selectedTrack, nowPlayingTrack, showHarmonicPaths, searchQuery, selectedKeyFilter, selectedMapTracks, filterMinEnergy, filterMinDance, filterMinIntensity, filterMinValence, filterQualityMode]);

    // Función auxiliar para punto dentro de polígono (Ray Casting)
    const isPointInPoly = (px, py, poly) => {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].x, yi = poly[i].y;
            const xj = poly[j].x, yj = poly[j].y;
            const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    // MANEJADORES DE RATÓN Y GESTOS
    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (toolMode === 'pan') {
            transformRef.current.isDragging = true;
            transformRef.current.isContinuousPanning = false;
            transformRef.current.dragStartX = mouseX - transformRef.current.targetPanX;
            transformRef.current.dragStartY = mouseY - transformRef.current.targetPanY;
            setIsPanning(true);
        } else if (toolMode === 'lasso') {
            selectionRef.current.isSelecting = true;
            selectionRef.current.points = [{ x: mouseX, y: mouseY }];
        } else if (toolMode === 'box') {
            selectionRef.current.isSelecting = true;
            selectionRef.current.boxStart = { x: mouseX, y: mouseY };
            selectionRef.current.points = [{ x: mouseX, y: mouseY }];
        }
    };

    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        mousePosRef.current = { x: e.clientX, y: e.clientY };
        if (tooltipRef.current) {
            const left = Math.min(window.innerWidth - 280, e.clientX + 16);
            const top = Math.min(window.innerHeight - 200, e.clientY + 16);
            tooltipRef.current.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        }

        if (toolMode === 'pan' && transformRef.current.isDragging) {
            const nx = mouseX - transformRef.current.dragStartX;
            const ny = mouseY - transformRef.current.dragStartY;
            transformRef.current.targetPanX = nx;
            transformRef.current.targetPanY = ny;
            transformRef.current.panX = nx;
            transformRef.current.panY = ny;
            return;
        }

        if (selectionRef.current.isSelecting) {
            selectionRef.current.points.push({ x: mouseX, y: mouseY });
            return;
        }

        // Búsqueda de nodo bajo el puntero (Hit-Testing de alto rendimiento con Spatial Grid O(1))
        const w = rect.width;
        const h = rect.height;
        const { scale, panX, panY } = transformRef.current;
        const toScreen = (nx, ny) => {
            const cx = w / 2 + panX;
            const cy = h / 2 + panY;
            const side = radialView ? Math.min(w, h) : null;
            return { x: cx + (nx - 0.5) * (side || w) * scale, y: cy + (ny - 0.5) * (side || h) * scale };
        };

        if (mouseRafRef.current) cancelAnimationFrame(mouseRafRef.current);
        mouseRafRef.current = requestAnimationFrame(() => {
            let found = null;
            let minDist = Math.max(16, 14 * Math.min(2.4, Math.max(0.8, Math.sqrt(scale))));
            const nodes = nodesRef.current;
            const grid = spatialGridRef.current;

            if (grid && nodes.length > 100) {
                const side = radialView ? Math.min(w, h) : null;
                const normX = (mouseX - (w / 2 + panX)) / ((side || w) * scale) + 0.5;
                const normY = (mouseY - (h / 2 + panY)) / ((side || h) * scale) + 0.5;
                const GRID_DIVS = 32;
                const gx = Math.floor(normX * GRID_DIVS);
                const gy = Math.floor(normY * GRID_DIVS);

                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const cellNodes = grid.get(`${gx + dx}_${gy + dy}`);
                        if (cellNodes) {
                            for (let i = 0; i < cellNodes.length; i++) {
                                const n = cellNodes[i];
                                const pt = toScreen(n.currX, n.currY);
                                const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
                                if (dist < minDist) {
                                    minDist = dist;
                                    found = n.track;
                                }
                            }
                        }
                    }
                }
            } else {
                for (let i = 0; i < nodes.length; i++) {
                    const n = nodes[i];
                    const pt = toScreen(n.currX, n.currY);
                    const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
                    if (dist < minDist) {
                        minDist = dist;
                        found = n.track;
                    }
                }
            }

            setHoveredTrack(prev => (prev?.id === found?.id && prev?.title === found?.title ? prev : found));
        });
    };

    const handleMouseUp = () => {
        if (toolMode === 'pan') {
            transformRef.current.isDragging = false;
            setIsPanning(false);
        } else if (selectionRef.current.isSelecting) {
            selectionRef.current.isSelecting = false;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            const { scale, panX, panY } = transformRef.current;
            const toScreen = (nx, ny) => {
                const cx = w / 2 + panX;
                const cy = h / 2 + panY;
                const side = radialView ? Math.min(w, h) : null;
            return { x: cx + (nx - 0.5) * (side || w) * scale, y: cy + (ny - 0.5) * (side || h) * scale };
            };

            const selPoints = selectionRef.current.points;
            const selected = [];

            if (toolMode === 'lasso' && selPoints.length >= 3) {
                nodesRef.current.forEach(n => {
                    const pt = toScreen(n.currX, n.currY);
                    if (isPointInPoly(pt.x, pt.y, selPoints)) {
                        selected.push(n.track);
                    }
                });
            } else if (toolMode === 'box' && selectionRef.current.boxStart && selPoints.length > 0) {
                const start = selectionRef.current.boxStart;
                const end = selPoints[selPoints.length - 1];
                const bx = Math.min(start.x, end.x);
                const by = Math.min(start.y, end.y);
                const bw = Math.abs(end.x - start.x);
                const bh = Math.abs(end.y - start.y);

                nodesRef.current.forEach(n => {
                    const pt = toScreen(n.currX, n.currY);
                    if (pt.x >= bx && pt.x <= bx + bw && pt.y >= by && pt.y <= by + bh) {
                        selected.push(n.track);
                    }
                });
            }

            if (selected.length > 0) {
                setSelectedMapTracks(selected);
            }
            selectionRef.current.points = [];
            selectionRef.current.boxStart = null;
        }
    };

    // Zoom cinemático suave y exacto con rueda/trackpad anclado al puntero (60 FPS sin bloqueos)
    const handleWheel = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (w <= 0 || h <= 0) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const tr = transformRef.current;
        tr.isContinuousPanning = false;

        // Calibración adaptativa: clamping de deltaY para soportar tanto rueda física como trackpad de macOS
        const delta = Math.max(-100, Math.min(100, e.deltaY));
        const zoomFactor = Math.exp(-delta * 0.0022);

        const oldScale = tr.targetScale || tr.scale || 1.0;
        const newScale = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, oldScale * zoomFactor));
        if (Math.abs(newScale - oldScale) < 0.0001) return;

        const ratio = newScale / oldScale;
        // Invariante geométrico exacto: el punto del mapa situado bajo el cursor permanece fijo
        tr.targetPanX = (mouseX - w / 2) - (mouseX - w / 2 - tr.targetPanX) * ratio;
        tr.targetPanY = (mouseY - h / 2) - (mouseY - h / 2 - tr.targetPanY) * ratio;
        tr.targetScale = newScale;

        // Desacoplar la actualización de estado de React (throttle a 80ms + trailing) para no saturar el hilo principal
        if (zoomTrailingRef.current) clearTimeout(zoomTrailingRef.current);
        zoomTrailingRef.current = setTimeout(() => {
            setZoomDisplay(transformRef.current.targetScale);
        }, 120);

        if (!zoomThrottleRef.current) {
            zoomThrottleRef.current = setTimeout(() => {
                setZoomDisplay(transformRef.current.targetScale);
                zoomThrottleRef.current = null;
            }, 80);
        }
    }, []);

    // Listener nativo no-pasivo en canvas para prevenir overscroll del navegador y garantizar 60 FPS
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const onWheelNative = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleWheel(e);
        };
        canvas.addEventListener('wheel', onWheelNative, { passive: false });
        return () => {
            canvas.removeEventListener('wheel', onWheelNative);
        };
    }, [handleWheel]);

    // Clic en nodo: Solo SELECCIONAR pista e iluminar su tonalidad en la Rueda Camelot. NO reproducir hasta dar al Play.
    const handleClick = () => {
        if (hoveredTrack) {
            setSelectedTrack(hoveredTrack);
        }
    };

    const handleResetZoom = () => {
        handleAutoFrame(1.0);
    };

    // Auto-enmarcar tracks activos al cambiar proyección o cargar pistas
    useEffect(() => {
        const timer = setTimeout(() => {
            handleAutoFrame();
        }, 120);
        return () => clearTimeout(timer);
    }, [projectionMode, activeTracks.length, handleAutoFrame]);

    const mapStats = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const vis = activeTracks.filter(t => {
            const k = (t.key || t.k || '8A').toUpperCase();
            if (selectedKeyFilter !== 'ALL' && k !== selectedKeyFilter) return false;

            const eVal = Math.max(10, Math.min(100, parseInt(t.energy !== undefined ? t.energy : (t.e || 75), 10)));
            if (eVal < filterMinEnergy) return false;

            const dVal = Math.max(10, Math.min(100, parseInt(t.danceability !== undefined ? t.danceability : (t.dance || 80), 10)));
            if (dVal < filterMinDance) return false;

            const iVal = Number(t.arousal || t.intensity || Math.round(eVal * 0.95)) || 0;
            if (iVal < filterMinIntensity) return false;

            const vVal = Number(t.valence != null ? t.valence : (k.includes('B') ? 65 : 45)) || 0;
            if (vVal < filterMinValence) return false;

            if (filterQualityMode === 'lossless') {
                const isLossless = ['flac', 'wav', 'aiff'].includes((t.extension || t.tipo || '').toLowerCase()) || (t.bitrate_kbps && t.bitrate_kbps > 1000);
                if (!isLossless) return false;
            } else if (filterQualityMode === 'nofake') {
                const isBad = t.es_fake || (t.calidad && String(t.calidad).includes('Baja'));
                if (isBad) return false;
            }

            if (!q) return true;
            return `${t.title} ${t.artist} ${t.genre || t.genero || ''} ${k}`.toLowerCase().includes(q);
        });
        const bpms = vis.map(t => parseFloat(t.bpm || t.b)).filter(b => b > 40 && b < 250);
        const ens = vis.map(t => parseInt(t.energy !== undefined ? t.energy : (t.e || 75), 10)).filter(n => !isNaN(n));
        return {
            visible: vis.length,
            avgBpm: bpms.length ? Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length) : 0,
            avgEnergy: ens.length ? Math.round(ens.reduce((a, b) => a + b, 0) / ens.length) : 0,
            keyCount: new Set(vis.map(t => (t.key || t.k || '').toUpperCase()).filter(Boolean)).size,
        };
    }, [activeTracks, searchQuery, selectedKeyFilter, filterMinEnergy, filterMinDance, filterMinIntensity, filterMinValence, filterQualityMode]);

    // Métricas del grupo seleccionado mediante Lasso / Caja
    const selBpmAvg = selectedMapTracks.length > 0
        ? Math.round(selectedMapTracks.reduce((acc, t) => acc + (parseFloat(t.bpm || t.b) || 126), 0) / selectedMapTracks.length)
        : 126;

    const selEnergyAvg = selectedMapTracks.length > 0
        ? Math.round(selectedMapTracks.reduce((acc, t) => acc + (parseInt(t.energy !== undefined ? t.energy : (t.e || 75), 10)), 0) / selectedMapTracks.length)
        : 80;

    return (
        <div className="ws-module ws-mod-map w-full h-full flex flex-col bg-[#09090b] text-zinc-300 overflow-hidden relative select-none font-sans">
            {/* BARRA SUPERIOR DE HERRAMIENTAS Y CONTROLES DEL MAPA */}
            <div className="p-2.5 sm:px-4 bg-[var(--bw-surface-1)] border-b border-[var(--bw-line)] flex flex-wrap items-center justify-between gap-2.5 shrink-0 z-20 backdrop-blur-md">
                {/* LADO IZQUIERDO: TÍTULO Y SELECTOR DE PROYECCIÓN ESPACIAL */}
                <div className="flex items-center gap-3">
                    <SectionTitle icon={Icons.Map} title="Map" accent="Scatter" badge="2D" />

                    {/* SELECTOR DE PROYECCIÓN DE COORDENADAS CON DS 3.0 */}
                    <div className="ws-seg" role="group" aria-label="Proyección espacial">
                        {[
                            { id: 'energy_dance', label: 'Energía / Dance', title: 'X: Energía (0-100%) vs Y: Bailabilidad (0-100%)' },
                            { id: 'bpm_energy', label: 'BPM / Energía', title: 'X: Tempo BPM vs Y: Nivel de Energía' },
                            { id: 'camelot_wheel', label: 'Rueda Camelot', title: 'Proyección Radial Armónica 12 Slices Camelot 2D' },
                            { id: 'acoustic_clusters', label: 'Clusters AI', title: 'Agrupación Multi-dimensional por Género y Timbre' }
                        ].map(proj => (
                            <button
                                key={proj.id}
                                type="button"
                                onClick={() => setProjectionMode(proj.id)}
                                className={`ws-seg-btn ${projectionMode === proj.id ? 'ws-seg-on' : ''}`}
                                aria-pressed={projectionMode === proj.id}
                                title={proj.title}
                            >
                                {proj.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CENTRO: MODO DE COLOR Y HERRAMIENTA ACTIVA (PAN / LASSO / BOX) */}
                <div className="flex items-center gap-2">
                    {/* SELECTOR DE PALETA DE COLOR */}
                    <div className="ws-seg hidden lg:inline-flex" role="group" aria-label="Métrica de color">
                        <span className="ws-seg-label">Color</span>
                        {[
                            { id: 'genre', label: 'Género' },
                            { id: 'camelot', label: 'Camelot' },
                            { id: 'energy', label: 'Energía' },
                            { id: 'quality', label: 'Calidad' }
                        ].map(c => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setColorMode(c.id)}
                                className={`ws-seg-btn ${colorMode === c.id ? 'ws-seg-on' : ''}`}
                                aria-pressed={colorMode === c.id}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>

                    {/* SELECTOR DE HERRAMIENTA: NAVEGAR vs LASSO SPATIAL COLLECT */}
                    <div className="ws-seg" role="group" aria-label="Herramienta de selección">
                        <button
                            type="button"
                            onClick={() => setToolMode('pan')}
                            className={`ws-seg-btn ${toolMode === 'pan' ? 'ws-seg-on' : ''}`}
                            aria-pressed={toolMode === 'pan'}
                            title="Modo Navegar: Arrastra el fondo para moverte y usa la rueda para hacer zoom"
                        >
                            <Icons.Target size={13} /> <span className="hidden sm:inline">Navegar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setToolMode('lasso')}
                            className={`ws-seg-btn ${toolMode === 'lasso' ? 'ws-seg-on' : ''}`}
                            aria-pressed={toolMode === 'lasso'}
                            title="Herramienta Lasso: Dibuja a mano alzada para capturar una zona de pistas"
                        >
                            <Icons.Pencil size={13} /> <span>Lasso</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setToolMode('box')}
                            className={`ws-seg-btn ${toolMode === 'box' ? 'ws-seg-on' : ''}`}
                            aria-pressed={toolMode === 'box'}
                            title="Herramienta Caja: Haz clic y arrastra un rectángulo para seleccionar un grupo"
                        >
                            <Icons.Grid size={13} /> <span className="hidden sm:inline">Caja</span>
                        </button>
                    </div>
                </div>

                {/* LADO DERECHO: BUSCADOR EN VIVO Y CONTROLES */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            if (onNavigateTab) onNavigateTab('setbuilder');
                        }}
                        className="ws-btn ws-btn-outline"
                        title="Ir a Set Builder para generar el flujo de sesión en Grafo DAG (DJOID Graph Playlists)"
                    >
                        <Icons.Flow size={14} />
                        <span className="hidden md:inline">Graph Playlists</span>
                    </button>
                    {/* BUSCADOR */}
                    <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-zinc-500 pointer-events-none flex items-center">
                            <Icons.Search size={13} />
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar en el mapa"
                            className="w-32 sm:w-44 bg-[var(--bw-surface-2)] border border-[var(--bw-line-strong)] rounded-lg pl-7 pr-6 py-1 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-cyan-400"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 text-xs text-zinc-400 hover:text-white cursor-pointer px-1"
                                title="Borrar búsqueda"
                            >
                                <Icons.Close size={12} />
                            </button>
                        )}
                    </div>

                    {/* TOGGLE TRAYECTORIAS ARMÓNICAS */}
                    <button
                        type="button"
                        onClick={() => setShowHarmonicPaths(prev => !prev)}
                        className={`ws-btn ${showHarmonicPaths ? 'ws-btn-active' : 'ws-btn-outline'} px-2`}
                        title={showHarmonicPaths ? "Ocultar líneas de mezcla armónica" : "Mostrar enlaces armónicos entre pistas compatibles"}
                    >
                        <Icons.Zap size={13} />
                    </button>

                    {/* CARGAR CARPETAS / COLECCIÓN EN MAPA */}
                    <button
                        type="button"
                        onClick={() => setFsBrowserOpen(true)}
                        className="ws-btn ws-btn-outline px-2 text-cyan-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        title="Explorar carpetas o importar colección al mapa"
                    >
                        <Icons.Folder size={13} />
                        <span className="hidden lg:inline text-[11px] font-mono font-bold">Cargar</span>
                    </button>

                    {/* RECENTRAR Y ENMARCAR TRACKS */}
                    <button
                        type="button"
                        onClick={() => handleAutoFrame()}
                        className="ws-btn ws-btn-outline px-2.5 text-cyan-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
                        title="Recentrar y enmarcar todos los tracks activos en pantalla"
                    >
                        <ShellIcons.Target size={13} />
                        <span className="hidden md:inline text-[11px] font-mono font-bold">Enmarcar</span>
                    </button>

                    {/* TOGGLE CONSOLA ACÚSTICA DERECHA */}
                    <button
                        type="button"
                        onClick={() => setIsMapConsoleOpen(prev => !prev)}
                        className={`ws-btn ${isMapConsoleOpen ? 'ws-btn-active' : 'ws-btn-outline'} px-2.5 flex items-center gap-1.5 cursor-pointer`}
                        title={isMapConsoleOpen ? "Ocultar Consola Acústica lateral" : "Mostrar Consola Acústica lateral y controles del mapa"}
                        aria-expanded={isMapConsoleOpen}
                    >
                        <ShellIcons.Sliders size={13} />
                        <span className="hidden sm:inline text-[11px] font-mono font-bold">Consola</span>
                        <span className="text-[10px] font-mono opacity-80">({mapStats.visible})</span>
                    </button>
                </div>
            </div>

            {/* CONTENEDOR FLEX: ZONA CENTRAL DEL MAPA + CONSOLA DERECHA UNIFICADA */}
            <div className="flex-1 w-full min-h-0 flex overflow-hidden relative">
                {/* ZONA CENTRAL DEL MAPA INTERACTIVO */}
                <div ref={containerRef} className="flex-1 h-full relative overflow-hidden bg-black">
                <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => { if (transformRef.current.isDragging) handleMouseUp(); setHoveredTrack(null); }}
                    onClick={handleClick}
                    className={`w-full h-full block ${
                        toolMode === 'pan'
                            ? (isPanning ? 'cursor-grabbing' : 'cursor-grab')
                            : 'cursor-crosshair'
                    }`}
                />

                {!isMapConsoleOpen && (
                    <>
                        <div className="absolute top-3 left-3 z-30 select-none">
                            <MapCamelotOverlay
                                open={isCamelotWheelOpen}
                                onToggle={() => setIsCamelotWheelOpen(prev => !prev)}
                                selectedKey={selectedTrack ? (selectedTrack.key || selectedTrack.k || '8A').toUpperCase() : null}
                                keyFilter={selectedKeyFilter}
                                onFilter={(k) => setSelectedKeyFilter(prev => prev === k ? 'ALL' : k)}
                                colors={MAP_CAMELOT_COLORS}
                                isMatch={(a, b) => calcHarmonicMixMatch(a, b).isMatch}
                            />
                        </div>

                        <div className="absolute top-3 right-3 z-30 select-none">
                            <MapNavOverlay
                                open={isNavOverlayOpen}
                                onToggle={() => setIsNavOverlayOpen(prev => !prev)}
                                zoom={zoomDisplay}
                                onZoom={handleFaderZoom}
                                onReset={handleResetZoom}
                                startPan={startPan}
                                stopPan={stopPan}
                            />
                        </div>
                    </>
                )}

                {activeTracks.length > 0 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 select-none pointer-events-none">
                        <MapStatsHud
                            visible={mapStats.visible}
                            total={activeTracks.length}
                            avgBpm={mapStats.avgBpm}
                            avgEnergy={mapStats.avgEnergy}
                            keyCount={mapStats.keyCount}
                            selected={selectedMapTracks.length}
                        />
                    </div>
                )}

                {/* BANNER INFORMATIVO SI LA BIBLIOTECA ESTÁ VACÍA */}
                {activeTracks.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm z-30">
                        <div className="max-w-md w-full bg-[var(--bw-surface-1)] border border-[var(--bw-line-strong)] p-6 rounded-xl shadow-2xl text-center">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[var(--bw-cyan)] mx-auto mb-3.5 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                                <Icons.Map size={24} />
                            </div>
                            <h3 className="font-syne font-bold text-base text-white mb-1.5 uppercase tracking-wide">
                                Paisaje Espacial de Cabina
                            </h3>
                            <p className="text-xs text-zinc-400 font-mono mb-5 leading-relaxed">
                                Scatter Map posiciona cada pista según su energía, danza, BPM y tonalidad. La proximidad espacial revela qué temas mezclan naturalmente juntos.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => setUseDemo(true)}
                                    className="ws-btn ws-btn-primary w-full justify-center h-9 text-xs"
                                >
                                    <Icons.Zap size={14} />
                                    <span>Cargar Demo Electrónica (16 Tracks)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFsBrowserOpen(true)}
                                    className="ws-btn ws-btn-outline w-full justify-center h-9 text-xs"
                                >
                                    <Icons.Folder size={14} />
                                    <span>Elegir Carpeta o Pistas</span>
                                </button>
                                <div className="flex items-center gap-1.5 w-full">
                                    <button
                                        type="button"
                                        onClick={() => handleCargarColeccion()}
                                        className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-mono font-bold flex-1 flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer"
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
                                            <option value="" disabled>Biblioteca...</option>
                                            {customLibraries.map(lib => (
                                                <option key={lib.id} value={lib.id}>
                                                    {lib.name} ({lib.folders?.reduce((acc, f) => acc + (f.tracks?.length || 0), 0) || 0} pistas)
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* HUD FLOTANTE TRASLÚCIDO AL PASAR EL RATÓN SOBRE UNA PISTA */}
                {hoveredTrack && (
                    <div
                        ref={tooltipRef}
                        className="fixed pointer-events-none z-50 bg-[#0c0d16]/95 border border-djzinc-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-xl max-w-xs animate-fadeIn font-mono text-xs top-0 left-0"
                        style={{
                            transform: `translate3d(${Math.min(window.innerWidth - 280, mousePosRef.current.x + 16)}px, ${Math.min(window.innerHeight - 200, mousePosRef.current.y + 16)}px, 0)`
                        }}
                    >
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-djzinc-800 shrink-0 border border-djzinc-700/60 shadow">
                                {hoveredTrack.cover ? (
                                    <img src={hoveredTrack.cover} alt="Cover" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs"><Icons.Music size={14} className="inline-block align-[-2px]" /></div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-bold text-white text-xs truncate">
                                    {hoveredTrack.artist || 'Desconocido'}
                                </div>
                                <div className="text-djcyan-300 font-medium text-[11px] truncate">
                                    {hoveredTrack.title || 'Sin Título'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-djzinc-900/80 p-2 rounded-lg border border-djzinc-800 mb-2">
                            <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded flex items-center justify-center font-black text-black text-[9px]" style={{ backgroundColor: MAP_CAMELOT_COLORS[hoveredTrack.key || '8A'] || '#06b6d4' }}>
                                    {hoveredTrack.key || '8A'}
                                </span>
                                <span className="text-gray-300 font-bold">{hoveredTrack.bpm ? parseFloat(hoveredTrack.bpm).toFixed(1) : '126.0'} BPM</span>
                            </div>
                            <div className="flex items-center justify-end text-gray-400 truncate">
                                <span>{hoveredTrack.genre || 'Tech House'}</span>
                            </div>
                        </div>

                        <div className="space-y-1 mb-2">
                            <div className="flex items-center justify-between text-[9px]">
                                <span className="text-gray-400"><Icons.Zap size={14} className="inline-block align-[-2px]" /> Energía</span>
                                <span className="text-amber-400 font-bold">{hoveredTrack.energy !== undefined ? hoveredTrack.energy : 80}%</span>
                            </div>
                            <div className="w-full h-1 bg-djzinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" style={{ width: `${hoveredTrack.energy !== undefined ? hoveredTrack.energy : 80}%` }}></div>
                            </div>
                        </div>

                        <div className="text-[9px] text-djcyan-400 text-center font-bold">
                            Clic para seleccionar y ver posición Camelot
                        </div>
                    </div>
                )}

                {/* TARJETA HUD FLOTANTE DE PISTA SELECCIONADA CON REPRODUCTOR MANUAL (Solo si consola lateral cerrada) */}
                {!isMapConsoleOpen && selectedTrack && (
                    <div className="absolute bottom-4 right-4 z-40 bg-[#0c0d16]/95 border border-djcyan-500/60 p-4 rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.3)] backdrop-blur-xl max-w-sm w-full font-mono animate-slideUp">
                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-djzinc-800">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-djcyan-400 animate-pulse"></span>
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Pista Seleccionada</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTrack(null)}
                                className="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-djzinc-800 cursor-pointer"
                                title="Cerrar detalles"
                            >
                                <Icons.Close size={14} className="inline-block align-[-2px]" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-djzinc-800 shrink-0 border border-djzinc-700 shadow-md">
                                {(selectedTrack.cover || selectedTrack.cover_url || selectedTrack.path) ? (
                                    <img 
                                        src={selectedTrack.cover || selectedTrack.cover_url || `/cover?path=${encodeURIComponent(selectedTrack.path)}`} 
                                        alt="Cover" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm"><Icons.Music size={14} className="inline-block align-[-2px]" /></div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-bold text-white text-sm truncate" title={selectedTrack.artist}>
                                    {selectedTrack.artist || 'Desconocido'}
                                </div>
                                <div className="text-djcyan-300 font-medium text-xs truncate" title={selectedTrack.title}>
                                    {selectedTrack.title || 'Sin Título'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[10px] bg-djzinc-900/90 p-2.5 rounded-xl border border-djzinc-800 mb-3">
                            <div className="flex flex-col items-center">
                                <span className="text-gray-500 uppercase text-[9px]">Tonalidad</span>
                                <span 
                                    className="mt-0.5 px-2 py-0.5 rounded font-black text-black text-[10px]"
                                    style={{ backgroundColor: MAP_CAMELOT_COLORS[(selectedTrack.key || '8A').toUpperCase()] || '#06b6d4' }}
                                >
                                    {(selectedTrack.key || '8A').toUpperCase()}
                                </span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-gray-500 uppercase text-[9px]">Tempo</span>
                                <span className="mt-0.5 text-white font-bold">{selectedTrack.bpm ? parseFloat(selectedTrack.bpm).toFixed(1) : '126.0'} BPM</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-gray-500 uppercase text-[9px]">Energía</span>
                                <span className="mt-0.5 text-amber-300 font-bold">{selectedTrack.energy !== undefined ? selectedTrack.energy : 80}%</span>
                            </div>
                        </div>

                        {/* Botones de Acción: Reproducir Manualmente & Añadir a Set */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const isCur = Boolean(nowPlayingTrack && (
                                        nowPlayingTrack.id === selectedTrack.id ||
                                        (nowPlayingTrack.path && selectedTrack.path && nowPlayingTrack.path === selectedTrack.path) ||
                                        (nowPlayingTrack.title === selectedTrack.title)
                                    ));
                                    if (isCur && isPlaying && onTogglePlay) {
                                        onTogglePlay();
                                    } else if (onPlayTrack) {
                                        onPlayTrack(selectedTrack, 0, true);
                                    }
                                }}
                                className="ws-btn ws-btn-primary flex-1 justify-center"
                            >
                                <span>{Boolean(nowPlayingTrack && isPlaying && (nowPlayingTrack.id === selectedTrack.id || nowPlayingTrack.title === selectedTrack.title)) ? '⏸ Pausar' : '▶ Escuchar Preview'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (onAddTracksToSet) {
                                        onAddTracksToSet([selectedTrack]);
                                    }
                                }}
                                className="ws-btn ws-btn-outline"
                                title="Añadir esta pista al Set Builder"
                            >
                                <Icons.Plus size={14} /> <span>Set</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* DRAWER FLOTANTE DE SELECCIÓN DE ZONA ("COLLECT FROM SPACE") */}
                {selectedMapTracks.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[620px] bg-[rgba(14,14,18,0.96)] border border-cyan-500/50 p-3.5 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.25)] backdrop-blur-xl z-40 animate-slideUp font-mono">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--bw-line)]">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                <span className="text-xs font-bold text-white">
                                    Zona Seleccionada: <span className="text-cyan-300 font-black">{selectedMapTracks.length} pistas</span>
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedMapTracks([])}
                                className="ws-btn ws-btn-ghost text-xs py-1"
                            >
                                <Icons.Close size={12} /> Deseleccionar
                            </button>
                        </div>

                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                                <span><Icons.Wave size={14} className="inline-block align-[-2px]" /> Promedio: <strong className="text-white">{selBpmAvg} BPM</strong></span>
                                <span><Icons.Zap size={14} className="inline-block align-[-2px]" /> Energía: <strong className="text-amber-300">{selEnergyAvg}%</strong></span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedMapTracks.length > 0 && onPlayTrack) {
                                            onPlayTrack(selectedMapTracks[0], 0, true);
                                        }
                                    }}
                                    className="ws-btn ws-btn-outline"
                                    title="Reproducir primer tema de la zona capturada"
                                >
                                    <Icons.Play size={13} /> <span>Reproducir Zona</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onAddTracksToSet) {
                                            onAddTracksToSet(selectedMapTracks);
                                        }
                                    }}
                                    className="ws-btn ws-btn-primary"
                                    title="Enviar pistas capturadas en esta zona directamente al Set Builder"
                                >
                                    <Icons.Zap size={13} /> <span>Enviar a Set</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onAddTracksToSet) {
                                            onAddTracksToSet(selectedMapTracks);
                                        }
                                        if (onNavigateTab) {
                                            onNavigateTab('setbuilder');
                                        }
                                    }}
                                    className="ws-btn ws-btn-outline"
                                    title="Enviar pistas capturadas y generar Flujo de Sesión (Graph Playlists)"
                                >
                                    <Icons.Flow size={13} /> <span>Flujo Sesión (DAG)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* COLUMNA DERECHA UNIFICADA: CONSOLA ACÚSTICA & CAMELOT & ZOOM & DRAG & DROP */}
            <MapAcousticConsole
                isOpen={isMapConsoleOpen}
                width={mapConsoleWidth}
                onResizeDown={onMapConsoleResizeDown}
                onResetWidth={onResetMapConsoleWidth}
                onClose={() => setIsMapConsoleOpen(false)}
                zoom={zoomDisplay}
                onZoom={handleFaderZoom}
                onResetZoom={handleResetZoom}
                onAutoFrame={handleAutoFrame}
                selectedTrack={selectedTrack}
                selectedKey={selectedTrack ? (selectedTrack.key || selectedTrack.k || '8A').toUpperCase() : null}
                keyFilter={selectedKeyFilter}
                onKeyFilter={(k) => setSelectedKeyFilter(prev => prev === k ? 'ALL' : k)}
                colors={MAP_CAMELOT_COLORS}
                isMatch={(a, b) => calcHarmonicMixMatch(a, b).isMatch}
                filterMinEnergy={filterMinEnergy}
                setFilterMinEnergy={setFilterMinEnergy}
                filterMinDance={filterMinDance}
                setFilterMinDance={setFilterMinDance}
                filterMinIntensity={filterMinIntensity}
                setFilterMinIntensity={setFilterMinIntensity}
                filterMinValence={filterMinValence}
                setFilterMinValence={setFilterMinValence}
                filterQualityMode={filterQualityMode}
                setFilterQualityMode={setFilterQualityMode}
                onResetFilters={handleResetAcousticFilters}
                hasActiveFilters={hasActiveFilters}
                visibleCount={mapStats.visible}
                totalCount={activeTracks.length}
                selectedMapTracks={selectedMapTracks}
                onPlayTrack={onPlayTrack}
                onAddTracksToSet={onAddTracksToSet}
                nowPlayingTrack={nowPlayingTrack}
                isPlaying={isPlaying}
                onTogglePlay={onTogglePlay}
                onClearSelection={() => { setSelectedTrack(null); setSelectedMapTracks([]); }}
            />
            {/* Modal Unificada de Exploración de Bibliotecas & Archivos */}
            <UnifiedLibraryBrowserModal
                isOpen={fsBrowserOpen}
                onClose={() => setFsBrowserOpen(false)}
                title="Scatter Map • Explorador de Biblioteca & Archivos"
                onSelectPath={(selectedPath) => handleCargarDirectorio(selectedPath)}
                onSelectMultiple={(allTargets) => handleCargarDirectorio(allTargets)}
                customLibraries={customLibraries}
                activeCustomLibId={activeCustomLibId}
                onImportCollection={handleCargarColeccion}
            />
        </div>
    </div>
);
};

