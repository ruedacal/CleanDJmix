import { FeatureErrorBoundary } from './shared/FeatureErrorBoundary.jsx';
import { ShellIcons } from './shell/icons.jsx';
import { apiClient } from './services/apiClient.js';
import { SideRail } from './shell/SideRail.jsx';
import { TopBar } from './shell/TopBar.jsx';
import { MobileTabBar, MoreSheet } from './shell/MobileNav.jsx';
import { WsButton, ToolbarDivider, ExportMenu, AddToCollectionMenu, FilterMenu, IngestDropzone, CamelotKeyBadge, BeatWaveBrandIdentity } from './shell/workspace-ui.jsx';
import { PricingModal } from './shell/pricing-modal.jsx';
import { RegisterFlowModal } from './shell/register-modal.jsx';
import { MapCamelotOverlay, MapNavOverlay, MapStatsHud, MapAcousticConsole, MAP_ZOOM_MIN, MAP_ZOOM_MAX } from './shell/map-overlays.jsx';
import { classifyTrackGenre } from './modules/genreClassifier.ts';
import { Phase1FastRecognizer } from './modules/Phase1FastRecognizer.ts';
import { NV2_COLORS, DEFAULT_VINYL_SVG, getValidCover, CAMELOT_TO_MUSICAL, getHarmonicKeyDisplay } from './data/constants.js';
import { I18N_TRANSLATIONS } from './data/i18n.js';
import { 
    CAMELOT_WHEEL_DATA, 
    TAXONOMY_TREE, 
    DJ_GENRES_LIST, 
    DJ_VERSIONS_LIST, 
    DJ_MOODS_LIST, 
    AI_PROMPT_CHIPS, 
    CUENCA_PROMPT_CHIPS, 
    DJ_CURATED_CATALOG, 
    parseAIDJQuery, 
    parseCuencaDJQuery 
} from './data/djCatalog.js';
import { BEATWAVE_MASTER_GLOSSARY } from './data/glossary.js';
import { WorkspaceSlot } from './shell/WorkspaceSlot.jsx';
import {
    LibraryWorkspace,
    CustomLibraryModal,
    FOLDER_COLORS,
    AuditWorkspace,
    HotCuesWorkspace,
    SpotifyWorkspace,
    TaxonomyWorkspace,
    ShazamWorkspace,
    LogsWorkspace,
    TrendsWorkspace,
    SetBuilderWorkspace,
    MapWorkspace,
    KnowledgeWorkspace,
    CopilotWorkspace,
    CopilotLaunchModal,
    AppCinematicIntro
} from './workspaces/index.js';
import { 
    TableHarmonicWaveform, 
    CopilotSeratoWaveform, 
    FooterMasterWaveform, 
    getTrackHash,
    computeTrackStructuralBands,
    WAVEFORM_COLOR_LEGEND,
    DJ_PAD_PALETTE,
    parseDurationMs,
    parseTimeToMs,
    parseDurationToSeconds,
    formatMsToTime
} from './waveforms/index.js';
import { useVirtualRows, useDrawerResize, MASTER_DRAWER_STORAGE_KEY } from './shell/hooks.js';
import { 
    HotCueStudioModal, 
    CamelotWheelModal, 
    BatchAuditorModal, 
    DuplicateComparisonModal, 
    UserAccountModal, 
    BitacoraDetailContent, 
    BitacoraDetailModal, 
    BitacoraModal, 
    detectClientOS, 
    DJShortcutsModal, 
    MANUAL_SECTIONS, 
    InteractiveManualModal, 
    MixOracleModal 
} from './modals/index.js';
const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

// ─── PERF: PlayerContext ──────────────────────────────────────────────────────
// Aísla COMPLETAMENTE el estado de reproducción del árbol de componentes.
// - playProgressRef: ref mutable (nunca dispara renders), leída por canvas via rAF.
// - isPlaying / nowPlayingTrack: solo cambian al cambiar pista o play/pause,
//   NO con cada tick de ontimeupdate → cero re-renders de App durante playback.
// ─────────────────────────────────────────────────────────────────────────────
const PlayerContext = createContext({
    playProgressRef: { current: 0 },
    isPlaying: false,
    nowPlayingTrack: null,
});

const usePlayerContext = () => useContext(PlayerContext);
// Hook para saber si una pista concreta está sonando (render solo al cambiar pista/play)
const useIsTrackPlaying = (trackId) => {
    const { isPlaying, nowPlayingTrack } = usePlayerContext();
    if (!trackId || !nowPlayingTrack) return false;
    return isPlaying && (
        String(nowPlayingTrack.id) === String(trackId) ||
        nowPlayingTrack.path === trackId ||
        nowPlayingTrack.f === trackId
    );
};

// Unified icon system (Lucide geometry, consistent stroke) shared by every workspace.
const Icons = {
    ...ShellIcons,
    Edit: ShellIcons.Pencil,
};

const AppTutorialModal = ({ isOpen, onClose, activeTab, setActiveTab, initialMode = 'launcher' }) => {
    return null;
};

