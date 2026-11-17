const { useState, useEffect, useMemo } = React;
import { Icons } from '../shell/icons.jsx';
import { SectionTitle } from '../shell/workspace-ui.jsx';

// =========================================================================
// ESPACIO DE TRABAJO: TENDENCIAS (CRAWLER SEMANAL MARTES NOCHE & RADAR DJ)
// =========================================================================
export const TrendsWorkspace = ({ lang = "es" }) => {
    const [trendsData, setTrendsData] = useState({
        last_crawled_at: "Sincronizando...",
        next_scheduled_run: "Martes 23:00",
        items: [],
        festivals_calendar: [],
        set_breakdowns: [],
        interviews: [],
        controllers: [],
        gadgets: [],
        dj_gear: [],
        trends_radar: []
    });
    const [loading, setLoading] = useState(true);
    const [isCrawling, setIsCrawling] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("todas");
    const [selectedCity, setSelectedCity] = useState("Madrid");
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState("all"); // 'all' | '7days' | '30days' | '90days'
    const [readingArticle, setReadingArticle] = useState(null);
    const [copiedRef, setCopiedRef] = useState(false);

    const categories = [
        { id: "todas", label: lang === "en" ? "All Trends" : "Todas las Novedades", icon: "🌐" },
        { id: "Festivales & Eventos", label: lang === "en" ? "Events (Time To House)" : "Eventos & Clubs (Time To House)", icon: "🎪" },
        { id: "Entrevistas", label: lang === "en" ? "DJ Interviews" : "Entrevistas DJs", icon: "🎙️" },
        { id: "Controladoras", label: lang === "en" ? "DJ Controllers" : "Controladoras DJ", icon: "🎛️" },
        { id: "Gadgets", label: lang === "en" ? "Booth Gadgets" : "Gadgets de Cabina", icon: "🔌" },
        { id: "Material DJ", label: lang === "en" ? "Pro DJ Gear" : "Material DJ Pro", icon: "🎧" },
        { id: "Tendencias", label: lang === "en" ? "Trends & News" : "Tendencias Globales", icon: "🔥" },
        { id: "SetBreakdowns", label: lang === "en" ? "Set Breakdowns" : "Análisis de Sesiones", icon: "📊" },
        { id: "Radar", label: lang === "en" ? "Tech Radar & DSP" : "Radar & DSP", icon: "📡" },
        { id: "Lanzamientos & Charts", label: lang === "en" ? "Charts & Labels" : "Charts & Labels", icon: "📈" }
    ];

    const fetchTrends = async () => {
        try {
            setLoading(true);
            if (window.eel && window.eel.obtener_tendencias_web) {
                const res = await window.eel.obtener_tendencias_web()();
                if (res && res.items) setTrendsData(res);
            } else {
                const resp = await fetch('/api/trends');
                if (resp.ok) {
                    const data = await resp.json();
                    if (data && data.items) setTrendsData(data);
                }
            }
        } catch (e) {
            console.error("Error cargando tendencias:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrends();
    }, []);

    const handleRunCrawler = async () => {
        setIsCrawling(true);
        try {
            if (window.eel && window.eel.ejecutar_crawler_tendencias) {
                const res = await window.eel.ejecutar_crawler_tendencias()();
                if (res && res.items) setTrendsData(res);
            } else {
                const resp = await fetch('/api/trends/crawl', { method: 'POST' });
                if (resp.ok) {
                    const data = await resp.json();
                    if (data && data.items) setTrendsData(data);
                }
            }
        } catch (e) {
            console.error("Error al ejecutar crawler:", e);
        } finally {
            setIsCrawling(false);
        }
    };

    const handleCopyReference = (refText) => {
        if (!refText) return;
        try {
            navigator.clipboard.writeText(refText);
            setCopiedRef(true);
            setTimeout(() => setCopiedRef(false), 2500);
        } catch (_) {}
    };

    const filteredItems = useMemo(() => {
        const items = trendsData.items || [];
        return items.filter(item => {
            const matchCat = selectedCategory === "todas" || item.category === selectedCategory;
            const q = searchQuery.toLowerCase().trim();
            const matchSearch = !q || 
                (item.title || "").toLowerCase().includes(q) || 
                (item.summary || "").toLowerCase().includes(q) || 
                (item.source || "").toLowerCase().includes(q) ||
                (item.key_tags || []).some(t => t.toLowerCase().includes(q));

            if (!matchCat || !matchSearch) return false;

            if (dateFilter !== "all" && item.date) {
                try {
                    const itemDate = new Date(item.date);
                    if (!isNaN(itemDate.getTime())) {
                        const now = new Date();
                        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
                        if (dateFilter === "7days" && diffDays > 7) return false;
                        if (dateFilter === "30days" && diffDays > 30) return false;
                        if (dateFilter === "90days" && diffDays > 90) return false;
                    }
                } catch (_) {}
            }
            return true;
        });
    }, [trendsData, selectedCategory, searchQuery, dateFilter]);

    const festivals = useMemo(() => {
        let list = trendsData.festivals_calendar || [];
        if (selectedCity && selectedCity !== "Todas") {
            list = list.filter(f => (f.city || "").toLowerCase() === selectedCity.toLowerCase());
        }
        const q = searchQuery.toLowerCase().trim();
        if (!q) return list;
        return list.filter(f => 
            (f.name || "").toLowerCase().includes(q) || 
            (f.city || "").toLowerCase().includes(q) || 
            (f.venue || "").toLowerCase().includes(q) ||
            (f.headliners || []).some(h => h.toLowerCase().includes(q))
        );
    }, [trendsData, selectedCity, searchQuery]);

    const setBreakdowns = useMemo(() => {
        const list = trendsData.set_breakdowns || [];
        const q = searchQuery.toLowerCase().trim();
        if (!q) return list;
        return list.filter(s => 
            (s.artist || "").toLowerCase().includes(q) || 
            (s.event || "").toLowerCase().includes(q) || 
            (s.tactical_breakdown || "").toLowerCase().includes(q)
        );
    }, [trendsData, searchQuery]);

    const interviews = useMemo(() => {
        const list = trendsData.interviews || [];
        const q = searchQuery.toLowerCase().trim();
        if (!q) return list;
        return list.filter(it => 
            (it.artist || "").toLowerCase().includes(q) || 
            (it.headline || "").toLowerCase().includes(q) || 
            (it.quote || "").toLowerCase().includes(q)
        );
    }, [trendsData, searchQuery]);

    const controllers = useMemo(() => {
        const list = trendsData.controllers || [];
        const q = searchQuery.toLowerCase().trim();
        if (!q) return list;
        return list.filter(c => 
            (c.name || "").toLowerCase().includes(q) || 
            (c.brand || "").toLowerCase().includes(q) || 
            (c.description || "").toLowerCase().includes(q)
        );
    }, [trendsData, searchQuery]);

    const gadgets = useMemo(() => {
        const list = trendsData.gadgets || [];
        const q = searchQuery.toLowerCase().trim();
        if (!q) return list;
        return list.filter(g => 
            (g.name || "").toLowerCase().includes(q) || 
            (g.category || "").toLowerCase().includes(q) || 
            (g.utility || "").toLowerCase().includes(q)
        );
    }, [trendsData, searchQuery]);

    const djGear = useMemo(() => {
        const list = trendsData.dj_gear || [];
        const q = searchQuery.toLowerCase().trim();
        if (!q) return list;
        return list.filter(dg => 
            (dg.name || "").toLowerCase().includes(q) || 
            (dg.brand || "").toLowerCase().includes(q) || 
            (dg.type || "").toLowerCase().includes(q) || 
            (dg.description || "").toLowerCase().includes(q)
        );
    }, [trendsData, searchQuery]);

    const radarItems = useMemo(() => {
        const list = trendsData.trends_radar || [];
        const q = searchQuery.toLowerCase().trim();
        if (!q) return list;
        return list.filter(r => 
            (r.topic || "").toLowerCase().includes(q) || 
            (r.description || "").toLowerCase().includes(q)
        );
    }, [trendsData, searchQuery]);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#08080c] overflow-y-auto text-gray-200 pb-36 md:pb-8">
            {/* Header del Espacio de Tendencias */}
            <div className="p-4 md:p-6 border-b border-djzinc-800/80 bg-gradient-to-b from-[#10101a] to-[#08080c] flex flex-col gap-4 shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                                            <div className="flex flex-col gap-1">
                        <SectionTitle 
                            icon={Icons.Trends} 
                            title="Tendencias" 
                            accent="Studio Lab" 
                            badge="RADAR & FESTIVALES" 
                            accentColor="purple" 
                        />
                        <p className="text-xs text-gray-400 mt-0.5">
                            Inteligencia musical continua y escaneo de tendencias acústicas de cabina.
                        </p>
                    </div>
                    </div>

                    {/* Caja de Estado del Crawler & Botón de Sincronización */}
                    <div className="flex flex-wrap items-center gap-3 bg-[#0d0d15] p-2 rounded-xl border border-djzinc-800 shadow-inner">
                        <div className="flex flex-col text-right px-2">
                            <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5 justify-end">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>Crawler semanal: <strong>Martes noche (23:00)</strong></span>
                            </span>
                            <span className="text-[9.5px] font-mono text-gray-500">
                                Última sync: {trendsData.last_crawled_at || 'Reciente'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleRunCrawler}
                            disabled={isCrawling}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-djcyan-500 to-djcyan-400 hover:from-djcyan-400 hover:to-djcyan-300 disabled:opacity-50 text-black font-black text-xs rounded-lg shadow-md shadow-djcyan-500/30 flex items-center gap-2 cursor-pointer transition-transform active:scale-95 shrink-0"
                            title="Lanza el crawler para buscar noticias y tendencias de música electrónica en la web ahora mismo"
                        >
                            <span className={isCrawling ? "animate-spin" : ""}><Icons.Refresh size={14} className="inline-block align-[-2px]" /></span>
                            <span>{isCrawling ? "Rastreando la Web..." : "Sincronizar Crawler"}</span>
                        </button>
                    </div>
                </div>

                {/* Filtros por Categoría y Buscador */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                        {categories.map(cat => {
                            const isSelected = selectedCategory === cat.id;
                            let count = 0;
                            if (cat.id === "todas") count = (trendsData.items || []).length;
                            else if (cat.id === "Festivales & Eventos") count = (trendsData.festivals_calendar || []).length;
                            else if (cat.id === "SetBreakdowns") count = (trendsData.set_breakdowns || []).length;
                            else if (cat.id === "Entrevistas") count = (trendsData.interviews || []).length;
                            else if (cat.id === "Controladoras") count = (trendsData.controllers || []).length;
                            else if (cat.id === "Gadgets") count = (trendsData.gadgets || []).length;
                            else if (cat.id === "Material DJ") count = (trendsData.dj_gear || []).length;
                            else if (cat.id === "Radar") count = (trendsData.trends_radar || []).length;
                            else count = (trendsData.items || []).filter(i => i.category === cat.id).length;

                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                                        isSelected 
                                            ? "bg-gradient-to-r from-djcyan-500 to-djcyan-400 text-black shadow-md font-black" 
                                            : "bg-djzinc-900/80 text-gray-400 hover:text-white hover:bg-djzinc-800 border border-djzinc-800"
                                    }`}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                                        isSelected ? "bg-black text-djcyan-300 font-bold" : "bg-djzinc-800 text-gray-400"
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Selector de Rango de Fecha */}
                        <div className="flex items-center gap-1.5 bg-[#0d0d15] border border-djzinc-800 rounded-lg px-2.5 py-1 text-xs font-mono">
                            <Icons.Calendar size={14} className="inline-block align-[-2px] text-gray-400" />
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="bg-transparent text-gray-300 text-xs font-mono outline-none cursor-pointer"
                                title="Filtrar tendencias por fecha de publicación"
                            >
                                <option value="all" className="bg-[#0d0d15] text-gray-200">Todas las fechas</option>
                                <option value="7days" className="bg-[#0d0d15] text-gray-200">Última semana</option>
                                <option value="30days" className="bg-[#0d0d15] text-gray-200">Último mes</option>
                                <option value="90days" className="bg-[#0d0d15] text-gray-200">Últimos 3 meses</option>
                            </select>
                        </div>

                        {/* Buscador de Tendencias */}
                        <div className="relative min-w-[200px] md:w-64">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar noticias, artistas..."
                                className="w-full bg-[#0d0d15] border border-djzinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 outline-none focus:border-djcyan-500 transition-colors font-mono"
                            />
                            <Icons.Search size={14} className="inline-block align-[-2px] absolute left-2.5 top-2 text-gray-500" />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1.5 text-gray-500 hover:text-white text-xs cursor-pointer"
                                >
                                    <Icons.Close size={14} className="inline-block align-[-2px]" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 1: CALENDARIO DE EVENTOS & CLUBS (Diseño Time To House - Default Madrid) */}
            {selectedCategory === "Festivales & Eventos" && (
                <div className="p-4 md:p-6 space-y-4">
                    {/* Cabecera de Eventos */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-djzinc-800 pb-3 gap-2">
                        <div className="flex items-center gap-2">
                            <Icons.Star size={14} className="inline-block align-[-2px]" />
                            <div>
                                <h2 className="text-base font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                                    <span>Eventos & Clubs Time To House</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/50">
                                        timetohouse.com/es
                                    </span>
                                </h2>
                                <p className="text-xs text-gray-400">
                                    Agenda de clubs y sesiones electrónicas por ciudades con line-ups, horarios y entradas oficiales.
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-mono text-cyan-400 font-bold self-start sm:self-auto">
                            {festivals.length} Eventos en {selectedCity}
                        </span>
                    </div>

                    {/* Selector de Ciudades (Por defecto Madrid) */}
                    <div className="p-3 bg-[#0d0e1c] rounded-2xl border border-djzinc-800 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-300 mr-1 shrink-0">
                            <span><Icons.Pin size={14} className="inline-block align-[-2px]" /> Seleccionar Ciudad:</span>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                            {["Madrid", "Barcelona", "Ibiza", "Valencia", "Sevilla", "Bilbao", "Ámsterdam", "Berlín", "Londres", "Miami", "Todas"].map(city => {
                                const isCityActive = selectedCity.toLowerCase() === city.toLowerCase();
                                return (
                                    <button
                                        key={city}
                                        type="button"
                                        onClick={() => setSelectedCity(city)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                                            isCityActive
                                                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                                                : "bg-[#141525] text-gray-400 hover:text-white hover:bg-[#1c1d35] border border-djzinc-800"
                                        }`}
                                    >
                                        {city === "Madrid" ? "🇪🇸 Madrid (Default)" : city === "Barcelona" ? "🇪🇸 Barcelona" : city === "Ibiza" ? "🏝️ Ibiza" : city === "Valencia" ? "🇪🇸 Valencia" : city === "Sevilla" ? "🇪🇸 Sevilla" : city === "Bilbao" ? "🇪🇸 Bilbao" : city === "Ámsterdam" ? "🇳🇱 Ámsterdam" : city === "Berlín" ? "🇩🇪 Berlín" : city === "Londres" ? "🇬🇧 Londres" : city === "Miami" ? "🇺🇸 Miami" : "🌐 Todas"}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="ml-auto text-[11px] font-mono text-gray-400 shrink-0">
                            <a 
                                href={`https://timetohouse.com/es/events?city=${selectedCity.toLowerCase() === 'todas' ? 'madrid' : selectedCity.toLowerCase()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                            >
                                <span>timetohouse.com/es/events</span>
                                <span>↗</span>
                            </a>
                        </div>
                    </div>

                    {/* Grid de Eventos con diseño Time To House */}
                    {festivals.length === 0 ? (
                        <div className="p-8 text-center bg-[#0e0f1c] rounded-2xl border border-djzinc-800 text-gray-400 font-mono text-xs">
                            No hay eventos listados para {selectedCity} con el término de búsqueda actual.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {festivals.map(fest => (
                                <div 
                                    key={fest.id}
                                    className="bg-[#0e0f1c] border border-djzinc-800 hover:border-cyan-500/60 rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-[0_4px_24px_rgba(6,182,212,0.18)] flex flex-col group cursor-pointer"
                                    onClick={() => setReadingArticle({
                                        id: fest.id,
                                        title: `${fest.name} @ ${fest.venue} (${fest.city})`,
                                        category: "Eventos & Clubs",
                                        category_badge: `🎪 ${fest.city.toUpperCase()}`,
                                        source: "Time To House (timetohouse.com/es)",
                                        author: fest.venue,
                                        date: fest.dates,
                                        read_time: "Guía de Sesión",
                                        image_url: fest.image_url,
                                        summary: fest.description,
                                        content: `${fest.name} se celebra en ${fest.venue} (${fest.city}, ${fest.country}). Horario: ${fest.dates}. Sistema de sonido certificado: ${fest.sound_system}. Line-up confirmado: ${fest.headliners.join(", ")}. Precio de entrada: ${fest.price || 'Consultar'}.\n\nRecomendaciones para cabina: Tempo recomendado en torno a ${fest.recommended_bpm}.`,
                                        takeaways: [
                                            `Fecha: ${fest.dates} (${fest.city}, ${fest.country})`,
                                            `Club / Sala: ${fest.venue}`,
                                            `Sistema Acústico: ${fest.sound_system}`,
                                            `Line-up: ${fest.headliners.join(" • ")}`,
                                            `Precio: ${fest.price || 'Entradas anticipadas disponibles'}`
                                        ],
                                        reference: fest.reference || "https://timetohouse.com/es/events?city=madrid",
                                        url: fest.ticket_url || "https://timetohouse.com/es/events?city=madrid",
                                        key_tags: [fest.city, "Time To House", fest.venue, "Eventos 2026"]
                                    })}
                                >
                                    <div className="h-44 w-full relative overflow-hidden bg-djzinc-900">
                                        <img 
                                            src={fest.image_url} 
                                            alt={fest.name} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f1c] via-black/40 to-transparent"></div>
                                        
                                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                            <span className="text-lg">{fest.flag}</span>
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-black/85 text-cyan-300 border border-cyan-500/50">
                                                {fest.city}
                                            </span>
                                        </div>

                                        <div className="absolute top-3 right-3">
                                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 shadow">
                                                {fest.price || "Entradas"}
                                            </span>
                                        </div>

                                        <div className="absolute bottom-2.5 left-3 text-[11px] font-mono font-bold text-white bg-black/85 px-2.5 py-1 rounded-lg border border-djzinc-750 flex items-center gap-1.5">
                                            <Icons.Library size={14} className="inline-block align-[-2px]" />
                                            <span>{fest.venue}</span>
                                        </div>
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-[#161729] border border-cyan-500/50 text-center shrink-0 shadow">
                                                    <span className="text-[9px] font-mono font-black text-cyan-400 uppercase">{fest.month_badge || 'OCT'}</span>
                                                    <span className="text-lg font-mono font-black text-white leading-none">{fest.day_badge || '31'}</span>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors leading-snug">
                                                        {fest.name}
                                                    </h3>
                                                    <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">
                                                        {fest.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="p-2.5 bg-[#121324] rounded-xl border border-djzinc-800 space-y-1 text-[11px] font-mono">
                                                <div className="flex items-center justify-between text-gray-400">
                                                    <span><Icons.Volume size={14} className="inline-block align-[-2px]" /> Sound System:</span>
                                                    <span className="text-cyan-300 font-bold truncate max-w-[170px]" title={fest.sound_system}>{fest.sound_system}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-gray-400">
                                                    <span><Icons.Clock size={14} className="inline-block align-[-2px]" /> Fechas / Horario:</span>
                                                    <span className="text-amber-300 font-bold">{fest.dates}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <span className="text-[10px] font-mono text-gray-500 uppercase font-bold block">Line-up Confirmado:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {(fest.headliners || []).map((hl, i) => (
                                                        <span key={i} className="text-[9.5px] font-mono px-2 py-0.5 rounded-md bg-[#161729] text-gray-200 border border-djzinc-750 font-bold">
                                                            <Icons.Star size={14} className="inline-block align-[-2px]" /> {hl}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2.5 border-t border-djzinc-800 flex items-center justify-between">
                                            <span className="text-[9.5px] font-mono text-gray-500 flex items-center gap-1">
                                                <span>Fuente:</span>
                                                <span className="text-cyan-400 font-bold">Time To House</span>
                                            </span>
                                            <a
                                                href={fest.ticket_url || "https://timetohouse.com/es/events?city=madrid"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black rounded-lg text-xs font-mono font-black flex items-center gap-1.5 transition-transform active:scale-95 shadow-md"
                                            >
                                                <span>Entradas</span>
                                                <span>↗</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SECCIÓN NUEVA: CONTROLADORAS DJ */}
            {selectedCategory === "Controladoras" && (
                <div className="p-4 md:p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-djzinc-800 pb-2">
                        <div className="flex items-center gap-2">
                            <Icons.Sliders size={14} className="inline-block align-[-2px]" />
                            <h2 className="text-base font-black text-white uppercase tracking-wider font-mono">
                                Controladoras DJ Profesionales & Sistemas Todo-en-Uno (2026)
                            </h2>
                        </div>
                        <span className="text-xs font-mono text-cyan-400">
                            {controllers.length} Modelos Analizados
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {controllers.map(item => (
                            <div key={item.id} className="bg-[#0e0f1c] border border-djzinc-800 hover:border-cyan-500/60 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group">
                                <div className="h-44 w-full relative overflow-hidden bg-djzinc-900">
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f1c] via-black/30 to-transparent"></div>
                                    <div className="absolute top-3 left-3">
                                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-black/85 text-cyan-300 border border-cyan-500/50">
                                            {item.target}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-amber-950/90 text-amber-300 border border-amber-500/60">
                                            {item.price}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-2.5 left-3 text-xs font-mono font-bold text-white bg-black/85 px-2 py-0.5 rounded border border-djzinc-750">
                                        {item.brand}
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                                            <span className="text-cyan-400 font-bold">{item.brand}</span>
                                            <span>{item.date}</span>
                                        </div>
                                        <h3 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            {item.description}
                                        </p>

                                        <div className="p-2.5 bg-[#121324] rounded-xl border border-djzinc-800 space-y-1.5 text-xs font-mono">
                                            <div className="text-[10px] text-gray-400 uppercase font-bold">Compatibilidad Software:</div>
                                            <div className="flex flex-wrap gap-1">
                                                {(item.software_support || []).map((sw, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 rounded bg-djzinc-900 text-cyan-300 border border-djzinc-750 text-[10px]">
                                                        {sw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1 text-xs font-mono">
                                            {(item.key_features || []).map((feat, fIdx) => (
                                                <div key={fIdx} className="flex items-center gap-1.5 text-gray-300 text-[11px]">
                                                    <Icons.Check size={14} className="inline-block align-[-2px] text-cyan-400 font-bold" />
                                                    <span>{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-djzinc-800 flex items-center justify-between text-[10px] font-mono text-gray-400">
                                        <span>Fuente: {item.source}</span>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1">
                                            <span>Ver Análisis</span>
                                            <span>↗</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECCIÓN NUEVA: GADGETS DE CABINA */}
            {selectedCategory === "Gadgets" && (
                <div className="p-4 md:p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-djzinc-800 pb-2">
                        <div className="flex items-center gap-2">
                            <Icons.Link size={14} className="inline-block align-[-2px]" />
                            <h2 className="text-base font-black text-white uppercase tracking-wider font-mono">
                                Gadgets Indispensables de Cabina & Accesorios Pro
                            </h2>
                        </div>
                        <span className="text-xs font-mono text-cyan-400">
                            {gadgets.length} Gadgets Esenciales
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {gadgets.map(item => (
                            <div key={item.id} className="bg-[#0e0f1c] border border-djzinc-800 hover:border-emerald-500/60 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group">
                                <div className="h-44 w-full relative overflow-hidden bg-djzinc-900">
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f1c] via-black/30 to-transparent"></div>
                                    <div className="absolute top-3 left-3">
                                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-black/85 text-emerald-300 border border-emerald-500/50">
                                            {item.category}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-emerald-950/90 text-emerald-300 border border-emerald-500/60">
                                            {item.price}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                                            <span className="text-emerald-400 font-bold">{item.brand}</span>
                                            <span>{item.date}</span>
                                        </div>
                                        <h3 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                                            {item.name}
                                        </h3>
                                        <div className="p-2.5 bg-[#121824] rounded-xl border border-emerald-900/50 text-xs font-mono text-emerald-200">
                                            <Icons.Bulb size={14} className="inline-block align-[-2px]" /> {item.utility}
                                        </div>

                                        <div className="space-y-1 text-xs font-mono">
                                            {(item.specs || []).map((sp, sIdx) => (
                                                <div key={sIdx} className="flex items-center gap-1.5 text-gray-300 text-[11px]">
                                                    <span className="text-emerald-400 font-bold">•</span>
                                                    <span>{sp}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-djzinc-800 flex items-center justify-between text-[10px] font-mono text-gray-400">
                                        <span>Fuente: {item.source}</span>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                                            <span>Ver Ficha</span>
                                            <span>↗</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECCIÓN NUEVA: MATERIAL DJ PRO */}
            {selectedCategory === "Material DJ" && (
                <div className="p-4 md:p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-djzinc-800 pb-2">
                        <div className="flex items-center gap-2">
                            <Icons.Headphones size={14} className="inline-block align-[-2px]" />
                            <h2 className="text-base font-black text-white uppercase tracking-wider font-mono">
                                Material DJ Profesional: Auriculares, Giradiscos & Cápsulas
                            </h2>
                        </div>
                        <span className="text-xs font-mono text-cyan-400">
                            {djGear.length} Equipos de Referencia
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {djGear.map(item => (
                            <div key={item.id} className="bg-[#0e0f1c] border border-djzinc-800 hover:border-purple-500/60 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group">
                                <div className="h-44 w-full relative overflow-hidden bg-djzinc-900">
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f1c] via-black/30 to-transparent"></div>
                                    <div className="absolute top-3 left-3">
                                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-black/85 text-purple-300 border border-purple-500/50">
                                            {item.type}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-purple-950/90 text-purple-300 border border-purple-500/60">
                                            {item.price}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                                            <span className="text-purple-400 font-bold">{item.brand}</span>
                                            <span>{item.date}</span>
                                        </div>
                                        <h3 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            {item.description}
                                        </p>

                                        <div className="space-y-1 text-xs font-mono">
                                            {(item.specs || []).map((sp, sIdx) => (
                                                <div key={sIdx} className="flex items-center gap-1.5 text-gray-300 text-[11px]">
                                                    <Icons.Check size={14} className="inline-block align-[-2px] text-purple-400 font-bold" />
                                                    <span>{sp}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-djzinc-800 flex items-center justify-between text-[10px] font-mono text-gray-400">
                                        <span>Fuente: {item.source}</span>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1">
                                            <span>Especificaciones</span>
                                            <span>↗</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECCIÓN 2: ANÁLISIS DE SESIONES PASADAS (Set Breakdowns) */}
            {selectedCategory === "SetBreakdowns" && (
                <div className="p-4 md:p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-djzinc-800 pb-2">
                        <div className="flex items-center gap-2">
                            <Icons.Sliders size={14} className="inline-block align-[-2px]" />
                            <h2 className="text-base font-black text-white uppercase tracking-wider font-mono">
                                Desglose Técnico de Sesiones Históricas (Harmonic & Energy Flow)
                            </h2>
                        </div>
                        <span className="text-xs font-mono text-purple-400">
                            {setBreakdowns.length} Sesiones Auditadas
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {setBreakdowns.map(sb => (
                            <div 
                                key={sb.id}
                                className="bg-[#0e0e16] border border-djzinc-800 hover:border-purple-500/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-4 transition-all hover:shadow-[0_4px_24px_rgba(168,85,247,0.15)] group cursor-pointer"
                                onClick={() => setReadingArticle({
                                    id: sb.id,
                                    title: `${sb.artist} • ${sb.event}`,
                                    category: "Set Breakdowns",
                                    category_badge: "🎛️ ANÁLISIS DE SESIÓN",
                                    source: "BeatWave Audio Forensics",
                                    author: sb.artist,
                                    date: sb.duration,
                                    read_time: "5 min análisis",
                                    image_url: sb.image_url,
                                    summary: `Desglose armónico y de sonoridad del set de ${sb.artist} en ${sb.event}.`,
                                    content: `${sb.tactical_breakdown} Transición clave: ${sb.key_transition}`,
                                    takeaways: [
                                        `Flujo de BPM: ${sb.bpm_flow}`,
                                        `Viaje Camelot: ${sb.camelot_journey}`,
                                        `Sonoridad Integrada: ${sb.lufs_integrated} (Rango dinámico: ${sb.dynamic_range})`,
                                        `Balance Tri-Banda: ${sb.acoustic_profile}`
                                    ],
                                    reference: sb.reference,
                                    url: "https://www.bbc.co.uk/programmes/b006wkfp",
                                    key_tags: [sb.artist, "Set Analysis", "Camelot", "LUFS"]
                                })}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-djzinc-700 bg-djzinc-900">
                                        <img src={sb.image_url} alt={sb.artist} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 text-[10px] font-mono text-purple-400 font-bold mb-1">
                                            <span><Icons.Clock size={14} className="inline-block align-[-2px]" /> {sb.duration}</span>
                                            <span>•</span>
                                            <span>{sb.event}</span>
                                        </div>
                                        <h3 className="text-base font-black text-white group-hover:text-purple-300 transition-colors">
                                            {sb.artist}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                            {sb.tactical_breakdown}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                                    <div className="bg-[#12121c] p-2 rounded-lg border border-djzinc-800">
                                        <span className="text-[9px] text-gray-500 block uppercase">Flujo BPM</span>
                                        <span className="text-emerald-400 font-bold text-[11px] truncate block" title={sb.bpm_flow}>{sb.bpm_flow}</span>
                                    </div>
                                    <div className="bg-[#12121c] p-2 rounded-lg border border-djzinc-800">
                                        <span className="text-[9px] text-gray-500 block uppercase">Viaje Camelot</span>
                                        <span className="text-djcyan-400 font-bold text-[11px] truncate block" title={sb.camelot_journey}>{sb.camelot_journey}</span>
                                    </div>
                                    <div className="bg-[#12121c] p-2 rounded-lg border border-djzinc-800">
                                        <span className="text-[9px] text-gray-500 block uppercase">Sonoridad LUFS</span>
                                        <span className="text-amber-400 font-bold text-[11px]">{sb.lufs_integrated}</span>
                                    </div>
                                    <div className="bg-[#12121c] p-2 rounded-lg border border-djzinc-800">
                                        <span className="text-[9px] text-gray-500 block uppercase">Tri-Banda %</span>
                                        <span className="text-purple-300 font-bold text-[10px] truncate block" title={sb.acoustic_profile}>{sb.acoustic_profile.split('(')[0]}</span>
                                    </div>
                                </div>

                                <div className="p-2.5 bg-[#141420] rounded-xl border border-djzinc-800 text-xs">
                                    <div className="text-[10px] font-mono text-gray-400 mb-0.5"><Icons.Zap size={14} className="inline-block align-[-2px]" /> Transición Maestra:</div>
                                    <p className="text-xs text-gray-200 italic font-medium">"{sb.key_transition}"</p>
                                </div>

                                <div className="pt-2 border-t border-djzinc-800 flex items-center justify-between text-[10px] font-mono text-gray-400">
                                    <span className="truncate max-w-xs"><Icons.Knowledge size={14} className="inline-block align-[-2px]" /> Ref: {sb.reference}</span>
                                    <span className="text-purple-400 font-bold group-hover:translate-x-1 transition-transform">Ver Desglose →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECCIÓN 3: ENTREVISTAS EXCLUSIVAS (Cuando está en la pestaña Entrevistas) */}
            {selectedCategory === "Entrevistas" && (
                <div className="p-4 md:p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-djzinc-800 pb-2">
                        <div className="flex items-center gap-2">
                            <Icons.Mic size={14} className="inline-block align-[-2px]" />
                            <h2 className="text-base font-black text-white uppercase tracking-wider font-mono">
                                Entrevistas de Cabina & Filosofía de Mezcla
                            </h2>
                        </div>
                        <span className="text-xs font-mono text-rose-400">
                            {interviews.length} Entrevistas Técnicas
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {interviews.map(it => (
                            <div 
                                key={it.id}
                                className="bg-[#0e0e16] border border-djzinc-800 hover:border-rose-500/50 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group cursor-pointer transition-all hover:shadow-[0_4px_24px_rgba(244,63,94,0.15)]"
                                onClick={() => setReadingArticle({
                                    id: it.id,
                                    title: `${it.artist}: "${it.headline}"`,
                                    category: "Entrevistas",
                                    category_badge: "🎙️ ENTREVISTA EXCLUSIVA",
                                    source: it.role,
                                    author: it.artist,
                                    date: it.date,
                                    read_time: it.read_time,
                                    image_url: it.image_url,
                                    summary: it.quote,
                                    content: (it.q_and_a || []).map(qa => `Pregunta: ${qa.q}\n\nRespuesta: ${qa.a}`).join("\n\n"),
                                    takeaways: [
                                        `Artista: ${it.artist} (${it.role})`,
                                        `Cita Destacada: ${it.quote}`,
                                        `Referencia Editorial: ${it.reference}`
                                    ],
                                    reference: it.reference,
                                    url: "https://djmag.com/features",
                                    key_tags: [it.artist, "Interview", "Studio Secrets"]
                                })}
                            >
                                <div className="h-44 w-full relative overflow-hidden bg-djzinc-900">
                                    <img src={it.image_url} alt={it.artist} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-transparent to-black/30"></div>
                                    <div className="absolute top-3 left-3">
                                        <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-black uppercase bg-black/80 text-rose-300 border border-rose-500/50">
                                            {it.read_time}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-2.5 left-3 right-3 text-white">
                                        <div className="text-base font-black drop-shadow">{it.artist}</div>
                                        <div className="text-[10px] font-mono text-gray-300 drop-shadow truncate">{it.role}</div>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors line-clamp-2 leading-snug">
                                            {it.headline}
                                        </h4>
                                        <div className="p-3 bg-[#13131e] rounded-xl border border-djzinc-800 text-xs italic text-gray-300 line-clamp-3 leading-relaxed">
                                            {it.quote}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-djzinc-800 flex items-center justify-between text-[10px] font-mono text-gray-400">
                                        <span className="truncate max-w-[160px]" title={it.reference}><Icons.Knowledge size={14} className="inline-block align-[-2px]" /> {it.reference}</span>
                                        <span className="text-rose-400 font-bold group-hover:translate-x-1 transition-transform">Leer Q&A →</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECCIÓN 4: RADAR DE NUEVOS TEMAS & METODOLOGÍA DSP (Cuando está en Radar) */}
            {selectedCategory === "Radar" && (
                <div className="p-4 md:p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-djzinc-800 pb-2">
                        <div className="flex items-center gap-2">
                            <Icons.Radar size={14} className="inline-block align-[-2px]" />
                            <h2 className="text-base font-black text-white uppercase tracking-wider font-mono">
                                Radar Acústico & Nuevas Metodologías de Cabina
                            </h2>
                        </div>
                        <span className="text-xs font-mono text-djcyan-400">
                            {radarItems.length} Puntos Clave
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {radarItems.map((rad, rIdx) => (
                            <div key={rad.id || rIdx} className="bg-[#0e0e16] border border-djzinc-800 hover:border-djcyan-500/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-3">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-djcyan-950 text-djcyan-300 border border-djcyan-700/60 uppercase">
                                        METODOLOGÍA #{rIdx + 1}
                                    </span>
                                    <h3 className="text-sm font-black text-white">{rad.topic}</h3>
                                    <p className="text-xs text-gray-400 leading-relaxed">{rad.description}</p>
                                </div>
                                <div className="p-2.5 bg-[#12121c] rounded-xl border border-djzinc-800 text-xs font-mono space-y-1">
                                    <div className="text-djcyan-400 font-bold">Emparejamiento:</div>
                                    <div className="text-gray-300">{rad.recommended_pairing}</div>
                                    <div className="text-[10px] text-gray-500 pt-1 border-t border-djzinc-850">Benchmark: {rad.ratio_benchmark}</div>
                                </div>
                                <div className="text-[10px] font-mono text-gray-500 pt-1 border-t border-djzinc-850">
                                    Fuente: {rad.reference}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECCIÓN 5: GRID DE ARTÍCULOS GENERALES DE TENDENCIAS */}
            {(selectedCategory === "todas" || selectedCategory === "Tendencias" || selectedCategory === "Tecnología & Hardware" || selectedCategory === "Lanzamientos & Charts") && (
                <div className="flex-1 p-4 md:p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
                            <span className="w-8 h-8 border-2 border-djcyan-500 border-t-transparent rounded-full animate-spin"></span>
                            <span className="text-xs font-mono">Cargando radar de tendencias...</span>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
                            <Icons.Radar size={14} className="inline-block align-[-2px]" />
                            <span className="text-xs font-mono font-bold text-gray-400">No se encontraron noticias con los filtros actuales</span>
                            <button
                                type="button"
                                onClick={() => { setSelectedCategory("todas"); setSearchQuery(""); }}
                                className="text-xs text-djcyan-400 underline cursor-pointer"
                            >
                                Restablecer filtros
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredItems.map(item => (
                                <div
                                    key={item.id}
                                    className="bg-[#0e0e16] border border-djzinc-800/90 hover:border-djcyan-500/50 rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-[0_4px_24px_rgba(6,182,212,0.15)] hover:-translate-y-0.5 flex flex-col group cursor-pointer"
                                    onClick={() => setReadingArticle(item)}
                                >
                                    {/* Imagen de Cabecera con Badge de Categoría */}
                                    <div className="h-44 w-full relative overflow-hidden bg-djzinc-900">
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80";
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-transparent to-black/30"></div>
                                        <div className="absolute top-3 left-3">
                                            <span className={`px-2.5 py-1 rounded-md text-[9.5px] font-mono font-black uppercase tracking-wider border backdrop-blur-md ${item.badge_color || "bg-djcyan-950/80 text-djcyan-300 border-djcyan-500/50"}`}>
                                                {item.category_badge || item.category}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-gray-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur border border-djzinc-800">
                                            <Icons.Clock size={14} className="inline-block align-[-2px]" /> {item.read_time || "4 min"}
                                        </div>
                                    </div>

                                    {/* Contenido de la Tarjeta */}
                                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                                                <span className="text-djcyan-400 font-bold">{item.source}</span>
                                                <span>{item.date}</span>
                                            </div>
                                            <h3 className="text-sm font-bold text-white group-hover:text-djcyan-300 transition-colors line-clamp-2 leading-snug">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                                                {item.summary}
                                            </p>
                                        </div>

                                        {/* Tags y Botón de Enlace */}
                                        <div className="pt-2 border-t border-djzinc-800/80 flex items-center justify-between gap-2">
                                            <div className="flex flex-wrap gap-1">
                                                {(item.key_tags || []).slice(0, 2).map((tg, idx) => (
                                                    <span key={idx} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-djzinc-900 text-gray-400 border border-djzinc-800">
                                                        #{tg}
                                                    </span>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setReadingArticle(item); }}
                                                className="px-2.5 py-1 bg-djzinc-900 hover:bg-djcyan-950 text-djcyan-400 hover:text-djcyan-300 border border-djzinc-800 hover:border-djcyan-500/60 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
                                            >
                                                <span>Leer En App</span>
                                                <span>→</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL DE LECTURA COMPLETA INTEGRADA EN LA APP CON REFERENCIA Y ENLACE EXTERNO */}
            {readingArticle && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-[#0f1019] border border-djcyan-500/50 rounded-2xl max-w-2xl w-full p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col gap-4 relative text-gray-200 max-h-[90vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => setReadingArticle(null)}
                            className="absolute top-3 right-3 z-50 text-white hover:text-white text-sm font-black font-mono cursor-pointer w-9 h-9 rounded-full bg-black/85 hover:bg-red-600 border border-white/30 shadow-2xl flex items-center justify-center transition-all active:scale-90"
                            title="Cerrar artículo"
                        >
                            <Icons.Close size={14} className="inline-block align-[-2px]" />
                        </button>

                        <div className="h-56 w-full rounded-xl overflow-hidden relative">
                            <img
                                src={readingArticle.image_url}
                                alt={readingArticle.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1019] via-transparent to-black/30"></div>
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-black/80 text-djcyan-300 border border-djcyan-500/50">
                                {readingArticle.category_badge || readingArticle.category}
                            </span>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mb-1">
                                <span className="text-djcyan-400 font-bold">{readingArticle.source}</span>
                                <span>•</span>
                                <span>{readingArticle.date}</span>
                                <span>•</span>
                                <span>{readingArticle.read_time}</span>
                            </div>
                            <h2 className="text-xl font-black text-white">{readingArticle.title}</h2>
                        </div>

                        {/* Extracto / Resumen Ejecutivo */}
                        <div className="p-3 bg-djzinc-900/90 border border-djzinc-800 rounded-xl">
                            <p className="text-xs font-medium text-djcyan-300 leading-relaxed italic">
                                "{readingArticle.summary}"
                            </p>
                        </div>

                        {/* Puntos Clave de Cabina / Takeaways */}
                        {readingArticle.takeaways && readingArticle.takeaways.length > 0 && (
                            <div className="p-3.5 bg-[#12121e] border border-djcyan-500/30 rounded-xl space-y-2">
                                <h4 className="text-xs font-mono font-black text-djcyan-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Icons.Target size={14} className="inline-block align-[-2px]" />
                                    <span>Puntos Clave & Especificaciones Técnicas:</span>
                                </h4>
                                <ul className="space-y-1.5 text-xs text-gray-300 font-mono">
                                    {readingArticle.takeaways.map((tk, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <Icons.Check size={14} className="inline-block align-[-2px] text-emerald-400 font-bold shrink-0" />
                                            <span>{tk}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Contenido Completo del Artículo */}
                        <div className="text-xs text-gray-300 leading-relaxed space-y-3 whitespace-pre-line font-sans">
                            {readingArticle.content}
                        </div>

                        {/* Etiquetas */}
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-djzinc-800">
                            {(readingArticle.key_tags || []).map((tg, idx) => (
                                <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-djzinc-900 text-djcyan-300 border border-djzinc-800">
                                    #{tg}
                                </span>
                            ))}
                        </div>

                        {/* Pie de Referencia Bibliográfica y Enlace Externo */}
                        <div className="pt-3 border-t border-djzinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex flex-col text-xs font-mono text-gray-400">
                                <span>Redacción: {readingArticle.author || readingArticle.source}</span>
                                {readingArticle.reference && (
                                    <span className="text-[10px] text-gray-500 italic mt-0.5">
                                        <Icons.Knowledge size={14} className="inline-block align-[-2px]" /> Ref: {readingArticle.reference}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {readingArticle.reference && (
                                    <button
                                        type="button"
                                        onClick={() => handleCopyReference(readingArticle.reference)}
                                        className="px-3 py-1.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 text-xs font-mono rounded-lg border border-djzinc-700 transition-colors flex items-center gap-1"
                                        title="Copiar cita bibliográfica al portapapeles"
                                    >
                                        <span>{copiedRef ? "✓ Copiado" : "📋 Citar"}</span>
                                    </button>
                                )}
                                {readingArticle.url && (
                                    <a
                                        href={readingArticle.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-1.5 bg-gradient-to-r from-djcyan-500 to-djcyan-400 text-black font-black text-xs rounded-lg shadow cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
                                    >
                                        <span>Abrir Enlace Web</span>
                                        <span>↗</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


