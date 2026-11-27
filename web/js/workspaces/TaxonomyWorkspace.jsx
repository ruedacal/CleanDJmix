const { useState, useEffect, useRef, useMemo, useCallback } = React;
import { Icons } from '../shell/icons.jsx';
import { apiClient } from '../services/apiClient.js';
import { DJ_CURATED_CATALOG, TAXONOMY_TREE, CAMELOT_WHEEL_DATA, AI_PROMPT_CHIPS, parseAIDJQuery } from '../data/djCatalog.js';
import { SectionTitle, CamelotKeyBadge } from '../shell/workspace-ui.jsx';
import { DEFAULT_VINYL_SVG, getValidCover } from '../data/constants.js';
import { CamelotWheelModal } from '../modals/index.js';

// Espacio de Trabajo: Taxonomía, Buscador Inteligente IA (Estilo Cuenca Music) y Ruteo a Serato Crates
export const TaxonomyWorkspace = ({ 
    tracks = [], 
    onTracksUpdated, 
    onNavigateTab,
    onPlayTrack,
    nowPlayingTrack = null,
    isPlaying = false,
    onTogglePlay = () => {},
    onSelectTrackForCues,
    onSendToSpotify,
    onAddTrackToSpotify,
    onAddTracksToSpotify,
    onRemoveTrack
}) => {
    // Sub-pestaña activa: 'search' (Buscador Cuenca Music IA) o 'routing' (Serato Crates)
    const [activeSubView, setActiveSubView] = useState('search');

    // Ámbito de Búsqueda Activa: 'all' (Híbrido), 'local' (Biblioteca Local), 'online' (Record Pool Online)
    const [searchScope, setSearchScope] = useState('all');
    const [isSearchingOnline, setIsSearchingOnline] = useState(false);
    const [onlineResults, setOnlineResults] = useState([]);
    const [searchLocalResults, setSearchLocalResults] = useState([]);
    const [hasExecutedSearch, setHasExecutedSearch] = useState(false);

    // Selección múltiple para enviar a descargas
    const [selectedTaxIds, setSelectedTaxIds] = useState(new Set());

    // Estado de Tabla & Filtros de Cabecera en Taxonomía
    const [displayMode, setDisplayMode] = useState('table'); // 'table' o 'grid'
    const [taxSortField, setTaxSortField] = useState('matchScore');
    const [taxSortDir, setTaxSortDir] = useState('desc');
    const [taxFilterSearch, setTaxFilterSearch] = useState('');
    const [taxFilterGenre, setTaxFilterGenre] = useState('ALL');
    const [taxFilterOrigin, setTaxFilterOrigin] = useState('ALL');
    const [taxFilterEnergy, setTaxFilterEnergy] = useState('ALL');
    const [taxFilterDance, setTaxFilterDance] = useState('ALL');

    const handleSortTax = (field) => {
        setTaxSortDir(prev => taxSortField === field && prev === 'asc' ? 'desc' : 'asc');
        setTaxSortField(field);
    };

    const renderSortArrowTax = (field) => {
        if (taxSortField !== field) return <span className="text-gray-600 ml-1 text-[9px]">↕</span>;
        return <span className="text-djcyan-400 ml-1 font-bold text-[10px]">{taxSortDir === 'asc' ? '▲' : '▼'}</span>;
    };

    // Estado del Buscador Inteligente por Taxonomías (Cuenca Music Style)
    const [aiQuery, setAiQuery] = useState('');
    const [selectedGenreFilter, setSelectedGenreFilter] = useState('ALL');
    const [selectedSubgenreFilterUI, setSelectedSubgenreFilterUI] = useState('ALL');
    const [selectedVersionFilter, setSelectedVersionFilter] = useState('ALL');
    const [selectedBpmFilter, setSelectedBpmFilter] = useState('ALL');
    const [selectedKeyFilter, setSelectedKeyFilter] = useState('ALL');
    const [selectedMoodFilter, setSelectedMoodFilter] = useState('ALL');
    const [isCamelotModalOpen, setIsCamelotModalOpen] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState('');

    // Estado del Menú de Añadir Tags y Filtros Manuales
    const [isAddTagMenuOpen, setIsAddTagMenuOpen] = useState(false);
    const [activeTagTab, setActiveTagTab] = useState('bpm');

    // Manejo de eliminación de tokens interpretados
    const handleRemoveToken = (tok) => {
        if (!tok) return;
        let newQuery = aiQuery;
        const matchStr = tok.rawMatch || tok.label;
        if (matchStr) {
            newQuery = newQuery.replace(new RegExp(`\\b${matchStr.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i'), '');
            if (newQuery === aiQuery) {
                newQuery = newQuery.replace(new RegExp(matchStr.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i'), '');
            }
        }
        newQuery = newQuery.replace(/\s+/g, ' ').trim();
        setAiQuery(newQuery);
        handleEjecutarBusqueda(newQuery);
    };

    // Manejo de incorporación de tags directos
    const handleAddTagToQuery = (tagStr) => {
        const newQuery = (aiQuery ? `${aiQuery} ${tagStr}` : tagStr).trim();
        setAiQuery(newQuery);
        setIsAddTagMenuOpen(false);
        handleEjecutarBusqueda(newQuery);
    };

    // Estado de Ruteo Físico y Exportación Serato / Rekordbox
    const [rutaBase, setRutaBase] = useState('/Users/admin/Music/mi musica');
    const [modo, setModo] = useState('copy'); // 'copy' o 'move'
    const [isRouting, setIsRouting] = useState(false);
    const [routeProgress, setRouteProgress] = useState(0);
    const [routeStatusMsg, setRouteStatusMsg] = useState('');
    const [resultSummary, setResultSummary] = useState(null);
    const [expandedGenre, setExpandedGenre] = useState('Techno');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubgenreFilter, setSelectedSubgenreFilter] = useState(null);

    // Auto-carga inicial para que la lista nunca esté vacía
    useEffect(() => {
        handleEjecutarBusqueda("");
    }, []);

    // Parseo en tiempo real de la consulta con el motor de IA DJ
    const parsedQuery = useMemo(() => parseAIDJQuery(aiQuery), [aiQuery]);

    // Combinación de pistas locales de auditoría + catálogo curado de pool
    const localTracks = useMemo(() => {
        return (Array.isArray(tracks) ? tracks : []).map(t => ({
            ...t,
            isLocal: true,
            displayTitle: t.t || t.title || 'Pista Local',
            displayArtist: t.a || t.artist || 'Artista',
            displayAlbum: t.album || '',
            displayBpm: parseFloat(t.b || t.bpm || 128),
            displayKey: (t.k || t.key || '8A').toUpperCase(),
            displayGenre: t.genre || 'House',
            displaySubgenre: t.subgenre || 'Tech House',
            displayVersion: t.version || 'Extended Mix',
            displayMood: t.mood_subtag || t.mood || 'Peak Time / Pista',
            displayCover: t.cover || (t.path ? `/cover?path=${encodeURIComponent(t.path)}` : null)
        }));
    }, [tracks]);

    const catalogTracks = useMemo(() => {
        return DJ_CURATED_CATALOG.map(t => ({
            ...t,
            isCatalog: true,
            displayTitle: t.title,
            displayArtist: t.artist,
            displayAlbum: t.album || '',
            displayBpm: t.bpm,
            displayKey: t.key,
            displayGenre: t.genre,
            displaySubgenre: t.subgenre,
            displayVersion: t.version,
            displayMood: t.mood,
            displayCover: t.cover
        }));
    }, []);

    // Fusión de catálogo según ámbito seleccionado
    const allPoolTracks = useMemo(() => {
        const combinedLocals = searchLocalResults.length > 0 ? searchLocalResults : localTracks;
        const combinedOnline = onlineResults.length > 0 ? onlineResults : catalogTracks;
        if (searchScope === 'local') {
            return combinedLocals;
        } else if (searchScope === 'online') {
            return combinedOnline;
        } else {
            return [...combinedLocals, ...combinedOnline];
        }
    }, [localTracks, searchLocalResults, onlineResults, catalogTracks, searchScope]);

    // Ejecución Activa de Búsqueda (Boton Buscar / Enter / Chip)
    const handleEjecutarBusqueda = async (queryOverride) => {
        const q = (queryOverride !== undefined ? queryOverride : aiQuery).trim();
        setIsSearchingOnline(true);
        setHasExecutedSearch(true);
        const scopeLabel = searchScope === 'local' ? 'Biblioteca Local' : (searchScope === 'online' ? 'Record Pool Online' : 'Local y Pool Online');
        setFeedbackMsg(`Buscando ${q ? `"${q}"` : "catálogo"} en ${scopeLabel}...`);

        try {
            if (true) {
                const res = await apiClient.rpc('buscar_temas_taxonomia', q, searchScope, rutaBase, 40);
                if (res && res.status === 'ok') {
                    const onlineItems = (res.online || []).map(item => ({
                        ...item,
                        isOnlinePool: true,
                        isFromSearch: true,
                        displayTitle: item.title,
                        displayArtist: item.artist,
                        displayAlbum: item.album || '',
                        displayBpm: parseFloat(item.bpm || 128),
                        displayKey: (item.key || '8A').toUpperCase(),
                        displayGenre: item.genre || 'House',
                        displaySubgenre: item.subgenre || 'Tech House',
                        displayVersion: item.version || 'Original Mix',
                        displayMood: item.mood || 'Peak Time / Pista',
                        displayCover: item.cover,
                        matchScore: 98
                    }));
                    const localItems = (res.locales || []).map(item => ({
                        ...item,
                        isLocal: true,
                        isLocalSearch: true,
                        isFromSearch: true,
                        displayTitle: item.title || item.t || 'Pista Local',
                        displayArtist: item.artist || item.a || 'Artista Local',
                        displayAlbum: item.album || '',
                        displayBpm: parseFloat(item.bpm || item.b || 128),
                        displayKey: (item.key || item.k || '8A').toUpperCase(),
                        displayGenre: item.genre || 'House',
                        displaySubgenre: item.subgenre || 'Tech House',
                        displayVersion: item.version || 'Extended Mix',
                        displayMood: item.mood || 'Peak Time / Pista',
                        displayCover: item.cover || (item.path ? `/cover?path=${encodeURIComponent(item.path)}` : null),
                        matchScore: 98
                    }));
                    setOnlineResults(onlineItems);
                    setSearchLocalResults(localItems);
                    const totalFound = localItems.length + onlineItems.length;
                    setFeedbackMsg(`✓ Encontrados ${totalFound} temas (${localItems.length} en disco + ${onlineItems.length} en Record Pool)`);
                }
            }
        } catch (err) {
            console.error("Error al buscar temas en taxonomía:", err);
            setFeedbackMsg(`✓ Búsqueda filtrada en pistas de biblioteca.`);
        } finally {
            setIsSearchingOnline(false);
            setTimeout(() => setFeedbackMsg(''), 4500);
        }
    };

    // Algoritmo de emparejamiento, scoring y ordenación por taxonomía musical
    const searchResults = useMemo(() => {
        const hasTextQuery = Boolean(aiQuery && aiQuery.trim().length > 0);
        const qLower = (aiQuery || '').toLowerCase().trim();
        const queryWords = qLower.split(/\s+/).filter(w => w.length >= 2 && !['para', 'con', 'del', 'the', 'los', 'las', 'por', 'and'].includes(w));

        let scored = allPoolTracks.map(trk => {
            let score = 0;
            let matchedReasons = [];
            const trkGenre = (trk.displayGenre || '').toLowerCase();
            const trkSubgenre = (trk.displaySubgenre || '').toLowerCase();
            const trkBpm = trk.displayBpm || 128;
            const trkKey = (trk.displayKey || '').toUpperCase();
            const trkTitle = (trk.displayTitle || '').toLowerCase();
            const trkArtist = (trk.displayArtist || '').toLowerCase();
            const trkAlbum = (trk.displayAlbum || '').toLowerCase();
            const trkVersion = (trk.displayVersion || '').toLowerCase();
            const trkMood = (trk.displayMood || '').toLowerCase();

            if (hasTextQuery) {
                // Si la pista vino directamente del backend como resultado de búsqueda
                if (trk.isFromSearch) {
                    score += 80;
                    matchedReasons.push("Resultado directo");
                }

                // Coincidencia exacta con la consulta completa
                if (trkTitle.includes(qLower) || trkArtist.includes(qLower) || trkAlbum.includes(qLower) || trkGenre.includes(qLower) || trkSubgenre.includes(qLower)) {
                    score += 65;
                    matchedReasons.push("Coincidencia directa");
                }

                // 1. Género y Subgénero
                if (parsedQuery.genre && trkGenre.includes(parsedQuery.genre.toLowerCase())) {
                    score += 35;
                    matchedReasons.push(parsedQuery.genre);
                }
                if (parsedQuery.subgenre && (trkSubgenre.includes(parsedQuery.subgenre.toLowerCase()) || trkTitle.includes(parsedQuery.subgenre.toLowerCase()))) {
                    score += 30;
                    matchedReasons.push(parsedQuery.subgenre);
                }

                // 2. BPM Match
                if (parsedQuery.targetBpm && trkBpm > 0) {
                    const diff = Math.abs(trkBpm - parsedQuery.targetBpm);
                    if (diff <= 1.5) {
                        score += 30;
                        matchedReasons.push(`${trkBpm} BPM`);
                    } else if (diff <= 3.5) {
                        score += 20;
                        matchedReasons.push(`±${Math.round(diff)} BPM`);
                    } else if (diff <= 6) {
                        score += 10;
                    }
                } else if (parsedQuery.minBpm && parsedQuery.maxBpm && trkBpm >= parsedQuery.minBpm && trkBpm <= parsedQuery.maxBpm) {
                    score += 25;
                    matchedReasons.push(`${trkBpm} BPM`);
                }

                // 3. Tonalidad Camelot
                if (parsedQuery.key) {
                    if (trkKey === parsedQuery.key) {
                        score += 30;
                        matchedReasons.push(`Key ${trkKey}`);
                    } else if (parsedQuery.compatibleKeys.includes(trkKey)) {
                        score += 20;
                        matchedReasons.push(`Harmonic ${trkKey}`);
                    }
                }

                // 4. Versión DJ
                if (parsedQuery.version) {
                    const vLower = parsedQuery.version.toLowerCase();
                    if (trkVersion.includes(vLower) || trkTitle.includes(vLower)) {
                        score += 20;
                        matchedReasons.push(parsedQuery.version);
                    }
                }

                // 5. Mood / Energía
                if (parsedQuery.mood) {
                    const mLower = parsedQuery.mood.toLowerCase();
                    if (trkMood.includes(mLower) || (parsedQuery.mood.includes("Previa") && (trkBpm < 118 || trkMood.includes("warm"))) || (parsedQuery.mood.includes("Pista") && (trkBpm >= 124 || trkMood.includes("peak")))) {
                        score += 15;
                        matchedReasons.push(parsedQuery.mood);
                    }
                }

                // 6. Palabras libres (Artista, Título, Álbum, Género, Subgénero)
                queryWords.forEach(word => {
                    if (trkArtist.includes(word)) {
                        score += 35;
                        matchedReasons.push(`Artista: ${word}`);
                    }
                    if (trkTitle.includes(word)) {
                        score += 30;
                        matchedReasons.push(`Título: ${word}`);
                    }
                    if (trkAlbum.includes(word)) {
                        score += 25;
                        matchedReasons.push(`Álbum: ${word}`);
                    }
                    if (trkGenre.includes(word) || trkSubgenre.includes(word)) {
                        score += 25;
                        matchedReasons.push(`Estilo: ${word}`);
                    }
                });
            } else {
                score = 85;
            }

            // Filtros manuales adicionales del panel expandible
            let matchesManual = true;
            if (selectedGenreFilter !== 'ALL' && !trkGenre.includes(selectedGenreFilter.toLowerCase())) {
                matchesManual = false;
            }
            if (selectedSubgenreFilterUI !== 'ALL' && !trkSubgenre.includes(selectedSubgenreFilterUI.toLowerCase())) {
                matchesManual = false;
            }
            if (selectedVersionFilter !== 'ALL') {
                const sv = selectedVersionFilter.toLowerCase();
                if (!trkVersion.includes(sv) && !trkTitle.includes(sv)) matchesManual = false;
            }
            if (selectedBpmFilter !== 'ALL') {
                if (selectedBpmFilter === '<120' && trkBpm >= 120) matchesManual = false;
                if (selectedBpmFilter === '120-125' && (trkBpm < 120 || trkBpm > 125)) matchesManual = false;
                if (selectedBpmFilter === '126-129' && (trkBpm < 126 || trkBpm > 129)) matchesManual = false;
                if (selectedBpmFilter === '130-135' && (trkBpm < 130 || trkBpm > 135)) matchesManual = false;
                if (selectedBpmFilter === '>135' && trkBpm <= 135) matchesManual = false;
            }
            if (selectedKeyFilter !== 'ALL' && trkKey !== selectedKeyFilter) {
                matchesManual = false;
            }
            if (selectedMoodFilter !== 'ALL' && !trkMood.includes(selectedMoodFilter.toLowerCase())) {
                matchesManual = false;
            }

            // Filtros de Cabecera de Tabla
            if (taxFilterSearch) {
                const hTerm = taxFilterSearch.toLowerCase();
                const mSearch = trkTitle.includes(hTerm) || trkArtist.includes(hTerm) || trkAlbum.includes(hTerm);
                if (!mSearch) matchesManual = false;
            }
            if (taxFilterGenre !== 'ALL') {
                if (!trkGenre.includes(taxFilterGenre.toLowerCase())) matchesManual = false;
            }
            if (taxFilterOrigin !== 'ALL') {
                const isLoc = Boolean(trk.isLocal || trk.is_local);
                if (taxFilterOrigin === 'local' && !isLoc) matchesManual = false;
                if (taxFilterOrigin === 'online' && isLoc) matchesManual = false;
            }
            if (taxFilterEnergy !== 'ALL') {
                const eVal = Number(trk.energy || trk.e || 80);
                if (taxFilterEnergy === 'HIGH' && eVal < 80) matchesManual = false;
                if (taxFilterEnergy === 'MED' && (eVal < 65 || eVal >= 80)) matchesManual = false;
                if (taxFilterEnergy === 'LOW' && eVal >= 65) matchesManual = false;
            }
            if (taxFilterDance !== 'ALL') {
                const dVal = Number(trk.danceability || trk.dance || 80);
                if (taxFilterDance === 'HIGH' && dVal < 80) matchesManual = false;
                if (taxFilterDance === 'MED' && (dVal < 65 || dVal >= 80)) matchesManual = false;
                if (taxFilterDance === 'LOW' && dVal >= 65) matchesManual = false;
            }

            const finalPct = Math.min(100, Math.max(10, score));
            return {
                ...trk,
                matchScore: finalPct,
                matchedReasons,
                matchesManual
            };
        })
        .filter(t => t.matchesManual && (!hasTextQuery || t.matchScore >= 15 || t.isFromSearch));

        // Ordenación de la Tabla / Grid
        scored.sort((a, b) => {
            let valA = a[taxSortField];
            let valB = b[taxSortField];

            if (taxSortField === 'title') {
                valA = a.displayTitle || '';
                valB = b.displayTitle || '';
            } else if (taxSortField === 'artist') {
                valA = a.displayArtist || '';
                valB = b.displayArtist || '';
            } else if (taxSortField === 'album') {
                valA = a.displayAlbum || '';
                valB = b.displayAlbum || '';
            } else if (taxSortField === 'genre') {
                valA = a.displayGenre || '';
                valB = b.displayGenre || '';
            } else if (taxSortField === 'subgenre') {
                valA = a.displaySubgenre || '';
                valB = b.displaySubgenre || '';
            } else if (taxSortField === 'key') {
                valA = a.displayKey || '';
                valB = b.displayKey || '';
            } else if (taxSortField === 'origin') {
                valA = Boolean(a.isLocal || a.is_local) ? 'local' : 'online';
                valB = Boolean(b.isLocal || b.is_local) ? 'local' : 'online';
            } else if (['matchScore', 'displayBpm', 'energy', 'danceability'].includes(taxSortField)) {
                valA = Number(valA || (taxSortField === 'energy' ? (a.energy || a.e) : (a.danceability || a.dance))) || 0;
                valB = Number(valB || (taxSortField === 'energy' ? (b.energy || b.e) : (b.danceability || b.dance))) || 0;
            }

            if (typeof valA === 'number' && typeof valB === 'number') {
                return taxSortDir === 'asc' ? valA - valB : valB - valA;
            }
            return taxSortDir === 'asc'
                ? String(valA || '').localeCompare(String(valB || ''))
                : String(valB || '').localeCompare(String(valA || ''));
        });

        return scored;
    }, [allPoolTracks, aiQuery, parsedQuery, selectedGenreFilter, selectedSubgenreFilterUI, selectedVersionFilter, selectedBpmFilter, selectedKeyFilter, selectedMoodFilter, taxFilterSearch, taxFilterGenre, taxFilterOrigin, taxFilterEnergy, taxFilterDance, taxSortField, taxSortDir]);

    // Gestión de Selección Múltiple en Tabla de Taxonomía
    const handleToggleTaxRow = (id) => {
        setSelectedTaxIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const allTaxSelected = searchResults.length > 0 && searchResults.every(t => selectedTaxIds.has(t.id));

    const handleToggleSelectAllTax = () => {
        if (allTaxSelected) {
            setSelectedTaxIds(new Set());
        } else {
            setSelectedTaxIds(new Set(searchResults.map(t => t.id)));
        }
    };

    // Añadir a Cola de Descargas (Spotify Ingest) - Individual
    const handleAnadirADescargas = (trk) => {
        if (!trk) return;
        const addFn = onAddTracksToSpotify || onAddTrackToSpotify;
        if (addFn) {
            addFn([trk], 'taxonomy');
            setFeedbackMsg(`✓ "${trk.displayTitle || trk.title}" añadido a Descargas (Record Pool). Redirigiendo a descargas...`);
        } else if (onSendToSpotify) {
            onSendToSpotify(trk.displayTitle || trk.title);
        } else if (onNavigateTab) {
            onNavigateTab('spotify');
        }
    };

    // Añadir Seleccionadas a Cola de Descargas (Spotify Ingest)
    const handleAnadirSeleccionadasADescargas = () => {
        const seleccionadas = searchResults.filter(t => selectedTaxIds.has(t.id));
        if (seleccionadas.length === 0) return;
        const addFn = onAddTracksToSpotify || onAddTrackToSpotify;
        if (addFn) {
            addFn(seleccionadas, 'taxonomy');
            setFeedbackMsg(`✓ ${seleccionadas.length} pista(s) seleccionadas añadidas a Descargas (Record Pool). Redirigiendo a descargas...`);
        } else if (onNavigateTab) {
            onNavigateTab('spotify');
        }
    };

    // Añadir Todas las pistas del listado actual a Cola de Descargas
    const handleAnadirTodasADescargas = () => {
        if (searchResults.length === 0) return;
        const addFn = onAddTracksToSpotify || onAddTrackToSpotify;
        if (addFn) {
            addFn(searchResults, 'taxonomy');
            setFeedbackMsg(`✓ ${searchResults.length} pista(s) añadidas a Descargas (Record Pool). Redirigiendo a descargas...`);
        } else if (onNavigateTab) {
            onNavigateTab('spotify');
        }
    };

    // Manejador de pre-escucha / Cargar en Deck 1 con resolución dinámica de streaming
    const handleCargarEnDeck = async (trk) => {
        if (!trk) return;
        const isCurrent = isPlaying && nowPlayingTrack && (
            String(nowPlayingTrack.id) === String(trk.id) || 
            (nowPlayingTrack.path && nowPlayingTrack.path === trk.path) || 
            (nowPlayingTrack.title && (nowPlayingTrack.title === trk.displayTitle || nowPlayingTrack.title === trk.title))
        );
        if (isCurrent && onTogglePlay) {
            onTogglePlay();
            return;
        }

        let streamUrl = trk.preview_url || trk.previewUrl || (trk.path && (trk.path.startsWith('http://') || trk.path.startsWith('https://')) ? trk.path : "");
        let coverHd = trk.displayCover || trk.cover;

        // Si es una pista de catálogo online o no tiene ruta local ni URL directa, resolver stream
        if (!streamUrl && !trk.path && !trk.f && true) {
            try {
                setFeedbackMsg(`[PRE-ESCUCHA] Resolviendo audio para: ${trk.displayArtist || trk.artist} - ${trk.displayTitle || trk.title}...`);
                const res = await apiClient.rpc('resolver_stream_preescucha', trk.displayTitle || trk.title, trk.displayArtist || trk.artist);
                if (res && res.stream_url) {
                    streamUrl = res.stream_url;
                    if (res.cover) coverHd = res.cover;
                }
            } catch (err) {
                console.warn("Fallo al resolver preescucha en taxonomía:", err);
            }
        }

        const trackToPlay = {
            ...trk,
            id: trk.id || `tax_${Date.now()}`,
            t: trk.displayTitle || trk.title || trk.t || 'Audio Track',
            title: trk.displayTitle || trk.title || trk.t || 'Audio Track',
            a: trk.displayArtist || trk.artist || trk.a || 'Artista',
            artist: trk.displayArtist || trk.artist || trk.a || 'Artista',
            album: trk.displayAlbum || trk.album || '',
            b: trk.displayBpm || trk.bpm || trk.b || 128,
            bpm: trk.displayBpm || trk.bpm || trk.b || 128,
            k: trk.displayKey || trk.key || trk.k || '8A',
            key: trk.displayKey || trk.key || trk.k || '8A',
            cover: coverHd,
            path: trk.path || trk.f || streamUrl || "",
            f: trk.path || trk.f || "",
            preview_url: streamUrl
        };

        if (onPlayTrack) {
            onPlayTrack(trackToPlay, 0, true);
            setFeedbackMsg(`✓ "${trackToPlay.title}" reproduciendo en Deck 1`);
            setTimeout(() => setFeedbackMsg(''), 3500);
        }
    };

    // Manejador para abrir en Hot-Cues Studio
    const handleAbrirEnHotCues = (trk) => {
        if (!trk) return;
        if (onSelectTrackForCues) {
            onSelectTrackForCues(trk);
        } else if (onNavigateTab) {
            onNavigateTab('hotcues');
        }
    };

    // Apuntar en Libreta Digital de Apuntes
    const handleApuntarEnLibreta = (trk) => {
        try {
            const saved = localStorage.getItem('beatwave_shazam_notebook');
            const list = saved ? JSON.parse(saved) : [];
            const exists = list.some(item => item.title === trk.displayTitle && item.artist === trk.displayArtist);
            if (!exists) {
                const now = new Date();
                const item = {
                    title: trk.displayTitle,
                    artist: trk.displayArtist,
                    bpm: trk.displayBpm,
                    key: trk.displayKey,
                    genre: trk.displayGenre,
                    cover: trk.displayCover,
                    added_at: now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    notebook_id: Date.now()
                };
                list.unshift(item);
                localStorage.setItem('beatwave_shazam_notebook', JSON.stringify(list));
                setFeedbackMsg(`✓ "${trk.displayTitle}" guardado en tu Libreta Digital.`);
            } else {
                setFeedbackMsg(`ℹ "${trk.displayTitle}" ya estaba en tu libreta.`);
            }
            setTimeout(() => setFeedbackMsg(''), 3000);
        } catch (e) {
            console.error(e);
        }
    };

    // Asignar pista individual a Crate Serato
    const handleAsignarACrateIndividual = async (trk) => {
        if (!trk) return;
        try {
            if (true) {
                const res = await apiClient.rpc('organizar_pista_en_crate', trk, rutaBase, modo);
                if (res && res.status === 'ok') {
                    setFeedbackMsg(`✓ Pista enrutada a Crate /${trk.displayGenre}/${trk.displaySubgenre}/`);
                } else {
                    setFeedbackMsg(`⚠ ${res?.msg || 'Error al enrutar pista'}`);
                }
                setTimeout(() => setFeedbackMsg(''), 3500);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Manejadores de Ruteo de Lote a Serato Crates
    const handleSeleccionarDestino = async () => {
        try {
            if (true) {
                const dir = await apiClient.rpc('seleccionar_directorio');
                if (dir) {
                    setRutaBase(dir);
                }
            }
        } catch (err) {
            console.error("Error al seleccionar carpeta destino:", err);
        }
    };

    const handleOrganizarLote = async () => {
        if (!tracks || tracks.length === 0) return;
        setIsRouting(true);
        setRouteProgress(5);
        setRouteStatusMsg(`Iniciando ruteo de ${tracks.length} pistas a ${rutaBase}...`);
        setResultSummary(null);

        try {
            if (true) {
                const res = await apiClient.rpc('organizar_lote_en_crates', tracks, rutaBase, modo);
                if (res && res.status === 'ok') {
                    setResultSummary(res);
                    setRouteProgress(100);
                    setRouteStatusMsg(`✓ Lote completado: ${res.procesados} pistas organizadas.`);
                } else {
                    setResultSummary({ status: 'error', msg: res?.msg || 'Error en el ruteo de lote.' });
                    setRouteStatusMsg(res?.msg || 'Error durante la operación.');
                }
            }
        } catch (err) {
            console.error("Error al organizar lote:", err);
            setResultSummary({ status: 'error', msg: String(err) });
            setRouteStatusMsg('Fallo inesperado al enrutar lote.');
        } finally {
            setIsRouting(false);
            setTimeout(() => setRouteProgress(0), 4000);
        }
    };

    const handleExportarSeratoCrates = async () => {
        if (!tracks || tracks.length === 0) return;
        setIsRouting(true);
        setRouteProgress(50);
        setRouteStatusMsg("Generando archivos binarios .crate para Serato DJ Pro...");
        try {
            if (true) {
                const res = await apiClient.rpc('exportar_serato_crates', tracks);
                setRouteProgress(100);
                if (res && res.status === 'ok') {
                    setResultSummary({
                        status: 'ok',
                        procesados: res.total_pistas,
                        errores: 0,
                        msg: `✓ ${res.total_crates} crates generados exitosamente en ${res.destino}`
                    });
                } else {
                    setResultSummary({ status: 'error', msg: res?.msg || 'Error al exportar crates Serato.' });
                }
            }
        } catch (err) {
            console.error("Error al exportar crates Serato:", err);
            setResultSummary({ status: 'error', msg: String(err) });
        } finally {
            setIsRouting(false);
            setTimeout(() => setRouteProgress(0), 4000);
        }
    };

    const handleExportarRekordboxXml = async () => {
        if (!tracks || tracks.length === 0) return;
        setIsRouting(true);
        setRouteProgress(50);
        setRouteStatusMsg("Generando archivo rekordbox.xml estándar Pioneer DJ...");
        try {
            if (true) {
                const res = await apiClient.rpc('exportar_rekordbox_xml', tracks, rutaBase, "rekordbox.xml");
                setRouteProgress(100);
                if (res && res.status === 'ok') {
                    setResultSummary({
                        status: 'ok',
                        procesados: res.total_tracks,
                        errores: 0,
                        msg: `✓ Archivo rekordbox.xml generado exitosamente (${res.total_tracks} pistas, ${res.playlists} playlists) en ${res.path}`
                    });
                } else {
                    setResultSummary({ status: 'error', msg: res?.msg || 'Error al exportar rekordbox.xml.' });
                }
            }
        } catch (err) {
            console.error("Error al exportar rekordbox XML:", err);
            setResultSummary({ status: 'error', msg: String(err) });
        } finally {
            setIsRouting(false);
            setTimeout(() => setRouteProgress(0), 4000);
        }
    };

    const getGenreStats = (gen) => {
        return tracks.filter(t => (t.genre || 'Tech House').toLowerCase() === gen.toLowerCase()).length;
    };

    const getSubgenreStats = (gen, subg) => {
        return tracks.filter(t => {
            const g = (t.genre || 'Tech House').toLowerCase();
            const sg = (t.subgenre || (TAXONOMY_TREE[t.genre || 'Tech House'] ? TAXONOMY_TREE[t.genre || 'Tech House'][0] : '')).toLowerCase();
            return g === gen.toLowerCase() && sg === subg.toLowerCase();
        });
    };

    const genresList = Object.keys(TAXONOMY_TREE);
    const totalCratesCount = genresList.reduce((acc, g) => acc + (TAXONOMY_TREE[g] ? TAXONOMY_TREE[g].length : 0), 0);

    const filteredGenres = genresList.filter(g => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        if (g.toLowerCase().includes(s)) return true;
        return TAXONOMY_TREE[g] && TAXONOMY_TREE[g].some(sg => sg.toLowerCase().includes(s));
    });

    const resetFilters = () => {
        setAiQuery('');
        setOnlineResults([]);
        setHasExecutedSearch(false);
        setSelectedGenreFilter('ALL');
        setSelectedSubgenreFilterUI('ALL');
        setSelectedVersionFilter('ALL');
        setSelectedBpmFilter('ALL');
        setSelectedKeyFilter('ALL');
        setSelectedMoodFilter('ALL');
        setTaxFilterSearch('');
        setTaxFilterGenre('ALL');
        setTaxFilterOrigin('ALL');
        setTaxFilterEnergy('ALL');
        setTaxFilterDance('ALL');
    };

    return (
        <div className="ws-module ws-mod-taxonomy flex flex-col h-full w-full overflow-y-auto pb-36 md:pb-8 bg-djzinc-950 text-gray-200">
            {/* ENCABEZADO Y SELECTOR DE VISTAS TAXONÓMICAS */}
            <div className="px-5 pt-4 pb-3 border-b border-djzinc-800 bg-[#08080c] shrink-0 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <SectionTitle icon={Icons.Routing} title="Crates" accent="& Taxonomía" />
                        <p className="text-gray-400 text-xs hidden md:inline">
                            Buscador inteligente en lenguaje natural y ruteo jerárquico a crates de Serato / Rekordbox.
                        </p>
                    </div>

                    {/* SELECTOR DE MODO: BUSCADOR IA VS RUTEO CRATES */}
                    <div className="inline-flex rounded-xl border border-djzinc-700/80 p-1 bg-djzinc-900/90 shadow">
                        <button
                            type="button"
                            onClick={() => setActiveSubView('search')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                activeSubView === 'search'
                                    ? 'bg-gradient-to-r from-djcyan-500 to-blue-500 text-black shadow-md'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <span><Icons.Search size={14} className="inline-block align-[-2px]" /> Buscador IA</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-black/30 text-white font-black">
                                {searchResults.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSubView('routing')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                activeSubView === 'routing'
                                    ? 'bg-djcyan-500 text-black shadow-md'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <span><Icons.Folder size={14} className="inline-block align-[-2px]" /> Serato Crates & Rekordbox</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-black/30 text-white font-black">
                                {totalCratesCount}
                            </span>
                        </button>
                    </div>
                </div>

                {/* MENSAJE DE FEEDBACK TOAST */}
                {feedbackMsg && (
                    <div className="p-2.5 rounded-lg bg-djcyan-950/80 border border-djcyan-500/50 text-djcyan-300 text-xs font-mono flex items-center justify-between shadow-lg animate-fadeIn">
                        <div className="flex items-center gap-2">
                            <span className="animate-pulse">●</span>
                            <span>{feedbackMsg}</span>
                        </div>
                        <button type="button" onClick={() => setFeedbackMsg('')} className="text-gray-400 hover:text-white cursor-pointer px-1"><Icons.Close size={14} className="inline-block align-[-2px]" /></button>
                    </div>
                )}
            </div>

            {/* VISTA 1: BUSCADOR IA POR TAXONOMÍAS & ESTILOS (ESTILO CUENCA MUSIC) */}
            {activeSubView === 'search' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* BARRA DE BÚSQUEDA EN LENGUAJE NATURAL IA */}
                    <div className="p-5 border-b border-djzinc-850 bg-[#09090e] shrink-0 space-y-3">
                        {/* SELECTOR DE ÁMBITO DE BÚSQUEDA + BOTÓN DE FILTROS MANUALES */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex items-center gap-1.5 bg-[#050509] p-1 rounded-xl border border-djzinc-800 shadow-inner overflow-x-auto no-scrollbar whitespace-nowrap shrink-0 max-w-full">
                                <span className="text-[10px] font-mono font-bold text-gray-400 px-2 uppercase tracking-wider shrink-0">
                                    Buscar en:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSearchScope('all')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                                        searchScope === 'all'
                                            ? 'bg-gradient-to-r from-djcyan-500 to-blue-500 text-black shadow'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <span><Icons.Globe size={14} className="inline-block align-[-2px]" /> Todo (Híbrido)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSearchScope('local')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                                        searchScope === 'local'
                                            ? 'bg-djcyan-500 text-black shadow'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <span><Icons.Folder size={14} className="inline-block align-[-2px]" /> Mi Biblioteca</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/30 text-white font-mono">{localTracks.length}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSearchScope('online')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                                        searchScope === 'online'
                                            ? 'bg-purple-500 text-white shadow'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <span><Icons.Cloud size={14} className="inline-block align-[-2px]" /> Record Pool</span>
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`text-xs px-2.5 py-1.5 rounded-lg border font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                                    showAdvancedFilters || selectedGenreFilter !== 'ALL' || selectedBpmFilter !== 'ALL' || selectedKeyFilter !== 'ALL'
                                        ? 'bg-djcyan-950 text-djcyan-300 border-djcyan-600'
                                        : 'bg-djzinc-900 text-gray-400 border-djzinc-750 hover:text-white'
                                }`}
                            >
                                <span><Icons.Sliders size={14} className="inline-block align-[-2px]" /> Filtros Manuales</span>
                                <span>{showAdvancedFilters ? '▲' : '▼'}</span>
                            </button>
                        </div>

                        {/* INPUT PRINCIPAL CON GLOW CIAN Y BOTÓN BUSCAR DESTACADO */}
                        <div className="flex items-center gap-2.5">
                            <div className="relative flex-1 flex items-center">
                                <Icons.Search size={14} className="inline-block align-[-2px] absolute left-3.5 text-gray-400  pointer-events-none" />
                                <input
                                    type="text"
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleEjecutarBusqueda();
                                        }
                                    }}
                                    placeholder="Ej: tech house a 128 bpm en 8A, afro house para bailar, reggaeton retro para la previa, extended mix..."
                                    className="ws-search-input w-full pl-10 pr-12 py-3 text-sm"
                                />
                                {aiQuery && (
                                    <button
                                        type="button"
                                        onClick={() => { setAiQuery(''); setOnlineResults([]); }}
                                        className="absolute right-3.5 text-gray-400 hover:text-white text-xs font-bold cursor-pointer"
                                        title="Borrar texto"
                                    >
                                        <Icons.Close size={14} className="inline-block align-[-2px]" />
                                    </button>
                                )}
                            </div>

                            {/* BOTÓN FÍSICO DE BUSCAR */}
                            <button
                                type="button"
                                onClick={() => handleEjecutarBusqueda()}
                                disabled={isSearchingOnline}
                                className="px-6 py-3 bg-djcyan-500 hover:bg-djcyan-400 active:scale-95 text-black font-black text-xs font-mono uppercase tracking-wider rounded-xl shadow-[0_0_18px_rgba(6,182,212,0.45)] transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                            >
                                {isSearchingOnline ? (
                                    <>
                                        <Icons.Clock size={14} className="inline-block align-[-2px] animate-spin" />
                                        <span>Buscando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icons.Search size={14} className="inline-block align-[-2px]" />
                                        <span>Buscar Temas</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* DESGLOSE EN TIEMPO REAL DE TOKENS INTERPRETADOS POR LA IA + BOTÓN AÑADIR TAG */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            {parsedQuery.tokens && parsedQuery.tokens.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] font-mono text-gray-400 mr-0.5">Filtros Activos:</span>
                                    {parsedQuery.tokens.map((tok, idx) => (
                                        <span
                                            key={idx}
                                            className="text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-djcyan-950/90 text-djcyan-300 border border-djcyan-600/80 shadow-sm flex items-center gap-1.5 group"
                                        >
                                            <Icons.Check size={14} className="inline-block align-[-2px]" />
                                            <span>{tok.label}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveToken(tok)}
                                                className="w-3.5 h-3.5 rounded-full hover:bg-red-500 hover:text-white text-djcyan-400 flex items-center justify-center text-[9px] font-black cursor-pointer transition-colors ml-0.5"
                                                title={`Eliminar filtro ${tok.label}`}
                                            >
                                                <Icons.Close size={14} className="inline-block align-[-2px]" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* BOTÓN DESPLEGABLE: + AÑADIR TAG / FILTRO */}
                            <div className="relative inline-block">
                                <button
                                    type="button"
                                    onClick={() => setIsAddTagMenuOpen(prev => !prev)}
                                    className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#12121f] hover:bg-djcyan-950 text-djcyan-400 hover:text-djcyan-300 border border-djcyan-700/60 shadow flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                                    title="Añadir manualmente filtros de BPM, Tono, Género, Versión o Mood"
                                >
                                    <span className="font-black text-xs">+</span>
                                    <span>Añadir Tag</span>
                                    <span className="text-[8px] text-gray-500">{isAddTagMenuOpen ? '▲' : '▼'}</span>
                                </button>

                                {isAddTagMenuOpen && (
                                    <div className="absolute top-full left-0 mt-1.5 w-84 bg-[#0a0a14] border-2 border-djcyan-500/70 rounded-xl p-3 shadow-2xl z-50 animate-fadeIn text-xs font-mono">
                                        <div className="flex items-center justify-between border-b border-djzinc-800 pb-1.5 mb-2">
                                            <span className="text-[10px] font-black text-white uppercase tracking-wider">Añadir Tag a la Búsqueda</span>
                                            <button 
                                                type="button" 
                                                onClick={() => setIsAddTagMenuOpen(false)}
                                                className="text-gray-400 hover:text-white text-xs font-bold cursor-pointer"
                                            >
                                                <Icons.Close size={14} className="inline-block align-[-2px]" />
                                            </button>
                                        </div>

                                        {/* Pestañas de Categoría */}
                                        <div className="flex items-center gap-1 mb-2 border-b border-djzinc-800/80 pb-1">
                                            {[
                                                { id: 'bpm', label: 'BPM' },
                                                { id: 'key', label: 'Key' },
                                                { id: 'genre', label: 'Género' },
                                                { id: 'version', label: 'Versión' },
                                                { id: 'mood', label: 'Mood' }
                                            ].map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setActiveTagTab(cat.id)}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                                        activeTagTab === cat.id
                                                            ? 'bg-djcyan-500 text-black shadow'
                                                            : 'text-gray-400 hover:text-white hover:bg-djzinc-850'
                                                    }`}
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Chips por Categoría */}
                                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar p-0.5">
                                            {activeTagTab === 'bpm' && [
                                                '120 bpm', '124 bpm', '126 bpm', '128 bpm', '130 bpm', '132 bpm', '138 bpm', '140 bpm', '145 bpm', '150 bpm', '160 bpm', '174 bpm'
                                            ].map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => handleAddTagToQuery(tag)}
                                                    className="px-2 py-1 rounded bg-[#161622] hover:bg-djcyan-500 hover:text-black border border-djzinc-750 text-gray-200 text-[10px] font-bold cursor-pointer transition-all"
                                                >
                                                    + {tag}
                                                </button>
                                            ))}

                                            {activeTagTab === 'key' && [
                                                '1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A',
                                                '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B'
                                            ].map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => handleAddTagToQuery(tag)}
                                                    className="px-2 py-1 rounded bg-[#161622] hover:bg-djcyan-500 hover:text-black border border-djzinc-750 text-gray-200 text-[10px] font-bold cursor-pointer transition-all"
                                                >
                                                    + {tag}
                                                </button>
                                            ))}

                                            {activeTagTab === 'genre' && [
                                                'Tech House', 'Afro House', 'Melodic Techno', 'Progressive House', 'Deep House',
                                                'Minimal / Deep Tech', 'Hard Techno', 'Psy-Trance', 'Drum & Bass', 'Reggaetón', 'Latin House'
                                            ].map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => handleAddTagToQuery(tag)}
                                                    className="px-2 py-1 rounded bg-[#161622] hover:bg-djcyan-500 hover:text-black border border-djzinc-750 text-gray-200 text-[10px] font-bold cursor-pointer transition-all"
                                                >
                                                    + {tag}
                                                </button>
                                            ))}

                                            {activeTagTab === 'version' && [
                                                'Extended Mix', 'Intro', 'Outro', 'Remix', 'Club Mix', 'Acapella', 'Transition', 'Mashup'
                                            ].map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => handleAddTagToQuery(tag)}
                                                    className="px-2 py-1 rounded bg-[#161622] hover:bg-djcyan-500 hover:text-black border border-djzinc-750 text-gray-200 text-[10px] font-bold cursor-pointer transition-all"
                                                >
                                                    + {tag}
                                                </button>
                                            ))}

                                            {activeTagTab === 'mood' && [
                                                'Peak Time', 'Warm Up', 'Chill', 'Sunset', 'Retro'
                                            ].map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => handleAddTagToQuery(tag)}
                                                    className="px-2 py-1 rounded bg-[#161622] hover:bg-djcyan-500 hover:text-black border border-djzinc-750 text-gray-200 text-[10px] font-bold cursor-pointer transition-all"
                                                >
                                                    + {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CHIPS DE PROMPT RÁPIDO */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] font-mono text-gray-500 mr-1 shrink-0">Sugerencias Rápidas:</span>
                            {AI_PROMPT_CHIPS.map((chip, cIdx) => (
                                <button
                                    key={cIdx}
                                    type="button"
                                    onClick={() => {
                                        setAiQuery(chip.query);
                                        handleEjecutarBusqueda(chip.query);
                                    }}
                                    className={`text-[10.5px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                                        aiQuery === chip.query
                                            ? 'bg-djcyan-500 text-black border-djcyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] font-bold'
                                            : 'bg-djzinc-900/90 text-gray-300 border-djzinc-800 hover:border-djcyan-500/50 hover:text-white'
                                    }`}
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>

                        {/* FILTROS MANUALES DESPLEGABLES */}
                        {showAdvancedFilters && (
                            <div className="p-3.5 bg-djzinc-900/90 border border-djzinc-800 rounded-xl grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs font-mono animate-fadeIn">
                                {/* Género */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-400 text-[10px]">Género Raíz:</label>
                                    <select
                                        value={selectedGenreFilter}
                                        onChange={(e) => setSelectedGenreFilter(e.target.value)}
                                        className="bg-djzinc-950 border border-djzinc-700 rounded px-2 py-1 text-gray-200 outline-none"
                                    >
                                        <option value="ALL">Todos los Géneros</option>
                                        {genresList.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Versión */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-400 text-[10px]">Versión / Edit:</label>
                                    <select
                                        value={selectedVersionFilter}
                                        onChange={(e) => setSelectedVersionFilter(e.target.value)}
                                        className="bg-djzinc-950 border border-djzinc-700 rounded px-2 py-1 text-gray-200 outline-none"
                                    >
                                        <option value="ALL">Todas las Versiones</option>
                                        {DJ_VERSIONS_LIST.map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Rango BPM */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-400 text-[10px]">Rango BPM:</label>
                                    <select
                                        value={selectedBpmFilter}
                                        onChange={(e) => setSelectedBpmFilter(e.target.value)}
                                        className="bg-djzinc-950 border border-djzinc-700 rounded px-2 py-1 text-gray-200 outline-none"
                                    >
                                        <option value="ALL">Cualquier Tempo</option>
                                        <option value="<120">&lt; 120 BPM (Previa/Downtempo)</option>
                                        <option value="120-125">120 - 125 BPM (Afro/Deep)</option>
                                        <option value="126-129">126 - 129 BPM (Tech House Clave)</option>
                                        <option value="130-135">130 - 135 BPM (Driving / Techno)</option>
                                        <option value=">135">&gt; 135 BPM (Peak Time / Trance)</option>
                                    </select>
                                </div>

                                {/* Key Camelot */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-gray-400 text-[10px]">Tonalidad:</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsCamelotModalOpen(true)}
                                            className="text-[9px] text-djcyan-400 hover:underline cursor-pointer"
                                        >
                                            <Icons.Disc size={14} className="inline-block align-[-2px]" /> Rueda
                                        </button>
                                    </div>
                                    <select
                                        value={selectedKeyFilter}
                                        onChange={(e) => setSelectedKeyFilter(e.target.value)}
                                        className="bg-djzinc-950 border border-djzinc-700 rounded px-2 py-1 text-gray-200 outline-none"
                                    >
                                        <option value="ALL">Cualquier Tono</option>
                                        {Object.keys(CAMELOT_WHEEL_DATA).map(k => (
                                            <option key={k} value={k}>{k} ({CAMELOT_WHEEL_DATA[k].classical})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Mood */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-400 text-[10px]">Atmósfera / Mood:</label>
                                    <select
                                        value={selectedMoodFilter}
                                        onChange={(e) => setSelectedMoodFilter(e.target.value)}
                                        className="bg-djzinc-950 border border-djzinc-700 rounded px-2 py-1 text-gray-200 outline-none"
                                    >
                                        <option value="ALL">Cualquier Mood</option>
                                        <option value="Previa / Warm Up">Previa / Warm Up</option>
                                        <option value="Peak Time / Pista">Peak Time / Pista</option>
                                        <option value="Chill / Sunset / After">Chill / Sunset / After</option>
                                    </select>
                                </div>

                                {/* Energía */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-400 text-[10px]"><Icons.Zap size={14} className="inline-block align-[-2px]" /> Energía DJ:</label>
                                    <select
                                        value={taxFilterEnergy}
                                        onChange={(e) => setTaxFilterEnergy(e.target.value)}
                                        className="bg-djzinc-950 border border-djzinc-700 rounded px-2 py-1 text-gray-200 outline-none"
                                    >
                                        <option value="ALL">Cualquier Nivel</option>
                                        <option value="HIGH">&gt;80% Alta (Peak Time)</option>
                                        <option value="MED">65-80% Media (Build-Up)</option>
                                        <option value="LOW">&lt;65% Baja (Warm Up/Calma)</option>
                                    </select>
                                </div>

                                {/* Danceability */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-400 text-[10px]"><Icons.Activity size={14} className="inline-block align-[-2px]" /> Danceability:</label>
                                    <select
                                        value={taxFilterDance}
                                        onChange={(e) => setTaxFilterDance(e.target.value)}
                                        className="bg-djzinc-950 border border-djzinc-700 rounded px-2 py-1 text-gray-200 outline-none"
                                    >
                                        <option value="ALL">Cualquier Nivel</option>
                                        <option value="HIGH">&gt;80% Alta (Club/Groove)</option>
                                        <option value="MED">65-80% Media</option>
                                        <option value="LOW">&lt;65% Baja</option>
                                    </select>
                                </div>

                                {/* Reset */}
                                <div className="flex flex-col justify-end">
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="w-full py-1 bg-djzinc-800 hover:bg-djzinc-750 text-gray-300 hover:text-white rounded border border-djzinc-700 text-xs font-bold cursor-pointer transition-colors"
                                    >
                                        ↺ Reset Filtros
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* LISTADO DE RESULTADOS EMPAREJADOS POR IA */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between text-xs font-mono text-gray-400 gap-2">
                            <div>
                                <span>Mostrando </span>
                                <strong className="text-white font-bold">{searchResults.length}</strong>
                                <span> temas para </span>
                                <span className="text-djcyan-400 font-bold">{aiQuery ? `"${aiQuery}"` : "Exploración Taxonómica"}</span>
                                <span className="text-gray-500 ml-2">
                                    ({searchScope === 'local' ? 'Solo Biblioteca Local' : (searchScope === 'online' ? 'Solo Record Pool Online' : 'Biblioteca Local + Record Pool')})
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Botones para enviar varias o todas a Spotify Ingest / Descargas */}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={selectedTaxIds.size === 0}
                                        onClick={handleAnadirSeleccionadasADescargas}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all ${
                                            selectedTaxIds.size > 0 
                                                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-95' 
                                                : 'bg-djzinc-850 text-gray-500 border border-djzinc-750 cursor-not-allowed opacity-40'
                                        }`}
                                        title="Añadir pistas seleccionadas a la cola de descargas del Record Pool"
                                    >
                                        <Icons.Download size={14} className="inline-block align-[-2px]" />
                                        <span>Añadir Seleccionadas ({selectedTaxIds.size})</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={searchResults.length === 0}
                                        onClick={handleAnadirTodasADescargas}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-500 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Añadir todas las pistas de esta búsqueda a la cola de descargas del Record Pool"
                                    >
                                        <Icons.Download size={14} className="inline-block align-[-2px]" />
                                        <span>Añadir Todas ({searchResults.length})</span>
                                    </button>
                                </div>

                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-djcyan-400"></span>
                                    <span>Biblioteca ({localTracks.length + searchLocalResults.length})</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                    <span>Record Pool Online ({onlineResults.length > 0 ? onlineResults.length : catalogTracks.length})</span>
                                </span>

                                {/* Selector de Modo: Tabla con filtros / Mosaico */}
                                <div className="inline-flex rounded-lg border border-djzinc-750 p-0.5 bg-[#050508] ml-2">
                                    <button
                                        type="button"
                                        onClick={() => setDisplayMode('table')}
                                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                            displayMode === 'table' ? 'bg-djcyan-500 text-black' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <span>𝄜</span> Tabla
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDisplayMode('grid')}
                                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                            displayMode === 'grid' ? 'bg-djcyan-500 text-black' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <span>⊞</span> Mosaico
                                    </button>
                                </div>
                            </div>
                        </div>

                        {searchResults.length === 0 ? (
                            <div className="p-8 border border-dashed border-djzinc-800 rounded-2xl bg-djzinc-900/30 text-center space-y-3">
                                <Icons.Search size={14} className="inline-block align-[-2px]" />
                                <h3 className="text-base font-bold text-white">No se encontraron temas coincidentes</h3>
                                <p className="text-xs text-gray-400 max-w-md mx-auto">
                                    No hay pistas que cumplan los criterios de "{aiQuery}". Puedes pulsar <strong>Buscar Temas</strong> para rastrear en el Record Pool Online o descargarlas en SuperFLAC / Record Pool.
                                </p>
                                <div className="flex items-center justify-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="px-3.5 py-1.5 bg-djzinc-800 hover:bg-djzinc-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                                    >
                                        ↺ Limpiar Búsqueda
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchScope('online');
                                            handleEjecutarBusqueda();
                                        }}
                                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                                    >
                                        <Icons.Cloud size={14} className="inline-block align-[-2px]" /> Buscar en Record Pool Online
                                    </button>
                                    {onSendToSpotify && (
                                        <button
                                            type="button"
                                            onClick={() => onSendToSpotify(aiQuery)}
                                            className="px-3.5 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black rounded-lg text-xs font-bold shadow-md cursor-pointer"
                                        >
                                            <Icons.Globe size={14} className="inline-block align-[-2px]" /> Ingestar desde SuperFLAC / Record Pool →
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : displayMode === 'table' ? (
                            /* VISTA DE TABLA CON ORDENACIÓN Y FILTROS EN CABECERA */
                            <div className="overflow-x-auto rounded-xl border border-djzinc-800 bg-[#07070a] shadow-lg">
                                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                                    <thead className="sticky top-0 z-10 bg-[#0d0d12] border-b border-djzinc-800 text-[10px] font-mono uppercase text-gray-400">
                                        <tr>
                                            <th className="py-2.5 px-3 w-8 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={allTaxSelected} 
                                                    onChange={handleToggleSelectAllTax} 
                                                    className="accent-djcyan-500 cursor-pointer" 
                                                    title="Seleccionar / Deseleccionar todas las pistas" 
                                                />
                                            </th>
                                            <th className="py-2.5 px-2 w-10 text-center">PLAY</th>
                                            <th onClick={() => handleSortTax('title')} className="py-2.5 px-3 min-w-[240px] cursor-pointer hover:text-white transition-colors">TÍTULO / ÁLBUM {renderSortArrowTax('title')}</th>
                                            <th onClick={() => handleSortTax('artist')} className="py-2.5 px-3 min-w-[150px] cursor-pointer hover:text-white transition-colors">ARTISTA {renderSortArrowTax('artist')}</th>
                                            <th onClick={() => handleSortTax('genre')} className="py-2.5 px-2.5 cursor-pointer hover:text-white transition-colors">GÉNERO {renderSortArrowTax('genre')}</th>
                                            <th onClick={() => handleSortTax('subgenre')} className="py-2.5 px-2.5 cursor-pointer hover:text-white transition-colors">SUBGÉNERO {renderSortArrowTax('subgenre')}</th>
                                            <th onClick={() => handleSortTax('displayBpm')} className="py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors">BPM {renderSortArrowTax('displayBpm')}</th>
                                            <th onClick={() => handleSortTax('key')} className="py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors">KEY {renderSortArrowTax('key')}</th>
                                            <th onClick={() => handleSortTax('version')} className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors">VERSIÓN {renderSortArrowTax('version')}</th>
                                            <th onClick={() => handleSortTax('origin')} className="py-2.5 px-2.5 text-center cursor-pointer hover:text-white transition-colors">ORIGEN {renderSortArrowTax('origin')}</th>
                                            <th onClick={() => handleSortTax('matchScore')} className="py-2.5 px-2.5 text-center cursor-pointer hover:text-white transition-colors">MATCH % {renderSortArrowTax('matchScore')}</th>
                                            <th onClick={() => handleSortTax('energy')} className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors"><Icons.Zap size={14} className="inline-block align-[-2px]" /> ENERGÍA {renderSortArrowTax('energy')}</th>
                                            <th onClick={() => handleSortTax('danceability')} className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors"><Icons.Activity size={14} className="inline-block align-[-2px]" /> DANCE {renderSortArrowTax('danceability')}</th>
                                            <th onClick={() => handleSortTax('arousal')} className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors text-emerald-400" title="Intensidad (Arousal)">🔥 INTENSIDAD {renderSortArrowTax('arousal')}</th>
                                            <th onClick={() => handleSortTax('valence')} className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors text-djcyan-400" title="Positividad (Valence)">✨ POSITIVIDAD {renderSortArrowTax('valence')}</th>
                                            <th className="py-2.5 px-2 text-center">FASE DJ</th>
                                            <th className="py-2.5 px-2.5 text-left">COMENTARIO PRO</th>
                                            <th className="py-2.5 px-3 text-center min-w-[150px]">ACCIONES DJ</th>
                                        </tr>
                                        <tr className="bg-[#050508] border-b border-djzinc-800 text-[10px] lowercase font-sans">
                                            <th className="p-1 text-center font-mono text-[9px] text-gray-500">
                                                {(taxFilterSearch || taxFilterGenre !== 'ALL' || taxFilterOrigin !== 'ALL' || taxFilterEnergy !== 'ALL' || taxFilterDance !== 'ALL') ? (
                                                    <button 
                                                        onClick={() => {
                                                            setTaxFilterSearch('');
                                                            setTaxFilterGenre('ALL');
                                                            setTaxFilterOrigin('ALL');
                                                            setTaxFilterEnergy('ALL');
                                                            setTaxFilterDance('ALL');
                                                        }}
                                                        title="Limpiar filtros"
                                                        className="text-amber-400 hover:text-white cursor-pointer"
                                                    ><Icons.Close size={14} className="inline-block align-[-2px]" /></button>
                                                ) : 'filtro'}
                                            </th>
                                            <th className="p-1"></th>
                                            <th className="p-1">
                                                <input 
                                                    type="text" 
                                                    value={taxFilterSearch} 
                                                    onChange={(e) => setTaxFilterSearch(e.target.value)} 
                                                    placeholder="Filtrar por título, álbum o artista..." 
                                                    className="w-full bg-[#111116] border border-djzinc-750 rounded px-1.5 py-0.5 text-[11px] text-gray-200 outline-none focus:border-djcyan-400 font-sans"
                                                />
                                            </th>
                                            <th className="p-1"></th>
                                            <th className="p-1">
                                                <select 
                                                    value={taxFilterGenre} 
                                                    onChange={(e) => setTaxFilterGenre(e.target.value)}
                                                    className="bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                                >
                                                    <option value="ALL">Todos</option>
                                                    <option value="Hard Techno">Hard Techno</option>
                                                    <option value="Techno">Techno</option>
                                                    <option value="House">House</option>
                                                    <option value="Trance">Trance</option>
                                                    <option value="Drum & Bass">Drum & Bass</option>
                                                    <option value="Afro House">Afro House</option>
                                                </select>
                                            </th>
                                            <th className="p-1"></th>
                                            <th className="p-1"></th>
                                            <th className="p-1"></th>
                                            <th className="p-1"></th>
                                            <th className="p-1 text-center">
                                                <select 
                                                    value={taxFilterOrigin} 
                                                    onChange={(e) => setTaxFilterOrigin(e.target.value)}
                                                    className="bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                                >
                                                    <option value="ALL">Todos</option>
                                                    <option value="local">📁 Local</option>
                                                    <option value="online">☁️ Pool Online</option>
                                                </select>
                                            </th>
                                            <th className="p-1"></th>
                                            <th className="p-1 text-center">
                                                <select 
                                                    value={taxFilterEnergy} 
                                                    onChange={(e) => setTaxFilterEnergy(e.target.value)}
                                                    className="bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                                >
                                                    <option value="ALL">Todas</option>
                                                    <option value="HIGH">&gt;80% Alta</option>
                                                    <option value="MED">65-80% Media</option>
                                                    <option value="LOW">&lt;65% Baja</option>
                                                </select>
                                            </th>
                                            <th className="p-1 text-center">
                                                <select 
                                                    value={taxFilterDance} 
                                                    onChange={(e) => setTaxFilterDance(e.target.value)}
                                                    className="bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                                >
                                                    <option value="ALL">Todas</option>
                                                    <option value="HIGH">&gt;80% Alta</option>
                                                    <option value="MED">65-80% Media</option>
                                                    <option value="LOW">&lt;65% Baja</option>
                                                </select>
                                            </th>
                                            <th className="p-1 text-center font-mono text-[9px] text-emerald-400 font-bold" title="Filtro Intensidad">🔥</th>
                                            <th className="p-1 text-center font-mono text-[9px] text-cyan-400 font-bold" title="Filtro Positividad">✨</th>
                                            <th className="p-1"></th>
                                            <th className="p-1"></th>
                                            <th className="p-1"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-djzinc-850/60 font-sans">
                                        {searchResults.map((trk, idx) => {
                                            const keyData = CAMELOT_WHEEL_DATA[trk.displayKey] || CAMELOT_WHEEL_DATA['8A'];
                                            const isLocal = Boolean(trk.isLocal || trk.is_local);
                                            const isOnline = Boolean(trk.isOnlinePool || trk.is_online);
                                            const isPlayingRow = nowPlayingTrack && (
                                                String(nowPlayingTrack.id) === String(trk.id) || 
                                                (nowPlayingTrack.title && (nowPlayingTrack.title === trk.displayTitle || nowPlayingTrack.title === trk.title)) ||
                                                (nowPlayingTrack.path && nowPlayingTrack.path === trk.path)
                                            ) && isPlaying;
                                            const isSelected = selectedTaxIds.has(trk.id);
                                            return (
                                                <tr 
                                                    key={trk.id || idx} 
                                                    className={`hover:bg-[#101016] transition-colors cursor-pointer select-none ${isSelected ? 'bg-[#0f172a]/50 border-l-2 border-djcyan-400' : ''}`}
                                                >
                                                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isSelected} 
                                                            onChange={() => handleToggleTaxRow(trk.id)} 
                                                            className="accent-djcyan-500 cursor-pointer" 
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-center" onClick={(e) => { e.stopPropagation(); handleCargarEnDeck(trk); }}>
                                                        <button className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isPlayingRow ? 'bg-djcyan-500 text-black font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-[#181820] text-gray-400 hover:text-white hover:bg-djzinc-800'}`}>
                                                            {isPlayingRow ? '❚❚' : '▶'}
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <div className="flex items-center gap-3">
                                                            <img loading="lazy" decoding="async" src={getValidCover(trk.displayCover)} alt="Cover" onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} className="w-9 h-9 rounded object-cover border border-djzinc-700 shrink-0 shadow-sm" />
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-semibold text-djcyan-400 text-xs truncate max-w-sm" title={trk.displayTitle}>{trk.displayTitle}</span>
                                                                <span className="text-[10px] text-gray-500 font-mono truncate max-w-sm" title={trk.displayAlbum}>{trk.displayAlbum || '--'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-300 text-xs truncate max-w-xs">{trk.displayArtist}</td>
                                                    <td className="py-2 px-2.5 font-mono text-[11px] text-gray-300">{trk.displayGenre}</td>
                                                    <td className="py-2 px-2.5 font-mono text-[10px] text-djcyan-400 font-semibold">{trk.displaySubgenre}</td>
                                                    <td className="py-2 px-2 text-center text-xs ws-bpm">{trk.displayBpm}</td>
                                                    <td className="py-2 px-2 text-center">
                                                        <button
                                                            type="button"
                                                            className="cursor-pointer"
                                                            onClick={() => setIsCamelotModalOpen(true)}
                                                            title={`Key ${trk.displayKey} (${keyData.classical})`}
                                                        >
                                                            <CamelotKeyBadge value={trk.displayKey} />
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-2 text-center font-mono text-[10px] text-gray-400">{trk.displayVersion || 'Original Mix'}</td>
                                                    <td className="py-2 px-2.5 text-center">
                                                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                                            isLocal ? 'bg-djcyan-950 text-djcyan-300 border-djcyan-700/60' :
                                                            (isOnline ? 'bg-purple-950 text-purple-300 border-purple-700/60' : 'bg-emerald-950 text-emerald-300 border-emerald-700/60')
                                                        }`}>
                                                            {isLocal ? '📁 Local' : (isOnline ? '☁️ Record Pool' : '🌟 BeatWave Pool')}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-2.5 text-center font-mono text-xs font-bold text-emerald-400">
                                                        <Icons.Zap size={14} className="inline-block align-[-2px]" /> {trk.matchScore}%
                                                    </td>

                                                    {/* ENERGÍA */}
                                                    <td className="py-2 px-2 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-0.5 w-16 mx-auto">
                                                            <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                                <Icons.Zap size={14} className="inline-block align-[-2px] text-gray-400" />
                                                                <span className={`font-bold ${(trk.energy || trk.e || 80) >= 82 ? 'text-red-400' : (trk.energy || trk.e || 80) >= 68 ? 'text-amber-400' : 'text-djcyan-400'}`}>
                                                                    {trk.energy || trk.e || 80}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750">
                                                                <div 
                                                                    className={`h-full rounded-full ${(trk.energy || trk.e || 80) >= 82 ? 'bg-gradient-to-r from-amber-500 to-red-500' : (trk.energy || trk.e || 80) >= 68 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`} 
                                                                    style={{ width: `${Math.min(100, Math.max(10, trk.energy || trk.e || 80))}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* DANCEABILITY */}
                                                    <td className="py-2 px-2 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-0.5 w-16 mx-auto">
                                                            <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                                <Icons.Activity size={14} className="inline-block align-[-2px] text-gray-400" />
                                                                <span className="font-bold text-purple-300">{trk.danceability || trk.dance || 80}%</span>
                                                            </div>
                                                            <div className="w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750">
                                                                <div 
                                                                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" 
                                                                    style={{ width: `${Math.min(100, Math.max(10, trk.danceability || trk.dance || 80))}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* INTENSIDAD */}
                                                    <td className="py-2 px-2 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-0.5 w-16 mx-auto">
                                                            <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                                <span className="text-[10px]">🔥</span>
                                                                <span className="font-bold text-emerald-400">{trk.arousal || trk.intensity || Math.round((trk.energy || trk.e || 80) * 0.95)}%</span>
                                                            </div>
                                                            <div className="w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750">
                                                                <div 
                                                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" 
                                                                    style={{ width: `${Math.min(100, Math.max(10, trk.arousal || trk.intensity || Math.round((trk.energy || trk.e || 80) * 0.95)))}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* POSITIVIDAD */}
                                                    <td className="py-2 px-2 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-0.5 w-16 mx-auto">
                                                            <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                                <span className="text-[10px]">✨</span>
                                                                <span className="font-bold text-cyan-300">{trk.valence != null ? trk.valence : (trk.displayKey && trk.displayKey.includes('B') ? 65 : 45)}%</span>
                                                            </div>
                                                            <div className="w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750">
                                                                <div 
                                                                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]" 
                                                                    style={{ width: `${Math.min(100, Math.max(10, trk.valence != null ? trk.valence : (trk.displayKey && trk.displayKey.includes('B') ? 65 : 45)))}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* FASE DJ */}
                                                    <td className="py-2 px-2 text-center">
                                                        {(() => {
                                                            const eVal = trk.energy || trk.e || 80;
                                                            const bVal = parseFloat(trk.displayBpm || trk.bpm || 128);
                                                            const badge = trk.fase_badge || (eVal >= 82 || bVal >= 135 ? 'CAÑA' : eVal >= 68 ? 'BUILD-UP' : (bVal < 118 ? 'CALMA' : 'WARM-UP'));
                                                            const colorMap = {
                                                                'CAÑA': 'bg-red-950/80 text-red-300 border-red-700 shadow-[0_0_8px_rgba(239,68,68,0.3)]',
                                                                'BUILD-UP': 'bg-amber-950/80 text-amber-300 border-amber-700',
                                                                'WARM-UP': 'bg-cyan-950/80 text-cyan-300 border-cyan-700',
                                                                'CIERRE': 'bg-purple-950/80 text-purple-300 border-purple-700',
                                                                'CALMA': 'bg-teal-950/80 text-teal-300 border-teal-700'
                                                            };
                                                            const iconMap = {
                                                                'CAÑA': '🔥',
                                                                'BUILD-UP': '🚀',
                                                                'WARM-UP': '🎧',
                                                                'CIERRE': '🌌',
                                                                'CALMA': '☕'
                                                            };
                                                            return (
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border inline-flex items-center gap-1 ${colorMap[badge] || 'bg-djzinc-800 text-gray-300 border-djzinc-700'}`}>
                                                                    <span>{iconMap[badge] || '🎵'}</span>
                                                                    <span>{badge}</span>
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>

                                                    {/* COMENTARIO PRO */}
                                                    <td className="py-2 px-2.5 text-left">
                                                        <div className="flex items-center gap-1.5 max-w-[260px]">
                                                            <Icons.MessageSquare size={14} className="inline-block align-[-2px] text-emerald-400  shrink-0" />
                                                            <span className="text-[10.5px] font-mono text-gray-200 truncate" title={trk.comment || `[${trk.displayBpm} BPM | ${trk.displayKey}] Intro 32b • Drop contundente • Outro 64b`}>
                                                                {trk.comment || `[${trk.displayBpm} BPM | ${trk.displayKey}] Intro 32b • Drop contundente • Outro 64b`}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="py-2 px-3 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button onClick={() => handleCargarEnDeck(trk)} className="px-2 py-1 rounded bg-djcyan-500 hover:bg-djcyan-400 text-black font-bold text-[10px] font-mono cursor-pointer" title="Cargar y Reproducir en Deck 1">
                                                                <Icons.Play size={14} className="inline-block align-[-2px]" /> Deck
                                                            </button>
                                                            <button onClick={() => handleAbrirEnHotCues(trk)} className="px-2 py-1 rounded bg-djzinc-850 hover:bg-djzinc-750 text-gray-200 border border-djzinc-700 text-[10px] font-mono cursor-pointer" title="Hot Cues Studio">
                                                                <Icons.Sliders size={14} className="inline-block align-[-2px]" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleAnadirADescargas(trk)} 
                                                                className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-[10px] cursor-pointer shadow flex items-center gap-1 transition-all active:scale-95" 
                                                                title="Añadir pista a la cola de descargas del Record Pool"
                                                            >
                                                                <Icons.Download size={14} className="inline-block align-[-2px]" />
                                                                <span>Añadir a Descargas</span>
                                                            </button>
                                                            {isOnline ? (
                                                                <button 
                                                                    onClick={() => {
                                                                        if (onSendToSpotify) onSendToSpotify(`${trk.displayArtist} - ${trk.displayTitle}`);
                                                                        else if (onNavigateTab) onNavigateTab('spotify');
                                                                    }}
                                                                    className="px-2 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-600 text-purple-300 text-[10px] font-mono cursor-pointer"
                                                                    title="Buscar en el Record Pool"
                                                                >
                                                                    <Icons.Search size={14} className="inline-block align-[-2px]" /> Pool
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => handleAsignarACrateIndividual(trk)} className="px-2 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-600 text-purple-300 text-[10px] font-mono cursor-pointer" title="Rutar a Crate">
                                                                        <Icons.Folder size={14} className="inline-block align-[-2px]" /> Crate
                                                                    </button>
                                                                    {isLocal && (
                                                                        <button 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (onRemoveTrack) {
                                                                                    onRemoveTrack(trk.id);
                                                                                } else if (onTracksUpdated) {
                                                                                    onTracksUpdated(prev => prev.filter(t => String(t.id) !== String(trk.id)));
                                                                                }
                                                                            }} 
                                                                            className="p-1 rounded bg-red-950/40 hover:bg-red-900 border border-red-800/60 text-red-400 hover:text-white text-[10px] font-mono cursor-pointer transition-colors active:scale-90" 
                                                                            title="Quitar pista del análisis global"
                                                                        >
                                                                            <Icons.Trash size={14} className="inline-block align-[-2px]" />
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            /* VISTA DE MOSAICO / TARJETAS */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {searchResults.map((trk, idx) => {
                                    const keyData = CAMELOT_WHEEL_DATA[trk.displayKey] || CAMELOT_WHEEL_DATA['8A'];
                                    const isLocal = Boolean(trk.isLocal || trk.is_local);
                                    const isOnline = Boolean(trk.isOnlinePool || trk.is_online);

                                    const isSelected = selectedTaxIds.has(trk.id);

                                    return (
                                        <div
                                            key={trk.id || idx}
                                            className={`p-3.5 bg-[#0a0a0f] rounded-xl border transition-all shadow-md hover:shadow-cyan-500/10 flex flex-col justify-between gap-3 group ${
                                                isSelected ? 'border-djcyan-400 bg-djcyan-950/20' : 'border-djzinc-850 hover:border-djcyan-500/50'
                                            }`}
                                        >
                                            {/* CABECERA DE LA PISTA */}
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-djzinc-800 shadow">
                                                    <img loading="lazy" decoding="async"
                                                        src={getValidCover(trk.displayCover)}
                                                        alt="Cover"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCargarEnDeck(trk)}
                                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-base transition-opacity cursor-pointer shadow"
                                                        title="Cargar y Reproducir en Deck 1"
                                                    >
                                                        {isPlaying && nowPlayingTrack && (String(nowPlayingTrack.id) === String(trk.id) || (nowPlayingTrack.path && nowPlayingTrack.path === trk.path) || (nowPlayingTrack.title && (nowPlayingTrack.title === trk.displayTitle || nowPlayingTrack.title === trk.title))) ? '❚❚' : '▶'}
                                                    </button>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isSelected} 
                                                                onChange={() => handleToggleTaxRow(trk.id)} 
                                                                className="accent-djcyan-500 cursor-pointer" 
                                                                title="Marcar pista"
                                                            />
                                                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                                                isLocal
                                                                    ? 'bg-djcyan-950 text-djcyan-300 border-djcyan-700/60'
                                                                    : (isOnline 
                                                                        ? 'bg-purple-950 text-purple-300 border-purple-700/60'
                                                                        : 'bg-emerald-950 text-emerald-300 border-emerald-700/60')
                                                            }`}>
                                                                {isLocal ? '📁 Local' : (isOnline ? '☁️ Online Pool' : '🌟 BeatWave Pool')}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-1.5 py-0.2 rounded shadow-sm">
                                                            <Icons.Zap size={14} className="inline-block align-[-2px]" /> {trk.matchScore}% Match
                                                        </span>
                                                    </div>

                                                    <h4 className="text-xs font-bold text-white truncate mt-1" title={trk.displayTitle}>
                                                        {trk.displayTitle}
                                                    </h4>
                                                    <p className="text-[11px] text-djcyan-400 truncate" title={trk.displayArtist}>
                                                        {trk.displayArtist}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* BADGES TAXONÓMICOS (GÉNERO, BPM, KEY, VERSIÓN, MOOD) */}
                                            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9.5px]">
                                                {/* Género & Subgénero */}
                                                <span className="px-2 py-0.5 rounded bg-djzinc-900 border border-djzinc-750 text-gray-300 font-semibold">
                                                    <Icons.Headphones size={14} className="inline-block align-[-2px]" /> {trk.displaySubgenre || trk.displayGenre}
                                                </span>

                                                {/* BPM */}
                                                <span className="px-2 py-0.5 rounded bg-djzinc-900 border border-djzinc-750 text-djcyan-300 font-bold">
                                                    <Icons.Sliders size={14} className="inline-block align-[-2px]" /> {trk.displayBpm} BPM
                                                </span>

                                                {/* Key Camelot */}
                                                <span
                                                    className="px-2 py-0.5 rounded border font-black flex items-center gap-1 cursor-pointer hover:brightness-125"
                                                    style={{
                                                        backgroundColor: `${keyData.color}20`,
                                                        borderColor: `${keyData.color}80`,
                                                        color: keyData.color
                                                    }}
                                                    onClick={() => setIsCamelotModalOpen(true)}
                                                    title={`Key ${trk.displayKey} (${keyData.classical}). Click para ver Rueda Armónica`}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: keyData.color }}></span>
                                                    <span>{trk.displayKey}</span>
                                                </span>

                                                {/* Versión */}
                                                {trk.displayVersion && (
                                                    <span className="px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-600/50 text-amber-300">
                                                        <Icons.Sliders size={14} className="inline-block align-[-2px]" /> {trk.displayVersion}
                                                    </span>
                                                )}

                                                {/* Mood */}
                                                {trk.displayMood && (
                                                    <span className="px-1.5 py-0.5 rounded bg-pink-950/40 border border-pink-600/50 text-pink-300">
                                                        <Icons.Flame size={14} className="inline-block align-[-2px]" /> {trk.displayMood}
                                                    </span>
                                                )}
                                            </div>

                                            {/* BOTONES DE ACCIÓN DJ RÁPIDOS */}
                                            <div className="pt-2 border-t border-djzinc-850 flex items-center justify-between gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCargarEnDeck(trk)}
                                                    className="flex-1 py-1 px-2 rounded bg-djcyan-500 hover:bg-djcyan-400 text-black font-bold text-[10px] font-mono flex items-center justify-center gap-1 shadow cursor-pointer transition-transform active:scale-95"
                                                >
                                                    <Icons.Play size={14} className="inline-block align-[-2px]" />
                                                    <span>Cargar Deck</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleAbrirEnHotCues(trk)}
                                                    className="py-1 px-2 rounded bg-djzinc-900 hover:bg-djzinc-800 border border-djzinc-750 text-gray-200 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                                    title="Editar Hot Cues en el Estudio"
                                                >
                                                    <Icons.Sliders size={14} className="inline-block align-[-2px]" />
                                                    <span>Cues</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleAnadirADescargas(trk)}
                                                    className="py-1 px-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow"
                                                    title="Añadir a la cola de descargas del Record Pool"
                                                >
                                                    <Icons.Download size={14} className="inline-block align-[-2px]" />
                                                    <span>Añadir a Descargas</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleApuntarEnLibreta(trk)}
                                                    className="py-1 px-2 rounded bg-djzinc-900 hover:bg-djzinc-800 border border-djzinc-750 text-gray-200 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                                    title="Apuntar en Libreta Digital"
                                                >
                                                    <Icons.Copy size={14} className="inline-block align-[-2px]" />
                                                </button>

                                                {isOnline ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (onSendToSpotify) onSendToSpotify(`${trk.displayArtist} - ${trk.displayTitle}`);
                                                            else if (onNavigateTab) onNavigateTab('spotify');
                                                        }}
                                                        className="py-1 px-2 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-500/70 text-purple-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors shadow"
                                                        title="Descargar versión HQ/FLAC en SuperFLAC / Record Pool"
                                                    >
                                                        <Icons.Download size={14} className="inline-block align-[-2px]" />
                                                        <span>SuperFLAC</span>
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAsignarACrateIndividual(trk)}
                                                            className="py-1 px-2 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-500/60 text-purple-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                                            title="Rutar físicamente a Serato Crate"
                                                        >
                                                            <Icons.Folder size={14} className="inline-block align-[-2px]" />
                                                        </button>
                                                        {isLocal && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (onRemoveTrack) {
                                                                        onRemoveTrack(trk.id);
                                                                    } else if (onTracksUpdated) {
                                                                        onTracksUpdated(prev => prev.filter(t => String(t.id) !== String(trk.id)));
                                                                    }
                                                                }}
                                                                className="py-1 px-1.5 rounded bg-red-950/50 hover:bg-red-900 border border-red-800/60 text-red-400 hover:text-white text-[10px] font-mono cursor-pointer transition-colors active:scale-90"
                                                                title="Quitar pista del análisis global"
                                                            >
                                                                <Icons.Trash size={14} className="inline-block align-[-2px]" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* BANNER INFERIOR DE INGESTA DESDE SUPERFLAC / SPOTIFY */}
                        <div className="p-4 bg-gradient-to-r from-djzinc-900 via-djzinc-900 to-djcyan-950/40 border border-djzinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Icons.Globe size={14} className="inline-block align-[-2px]" />
                                <div>
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                                        ¿Buscas canciones que no están en tu biblioteca local?
                                    </h4>
                                    <p className="text-[11px] text-gray-400">
                                        Explora y descarga temas por taxonomía en SuperFLAC / Record Pool con carátula en alta definición y tags automáticos.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (onSendToSpotify) onSendToSpotify(aiQuery || 'Tech House 2024');
                                    else if (onNavigateTab) onNavigateTab('spotify');
                                }}
                                className="px-3.5 py-2 bg-djcyan-500 hover:bg-djcyan-400 text-black font-bold text-xs rounded-lg shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
                            >
                                Ingestar en Record Pool / SuperFLAC →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA 2: RUTEO FÍSICO A SERATO CRATES Y REKORDBOX XML */}
            {activeSubView === 'routing' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* BARRA DE CONFIGURACIÓN Y ACCIÓN */}
                    <div className="p-5 border-b border-djzinc-800 bg-djzinc-950 shrink-0 space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-djcyan-400 shadow-[0_0_8px_#06b6d4]"></span>
                                    <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
                                        Ruteo Físico de Biblioteca a Crates Serato / Rekordbox
                                    </h3>
                                    <span className="text-[10px] bg-djcyan-950 text-djcyan-300 border border-djcyan-700/60 px-2 py-0.5 rounded font-mono font-bold">
                                        2-TIER CRATES
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs">
                                    Clasificación jerárquica en dos niveles (Género raíz {'\u2192'} Subgénero) con ruteo físico a carpetas y crates de Serato DJ Pro y Rekordbox.
                                </p>
                            </div>

                            {/* BOTONES DE ACCIÓN: RUTEO FÍSICO + EXPORTACIÓN SERATO CRATES / REKORDBOX XML */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    disabled={isRouting || tracks.length === 0}
                                    onClick={handleExportarSeratoCrates}
                                    className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                                        isRouting || tracks.length === 0
                                            ? 'bg-djzinc-900 border-djzinc-800 text-gray-500 cursor-not-allowed opacity-60'
                                            : 'bg-purple-950/60 hover:bg-purple-900 border-purple-500/60 text-purple-300 shadow hover:shadow-purple-500/20 active:scale-95'
                                    }`}
                                    title="Exporta archivos .crate oficiales a ~/Music/_Serato_/Subcrates para importación instantánea en Serato DJ Pro"
                                >
                                    <img loading="lazy" decoding="async" src="/assets/logos/serato.png" alt="Serato" className="h-3.5 w-auto object-contain shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                                    <span>Exportar Serato (.crate)</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={isRouting || tracks.length === 0}
                                    onClick={handleExportarRekordboxXml}
                                    className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                                        isRouting || tracks.length === 0
                                            ? 'bg-djzinc-900 border-djzinc-800 text-gray-500 cursor-not-allowed opacity-60'
                                            : 'bg-blue-950/60 hover:bg-blue-900 border-blue-500/60 text-cyan-400 shadow hover:shadow-blue-500/20 active:scale-95'
                                    }`}
                                    title="Genera archivo rekordbox.xml estándar Pioneer DJ con Hot Cues y playlists"
                                >
                                    <img loading="lazy" decoding="async" src="/assets/logos/rekordbox.png" alt="Rekordbox" className="h-3.5 w-auto object-contain shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                                    <span>Exportar Rekordbox XML</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={isRouting || tracks.length === 0}
                                    onClick={handleOrganizarLote}
                                    className={`px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all ${
                                        isRouting || tracks.length === 0
                                            ? 'bg-djzinc-800 text-gray-500 border border-djzinc-700 cursor-not-allowed opacity-60'
                                            : 'bg-djcyan-500 hover:bg-djcyan-400 text-black shadow-djcyan-500/25 active:scale-95'
                                    }`}
                                >
                                    <Icons.Routing />
                                    {isRouting ? 'Ruteando a Crates...' : `Enrutar Biblioteca (${tracks.length})`}
                                </button>
                            </div>
                        </div>

                        {/* CONFIGURACIÓN DE DESTINO Y MODO */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-djzinc-900/90 border border-djzinc-800 p-3 rounded-xl">
                            <div className="md:col-span-7 flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-gray-400 shrink-0"><Icons.Folder size={14} className="inline-block align-[-2px]" /> Destino Crates:</span>
                                <input
                                    type="text"
                                    value={rutaBase}
                                    onChange={(e) => setRutaBase(e.target.value)}
                                    className="flex-1 bg-djzinc-950 border border-djzinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-gray-200 outline-none focus:border-djcyan-500"
                                    placeholder="/Users/admin/Music/mi musica"
                                />
                                <button
                                    type="button"
                                    onClick={handleSeleccionarDestino}
                                    className="px-2.5 py-1.5 bg-djzinc-800 hover:bg-djzinc-700 border border-djzinc-600 rounded text-xs font-semibold text-gray-300 cursor-pointer"
                                >
                                    Examinar...
                                </button>
                            </div>

                            <div className="md:col-span-3 flex items-center gap-2 justify-start md:justify-center">
                                <span className="text-xs font-mono text-gray-400">Modo:</span>
                                <div className="inline-flex rounded-lg border border-djzinc-700 p-0.5 bg-djzinc-950">
                                    <button
                                        type="button"
                                        onClick={() => setModo('copy')}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                                            modo === 'copy' ? 'bg-djcyan-500 text-black shadow' : 'text-gray-400 hover:text-white'
                                        }`}
                                        title="Copia los archivos sin borrar los originales"
                                    >
                                        Copiar (Seguro)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setModo('move')}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                                            modo === 'move' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
                                        }`}
                                        title="Mueve los archivos directamente a las carpetas destino"
                                    >
                                        Mover
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-2 flex items-center">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Filtrar crate..."
                                    className="w-full bg-djzinc-950 border border-djzinc-700 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-djcyan-500"
                                />
                            </div>
                        </div>

                        {/* PROGRESO DE RUTEO */}
                        {isRouting && (
                            <div className="p-3 bg-djzinc-900 border border-djcyan-700/60 rounded-xl space-y-1.5 animate-pulse">
                                <div className="flex justify-between text-xs font-mono">
                                    <span className="text-djcyan-400 font-bold">{routeStatusMsg || 'Procesando ruteo de lote...'}</span>
                                    <span className="text-white font-bold">{routeProgress}%</span>
                                </div>
                                <div className="w-full h-2 bg-djzinc-950 rounded-full overflow-hidden border border-djzinc-800">
                                    <div
                                        className="h-full bg-gradient-to-r from-djcyan-500 to-emerald-400 transition-all duration-200"
                                        style={{ width: `${routeProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* MENSAJE DE ÉXITO O ERROR DEL ÚLTIMO RUTEO */}
                        {resultSummary && (
                            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                                resultSummary.status === 'ok' 
                                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
                                    : 'bg-red-950/40 border-red-500/50 text-red-300'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <span>{resultSummary.status === 'ok' ? '✓' : '⚠'}</span>
                                    <span>
                                        {resultSummary.status === 'ok'
                                            ? `Ruteo completado con éxito: ${resultSummary.procesados} pistas procesadas (${resultSummary.errores} errores) hacia ${rutaBase}.`
                                            : (resultSummary.msg || 'Fallo durante el ruteo de lote.')}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setResultSummary(null)}
                                    className="text-gray-400 hover:text-white cursor-pointer px-2 py-0.5 rounded"
                                >
                                    <Icons.Close size={14} className="inline-block align-[-2px]" />
                                </button>
                            </div>
                        )}

                        {/* MÉTRICAS */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-djzinc-900/60 border border-djzinc-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-[11px] text-gray-400">Pistas en Sesión</span>
                                <span className="text-sm font-black text-white font-mono">{tracks.length}</span>
                            </div>
                            <div className="bg-djzinc-900/60 border border-djzinc-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-[11px] text-gray-400">Géneros Raíz</span>
                                <span className="text-sm font-black text-djcyan-400 font-mono">{genresList.length}</span>
                            </div>
                            <div className="bg-djzinc-900/60 border border-djzinc-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-[11px] text-gray-400">Crates / Subgéneros</span>
                                <span className="text-sm font-black text-purple-400 font-mono">{totalCratesCount}</span>
                            </div>
                            <div className="bg-djzinc-900/60 border border-djzinc-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-[11px] text-gray-400">Estructura Serato</span>
                                <span className="text-[11px] font-bold text-emerald-400 font-mono">/[Género]/[Subgénero]/</span>
                            </div>
                        </div>
                    </div>

                    {/* LISTA DE GÉNEROS Y CRATES */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {tracks.length === 0 ? (
                            <div className="h-64 border-2 border-dashed border-djzinc-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-djzinc-900/20">
                                <div className="w-12 h-12 rounded-full bg-djzinc-800 flex items-center justify-center text-djcyan-400 mb-3 shadow-inner">
                                    <Icons.Routing />
                                </div>
                                <h3 className="text-base font-bold text-gray-200 mb-1">No hay pistas cargadas en la Auditoría</h3>
                                <p className="text-xs text-gray-400 max-w-md mb-4">
                                    Carga una carpeta en la pestaña <strong>Auditoría & DSP</strong> para ver el desglose en tiempo real de pistas asignadas a cada Crate y ejecutar el ruteo físico inteligente.
                                </p>
                                {onNavigateTab && (
                                    <button
                                        type="button"
                                        onClick={() => onNavigateTab('audit')}
                                        className="px-3.5 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black text-xs font-bold rounded-lg cursor-pointer transition-colors shadow"
                                    >
                                        Ir a Auditoría & DSP
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredGenres.map(genre => {
                                    const subgenres = TAXONOMY_TREE[genre] || [];
                                    const genreTracksCount = getGenreStats(genre);
                                    const isExpanded = expandedGenre === genre;

                                    return (
                                        <div
                                            key={genre}
                                            className="bg-djzinc-900/80 border border-djzinc-800 rounded-xl overflow-hidden shadow-md transition-all hover:border-djzinc-700"
                                        >
                                            <div
                                                onClick={() => setExpandedGenre(isExpanded ? null : genre)}
                                                className="p-3.5 bg-djzinc-900 flex items-center justify-between cursor-pointer hover:bg-djzinc-850 select-none border-b border-djzinc-800/60"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500 font-mono">
                                                        {isExpanded ? '▼' : '▶'}
                                                    </span>
                                                    <div>
                                                        <span className="text-sm font-black text-white uppercase tracking-wider font-mono">
                                                            {genre}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 ml-2 font-mono">
                                                            ({subgenres.length} subgéneros)
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                                                        genreTracksCount > 0
                                                            ? 'bg-djcyan-950 text-djcyan-400 border border-djcyan-700/60 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                                                            : 'bg-djzinc-800 text-gray-500 border border-djzinc-700'
                                                    }`}>
                                                        {genreTracksCount} pistas
                                                    </span>
                                                    <span className="text-gray-500 text-xs font-mono">
                                                        <Icons.Folder size={14} className="inline-block align-[-2px]" /> /{genre}/
                                                    </span>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-djzinc-950/40">
                                                    {subgenres.map(subg => {
                                                        const matchingTracks = getSubgenreStats(genre, subg);
                                                        const isFilterSelected = selectedSubgenreFilter === `${genre}__${subg}`;

                                                        return (
                                                            <div
                                                                key={subg}
                                                                className={`p-3 rounded-lg border transition-all ${
                                                                    isFilterSelected
                                                                        ? 'bg-djcyan-950/30 border-djcyan-500 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                                                                        : 'bg-djzinc-900 border-djzinc-800 hover:border-djzinc-700'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                                    <div className="font-bold text-xs text-gray-200">
                                                                        {subg}
                                                                    </div>
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 ${
                                                                        matchingTracks.length > 0
                                                                            ? 'bg-djcyan-500 text-black'
                                                                            : 'bg-djzinc-800 text-gray-500'
                                                                    }`}>
                                                                        {matchingTracks.length}
                                                                    </span>
                                                                </div>

                                                                <div className="text-[10px] font-mono text-gray-400 truncate mb-2" title={`${rutaBase}/${genre}/${subg}/`}>
                                                                    <Icons.Folder size={14} className="inline-block align-[-2px]" /> /{genre}/{subg}/
                                                                </div>

                                                                {matchingTracks.length > 0 ? (
                                                                    <div className="pt-2 border-t border-djzinc-800/80 space-y-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSelectedSubgenreFilter(isFilterSelected ? null : `${genre}__${subg}`)}
                                                                            className="text-[10px] text-djcyan-400 hover:text-djcyan-300 font-semibold cursor-pointer underline flex items-center gap-1"
                                                                        >
                                                                            {isFilterSelected ? 'Ocultar pistas' : `Ver ${matchingTracks.length} pistas`}
                                                                        </button>

                                                                        {isFilterSelected && (
                                                                            <div className="mt-2 max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[9.5px]">
                                                                                {matchingTracks.map((tr, idx) => (
                                                                                    <div key={idx} className="p-1 rounded bg-djzinc-950 border border-djzinc-800/80 truncate text-gray-300">
                                                                                        <span className="text-white font-bold">{tr.t || tr.title}</span>
                                                                                        <span className="text-gray-400"> - {tr.a || tr.artist}</span>
                                                                                        <span className="text-djcyan-400 ml-1">({tr.b || tr.bpm || '--'} BPM)</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-[9.5px] text-gray-400 italic">
                                                                        Sin pistas asignadas
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL DE RUEDA ARMÓNICA CAMELOT */}
            <CamelotWheelModal
                isOpen={isCamelotModalOpen}
                onClose={() => setIsCamelotModalOpen(false)}
                currentKey={selectedKeyFilter !== 'ALL' ? selectedKeyFilter : '8A'}
                onSelectKey={(k) => {
                    setSelectedKeyFilter(k);
                    setIsCamelotModalOpen(false);
                }}
            />
        </div>
    );
};