// Componente Principal de la Aplicación
const App = () => {
    // Intro Espectacular a Pantalla Completa con Video de Fondo
    const [pricingOpen, setPricingOpen] = useState(false);
    const [registerModalOpen, setRegisterModalOpen] = useState(false);
    const [selectedPlanForRegister, setSelectedPlanForRegister] = useState('pro');
    const [cinematicIntroOpen, setCinematicIntroOpen] = useState(() => {
        try {
            const p = new URLSearchParams(window.location.search);
            if (p.get('intro') === '1' || p.get('portal') === '1') return true;
            if (p.get('skipintro') === '1' || p.get('nointro') === '1') return false;
            return !sessionStorage.getItem('bw_intro_viewed');
        } catch (e) {
            return false;
        }
    });

    const [lang, setLang] = useState(() => {
        try {
            return localStorage.getItem('beatwave_lang') || 'es';
        } catch (e) {
            return 'es';
        }
    });

    const changeLang = (newLang) => {
        setLang(newLang);
        try {
            localStorage.setItem('beatwave_lang', newLang);
        } catch (e) {}
    };

    const t = (k) => (I18N_TRANSLATIONS[lang] && I18N_TRANSLATIONS[lang][k]) || (I18N_TRANSLATIONS['es'][k]) || k;

    const [activeTab, setActiveTab] = useState(() => {
        try {
            const p = new URLSearchParams(window.location.search);
            const q = p.get('tab') || window.location.hash.replace('#', '');
            if (q) {
                const map = {
                    'all': 'all', 'todas': 'all', 'galeria': 'all',
                    'library': 'library', 'coleccion': 'library', 'colección': 'library', 'biblioteca': 'library',
                    'audit': 'audit', 'cabina': 'audit',
                    'cues': 'hotcues', 'hotcues': 'hotcues',
                    'sets': 'setbuilder', 'setbuilder': 'setbuilder',
                    'map': 'map', 'mapa': 'map',
                    'pool': 'spotify', 'spotify': 'spotify',
                    'radar': 'shazam', 'shazam': 'shazam',
                    'crates': 'taxonomy', 'taxonomy': 'taxonomy',
                    'trends': 'trends',
                    'knowledge': 'knowledge', 'conocimiento': 'knowledge',
                    'copilot': 'copilot'
                };
                if (map[q.toLowerCase()]) return map[q.toLowerCase()];
            }
        } catch (e) {}
        return 'library';
    });
    const [isSimulationMode, setIsSimulationMode] = useState(false);
    const [currentFolder, setCurrentFolder] = useState('');
    const [studioMode, setStudioMode] = useState('cues');
    const [auditTracks, setAuditTracks] = useState([]);
    const [setBuilderTracks, setSetBuilderTracks] = useState([]);
    const [spotifyTracks, setSpotifyTracks] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const currentTrack = selectedTrack ? (auditTracks.find(t => t.id === selectedTrack) || null) : null;
    const [nowPlayingTrack, setNowPlayingTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loadTrackMenuOpen, setLoadTrackMenuOpen] = useState(false);
    const localAudioInputRef = useRef(null);

    const handleLoadLocalAudioFile = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        const localTrack = {
            id: 'local_' + Date.now(),
            title: fileNameWithoutExt,
            t: fileNameWithoutExt,
            artist: 'Archivo Local DJ',
            a: 'Archivo Local DJ',
            bpm: 128.0,
            b: 128.0,
            key: '10A',
            k: '10A',
            raw_key: 'Bm',
            genre: 'Audio Cabina',
            cover: null,
            f: file.name,
            path: file.name,
            url: objectUrl,
            cues: NV2_COLORS
        };
        setSelectedTrack(localTrack.id);
        setNowPlayingTrack(localTrack);
        setIsPlaying(true);
        setIsFooterDeckExpanded(true);
        setLoadTrackMenuOpen(false);
    };

    const handleLoadFirstLibraryTrack = () => {
        const candidate = (auditTracks && auditTracks.length > 0) ? auditTracks[0] : null;
        if (candidate) {
            setSelectedTrack(candidate.id);
            setNowPlayingTrack(candidate);
            setIsPlaying(true);
            setIsFooterDeckExpanded(true);
        }
        setLoadTrackMenuOpen(false);
    };
    // PERF A2: playProgress eliminado del estado React → ref mutable + CustomEvent.
    // Ningún re-render se dispara por ontimeupdate; solo FooterMasterWaveform y la
    // barra móvil (mobileProgress) reaccionan al avance de la reproducción.
    const playProgressRef = useRef(0);
    const setPlayProgress = useCallback((pct) => {
        const safe = Math.max(0, Math.min(1, typeof pct === "number" ? pct : 0));
        playProgressRef.current = safe;
        window.dispatchEvent(new CustomEvent("bw:progress", { detail: { pct: safe } }));
    }, []);
    const audioRef = useRef(null);

    // PERF A4: mobileProgress — estado local para la barra de progreso ultra-fina
    // en móvil (<768 px). Se actualiza vía CustomEvent 'bw:progress' en lugar de
    // leer playProgress del estado global, evitando re-renders en todo el árbol.
    const [mobileProgress, setMobileProgress] = useState(0);
    useEffect(() => {
        const onProgress = (e) => setMobileProgress(e.detail.pct);
        window.addEventListener("bw:progress", onProgress);
        return () => window.removeEventListener("bw:progress", onProgress);
    }, []);
    // PERF: playProgress para workspaces — se actualiza cada ~100ms via CustomEvent
    // (throttle), evitando re-renders a 60 fps. Los workspaces usan este valor
    // solo para el playhead de la fila activa, no en cada frame de audio.
    const playProgress = 0;
    const selectedAuditTrackIds = useMemo(
        () => new Set((auditTracks || []).filter(t => t.selected).map(t => t.id)),
        [auditTracks]
    );

    // Estado Global de Tareas en Background & Tutorial de Bienvenida (Deshabilitado a petición)
    const [globalAuditInfo, setGlobalAuditInfo] = useState({ isAuditing: false, isLoadingDir: false, progress: 0, statusMsg: '' });

    // RAM Warm-up: Monitorear precarga en caliente del catálogo al arrancar
    useEffect(() => {
        fetch('/api/warmup/status')
            .then(res => res.json())
            .then(data => {
                if (data && data.ready) {
                    console.log(`[RAM WARM-UP] Catálogo precalentado: ${data.total_cached} pistas en memoria RAM.`);
                }
            })
            .catch(() => {});
    }, []);

    // Listener Global de Progreso de Carga y Auditoría para TopBar y Workspaces
    useEffect(() => {
        const handleGlobalAuditEvt = (e) => {
            if (!e.detail) return;
            const { pct, msg } = e.detail;
            if (!msg || msg.includes('detenid') || msg.includes('cancelad')) {
                setGlobalAuditInfo({ isAuditing: false, isLoadingDir: false, progress: 0, statusMsg: '' });
                return;
            }
            const isLoading = msg.toLowerCase().includes('leyendo') || msg.toLowerCase().includes('carga') || msg.toLowerCase().includes('tags') || msg.toLowerCase().includes('archivo');
            setGlobalAuditInfo({
                isAuditing: !isLoading && pct < 100,
                isLoadingDir: isLoading,
                progress: pct,
                statusMsg: msg
            });
            if (pct >= 100) {
                setTimeout(() => {
                    setGlobalAuditInfo(prev => ({ ...prev, isAuditing: false, isLoadingDir: false, progress: 0, statusMsg: '' }));
                }, 2500);
            }
        };

        window.addEventListener('bw:audit_progress', handleGlobalAuditEvt);

        window.actualizar_progreso_batch = (pct, msg) => {
            window.dispatchEvent(new CustomEvent('bw:audit_progress', { detail: { pct, msg } }));
        };

        if (true) {
            try {
                apiClient.registerCallback("actualizar_progreso_batch", window.actualizar_progreso_batch);
            } catch (err) {}
        }

        return () => window.removeEventListener('bw:audit_progress', handleGlobalAuditEvt);
    }, []);
    const [tutorialOpen, setTutorialOpen] = useState(false);
    const [tutorialInitialMode, setTutorialInitialMode] = useState('launcher');
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    // Barra lateral de navegación: Al inicio siempre está desplegada hasta que el usuario interactúa (toca un menú u otro punto de la app)
    const [railExpanded, setRailExpanded] = useState(true);
    const toggleRailExpanded = () => {
        setRailExpanded((prev) => !prev);
    };

    useEffect(() => {
        if (!railExpanded) return;
        const handleAutoCollapse = (e) => {
            const isToggleBtn = e.target && e.target.closest && e.target.closest('[data-rail-toggle="true"]');
            if (isToggleBtn) return;
            setRailExpanded(false);
        };
        const timer = setTimeout(() => {
            window.addEventListener('pointerdown', handleAutoCollapse, true);
        }, 120);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('pointerdown', handleAutoCollapse, true);
        };
    }, [railExpanded]);
    const [copilotModalOpen, setCopilotModalOpen] = useState(false);

    // GESTIÓN GLOBAL DE LIBRERÍAS PERSONALIZADAS Y PERSISTENTES (COLUMNA DERECHA)
    const [customLibraries, setCustomLibraries] = useState(() => {
        try {
            const saved = localStorage.getItem('bw_user_custom_libraries');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map(l => ({
                        ...l,
                        tracks: l.tracks || [],
                        folders: (l.folders || []).filter(f => !f.id?.startsWith('f_default_') || (f.tracks && f.tracks.length > 0))
                    }));
                }
            }
        } catch (_) {}
        return [
            {
                id: 'lib_default',
                name: 'Mi Biblioteca Principal',
                createdAt: new Date().toISOString(),
                tracks: [],
                folders: []
            }
        ];
    });

    const [activeCustomLibId, setActiveCustomLibId] = useState(() => {
        try {
            return localStorage.getItem('bw_user_active_library_id') || 'lib_default';
        } catch (_) {
            return 'lib_default';
        }
    });

    // Carga automática de la biblioteca guardada en backend al iniciar la aplicación
    useEffect(() => {
        const loadSavedLibraryFromBackend = async () => {
            try {
                const r = await fetch('/api/biblioteca/cargar');
                if (r.ok) {
                    const res = await r.json();
                    if (res && res.status === 'success' && res.data && Array.isArray(res.data.libraries) && res.data.libraries.length > 0) {
                        const cleaned = res.data.libraries.map(l => ({
                            ...l,
                            tracks: l.tracks || [],
                            folders: (l.folders || []).filter(f => !f.id?.startsWith('f_default_') || (f.tracks && f.tracks.length > 0))
                        }));
                        setCustomLibraries(cleaned);
                        if (res.data.active_id) {
                            setActiveCustomLibId(res.data.active_id);
                        }
                    }
                }
            } catch (e) {
                console.warn("No se pudo cargar biblioteca remota:", e);
            }
        };
        loadSavedLibraryFromBackend();
    }, []);

    const [isLibraryDrawerOpen, setIsLibraryDrawerOpen] = useState(false);
    const [activeCrateFilter, setActiveCrateFilter] = useState(null);

    const handleAuditarCrateDesdeModal = (folder, lib) => {
        if (!folder) return;
        const keys = new Set((folder.tracks || []).map(t => t.id !== undefined ? t.id : (t.file_path || t.filename || t.path)));
        setActiveCrateFilter({
            id: folder.id,
            name: folder.name,
            libName: lib ? lib.name : 'Biblioteca',
            trackKeys: keys
        });
        setActiveTab('audit');
        setIsLibraryDrawerOpen(false);
    };

    const saveCustomLibraries = (newLibs, newActiveId = null) => {
        setCustomLibraries(newLibs);
        const activeIdToSave = newActiveId || activeCustomLibId;
        if (newActiveId) {
            setActiveCustomLibId(newActiveId);
            try { localStorage.setItem('bw_user_active_library_id', newActiveId); } catch (_) {}
        }
        // 1. Siempre persistir en backend (sin límite de 5MB de localStorage)
        fetch('/api/biblioteca/guardar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ libraries: newLibs, active_id: activeIdToSave })
        }).catch((err) => console.error('[Biblioteca] Error guardando en backend:', err));

        // 2. Caché local best-effort (si excede cuota, no bloquea el guardado en backend)
        try {
            localStorage.setItem('bw_user_custom_libraries', JSON.stringify(newLibs));
        } catch (err) {
            console.warn('[Biblioteca] localStorage lleno (usando persistencia en backend):', err?.name || err);
        }
    };

    const handleMaterializarBibliotecaEnDisco = async (lib) => {
        if (!lib || !lib.folders || lib.folders.length === 0) {
            alert("Crea al menos una carpeta y asigna pistas para materializar en disco.");
            return;
        }
        if (true) {
            try {
                const destino = await apiClient.rpc('seleccionar_directorio', `Selecciona la carpeta base donde crear la biblioteca "${lib.name}":`);
                if (!destino) return;
                const estructura = lib.folders.map(f => ({
                    folder_name: f.name,
                    track_paths: (f.tracks || []).map(t => t.file_path || t.path || t.filepath).filter(Boolean)
                }));
                if (window.eel.exportar_biblioteca_a_disco) {
                    const res = await apiClient.rpc('exportar_biblioteca_a_disco', destino, lib.name, estructura);
                    if (res && res.success) {
                        alert(`✓ Biblioteca "${lib.name}" creada con éxito en:\n${res.path}`);
                    } else {
                        alert(`Atención: ${res?.error || 'No se pudo exportar a disco'}`);
                    }
                }
            } catch (err) {
                console.error("Error materializando biblioteca:", err);
            }
        }
    };

    // MANUAL MAESTRO INTERACTIVO INDIVIDUALIZADO (Modal & Masterclass)
    const [manualModalOpen, setManualModalOpen] = useState(false);
    const [manualSection, setManualSection] = useState('audit');

    const handleOpenManual = (section = null) => {
        const secMap = {
            'audit': 'audit', 'copilot': 'copilot', 'hotcues': 'hotcues', 'cues': 'hotcues',
            'setbuilder': 'setbuilder', 'sets': 'setbuilder', 'map': 'map',
            'spotify': 'spotify', 'pool': 'spotify', 'radar': 'radar',
            'crates': 'crates', 'taxonomy': 'crates', 'trends': 'radar', 'knowledge': 'radar'
        };
        const target = (section && secMap[section]) ? secMap[section] : (secMap[activeTab] || 'audit');
        if (manualModalOpen && manualSection === target) {
            setManualModalOpen(false);
        } else {
            setManualSection(target);
            setManualModalOpen(true);
        }
    };

    // ESPACIO DE USUARIO, LOGIN & SESIONES GUARDADAS
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [userProfile, setUserProfile] = useState(() => {
        try {
            const saved = localStorage.getItem('bw_user_profile');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            alias: 'DJ Alex BeatWave',
            email: 'alex.dj@beatwave.pro',
            plan: 'PRO CABINA VIP',
            djSoftware: 'Serato DJ Pro',
            audioInterface: 'Focusrite Scarlett 2i2 / Serato Club Kit',
            targetLufs: -9.0,
            autoSave: true
        };
    });

    const handleUpdateUserProfile = (newProfile) => {
        setUserProfile(newProfile);
        try { localStorage.setItem('bw_user_profile', JSON.stringify(newProfile)); } catch (e) {}
    };

    const DEMO_SAVED_SESSIONS = [
        {
            id: 'sess-init-1',
            name: '🌟 Sesión Club Ibiza - Warmup Melodic (12 pistas)',
            date: '31/10/2026 20:30',
            folder: 'Simulación Cabina BeatWave',
            tracksCount: 12,
            activeTab: 'audit'
        }
    ];

    const [savedSessions, setSavedSessions] = useState(() => {
        try {
            const saved = localStorage.getItem('bw_saved_sessions');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [];
    });

    const handleSaveCurrentSession = (customName) => {
        const sessionObj = {
            id: 'sess-' + Date.now(),
            name: customName || `Sesión ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString().slice(0, 5)}`,
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0, 5),
            folder: currentFolder,
            activeTab: activeTab,
            tracksCount: auditTracks.length,
            selectedTrackId: selectedTrack,
            tracksData: auditTracks.map(t => ({
                id: t.id,
                path: t.path || t.f,
                title: t.title || t.name,
                artist: t.artist,
                bpm: t.bpm,
                key: t.key,
                cues: t.cues,
                quality: t.quality
            }))
        };
        setSavedSessions(prev => {
            const next = [sessionObj, ...prev.slice(0, 9)];
            try { localStorage.setItem('bw_saved_sessions', JSON.stringify(next)); } catch (e) {}
            return next;
        });
    };

    const handleLoadSession = (session) => {
        if (!session) return;
        if (session.folder) setCurrentFolder(session.folder);
        if (session.activeTab) setActiveTab(session.activeTab);
        if (session.tracksData && session.tracksData.length > 0) {
            setAuditTracks(session.tracksData);
            if (session.selectedTrackId) setSelectedTrack(session.selectedTrackId);
        }
    };

    const handleDeleteSession = (sessionId) => {
        setSavedSessions(prev => {
            const next = prev.filter(s => s.id !== sessionId);
            try { localStorage.setItem('bw_saved_sessions', JSON.stringify(next)); } catch (e) {}
            return next;
        });
    };

    // CUADERNO DE BITÁCORA DE PROCESOS (HISTORIAL DE CAMBIOS Y EXPORTACIÓN EXCEL)
    const DEMO_BITACORA_ENTRIES = [
        {
            id: 'b-1',
            timestamp: '31/10/2026 20:45',
            category: 'audit',
            action: 'Diagnóstico Espectral DSP & FFT',
            trackTitle: 'Cascada - Everytime We Touch',
            filePath: 'Cascada - Everytime We Touch.mp3',
            detailsBefore: 'MP3 218 kbps • Corte en 18.5 kHz • Sin tags Serato',
            detailsAfter: 'Certificado Media Calidad • BPM: 143.00 • Camelot: 8A • -9.0 LUFS',
            status: '✓ Certificado'
        },
        {
            id: 'b-2',
            timestamp: '31/10/2026 20:46',
            category: 'cues',
            action: 'Inyección de 8 Hot Cues & Fraseo',
            trackTitle: 'Kriss / New Limit - Tonight / Smile',
            filePath: 'Tonight Smile.mp3',
            detailsBefore: '0 Hot Cues en Serato',
            detailsAfter: '8 Hot Cues (1: Intro, 3: Break, 5: Snare, 7: Drop) • Pioneer RGB',
            status: '✓ Inyectado'
        },
        {
            id: 'b-3',
            timestamp: '31/10/2026 20:48',
            category: 'download',
            action: 'Sustitución SuperFLAC Lossless Ingest',
            trackTitle: 'Plastikman, Richie Hawtin - Artifakts (BC)',
            filePath: 'Plastikman - Artifakts.mp3',
            detailsBefore: 'MP3 83 kbps (Pérdida Severa <16kHz Fake)',
            detailsAfter: 'FLAC Lossless 24-bit Genuino (22.05 kHz) • Carátula 1400x1400',
            status: '✓ Reemplazado'
        },
        {
            id: 'b-4',
            timestamp: '31/10/2026 20:51',
            category: 'crates',
            action: 'Exportación a Serato Crates & Rekordbox XML',
            trackTitle: 'Lote Principal (12 pistas)',
            filePath: 'Melodic_Techno.crate',
            detailsBefore: 'Sin sincronización multisoftware',
            detailsAfter: 'Crate binario Serato .crate generado + Rekordbox XML sincronizado',
            status: '✓ Sincronizado'
        }
    ];

    const [bitacoraModalOpen, setBitacoraModalOpen] = useState(false);
    const [bitacoraEntries, setBitacoraEntries] = useState(() => {
        try {
            const saved = localStorage.getItem('bw_audit_bitacora');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [];
    });

    const handleClearBitacora = () => {
        setBitacoraEntries([]);
        try { localStorage.removeItem('bw_audit_bitacora'); } catch (e) {}
    };

    useEffect(() => {
        const handleBitacoraSync = (e) => {
            if (e && e.detail && Array.isArray(e.detail)) {
                setBitacoraEntries(e.detail);
            }
        };
        window.addEventListener('bw_bitacora_updated', handleBitacoraSync);
        return () => window.removeEventListener('bw_bitacora_updated', handleBitacoraSync);
    }, []);

    // Auto-guardado continuo del estado de la sesión para que el DJ continúe donde lo dejó
    useEffect(() => {
        if (userProfile && userProfile.autoSave !== false) {
            try {
                const autoSession = {
                    folder: currentFolder,
                    activeTab: activeTab,
                    selectedTrackId: selectedTrack,
                    updatedAt: Date.now()
                };
                localStorage.setItem('bw_auto_session', JSON.stringify(autoSession));
            } catch (e) {}
        }
    }, [currentFolder, activeTab, selectedTrack, userProfile]);

    // UX CABINA: Modo Cabina Oscura (High-Contrast Club Mode) y Modal de Atajos DJ
    const [clubMode, setClubMode] = useState(() => {
        try {
            return localStorage.getItem('bw_club_mode') === 'true';
        } catch (e) {
            return false;
        }
    });

    const toggleClubMode = () => {
        setClubMode(prev => {
            const next = !prev;
            try { localStorage.setItem('bw_club_mode', String(next)); } catch (e) {}
            return next;
        });
    };

    const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

    // Modo del Altavoz: 'neon' (nuevo con borde azul corporativo y efecto neón) | 'original' (preservado para recuperación)
    const [speakerLogoMode, setSpeakerLogoMode] = useState(() => {
        try {
            return localStorage.getItem('cleandjmix_speaker_logo_mode') || 'neon';
        } catch (e) {
            return 'neon';
        }
    });

    const handleSetSpeakerLogoMode = (mode) => {
        setSpeakerLogoMode(mode);
        try {
            localStorage.setItem('cleandjmix_speaker_logo_mode', mode);
        } catch (e) {}
    };

    useEffect(() => {
        window.setSpeakerLogoMode = handleSetSpeakerLogoMode;
        window.toggleSpeakerLogoMode = () => {
            handleSetSpeakerLogoMode(speakerLogoMode === 'neon' ? 'original' : 'neon');
        };
    }, [speakerLogoMode]);

    // Secuencia Techno del Logo: vibraciones en bucle durante 10 segundos, luego estático
    // IMPORTANTE: Si salta el tutorial o alguna modal está abierta, NO debe iniciarse hasta que el usuario termine/cierre las modales
    const [isLogoTechnoActive, setIsLogoTechnoActive] = useState(false);
    const logoTechnoTimerRef = useRef(null);
    const initialTechnoPlayedRef = useRef(false);

    const triggerLogoTechno = () => {
        setIsLogoTechnoActive(true);
        if (logoTechnoTimerRef.current) clearTimeout(logoTechnoTimerRef.current);
        logoTechnoTimerRef.current = setTimeout(() => {
            setIsLogoTechnoActive(false);
        }, 10000);
    };

    // Animación automática al entrar al panel eliminada a petición del usuario (logotipo limpio y estático)
    useEffect(() => {
        if (tutorialOpen || copilotModalOpen) {
            if (logoTechnoTimerRef.current) clearTimeout(logoTechnoTimerRef.current);
            setIsLogoTechnoActive(false);
        }
    }, [tutorialOpen, copilotModalOpen]);

    useEffect(() => {
        window.abrirIntroCinematica = () => {
            setCinematicIntroOpen(true);
        };
        window.abrirTutorial = (mode = 'launcher') => {
            setTutorialInitialMode(mode);
            setTutorialOpen(true);
        };
    }, []);

    const handleAddTracksToSpotify = (tracksData, origin = 'taxonomy') => {
        if (!tracksData) return;
        const list = Array.isArray(tracksData) ? tracksData : [tracksData];
        if (list.length === 0) return;

        const newTracks = list.map((trackData, idx) => {
            const bNum = parseFloat(trackData.displayBpm || trackData.bpm || trackData.b || 128) || 128;
            const titleStr = String(trackData.displayTitle || trackData.title || trackData.t || '').toLowerCase();
            const artistStr = String(trackData.displayArtist || trackData.artist || trackData.a || '').toLowerCase();
            const seed = (titleStr + artistStr).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + (idx * 17);
            const dynEnergy = Math.min(98, Math.max(45, Math.round(60 + (bNum - 118) * 1.5 + ((seed % 17) - 8))));
            const dynDance = Math.min(98, Math.max(48, Math.round(92 - Math.abs(bNum - 126) * 0.9 + ((seed % 15) - 7))));

            return {
                id: trackData.id || `tax_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
                title: trackData.displayTitle || trackData.title || trackData.t || 'Pista Taxonomía',
                artist: trackData.displayArtist || trackData.artist || trackData.a || 'Artista',
                album: trackData.displayAlbum || trackData.album || (origin === 'audit_upgrade' || trackData.origin === 'audit_upgrade' ? 'Catálogo Master HD' : 'Taxonomía AI'),
                bpm: bNum,
                key: (trackData.displayKey || trackData.key || trackData.k || '8A').toUpperCase(),
                cover: trackData.displayCover || trackData.cover || null,
                duration: trackData.duration || '04:00',
                origin: trackData.origin || origin,
                reemplazo_de: trackData.reemplazo_de || null,
                original_file: trackData.original_file || null,
                original_path: trackData.original_path || null,
                original_duration: trackData.original_duration || null,
                original_calidad: trackData.original_calidad || null,
                downloaded: false,
                selected: trackData.selected !== undefined ? trackData.selected : true,
                format: trackData.format || 'FLAC',
                energy: trackData.energy || trackData.e || dynEnergy,
                danceability: trackData.danceability || trackData.dance || dynDance,
                fase_badge: trackData.fase_badge || null,
                comment: trackData.comment || null,
                calidad: trackData.calidad || (origin === 'audit_upgrade' || trackData.origin === 'audit_upgrade' ? 'Catálogo Master HD' : 'Pendiente'),
                status: trackData.status || 'Pendiente Descarga',
                spotify_id: trackData.spotify_id || null,
                spotify_url: trackData.spotify_url || null,
                apple_url: trackData.apple_url || null,
                isrc: trackData.isrc || null,
                preview_url: trackData.preview_url || null,
                match_score: trackData.match_score !== undefined ? trackData.match_score : 100,
                match_confianza: trackData.match_confianza || 'ALTA',
                match_badge_color: trackData.match_badge_color || 'emerald',
                match_recomendacion: trackData.match_recomendacion || '',
                candidatos_alternativos: trackData.candidatos_alternativos || [],
                todos_candidatos: trackData.todos_candidatos || [],
                alerta_version: trackData.alerta_version || null,
                alerta_duracion: trackData.alerta_duracion || null,
                es_misma_pista: trackData.es_misma_pista !== undefined ? trackData.es_misma_pista : true
            };
        });

        setSpotifyTracks(prev => {
            const current = prev || [];
            const filteredNew = newTracks.filter(nt => !current.some(c => 
                (c.title || '').toLowerCase() === nt.title.toLowerCase() && 
                (c.artist || '').toLowerCase() === nt.artist.toLowerCase()
            ));
            return [...filteredNew, ...current];
        });
        setActiveTab('spotify');
    };
    const handleAddTrackToSpotify = handleAddTracksToSpotify;

    const [logs, setLogs] = useState([
        { type: 'info', text: "> CleanDJmix PRO v2.0 - Core Engine Initialized" },
        { type: 'divider', text: "--------------------------------------------------" },
        { type: 'success', text: "[ OK ] Audio Engine & Stream Router Online." },
        { type: 'success', text: "[ OK ] Serato Database XML Link Ready." }
    ]);

    // Web Audio Synthesizer fallback para preescucha cuando una pista no tiene archivo físico local
    const synthAudioCtxRef = useRef(null);
    const synthIntervalRef = useRef(null);

    const stopSynthPreview = () => {
        if (synthIntervalRef.current) {
            clearInterval(synthIntervalRef.current);
            synthIntervalRef.current = null;
        }
        if (synthAudioCtxRef.current) {
            try { synthAudioCtxRef.current.close(); } catch (e) {}
            synthAudioCtxRef.current = null;
        }
    };

    const playSynthPreview = (track) => {
        stopSynthPreview();
        setIsPlaying(false);
    };

    useEffect(() => {
        const audio = new Audio();
        audio.preload = "auto";

        audio.onended = () => {
            setIsPlaying(false);
            setPlayProgress(0);
        };

        audio.onerror = (err) => {
            if (audio.src && audio.src !== window.location.href && !audio.src.endsWith('/')) {
                console.warn("Global audio element error:", err);
            }
            setIsPlaying(false);
        };

        audio.ontimeupdate = () => {
            // PERF A3: solo actualiza ref + dispara CustomEvent, sin setState → sin re-renders
            if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                setPlayProgress(audio.currentTime / audio.duration);
            }
        };

        audioRef.current = audio;

        if (true) {
            window.log_to_console = (msg) => {
                setLogs(prev => [...prev, { type: 'info', text: `[${new Date().toLocaleTimeString()}] ${msg}` }]);
            };
            apiClient.registerCallback("log_to_console", window.log_to_console);

            window.notificar_archivo_original_eliminado_global = (info) => {
                if (info && info.original_path) {
                    const normPath = info.original_path.toLowerCase();
                    setAuditTracks(prev => prev.filter(t => {
                        const tPath = (t.path || t.filepath || t.f || '').toLowerCase();
                        return tPath !== normPath;
                    }));
                }
            };
            apiClient.registerCallback("notificar_archivo_original_eliminado_global", window.notificar_archivo_original_eliminado_global);
        }

        return () => {
            stopSynthPreview();
            audio.pause();
            audio.src = "";
        };
    }, []);

    const handlePlayTrack = (track, seekPct = 0, autoPlay = true, startOffsetSec = null) => {
        if (!track) return;
        stopSynthPreview();
        const resolvedCover = track.cover || (track.path ? `/cover?path=${encodeURIComponent(track.path)}` : (track.f ? `/cover?path=${encodeURIComponent(track.f)}` : null));
        const trackTitle = track.title || track.t || track.displayTitle || 'Audio Track';
        const trackArtist = track.artist || track.a || track.displayArtist || 'Unknown Artist';
        const trackWithCover = { 
            ...track, 
            cover: resolvedCover,
            title: trackTitle,
            t: trackTitle,
            artist: trackArtist,
            a: trackArtist
        };
        setNowPlayingTrack(trackWithCover);
        window.__bwCurrentTrack = trackWithCover;

        if (autoPlay) {
            const audio = audioRef.current;
            if (audio) {
                let targetSrc = "";
                const isDirectAudioUrl = (url) => {
                    if (!url || typeof url !== "string") return false;
                    if (url.startsWith("/previews/") || url.startsWith("/stream_audio")) return true;
                    if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
                    // Bloquear URLs de páginas web HTML que congelan el decodificador de audio
                    if (url.includes("open.spotify.com") || url.includes("music.apple.com") || url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
                        return false;
                    }
                    return true;
                };

                if (isDirectAudioUrl(track.preview_url)) {
                    targetSrc = track.preview_url;
                } else if (isDirectAudioUrl(track.previewUrl)) {
                    targetSrc = track.previewUrl;
                } else if (isDirectAudioUrl(track.path)) {
                    targetSrc = track.path;
                } else if (track.preview_url && track.preview_url.startsWith("/previews/")) {
                    targetSrc = track.preview_url;
                } else if (track.path && !track.path.startsWith("http")) {
                    targetSrc = `/stream_audio?path=${encodeURIComponent(track.path)}`;
                } else if (track.f && !track.f.startsWith("http")) {
                    targetSrc = `/stream_audio?path=${encodeURIComponent(track.f)}`;
                }

                if (targetSrc) {
                    const isSameSrc = (audio.src === targetSrc || audio.src.endsWith(targetSrc));
                    const applyPosition = () => {
                        const dur = audio.duration;
                        if (startOffsetSec !== null && !isNaN(startOffsetSec)) {
                            const safeOffset = (dur && !isNaN(dur) && dur > 0.5)
                                ? Math.max(0, Math.min(dur - 0.25, startOffsetSec))
                                : Math.max(0, startOffsetSec);
                            try { audio.currentTime = safeOffset; } catch (_) {}
                            if (dur && !isNaN(dur) && dur > 0) {
                                setPlayProgress(safeOffset / dur);
                            }
                        } else if (seekPct > 0) {
                            const safePct = Math.min(0.99, Math.max(0, seekPct));
                            if (dur && !isNaN(dur) && dur > 0.5) {
                                const targetSec = Math.max(0, Math.min(dur - 0.25, dur * safePct));
                                try { audio.currentTime = targetSec; } catch (_) {}
                                setPlayProgress(targetSec / dur);
                            } else {
                                setPlayProgress(safePct);
                            }
                        }
                    };

                    if (isSameSrc) {
                        applyPosition();
                        const p = audio.play();
                        if (p && typeof p.then === 'function') {
                            p.then(() => setIsPlaying(true)).catch((err) => {
                                if (err && err.name !== 'AbortError') console.warn("Audio HTML5 play error:", err);
                            });
                        }
                    } else {
                        audio.pause();
                        audio.preload = "auto";
                        audio.src = targetSrc;
                        const onReady = () => {
                            applyPosition();
                            audio.removeEventListener('canplay', onReady);
                        };
                        audio.addEventListener('canplay', onReady, { once: true });
                        const p = audio.play();
                        if (p && typeof p.then === 'function') {
                            p.then(() => {
                                setIsPlaying(true);
                                applyPosition();
                            }).catch((err) => {
                                if (err && err.name === 'NotSupportedError') {
                                    const localPath = track.path || track.f;
                                    if (localPath && typeof apiClient !== 'undefined' && apiClient.rpc) {
                                        apiClient.rpc('reproducir_pista_mac', localPath).catch(() => {});
                                    }
                                    return;
                                }
                                if (err && err.name !== 'AbortError') console.warn("Audio HTML5 play error:", err);
                            });
                        }
                    }
                } else if (track.path || track.f) {
                    if (true) {
                        apiClient.rpc('reproducir_pista_mac', track.path || track.f);
                        setIsPlaying(true);
                    }
                } else {
                    // Si no hay stream_url ni archivo local válido, detener audio limpiamente
                    audio.pause();
                    audio.src = "";
                    setIsPlaying(false);
                }
            }
        }
    };

    const handleFooterSeek = (pct) => {
        setPlayProgress(pct);
        const audio = audioRef.current;
        if (audio && audio.duration && !isNaN(audio.duration)) {
            audio.currentTime = audio.duration * pct;
            if (!isPlaying) {
                audio.play().then(() => setIsPlaying(true)).catch(() => {});
            }
        }
    };

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (isPlaying) {
            if (audio) {
                audio.pause();
            }
            stopSynthPreview();
            setIsPlaying(false);
            if (true) {
                apiClient.rpc('detener_audio_mac');
            }
        } else {
            if (audio && audio.src && audio.src !== window.location.href && !audio.src.endsWith("/") && !audio.ended && nowPlayingTrack) {
                const p = audio.play();
                if (p && typeof p.then === 'function') {
                    p.then(() => setIsPlaying(true)).catch((err) => {
                        if (err && err.name !== 'AbortError' && err.name !== 'NotSupportedError') console.warn("Play error:", err);
                        if (nowPlayingTrack) {
                            handlePlayTrack(nowPlayingTrack, playProgressRef.current, true);
                        }
                    });
                }
            } else if (nowPlayingTrack) {
                handlePlayTrack(nowPlayingTrack, playProgressRef.current, true);
            }
        }
    };

    const handleCue = () => {
        stopSynthPreview();
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        setIsPlaying(false);
        setPlayProgress(0);
        if (true) {
            const trk = window.__bwCurrentTrack || nowPlayingTrack || {};
            apiClient.rpc('cue_audio_mac', trk.path || trk.f || "");
        }
    };

    // ─── UX CABINA: Atajos de Teclado Profesionales DJ en Vivo (Adaptados por SO) ────
    useEffect(() => {
        const handleKeyDown = (e) => {
            const active = document.activeElement;
            const tag = active ? active.tagName.toLowerCase() : '';
            const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || (active && active.isContentEditable);

            // 1. ESC: Cerrar cualquier modal abierto (funciona incluso mientras se escribe)
            if (e.key === 'Escape') {
                if (pricingOpen) {
                    e.preventDefault();
                    setPricingOpen(false);
                    return;
                }
                if (userModalOpen) {
                    e.preventDefault();
                    setUserModalOpen(false);
                    return;
                }
                if (bitacoraModalOpen) {
                    e.preventDefault();
                    setBitacoraModalOpen(false);
                    return;
                }
                if (manualModalOpen) {
                    e.preventDefault();
                    setManualModalOpen(false);
                    return;
                }
                if (shortcutsModalOpen) {
                    e.preventDefault();
                    setShortcutsModalOpen(false);
                    return;
                }
                if (copilotModalOpen) {
                    e.preventDefault();
                    setCopilotModalOpen(false);
                    return;
                }
            }

            // 2. Atajo de Búsqueda Global: ⌘+F / ⌘+K (Mac) o Ctrl+F / Ctrl+K (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'F' || e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder*="Buscar"], input[type="search"], input[name="search"], input[data-search]');
                if (searchInput) {
                    searchInput.focus();
                    if (searchInput.select) searchInput.select();
                }
                return;
            }

            // 3. F1 o ⌘+/ / Ctrl+/: Abrir/cerrar Manual Maestro o Atajos
            if (e.key === 'F1') {
                e.preventDefault();
                if (manualModalOpen) {
                    setManualModalOpen(false);
                } else {
                    handleOpenManual(activeTab);
                }
                return;
            }
            if ((e.metaKey || e.ctrlKey) && (e.key === '/' || e.key === '?')) {
                e.preventDefault();
                setShortcutsModalOpen(prev => !prev);
                return;
            }

            // 4. Cambio Directo de Espacio de Trabajo: ⌘+1..7 (Mac) o Ctrl+1..7 (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '7') {
                e.preventDefault();
                const tabs = ['audit', 'hotcues', 'setbuilder', 'map', 'spotify', 'shazam', 'taxonomy'];
                const targetTab = tabs[parseInt(e.key, 10) - 1];
                if (targetTab) {
                    setActiveTab(targetTab);
                }
                return;
            }

            // 5. Colapsar/Expandir Barra Lateral (Side Rail): ⌘+B (Mac) o Ctrl+B (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
                e.preventDefault();
                toggleRailExpanded();
                return;
            }

            // Si está escribiendo texto en un input, ignorar atajos directos sin modificadores
            if (isTyping) {
                return;
            }

            // 6. ? o H: Abrir / cerrar Cheatsheet de atajos
            if (e.key === '?' || (e.key === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey)) {
                e.preventDefault();
                setShortcutsModalOpen(prev => !prev);
                return;
            }

            // 7. ESPACIO: Play / Pausa
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                if (nowPlayingTrack) {
                    togglePlayPause();
                } else if (currentTrack) {
                    handlePlayTrack(currentTrack, 0, true);
                }
                return;
            }

            // 8. C: Volver a CUE
            if (e.key === 'c' || e.key === 'C') {
                e.preventDefault();
                handleCue();
                return;
            }

            // 9. Teclas 1 a 8: Salto directo a Hot Cues
            if (e.key >= '1' && e.key <= '8' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const cueNum = parseInt(e.key, 10);
                const targetTrack = nowPlayingTrack || currentTrack;
                if (targetTrack) {
                    const cues = (targetTrack.cues && targetTrack.cues.length > 0) ? targetTrack.cues : NV2_COLORS;
                    const cue = cues[cueNum - 1] || cues.find(c => c.id === cueNum);
                    if (cue && typeof cue.pct === 'number') {
                        e.preventDefault();
                        handleFooterSeek(cue.pct);
                    }
                }
                return;
            }

            // 10. ↑ / ↓: Navegar entre pistas en la tabla
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                if (auditTracks && auditTracks.length > 0) {
                    e.preventDefault();
                    const curIdx = auditTracks.findIndex(t => t.id === selectedTrack);
                    let targetIdx = 0;
                    if (e.key === 'ArrowUp') {
                        targetIdx = curIdx <= 0 ? auditTracks.length - 1 : curIdx - 1;
                    } else {
                        targetIdx = curIdx === -1 || curIdx >= auditTracks.length - 1 ? 0 : curIdx + 1;
                    }
                    const nextTrk = auditTracks[targetIdx];
                    if (nextTrk) {
                        setSelectedTrack(nextTrk.id);
                    }
                }
                return;
            }

            // 11. M: Plegar / Desplegar panel de métricas
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('bw:toggle-metrics'));
                return;
            }

            // 12. L: Alternar Modo Cabina Oscura (High Contrast Club Mode)
            if (e.key === 'l' || e.key === 'L') {
                e.preventDefault();
                toggleClubMode();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nowPlayingTrack, currentTrack, auditTracks, selectedTrack, shortcutsModalOpen, manualModalOpen, userModalOpen, bitacoraModalOpen, pricingOpen, copilotModalOpen, activeTab, togglePlayPause, handlePlayTrack, handleCue, handleFooterSeek, toggleClubMode, toggleRailExpanded]);

    // Gestión Global de Eliminación de Pistas del Análisis
    const handleRemoveTrackGlobal = (trackId) => {
        if (!trackId && trackId !== 0) return;
        setAuditTracks(prev => prev.filter(t => String(t.id) !== String(trackId) && t.path !== trackId));
        setSelectedTrack(prev => (String(prev) === String(trackId) ? null : prev));
        if (nowPlayingTrack && (String(nowPlayingTrack.id) === String(trackId) || nowPlayingTrack.path === trackId)) {
            stopSynthPreview();
            const audio = audioRef.current;
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
            setIsPlaying(false);
            setNowPlayingTrack(null);
            window.__bwCurrentTrack = null;
        }
    };

    const handleRemoveMultipleTracksGlobal = (trackIds) => {
        if (!Array.isArray(trackIds) || trackIds.length === 0) return;
        const idSet = new Set(trackIds.map(id => String(id)));
        setAuditTracks(prev => prev.filter(t => !idSet.has(String(t.id)) && !idSet.has(String(t.path))));
        setSelectedTrack(prev => (idSet.has(String(prev)) ? null : prev));
        if (nowPlayingTrack && (idSet.has(String(nowPlayingTrack.id)) || idSet.has(String(nowPlayingTrack.path)))) {
            stopSynthPreview();
            const audio = audioRef.current;
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
            setIsPlaying(false);
            setNowPlayingTrack(null);
            window.__bwCurrentTrack = null;
        }
    };

    const handleToggleSimulation = (forceState) => {
        setIsSimulationMode(prev => {
            const next = forceState !== undefined ? forceState : !prev;
            if (next) {
                const demoList = (typeof DEMO_MAP_TRACKS !== 'undefined' && Array.isArray(DEMO_MAP_TRACKS)) ? [...DEMO_MAP_TRACKS] : [];
                setAuditTracks(demoList);
                setSetBuilderTracks(demoList.slice(0, 8));
                if (demoList[0]) setSelectedTrack(demoList[0].id);
                setCurrentFolder('Cabina Demo (Simulación)');
                setBitacoraEntries(DEMO_BITACORA_ENTRIES);
                setSavedSessions(DEMO_SAVED_SESSIONS);
            } else {
                setAuditTracks([]);
                setSetBuilderTracks([]);
                setSelectedTrack(null);
                setCurrentFolder('');
                setBitacoraEntries([]);
                setSavedSessions([]);
                if (nowPlayingTrack) {
                    stopSynthPreview();
                    const audio = audioRef.current;
                    if (audio) {
                        audio.pause();
                        audio.currentTime = 0;
                    }
                    setIsPlaying(false);
                    setNowPlayingTrack(null);
                    window.__bwCurrentTrack = null;
                }
            }
            return next;
        });
    };

    const handleClearAllTracksGlobal = () => {
        setIsSimulationMode(false);
        setAuditTracks([]);
        setSelectedTrack(null);
        stopSynthPreview();
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        setIsPlaying(false);
        setNowPlayingTrack(null);
        window.__bwCurrentTrack = null;
    };

    const handleCargarDirectorioGlobal = async (pathOverride) => {
        try {
            let target = pathOverride;
            if (!target) {
                if (true) {
                    try {
                        target = await apiClient.rpc('seleccionar_directorio');
                    } catch (e) {}
                }
                if (!target || target === 'cancelado') {
                    try {
                        const r = await fetch('/api/seleccionar_directorio');
                        if (r.ok) {
                            const d = await r.json();
                            target = d.path;
                        }
                    } catch (e) {}
                }
            }
            if (!target || target === 'cancelado') {
                return;
            }
            setIsSimulationMode(false);
            setCurrentFolder(target);
            setAuditTracks([]);
            setSelectedTrack(null);
            setGlobalAuditInfo({ isAuditing: false, isLoadingDir: true, progress: 3, statusMsg: 'Iniciando lectura de archivos en carpeta...' });

            let res = null;
            if (true) {
                try {
                    res = await apiClient.rpc('cargar_metadatos_directorio', target);
                } catch (e) {}
            }
            if (!res) {
                try {
                    const r = await fetch('/api/rpc/cargar_metadatos_directorio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ args: [target] })
                    });
                    if (r.ok) {
                        const d = await r.json();
                        res = d.result || d;
                    }
                } catch (e) {}
            }

            const rawTracks = (res && Array.isArray(res.tracks)) ? res.tracks : (Array.isArray(res) ? res : []);
            if (rawTracks.length > 0) {
                setAuditTracks(rawTracks);
                if (rawTracks[0] && rawTracks[0].id) {
                    setSelectedTrack(rawTracks[0].id);
                }
                setGlobalAuditInfo({ isAuditing: false, isLoadingDir: false, progress: 100, statusMsg: `✓ ${rawTracks.length} pistas cargadas correctamente.` });
                setTimeout(() => {
                    setGlobalAuditInfo(prev => ({ ...prev, progress: 0, statusMsg: '' }));
                }, 2500);
            } else {
                setGlobalAuditInfo({ isAuditing: false, isLoadingDir: false, progress: 0, statusMsg: 'No se encontraron pistas de audio en la carpeta.' });
                setTimeout(() => {
                    setGlobalAuditInfo(prev => ({ ...prev, statusMsg: '' }));
                }, 3000);
            }
        } catch (e) {
            console.error("Error al cargar directorio:", e);
        }
    };

    const handleAbrirNavegadorCarpetas = handleCargarDirectorioGlobal;

    const handleOpenBeatgridStudio = (trackRef) => {
        if (trackRef) {
            let found = null;
            if (typeof trackRef === 'object' && trackRef !== null) {
                found = auditTracks.find(t => String(t.id) === String(trackRef.id)) || trackRef;
            } else {
                const query = String(trackRef).trim();
                found = auditTracks.find(t => 
                    String(t.id) === query || 
                    (t.filePath && t.filePath === query) ||
                    (t.path && t.path === query) ||
                    (t.title && t.title.toLowerCase() === query.toLowerCase()) ||
                    (t.t && t.t.toLowerCase() === query.toLowerCase())
                );
            }

            if (found) {
                setSelectedTrack(found.id);
                if (handlePlayTrack) {
                    handlePlayTrack(found, 0, false);
                }
            } else if (typeof trackRef === 'string' && (trackRef.includes('/') || trackRef.includes('\\'))) {
                const filename = trackRef.split('/').pop().replace(/\.[^/.]+$/, "");
                const dynamicTrack = {
                    id: 'trk_' + Date.now(),
                    title: filename,
                    artist: 'DJ Library',
                    filePath: trackRef,
                    path: trackRef,
                    bpm: 138,
                    first_downbeat_ms: 0,
                    status: 'Listo'
                };
                setAuditTracks(prev => [dynamicTrack, ...prev]);
                setSelectedTrack(dynamicTrack.id);
                if (handlePlayTrack) {
                    handlePlayTrack(dynamicTrack, 0, false);
                }
            }
        }
        setStudioMode('beatgrid');
        setActiveTab('hotcues');
    };

    // CUANDO LA INTRO ESTÁ ACTIVA: SE RENDERIZA ÚNICA Y EXCLUSIVAMENTE LA INTRO A PANTALLA COMPLETA
    if (cinematicIntroOpen) {
        return (
            <AppCinematicIntro
                isOpen={true}
                onOpenPricing={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    setPricingOpen(true);
                }}
                onClose={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                }}
                onOpenLogin={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    setUserModalOpen(true);
                }}
                onOpenRegister={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    setRegisterModalOpen(true);
                }}
                onOpenTour={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    handleOpenManual('audit');
                }}
            />
        );
    }

    const shellHelpItems = [
        { id: 'manual', label: 'Manual interactivo', description: 'Masterclass del módulo actual', icon: 'Knowledge', kbd: 'F1', onClick: () => handleOpenManual(activeTab) },
        { id: 'pricing', label: 'Planes y precios', description: 'Free, DJ Pro y Founder Lifetime', icon: 'Crown', onClick: () => setPricingOpen(true) },
        { id: 'shortcuts', label: 'Atajos de teclado', description: 'Controles rápidos de cabina', icon: 'Keyboard', onClick: () => setShortcutsModalOpen(true) },
        { id: 'tutorial', label: 'Tutorial guiado', description: 'Recorrido por la interfaz', icon: 'Compass', onClick: () => setTutorialOpen(true) },
        { id: 'intro', label: 'Ver intro cinemática', description: 'Presentación a pantalla completa', icon: 'Film', onClick: () => setCinematicIntroOpen(true) },
        { id: 'pdf', label: 'Manual técnico (PDF)', description: 'Documentación funcional completa', icon: 'FileText', href: '/api/manual/pdf', download: 'CleanDJmix_PRO_Manual_Funcional_y_Tecnico.pdf' },
    ];

    return (
        <div className={`bw-app flex flex-col h-screen h-[100dvh] w-full max-w-full bg-[#09090b] text-zinc-300 overflow-hidden font-sans select-none ${clubMode ? 'club-mode' : ''}`}>
            <svg width="0" height="0" className="absolute pointer-events-none">
                    <defs>
                        {/* 1. DISTORSIÓN VERTICAL TEARING PARA LAS LETRAS BEATWAVE (BOMBO 4/4 + ROLLING RUMBLE + STUTTER) */}
                        <filter id="waveDistortion" x="-60%" y="-120%" width="220%" height="340%">
                            <feTurbulence type="fractalNoise" baseFrequency="0 0.38" numOctaves="3" result="warp">
                                <animate 
                                    attributeName="baseFrequency" 
                                    values="0 0.16; 0 0.68; 0 0.28; 0 0.58; 0 0.28; 0 0.62; 0 0.28; 0 0.68; 0 0.45; 0 0.16" 
                                    keyTimes="0; 0.04; 0.14; 0.25; 0.35; 0.50; 0.60; 0.75; 0.88; 1" 
                                    dur="2.0s" 
                                    repeatCount="indefinite" 
                                />
                            </feTurbulence>
                            
                            {/* Desplazamiento explosivo masivo sincronizado con la secuencia techno */}
                            <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="0" in="SourceGraphic" in2="warp">
                                <animate 
                                    attributeName="scale" 
                                    values="0; 86; 16; 76; 14; 80; 15; 86; 55; 65; 0" 
                                    keyTimes="0; 0.04; 0.14; 0.25; 0.35; 0.50; 0.60; 0.75; 0.83; 0.92; 1" 
                                    dur="2.0s" 
                                    repeatCount="indefinite"
                                />
                            </feDisplacementMap>
                        </filter>

                        {/* 2. DISTORSIÓN MECÁNICA / RUPTURA DE MEMBRANA PARA EL CONO DEL ALTAVOZ */}
                        <filter id="wooferMechanicalDistortion" x="-50%" y="-50%" width="200%" height="200%">
                            <feTurbulence type="fractalNoise" baseFrequency="0.08 0.14" numOctaves="2" result="coneNoise">
                                <animate 
                                    attributeName="baseFrequency" 
                                    values="0.04 0.08; 0.16 0.26; 0.06 0.12; 0.14 0.22; 0.06 0.12; 0.16 0.26; 0.04 0.08" 
                                    keyTimes="0; 0.04; 0.20; 0.50; 0.70; 0.85; 1" 
                                    dur="2.0s" 
                                    repeatCount="indefinite" 
                                />
                            </feTurbulence>
                            <feDisplacementMap in="SourceGraphic" in2="coneNoise" scale="0" xChannelSelector="R" yChannelSelector="G">
                                <animate 
                                    attributeName="scale" 
                                    values="0; 22; 4; 18; 4; 20; 4; 22; 14; 18; 0" 
                                    keyTimes="0; 0.04; 0.14; 0.25; 0.35; 0.50; 0.60; 0.75; 0.83; 0.92; 1" 
                                    dur="2.0s" 
                                    repeatCount="indefinite" 
                                />
                            </feDisplacementMap>
                        </filter>
                    </defs>
                </svg>

            <TopBar
                logo={(
                    <div className="flex items-center select-none my-auto bw-header-logo-container">
                        <BeatWaveBrandIdentity 
                            variant="header"
                            isTechnoActive={isLogoTechnoActive}
                            onClick={triggerLogoTechno}
                        />
                    </div>
                )}
                activeTab={activeTab}
                t={t}
                auditInfo={globalAuditInfo}
                clubMode={clubMode}
                onToggleClubMode={toggleClubMode}
                onOpenCopilot={() => setCopilotModalOpen(true)}
                helpItems={shellHelpItems}
                onOpenBitacora={() => setBitacoraModalOpen(true)}
                onOpenUser={() => setUserModalOpen(true)}
                userProfile={userProfile}
                lang={lang}
                onToggleLang={() => changeLang(lang === 'es' ? 'en' : 'es')}
            />

            <div className="flex flex-1 min-h-0 w-full">
                <SideRail
                    activeTab={activeTab}
                    onSelect={(tabId) => {
                        setActiveTab(tabId);
                        setRailExpanded(false);
                        try { localStorage.setItem('bw_rail_expanded', '0'); } catch (e) {}
                    }}
                    t={t}
                    expanded={railExpanded}
                    onToggleExpanded={toggleRailExpanded}
                    auditInfo={globalAuditInfo}
                    trackCount={auditTracks ? auditTracks.length : 0}
                    onOpenCopilot={() => {
                        setActiveTab('copilot');
                        setRailExpanded(false);
                        try { localStorage.setItem('bw_rail_expanded', '0'); } catch (e) {}
                    }}
                    onOpenLibrary={() => {
                        setActiveTab('library');
                        setRailExpanded(false);
                    }}
                    libraryCount={customLibraries.length}
                    isLibraryOpen={activeTab === 'library'}
                />
                <div className="flex flex-1 min-w-0 min-h-0 flex-col">

            {/* MAIN WORKSPACES: Persistencia Total de Estado Manteniendo Todo Montado */}
            <main className="flex-1 min-h-0 w-full overflow-hidden relative">
                <WorkspaceSlot isActive={activeTab === 'library'} className="w-full h-full flex flex-col">
                    <FeatureErrorBoundary feature="library">
                        <LibraryWorkspace 
                        libraries={customLibraries}
                        activeLibraryId={activeCustomLibId}
                        onSaveLibraries={(updatedLibs, newActiveId) => saveCustomLibraries(updatedLibs, newActiveId)}
                        onSelectLibrary={(id) => saveCustomLibraries(customLibraries, id)}
                        currentTracks={auditTracks}
                        selectedTrackIds={selectedAuditTrackIds}
                        onMaterializarEnDisco={handleMaterializarBibliotecaEnDisco}
                        onAuditarCrate={(folder, lib) => {
                            handleAuditarCrateDesdeModal(folder, lib);
                            setActiveTab('audit');
                        }}
                        onNavigateTab={setActiveTab}
                        onLoadFolderFromDisk={() => handleCargarDirectorioGlobal()}
                        currentFolder={currentFolder}
                        onPlayTrack={handlePlayTrack}
                        onTogglePlay={togglePlayPause}
                        nowPlayingTrack={nowPlayingTrack}
                        isPlaying={isPlaying}
                        playProgress={playProgress}
                        setAuditTracks={setAuditTracks}
                        setSelectedTrack={setSelectedTrack}
                    />
                        </FeatureErrorBoundary>
                </WorkspaceSlot>
                <WorkspaceSlot isActive={activeTab === 'audit'} className="w-full h-full">
                    <FeatureErrorBoundary feature="audit">
                    <AuditWorkspace 
                        tracks={auditTracks}
                        setTracks={setAuditTracks}
                        customLibraries={customLibraries}
                        onSaveCustomLibraries={saveCustomLibraries}
                        activeCustomLibId={activeCustomLibId}
                        selectedTrack={selectedTrack} 
                        setSelectedTrack={setSelectedTrack} 
                        onPlayTrack={handlePlayTrack} 
                        onTogglePlay={togglePlayPause} 
                        nowPlayingTrack={nowPlayingTrack} 
                        isPlaying={isPlaying} 
                        playProgress={playProgress} 
                        onNavigateTab={setActiveTab}
                        onSendToSpotify={handleAddTracksToSpotify}
                        onRemoveTrack={handleRemoveTrackGlobal}
                        onRemoveMultipleTracks={handleRemoveMultipleTracksGlobal}
                        onClearAllTracks={handleClearAllTracksGlobal}
                        lang={lang}
                        t={t}
                        currentFolder={currentFolder}
                        setCurrentFolder={setCurrentFolder}
                        audioRef={audioRef}
                        onAuditProgressChange={setGlobalAuditInfo}
                        onOpenLibrary={() => setActiveTab('library')}
                        isSimulationMode={isSimulationMode}
                        onToggleSimulation={handleToggleSimulation}
                        activeCrateFilter={activeCrateFilter}
                        onClearCrateFilter={() => setActiveCrateFilter(null)}
                        onOpenBeatgridStudio={handleOpenBeatgridStudio}
                    />
                    </FeatureErrorBoundary>
                </WorkspaceSlot>
                <WorkspaceSlot isActive={activeTab === 'hotcues'} className="w-full h-full">
                    <FeatureErrorBoundary feature="hotcues">
                    <HotCuesWorkspace 
                        tracks={auditTracks}
                        setTracks={setAuditTracks}
                        customLibraries={customLibraries}
                        onSaveCustomLibraries={saveCustomLibraries}
                        activeCustomLibId={activeCustomLibId}
                        selectedTrack={selectedTrack} 
                        setSelectedTrack={setSelectedTrack} 
                        onPlayTrack={handlePlayTrack} 
                        onTogglePlay={togglePlayPause} 
                        nowPlayingTrack={nowPlayingTrack} 
                        isPlaying={isPlaying} 
                        playProgress={playProgress} 
                        onNavigateTab={setActiveTab}
                        onSendToSpotify={handleAddTracksToSpotify}
                        onRemoveTrack={handleRemoveTrackGlobal}
                        onRemoveMultipleTracks={handleRemoveMultipleTracksGlobal}
                        lang={lang}
                        t={t}
                        currentFolder={currentFolder}
                        setCurrentFolder={setCurrentFolder}
                        audioRef={audioRef}
                        studioMode={studioMode}
                        onSetStudioMode={setStudioMode}
                    />
                    </FeatureErrorBoundary>
                </WorkspaceSlot>
                <WorkspaceSlot isActive={activeTab === 'spotify'} className="w-full h-full">
                    <FeatureErrorBoundary feature="pool">
                    <SpotifyWorkspace 
                        tracks={spotifyTracks}
                        setTracks={setSpotifyTracks}
                        customLibraries={customLibraries}
                        onSaveCustomLibraries={saveCustomLibraries}
                        activeCustomLibId={activeCustomLibId}
                        onPlayTrack={handlePlayTrack} 
                        nowPlayingTrack={nowPlayingTrack} 
                        isPlaying={isPlaying} 
                        onTogglePlay={togglePlayPause} 
                        lang={lang}
                        t={t}
                    />
                    </FeatureErrorBoundary>
                </WorkspaceSlot>
                <WorkspaceSlot isActive={activeTab === 'shazam'} className="w-full h-full">
                    <ShazamWorkspace 
                        customLibraries={customLibraries}
                        onSaveCustomLibraries={saveCustomLibraries}
                        activeCustomLibId={activeCustomLibId}
                        onSendToSpotify={(query) => {
                            if (typeof query === 'object' && query !== null) {
                                handleAddTrackToSpotify(query, 'shazam');
                            } else {
                                setActiveTab('spotify');
                            }
                        }}
                        onSendToAudit={(trackData) => {
                            setAuditTracks(prev => [trackData, ...prev]);
                            setSelectedTrack(trackData.id);
                            setActiveTab('audit');
                        }}
                        onNavigateTab={setActiveTab}
                        onLoadFolderFromDisk={() => handleCargarDirectorioGlobal()}
                        currentFolder={currentFolder}
                    />
                </WorkspaceSlot>
                <WorkspaceSlot isActive={activeTab === 'taxonomy'} className="w-full h-full">
                    <FeatureErrorBoundary feature="crates">
                <TaxonomyWorkspace 
                        tracks={auditTracks} 
                        onTracksUpdated={setAuditTracks} 
                        onNavigateTab={setActiveTab} 
                        onPlayTrack={handlePlayTrack}
                        nowPlayingTrack={nowPlayingTrack}
                        isPlaying={isPlaying}
                        onTogglePlay={togglePlayPause}
                        onRemoveTrack={handleRemoveTrackGlobal}
                        onSelectTrackForCues={(trk) => {
                            if (!trk) return;
                            const existing = auditTracks.find(t => t.id === trk.id || (t.path && t.path === trk.path));
                            if (existing) {
                                setSelectedTrack(existing.id);
                            } else {
                                const newId = auditTracks.length > 0 ? Math.max(...auditTracks.map(t => Number(t.id) || 0)) + 1 : 1;
                                const newTrk = { ...trk, id: newId };
                                setAuditTracks(prev => [newTrk, ...prev]);
                                setSelectedTrack(newId);
                            }
                            setActiveTab('hotcues');
                        }}
                        onSendToSpotify={(query) => {
                            setActiveTab('spotify');
                        }}
                        onAddTrackToSet={(track) => {
                            if (!track) return;
                            setSetBuilderTracks(prev => [...prev, track]);
                            setActiveTab('setbuilder');
                        }}
                        onAddTrackToSpotify={handleAddTracksToSpotify}
                        onAddTracksToSpotify={handleAddTracksToSpotify}
                    />
                </FeatureErrorBoundary>
                </WorkspaceSlot>
                <WorkspaceSlot isActive={activeTab === 'trends'} className="w-full h-full">
                    <FeatureErrorBoundary feature="radar">
                    <FeatureErrorBoundary feature="trends">
                <TrendsWorkspace lang={lang} />
                </FeatureErrorBoundary>
                    </FeatureErrorBoundary>
                </WorkspaceSlot>
                <WorkspaceSlot isActive={activeTab === 'setbuilder'} className="w-full h-full">
                    <FeatureErrorBoundary feature="sets">
                    <SetBuilderWorkspace 
                        setTracks={setBuilderTracks}
                        setSetTracks={setSetBuilderTracks}
                        auditTracks={auditTracks}
                        setAuditTracks={setAuditTracks}
                        customLibraries={customLibraries}
                        onSaveCustomLibraries={saveCustomLibraries}
                        activeCustomLibId={activeCustomLibId}
                        onPlayTrack={handlePlayTrack}
                        nowPlayingTrack={nowPlayingTrack}
                        isPlaying={isPlaying}
                        onTogglePlay={togglePlayPause}
                        onNavigateTab={setActiveTab}
                        lang={lang}
                    />
                    </FeatureErrorBoundary>
                </WorkspaceSlot>
                <WorkspaceSlot isActive={activeTab === 'map'} className="w-full h-full">
                    <FeatureErrorBoundary feature="map">
                    <MapWorkspace 
                        tracks={auditTracks}
                        setTracks={setAuditTracks}
                        customLibraries={customLibraries}
                        onSaveCustomLibraries={saveCustomLibraries}
                        activeCustomLibId={activeCustomLibId}
                        onPlayTrack={handlePlayTrack}
                        nowPlayingTrack={nowPlayingTrack}
                        isPlaying={isPlaying}
                        onTogglePlay={togglePlayPause}
                        onNavigateTab={setActiveTab}
                        onAddTracksToSet={(newTracks) => {
                            if (!newTracks || newTracks.length === 0) return;
                            setSetBuilderTracks(prev => [...prev, ...newTracks]);
                            setActiveTab('setbuilder');
                        }}
                        onSelectDirectory={() => handleCargarDirectorioGlobal()}
                        lang={lang}
                    />
                    </FeatureErrorBoundary>
                </WorkspaceSlot>
                <WorkspaceSlot isActive={activeTab === 'knowledge'} className="w-full h-full">
                    <FeatureErrorBoundary feature="knowledge">
                <KnowledgeWorkspace lang={lang} />
                </FeatureErrorBoundary>
                </WorkspaceSlot>
                {activeTab === 'copilot' && (
                    <div className="w-full h-full">
                        <FeatureErrorBoundary feature="copilot">
                        <CopilotWorkspace 
                            onOpenPopOut={() => {
                                const w = 1380, h = 880;
                                const left = (window.screen.width - w) / 2;
                                const top = (window.screen.height - h) / 2;
                                window.open('/copilot.html', 'BeatWaveLiveCopilot', `width=${w},height=${h},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no,resizable=yes`);
                            }}
                            onOpenQr={() => setCopilotModalOpen(true)}
                        />
                        </FeatureErrorBoundary>
                    </div>
                )}
            </main>

            {/* INPUT OCULTO PARA CARGA DE AUDIO LOCAL DESDE EL DISPOSITIVO DEL USUARIO */}
            <input 
                ref={localAudioInputRef} 
                type="file" 
                accept="audio/*" 
                onChange={handleLoadLocalAudioFile} 
                className="hidden" 
            />

            {/* DECK BAR GLOBAL — PERMANENTEMENTE VISIBLE (DECK FOOTER SIEMPRE ACTIVO) */}
            <footer className="flex bw-deckbar relative z-30 h-16 shrink-0 items-center gap-3 px-3 sm:px-4">
                <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-white/5 md:hidden">
                    <div className="h-full bg-cyan-400 transition-all duration-200" style={{ width: `${Math.min(100, Math.max(0, mobileProgress * 100))}%` }} />
                </div>

                {!nowPlayingTrack ? (
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 md:w-80 shrink-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/15 text-zinc-600">
                            <Icons.Disc size={20} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="bw-eyebrow">{t('deck_standby_label') || 'DECK 1 STANDBY'}</span>
                            <span className="text-xs text-zinc-500 truncate">{t('deck_standby_comment_hint') || 'Carga una pista para reproducir'}</span>
                        </div>

                        {/* SELECTOR DE CARGA DE PISTA: DESDE BIBLIOTECA O DISPOSITIVO */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setLoadTrackMenuOpen(prev => !prev)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/40 hover:bg-cyan-500/25 text-cyan-300 font-mono text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                            >
                                <span>🎵 Cargar</span>
                                <Icons.ChevronDown size={11} />
                            </button>

                            {loadTrackMenuOpen && (
                                <div className="absolute left-0 bottom-full mb-2 z-50 w-52 rounded-xl bg-zinc-950/98 border border-zinc-700/80 shadow-2xl p-1.5 flex flex-col gap-1 backdrop-blur-md text-xs font-mono">
                                    <button
                                        type="button"
                                        onClick={handleLoadFirstLibraryTrack}
                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors text-left cursor-pointer"
                                    >
                                        <span>📚</span>
                                        <span>Desde Biblioteca DJ</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (localAudioInputRef.current) localAudioInputRef.current.click();
                                        }}
                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-950/60 text-cyan-300 hover:text-white border border-transparent hover:border-cyan-500/30 transition-colors text-left cursor-pointer"
                                    >
                                        <span>📁</span>
                                        <span>Desde tu Dispositivo</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 min-w-0 flex-1 md:w-72 md:flex-initial">
                        <img
                            src={getValidCover(nowPlayingTrack.cover || (nowPlayingTrack.path ? `/cover?path=${encodeURIComponent(nowPlayingTrack.path)}` : (nowPlayingTrack.f ? `/cover?path=${encodeURIComponent(nowPlayingTrack.f)}` : null)))}
                            alt=""
                            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }}
                            className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                        />
                        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                            <span className="text-sm font-semibold text-white truncate" title={nowPlayingTrack.t || nowPlayingTrack.title}>
                                {nowPlayingTrack.t || nowPlayingTrack.title}
                            </span>
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs text-cyan-300 truncate" title={nowPlayingTrack.a || nowPlayingTrack.artist}>{nowPlayingTrack.a || nowPlayingTrack.artist}</span>
                                <span className="font-mono text-xs text-white shrink-0">{nowPlayingTrack.b || nowPlayingTrack.bpm || '--'}<span className="text-zinc-500"> BPM</span></span>
                                <span className="bw-key-chip shrink-0">{nowPlayingTrack.k || nowPlayingTrack.key || '--'}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                    <button type="button" disabled={!nowPlayingTrack} onClick={handleCue} className="bw-deck-btn">CUE</button>
                    <button type="button" disabled={!nowPlayingTrack} onClick={togglePlayPause} className="bw-deck-play" aria-label={isPlaying ? 'Pausar' : 'Reproducir'}>
                        {isPlaying ? <Icons.Pause size={18} /> : <Icons.Play size={18} />}
                    </button>
                    <button type="button" disabled={!nowPlayingTrack} onClick={() => handleFooterSeek(0.22)} className="bw-deck-btn hidden sm:inline-flex">SYNC</button>
                </div>

                {(nowPlayingTrack && (nowPlayingTrack.comment || nowPlayingTrack.comentario)) && (
                    <div className="hidden xl:flex items-center gap-2 max-w-xs shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5" title={nowPlayingTrack.comment || nowPlayingTrack.comentario}>
                        <Icons.MessageSquare size={14} className="text-cyan-300" />
                        <span className="font-mono text-xs text-zinc-300 truncate">{nowPlayingTrack.comment || nowPlayingTrack.comentario}</span>
                    </div>
                )}

                <div className="hidden md:flex flex-1 min-w-0">
                    <FooterMasterWaveform 
                        track={nowPlayingTrack} 
                        isPlaying={isPlaying} 
                        playProgressRef={playProgressRef} 
                        onSeek={handleFooterSeek} 
                        cues={(nowPlayingTrack && nowPlayingTrack.cues && nowPlayingTrack.cues.length > 0) ? nowPlayingTrack.cues : ((currentTrack && currentTrack.cues && currentTrack.cues.length > 0) ? currentTrack.cues : NV2_COLORS)} 
                        t={t}
                    />
                </div>
            </footer>
                </div>
            </div>

            <MobileTabBar
                activeTab={activeTab}
                onSelect={setActiveTab}
                onOpenMore={() => setMobileDrawerOpen(true)}
                moreOpen={mobileDrawerOpen}
                t={t}
            />

            <MoreSheet
                open={mobileDrawerOpen}
                onClose={() => setMobileDrawerOpen(false)}
                activeTab={activeTab}
                onSelect={setActiveTab}
                onOpenCopilot={() => setCopilotModalOpen(true)}
                helpItems={shellHelpItems}
                clubMode={clubMode}
                onToggleClubMode={toggleClubMode}
                lang={lang}
                onChangeLang={changeLang}
                onOpenBitacora={() => setBitacoraModalOpen(true)}
                t={t}
            />

            {/* TUTORIAL & ASISTENTE INTERACTIVO DE BIENVENIDA */}
            <AppTutorialModal 
                isOpen={tutorialOpen} 
                onClose={() => setTutorialOpen(false)} 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                initialMode={tutorialInitialMode}
            />

            {/* MODAL LANZADOR BEATWAVE LIVE COPILOT */}
            <FeatureErrorBoundary feature="pricing">
                <PricingModal 
                isOpen={pricingOpen} 
                onClose={() => setPricingOpen(false)} 
                onSelectPlan={(plan) => { 
                    setPricingOpen(false); 
                    if (plan === 'free') return; 
                    setSelectedPlanForRegister(plan === 'lifetime' ? 'lifetime' : 'pro');
                    setRegisterModalOpen(true); 
                }} 
            />
                </FeatureErrorBoundary>
            <CopilotLaunchModal 
                isOpen={copilotModalOpen}
                onClose={() => setCopilotModalOpen(false)}
                onSelectEmbedded={() => {
                    setActiveTab('copilot');
                    setCopilotModalOpen(false);
                }}
            />

            {/* UX CABINA: MODAL DE ATAJOS DE TECLADO DJ PROFESIONAL */}
            <DJShortcutsModal 
                isOpen={shortcutsModalOpen}
                onClose={() => setShortcutsModalOpen(false)}
                clubMode={clubMode}
                onToggleClubMode={toggleClubMode}
            />

            {/* MANUAL INTERACTIVO MAESTRO DE CABINA BEATWAVE PRO (8 SECCIONES & SIMULADOR) */}
            <FeatureErrorBoundary feature="manual">
                <InteractiveManualModal
                isOpen={manualModalOpen}
                onClose={() => setManualModalOpen(false)}
                initialSection={manualSection}
                onNavigateTab={(tab) => {
                    setActiveTab(tab);
                    setManualModalOpen(false);
                }}
                lang={lang}
            />
                </FeatureErrorBoundary>

            {/* ESPACIO DE USUARIO, LOGIN & SESIONES GUARDADAS */}
            <FeatureErrorBoundary feature="login">
                <UserAccountModal 
                isOpen={userModalOpen}
                onClose={() => setUserModalOpen(false)}
                userProfile={userProfile}
                onUpdateProfile={handleUpdateUserProfile}
                savedSessions={savedSessions}
                onSaveCurrentSession={handleSaveCurrentSession}
                onLoadSession={handleLoadSession}
                onDeleteSession={handleDeleteSession}
                currentSessionSnapshot={{
                    folder: currentFolder,
                    tracksCount: auditTracks.length,
                    activeTab: activeTab
                }}
                onNavigateTab={setActiveTab}
                onOpenShortcuts={() => setShortcutsModalOpen(true)}
                onOpenPricing={() => {
                    setUserModalOpen(false);
                    setPricingOpen(true);
                }}
                onOpenRegister={() => {
                    setUserModalOpen(false);
                    setRegisterModalOpen(true);
                }}
            />
                </FeatureErrorBoundary>

            {/* MODAL DE REGISTRO & PASARELA DE PAGO COMPLETA */}
            <RegisterFlowModal
                isOpen={registerModalOpen}
                initialPlan={selectedPlanForRegister}
                onClose={() => setRegisterModalOpen(false)}
                onOpenPricing={() => {
                    setRegisterModalOpen(false);
                    setPricingOpen(true);
                }}
                onSuccessRegister={(newProfile) => {
                    setRegisterModalOpen(false);
                    if (handleUpdateUserProfile) {
                        handleUpdateUserProfile(newProfile);
                    }
                    setUserModalOpen(true);
                }}
            />

            {/* CUADERNO DE BITÁCORA Y REGISTRO DE CAMBIOS AUDITABLE (DRAWER LATERAL DERECHO) */}
            <FeatureErrorBoundary feature="bitacora">
                <BitacoraModal 
                isOpen={bitacoraModalOpen}
                onClose={() => setBitacoraModalOpen(false)}
                entries={bitacoraEntries}
                onClearEntries={handleClearBitacora}
                onOpenBeatgridStudio={handleOpenBeatgridStudio}
                tracks={auditTracks}
            />
                </FeatureErrorBoundary>


            {/* PRESENTACIÓN CINEMÁTICA A PANTALLA COMPLETA CON VÍDEO DE FONDO */}
            <AppCinematicIntro
                isOpen={cinematicIntroOpen}
                onOpenPricing={() => setPricingOpen(true)}
                onClose={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                }}
                onOpenFolder={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    handleCargarDirectorioGlobal();
                }}
                onOpenDemo={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    setActiveTab('map');
                }}
                onOpenManual={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    handleOpenManual('audit');
                }}
                onOpenLogin={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    setUserModalOpen(true);
                }}
                onOpenRegister={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    setRegisterModalOpen(true);
                }}
                onOpenTour={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    handleOpenManual('copilot');
                }}
            />
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
