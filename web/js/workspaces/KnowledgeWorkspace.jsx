const { useState, useEffect, useRef, useMemo } = React;
import { Icons, PlatformLogos, renderPlatformLogo } from '../shell/icons.jsx';
import { BEATWAVE_MASTER_GLOSSARY } from '../data/glossary.js';
import { SectionTitle } from '../shell/workspace-ui.jsx';
import { DEFAULT_VINYL_SVG, getValidCover } from '../data/constants.js';

// =========================================================================
// ESPACIO DE TRABAJO: CONOCIMIENTO (CURSOS, VÍDEOS Y MANUALES DJ)
// =========================================================================
export const KnowledgeWorkspace = ({ lang = "es" }) => {
    const [activeSection, setActiveSection] = useState("courses"); // 'courses' | 'videos' | 'manuals' | 'tricks' | 'glossary'
    const [knowledgeData, setKnowledgeData] = useState({
        courses: [],
        videos: [],
        manuals: [],
        tricks: [],
        glossary: []
    });
    const [loading, setLoading] = useState(true);
    const [expandedCourseId, setExpandedCourseId] = useState("course_01");
    const [glossarySearch, setGlossarySearch] = useState("");
    const [glossaryCategory, setGlossaryCategory] = useState("all");

    const fetchKnowledge = async () => {
        try {
            setLoading(true);
            if (window.eel && window.eel.obtener_recursos_conocimiento) {
                const res = await window.eel.obtener_recursos_conocimiento()();
                if (res) setKnowledgeData(res);
            } else {
                const resp = await fetch('/api/knowledge');
                if (resp.ok) {
                    const data = await resp.json();
                    if (data) setKnowledgeData(data);
                }
            }
        } catch (e) {
            console.error("Error cargando conocimiento:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKnowledge();
    }, []);

    const filteredGlossary = useMemo(() => {
        // Combinar glosario maestro exhaustivo de BeatWave con cualquier término dinámico del backend
        const dynamicItems = knowledgeData.glossary || [];
        const combined = [...BEATWAVE_MASTER_GLOSSARY];
        dynamicItems.forEach(d => {
            if (!combined.some(c => c.term.toLowerCase() === (d.term || '').toLowerCase())) {
                combined.push(d);
            }
        });
        return combined.filter(g => {
            if (glossaryCategory !== "all" && (g.category || "").toLowerCase() !== glossaryCategory.toLowerCase()) {
                return false;
            }
            if (!glossarySearch.trim()) return true;
            const q = glossarySearch.toLowerCase();
            return (
                (g.term || "").toLowerCase().includes(q) || 
                (g.definition || "").toLowerCase().includes(q) ||
                (g.category || "").toLowerCase().includes(q) ||
                (g.tag || "").toLowerCase().includes(q) ||
                (g.impact || "").toLowerCase().includes(q)
            );
        });
    }, [knowledgeData.glossary, glossarySearch, glossaryCategory]);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#08080c] overflow-y-auto text-gray-200">
            {/* Header de Conocimiento */}
            <div className="p-4 md:p-6 border-b border-djzinc-800/80 bg-gradient-to-b from-[#10101a] to-[#08080c] flex flex-col gap-4 shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <SectionTitle 
                            icon={Icons.Knowledge} 
                            title="Conocimiento" 
                            accent="& Academia" 
                            badge="FORMACIÓN DJ" 
                            accentColor="purple" 
                        />
                        <p className="text-xs text-gray-400 mt-0.5">
                            Centro de aprendizaje profesional: guías acústicas, técnicas de mezcla, manuales y glosario exhaustivo.
                        </p>
                    </div>

                    {/* Botones de Cabecera: Tutoriales y Manual PDF */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => window.abrirTutorial && window.abrirTutorial('teaser')}
                            className="px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 text-purple-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md font-mono"
                            title="Ver Teaser Comercial de 60 segundos"
                        >
                            <Icons.Film size={14} className="inline-block align-[-2px]" />
                            <span>Ver Teaser (60s)</span>
                        </button>
                        <a
                            href="/api/manual/pdf"
                            download="CleanDJmix_PRO_Manual_Funcional_y_Tecnico.pdf"
                            className="px-3.5 py-2 bg-gradient-to-r from-djcyan-500 to-purple-600 hover:from-djcyan-400 hover:to-purple-500 text-black font-black text-xs rounded-xl shadow-lg shadow-djcyan-500/20 flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 font-mono"
                            title="Descargar el manual completo en formato PDF con capturas de la aplicación y arquitectura de código"
                        >
                            <Icons.FileText size={14} className="inline-block align-[-2px]" />
                            <span>Manual PDF</span>
                        </a>
                    </div>
                </div>

                {/* Pestañas de Navegación Interna */}
                <div className="flex items-center gap-2 border-b border-djzinc-800 pt-2 overflow-x-auto scrollbar-none">
                    <button
                        type="button"
                        onClick={() => setActiveSection("courses")}
                        className={`px-4 py-2 text-xs font-mono font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeSection === "courses"
                                ? "border-djcyan-400 text-djcyan-300 bg-djcyan-950/30"
                                : "border-transparent text-gray-400 hover:text-white"
                        }`}
                    >
                        <span><Icons.Knowledge size={14} className="inline-block align-[-2px]" /> Cursos Estructurados</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-djzinc-800 text-gray-300">
                            {(knowledgeData.courses || []).length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection("videos")}
                        className={`px-4 py-2 text-xs font-mono font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeSection === "videos"
                                ? "border-djcyan-400 text-djcyan-300 bg-djcyan-950/30"
                                : "border-transparent text-gray-400 hover:text-white"
                        }`}
                    >
                        <span><Icons.Film size={14} className="inline-block align-[-2px]" /> Vídeos & Masterclasses</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-djzinc-800 text-gray-300">
                            {(knowledgeData.videos || []).length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection("manuals")}
                        className={`px-4 py-2 text-xs font-mono font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeSection === "manuals"
                                ? "border-djcyan-400 text-djcyan-300 bg-djcyan-950/30"
                                : "border-transparent text-gray-400 hover:text-white"
                        }`}
                    >
                        <span><Icons.FileText size={14} className="inline-block align-[-2px]" /> Manuales & Guías Técnicas</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-djzinc-800 text-gray-300">
                            {(knowledgeData.manuals || []).length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection("tricks")}
                        className={`px-4 py-2 text-xs font-mono font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeSection === "tricks"
                                ? "border-amber-400 text-amber-300 bg-amber-950/30"
                                : "border-transparent text-gray-400 hover:text-white"
                        }`}
                    >
                        <span><Icons.Zap size={14} className="inline-block align-[-2px]" /> Hacks & Curiosidades Acústicas</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-djzinc-800 text-gray-300">
                            {(knowledgeData.tricks || []).length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection("glossary")}
                        className={`px-4 py-2 text-xs font-mono font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeSection === "glossary"
                                ? "border-djcyan-400 text-djcyan-300 bg-djcyan-950/30"
                                : "border-transparent text-gray-400 hover:text-white"
                        }`}
                    >
                        <span><Icons.Knowledge size={14} className="inline-block align-[-2px]" /> Glosario Acústico DJ</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-djzinc-800 text-gray-300">
                            {(knowledgeData.glossary || []).length}
                        </span>
                    </button>
                </div>
            </div>

            {/* Contenido de la Sección Activa */}
            <div className="flex-1 p-4 md:p-6">
                {/* SECCIÓN 1: CURSOS ESTRUCTURADOS */}
                {activeSection === "courses" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {(knowledgeData.courses || []).map(course => {
                                const isExpanded = expandedCourseId === course.id;
                                return (
                                    <div
                                        key={course.id}
                                        className="bg-[#0e0e16] border border-djzinc-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
                                    >
                                        <div className="h-40 relative bg-djzinc-900">
                                            <img
                                                src={course.image_url}
                                                alt={course.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-transparent to-black/30"></div>
                                            <div className="absolute top-3 left-3">
                                                <span className={`px-2.5 py-1 rounded-md text-[9.5px] font-mono font-black uppercase tracking-wider border backdrop-blur-md ${course.badge_color}`}>
                                                    {course.level_badge}
                                                </span>
                                            </div>
                                            <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-gray-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur">
                                                <Icons.Clock size={14} className="inline-block align-[-2px]" /> {course.duration} • {course.lessons_count} lecciones
                                            </div>
                                        </div>

                                        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-mono text-djcyan-400 font-bold">
                                                    Instructor: {course.instructor}
                                                </span>
                                                <h3 className="text-sm font-bold text-white leading-snug">
                                                    {course.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 leading-relaxed">
                                                    {course.description}
                                                </p>
                                            </div>

                                            {/* Temario Desplegable */}
                                            {isExpanded && (
                                                <div className="p-3 bg-djzinc-900/90 rounded-xl border border-djzinc-800 space-y-2 animate-fadeIn">
                                                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                                                        Temario de Lecciones:
                                                    </span>
                                                    {(course.modules || []).map((mod, mIdx) => (
                                                        <div key={mIdx} className="flex items-center justify-between text-xs py-1 border-b border-djzinc-800/60 last:border-0">
                                                            <span className="text-gray-300 font-medium">{mod.title}</span>
                                                            <span className="text-[10px] font-mono text-gray-500 shrink-0 ml-2">{mod.duration}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="pt-2 border-t border-djzinc-800 flex items-center justify-between">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                                                    className="text-xs font-mono text-djcyan-400 hover:text-djcyan-300 cursor-pointer font-bold flex items-center gap-1"
                                                >
                                                    <span>{isExpanded ? "Ocultar Temario" : "Ver Temario Completo"}</span>
                                                    <span>{isExpanded ? "▲" : "▼"}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => alert(`Iniciando módulo interactivo: ${course.title}`)}
                                                    className="px-3.5 py-1.5 bg-djzinc-800 hover:bg-djcyan-950 text-gray-200 hover:text-djcyan-300 border border-djzinc-700 hover:border-djcyan-500/60 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors"
                                                >
                                                    Iniciar Lección →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* SECCIÓN 2: VÍDEOS & MASTERCLASSES */}
                {activeSection === "videos" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(knowledgeData.videos || []).map(vid => (
                            <div
                                key={vid.id}
                                className="bg-[#0e0e16] border border-djzinc-800 hover:border-djcyan-500/50 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group"
                            >
                                <div className="h-36 relative bg-djzinc-900 overflow-hidden">
                                    <img
                                        src={vid.thumbnail}
                                        alt={vid.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-djcyan-500/90 text-black flex items-center justify-center font-bold pl-0.5 shadow-lg group-hover:scale-110 transition-transform">
                                            <Icons.Play size={14} className="inline-block align-[-2px]" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 text-[10px] font-mono text-white bg-black/80 px-1.5 py-0.2 rounded backdrop-blur">
                                        {vid.duration}
                                    </div>
                                </div>

                                <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-mono text-djcyan-400 font-bold block">
                                            {vid.category} • {vid.views} vistas
                                        </span>
                                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                                            {vid.title}
                                        </h4>
                                        <span className="text-[10px] text-gray-400 block font-mono">
                                            Por {vid.instructor}
                                        </span>
                                    </div>

                                    <div className="pt-2 border-t border-djzinc-800/80 flex items-center justify-between">
                                        <div className="flex gap-1 flex-wrap">
                                            {(vid.tags || []).slice(0, 2).map((tg, i) => (
                                                <span key={i} className="text-[9px] font-mono px-1 py-0.2 rounded bg-djzinc-900 text-gray-400">
                                                    #{tg}
                                                </span>
                                            ))}
                                        </div>
                                        <a
                                            href={vid.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2.5 py-1 bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-300 border border-djcyan-700/60 rounded text-[10px] font-mono font-bold flex items-center gap-1"
                                        >
                                            <span>Ver</span>
                                            <span>↗</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* SECCIÓN 3: MANUALES Y GUÍAS TÉCNICAS */}
                {activeSection === "manuals" && (
                    <div className="space-y-5">
                        {/* Tarjeta Flagship: Manual CleanDJmix PRO */}
                        <div className="p-6 bg-gradient-to-br from-[#0e0e18] via-[#101024] to-[#0a0a14] border-2 border-djcyan-500/60 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                            <div className="space-y-3 max-w-xl">
                                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-djcyan-950 text-djcyan-300 border border-djcyan-500/60">
                                    DOCUMENTACIÓN OFICIAL CERTIFICADA
                                </span>
                                <h3 className="text-lg md:text-xl font-black text-white">
                                    Manual Funcional y Técnico Ilustrado CleanDJmix PRO (v2.4.0)
                                </h3>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    8 páginas de ingeniería que cubren la arquitectura limpia del sistema, el mapa exhaustivo de código en <code>services/</code> y <code>web/</code>, física de tornamesa directa, ecualizador Web Audio API de 3 vías, detección SuperFLAC, endpoints REST y resultados de la suite Pytest (117 tests superados).
                                </p>
                                <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                                    <span><Icons.FileText size={14} className="inline-block align-[-2px]" /> Formato: PDF Corporativo A4</span>
                                    <span>•</span>
                                    <span><Icons.Excel size={14} className="inline-block align-[-2px]" /> 8 Páginas Ilustradas</span>
                                    <span>•</span>
                                    <span><Icons.Save size={14} className="inline-block align-[-2px]" /> ~2.1 MB</span>
                                </div>
                            </div>

                            <a
                                href="/api/manual/pdf"
                                download="CleanDJmix_PRO_Manual_Funcional_y_Tecnico.pdf"
                                className="px-6 py-3 bg-gradient-to-r from-djcyan-400 via-sky-400 to-purple-500 hover:from-djcyan-300 hover:to-purple-400 text-black font-black text-sm rounded-xl shadow-lg shadow-djcyan-500/30 flex items-center gap-2.5 cursor-pointer transition-transform active:scale-95 shrink-0"
                            >
                                <Icons.Download size={14} className="inline-block align-[-2px]" />
                                <span>Descargar Manual PDF</span>
                            </a>
                        </div>

                        {/* Lista de Guías Secundarias */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(knowledgeData.manuals || []).slice(1).map(man => (
                                <div
                                    key={man.id}
                                    className="p-4 bg-[#0e0e16] border border-djzinc-800 rounded-xl flex flex-col justify-between gap-3 shadow"
                                >
                                    <div className="space-y-2">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${man.badge_color}`}>
                                            {man.badge}
                                        </span>
                                        <h4 className="text-xs font-bold text-white leading-snug">{man.title}</h4>
                                        <p className="text-[11px] text-gray-400 leading-relaxed">{man.description}</p>
                                    </div>
                                    <div className="pt-2 border-t border-djzinc-800 flex items-center justify-between text-[10px] font-mono text-gray-400">
                                        <span>{man.format} • {man.pages}</span>
                                        <button
                                            type="button"
                                            onClick={() => alert(`Consultando especificación técnica: ${man.title}`)}
                                            className="text-djcyan-400 hover:underline font-bold cursor-pointer"
                                        >
                                            Consultar →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SECCIÓN 4: HACKS & CURIOSIDADES ACÚSTICAS */}
                {activeSection === "tricks" && (
                    <div className="space-y-6">
                        <div className="p-4 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-cyan-950/40 border border-amber-500/40 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="text-base font-black text-amber-300 font-mono flex items-center gap-2">
                                    <Icons.Zap size={14} className="inline-block align-[-2px]" /> <span>Hacks Creativos de Cabina & Secretos Psicoacústicos</span>
                                </h3>
                                <p className="text-xs text-gray-300">
                                    Técnicas no convencionales aplicadas por DJs internacionales: polirritmias métricas, trucos de pads, transiciones wordplay y secretos de sonido de salas icónicas como Berghain.
                                </p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/50 shrink-0">
                                EXPERIMENTACIÓN PRO
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {(knowledgeData.tricks || []).map(trick => (
                                <div 
                                    key={trick.id}
                                    className="p-5 bg-[#0e0f1c] border border-djzinc-800 hover:border-amber-500/50 rounded-2xl shadow-lg flex flex-col justify-between gap-4 transition-all hover:shadow-[0_4px_24px_rgba(245,158,11,0.12)]"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{trick.icon}</span>
                                                <div>
                                                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-black uppercase border ${trick.badge_color || 'bg-amber-950 text-amber-300 border-amber-500/50'}`}>
                                                        {trick.badge}
                                                    </span>
                                                    <h4 className="text-sm font-black text-white mt-1">
                                                        {trick.title}
                                                    </h4>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-300 leading-relaxed font-sans">
                                            {trick.summary}
                                        </p>

                                        {/* Pasos de Ejecución */}
                                        <div className="p-3 bg-[#131424] rounded-xl border border-djzinc-800 space-y-2">
                                            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                                                Ejecución en Cabina:
                                            </span>
                                            <div className="space-y-1.5 text-xs text-gray-300 font-mono">
                                                {(trick.step_by_step || []).map((step, sIdx) => (
                                                    <div key={sIdx} className="flex items-start gap-2">
                                                        <span className="text-amber-400 font-bold shrink-0">▸</span>
                                                        <span className="text-[11.5px] leading-snug">{step}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Pro Tip */}
                                        {trick.pro_tip && (
                                            <div className="p-2.5 bg-purple-950/40 rounded-xl border border-purple-500/40 text-xs font-mono text-purple-200 flex items-center gap-2">
                                                <Icons.Bulb size={14} className="inline-block align-[-2px]" />
                                                <span className="text-[11px] leading-tight font-medium"><strong>Pro Tip:</strong> {trick.pro_tip}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SECCIÓN 5: GLOSARIO ACÚSTICO DJ INTEGRAL & VISUAL */}
                {activeSection === "glossary" && (
                    <div className="space-y-6">
                        {/* BARRA SUPERIOR: BUSCADOR & FILTROS POR CATEGORÍA */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 shadow-xl backdrop-blur-md">
                            <div className="relative flex-1 max-w-md">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs">🔍</span>
                                <input
                                    type="text"
                                    value={glossarySearch}
                                    onChange={(e) => setGlossarySearch(e.target.value)}
                                    placeholder="Buscar término (ej. Bass Clash, Downbeat, LUFS, Camelot)..."
                                    className="w-full pl-8 pr-4 py-2 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-400 font-mono shadow-inner transition-colors"
                                />
                                {glossarySearch && (
                                    <button
                                        type="button"
                                        onClick={() => setGlossarySearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-mono"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* BADGE RESUMEN */}
                            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 shrink-0">
                                <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 font-bold text-cyan-300">
                                    {filteredGlossary.length} Términos DJ
                                </span>
                                <span className="text-zinc-600">|</span>
                                <span className="text-[11px] text-zinc-500">100% Definiciones Operativas</span>
                            </div>
                        </div>

                        {/* SELECTOR RÁPIDO DE CATEGORÍAS ACÚSTICAS Y TÉCNICAS */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
                            {[
                                { id: 'all', label: 'Todos los Conceptos', icon: '🌐' },
                                { id: 'DSP & Acústica', label: 'DSP & Acústica', icon: '🔬', color: 'border-cyan-400 text-cyan-300 bg-cyan-950/40' },
                                { id: 'Cabina & Decks', label: 'Cabina & Decks', icon: '🎛️', color: 'border-sky-400 text-sky-300 bg-sky-950/40' },
                                { id: 'Armonía & Camelot', label: 'Armonía & Camelot', icon: '🎡', color: 'border-pink-400 text-pink-300 bg-pink-950/40' },
                                { id: 'Psicoacústica & IA', label: 'Psicoacústica & IA', icon: '⚡', color: 'border-amber-400 text-amber-300 bg-amber-950/40' },
                                { id: 'Metadatos & Suites', label: 'Metadatos & Suites', icon: '💾', color: 'border-emerald-400 text-emerald-300 bg-emerald-950/40' }
                            ].map(cat => {
                                const isActive = glossaryCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setGlossaryCategory(cat.id)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                                            isActive
                                                ? (cat.color || 'border-cyan-400 text-cyan-300 bg-cyan-950/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]')
                                                : 'border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700'
                                        }`}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* GRID DE TARJETAS VISUALES DEL GLOSARIO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredGlossary.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 rounded-2xl bg-[#0b0c13] border border-zinc-800/90 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300 flex flex-col justify-between gap-3 group"
                                >
                                    {/* Cabecera del término */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span 
                                                className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border"
                                                style={{ 
                                                    backgroundColor: `${item.color || '#06b6d4'}15`, 
                                                    borderColor: `${item.color || '#06b6d4'}40`,
                                                    color: item.color || '#06b6d4'
                                                }}
                                            >
                                                {item.tag || item.category}
                                            </span>
                                            <span className="text-xs">{item.icon || "📖"}</span>
                                        </div>

                                        <h4 className="font-syne font-black text-sm text-white group-hover:text-cyan-300 transition-colors tracking-tight flex items-center gap-1.5">
                                            {item.term}
                                        </h4>

                                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                                            {item.definition}
                                        </p>
                                    </div>

                                    {/* Footer con Fórmula e Impacto en Cabina */}
                                    <div className="pt-2.5 border-t border-zinc-800/80 space-y-1.5 text-[10px] font-mono">
                                        {item.formula && (
                                            <div className="flex items-center justify-between text-zinc-400">
                                                <span className="text-zinc-500 font-bold">MÉTRICA:</span>
                                                <span className="text-cyan-400 font-semibold truncate">{item.formula}</span>
                                            </div>
                                        )}
                                        {item.impact && (
                                            <div className="p-1.5 rounded-lg bg-zinc-950/70 border border-zinc-900 text-zinc-400 leading-normal">
                                                <strong className="text-emerald-400">Impacto Cabina: </strong>
                                                <span>{item.impact}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// ==============================================================================
// SISTEMA DE ONBOARDING DJ: TEASER COMERCIAL 60S & TOUR SPOTLIGHT INTERACTIVO
// ==============================================================================

// Motor de Síntesis Web Audio API para el Teaser Comercial (Cero dependencias externas)
class CommercialBeatEngine {
    constructor() {
        this.ctx = null;
        this.timer = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.step = 0;
    }

    init() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            this.ctx = new AudioCtx();
        } catch (e) {
            console.warn("AudioContext error:", e);
        }
    }

    start() {
        if (!this.ctx) this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.isPlaying = true;
        this.step = 0;
        this.scheduleTick();
    }

    scheduleTick() {
        if (!this.isPlaying || !this.ctx) return;
        const bpm = 126;
        const stepInterval = (60 / bpm) / 4; // semicorcheas
        this.playStep(this.step);
        this.step = (this.step + 1) % 16;
        this.timer = setTimeout(() => this.scheduleTick(), stepInterval * 1000);
    }

    playStep(s) {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        // Kick analógico 4x4 de club (pasos 0, 4, 8, 12)
        if (s % 4 === 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(135, now);
            osc.frequency.exponentialRampToValueAtTime(32, now + 0.12);
            gain.gain.setValueAtTime(0.7, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        }
        // Hi-Hat en el contratiempo (pasos 2, 6, 10, 14)
        if (s % 4 === 2) {
            const bufSize = Math.floor(this.ctx.sampleRate * 0.04);
            const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(7500, now);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
        }
        // Sub-bassline club en tonalidad 8A (A1 = 55Hz)
        if (s % 2 === 0 && s % 4 !== 0) {
            const bass = this.ctx.createOscillator();
            const bGain = this.ctx.createGain();
            const bFilter = this.ctx.createBiquadFilter();
            bass.type = 'sawtooth';
            bass.frequency.setValueAtTime(55, now);
            bFilter.type = 'lowpass';
            bFilter.frequency.setValueAtTime(280, now);
            bGain.gain.setValueAtTime(0.35, now);
            bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
            bass.connect(bFilter);
            bFilter.connect(bGain);
            bGain.connect(this.ctx.destination);
            bass.start(now);
            bass.stop(now + 0.18);
        }
    }

    setMuted(m) {
        this.isMuted = m;
    }

    stop() {
        this.isPlaying = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    destroy() {
        this.stop();
        if (this.ctx && this.ctx.state !== 'closed') {
            try { this.ctx.close(); } catch (e) {}
        }
        this.ctx = null;
    }
}

// 5 Escenas Dinámicas de 12 segundos para la Demo Comercial de 60 Segundos
const COMMERCIAL_SCENES = [
    {
        id: "fft_fake",
        startSec: 0,
        endSec: 12,
        badge: "01/05 • INGESTA HÍBRIDA & RADAR FFT",
        tag: "DETECCIÓN FAKE LOSSLESS",
        title: "¡NUNCA MÁS UN MP3 DISFRAZADO EN FESTIVAL!",
        hook: "Transformada Rápida de Fourier (FFT) en proceso multihilo asíncrono",
        description: "Muchos DJs descargan supuestos WAV o FLAC que son ripeos inflados desde MP3 a 128 kbps. CleanDJmix analiza el espectro al milisegundo: si corta en seco a 16 kHz, activa la alerta roja y busca el master oficial original en la pasarela SuperFLAC.",
        metricLabel: "CORTE FFT DETECTADO",
        metricVal: "16.0 kHz ❌ FAKE",
        metricSuccess: "22.05 kHz ✓ LOSSLESS REAL",
        accent: "from-red-500 via-amber-500 to-djcyan-400"
    },
    {
        id: "anti_muddy",
        startSec: 12,
        endSec: 24,
        badge: "02/05 • ESCUDO ANTI-MUDDY TRI-BANDA",
        tag: "BALANCE ESPECTRAL CABINA",
        title: "PROTEGE TU MEZCLA DE LA COLISIÓN DE GRAVES",
        hook: "Ratio de Energía Espectral Tri-Banda (Low / Mid / High %)",
        description: "El error número 1 al mezclar es solapar dos pistas con excesiva carga de subgraves (30-80 Hz). La app calcula la densidad espectral de cada tema y clasifica su Rol Acústico: Bass Driver, Vocal/Lead o Percussive Tool para mezclas limpias y potentes.",
        metricLabel: "DISTRIBUCIÓN TRI-BANDA",
        metricVal: "LOW: 45% | MID: 35% | HI: 20%",
        metricSuccess: "ROL: BASS DRIVER (COMPLEMENTARIO)",
        accent: "from-cyan-500 via-blue-500 to-emerald-400"
    },
    {
        id: "hot_cues",
        startSec: 24,
        endSec: 36,
        badge: "03/05 • 8 HOT CUES & AUTO-MAPPING",
        tag: "ESTRUCTURA DE CLUB EXTENDED",
        title: "TUS 8 PADS LISTOS EN MENOS DE 1 SEGUNDO",
        hook: "Auto-Mapping algorítmico a 16 y 32 compases",
        description: "Se acabó colocar cues a mano tema por tema en librerías de 2.000 pistas. Con un clic, la app detecta el primer beat y mapea la plantilla Club: Pad 1 Intro, Pad 2 Percusión, Pad 3 Breakdown, Pad 4 Drop, Pads 5-6 Loops de 16/32c y Pads 7-8 Outro con colores oficiales RGB.",
        metricLabel: "CUANTIZACIÓN DE FRASE",
        metricVal: "16 & 32 COMPASES (AUTO)",
        metricSuccess: "8 PADS RGB SERATO & REKORDBOX",
        accent: "from-emerald-400 via-teal-400 to-cyan-400"
    },
    {
        id: "set_builder",
        startSec: 36,
        endSec: 48,
        badge: "04/05 • SET-BUILDER & FLUJO ARMÓNICO",
        tag: "CAMELOT WHEEL & ENERGY CURVE",
        title: "DISEÑA EL VIAJE SONORO PERFECTO DE TU SESIÓN",
        hook: "Canvas interactivo con visualización de curva de energía",
        description: "Un DJ improvisando sin rumbo se pierde. Arrastra temas al canvas interactivo y la app dibuja la progresión de BPM y energía en tiempo real, advirtiéndote al instante de saltos armónicos bruscos o caídas de dinámica para mantener la pista de baile en llamas.",
        metricLabel: "COMPATIBILIDAD TONAL",
        metricVal: "CAMELOT: 8A → 9A (+1 COMPATIBLE)",
        metricSuccess: "CURVA DE ENERGÍA: ASCENDENTE (126 → 128 BPM)",
        accent: "from-purple-500 via-pink-500 to-djcyan-400"
    },
    {
        id: "export",
        startSec: 48,
        endSec: 60,
        badge: "05/05 • EXPORTACIÓN NATIVA ZERO-LATENCY",
        tag: "COMPATIBILIDAD SERATO & REKORDBOX",
        title: "DE TU PORTÁTIL A LA CABINA EN UN SOLO CLIC",
        hook: "Paridad binaria Serato GEOB Markers2 y Rekordbox XML",
        description: "Exportación nativa inmediata para Pioneer DJ (rekordbox.xml) y Serato DJ Pro (.crate). Conecta tu USB al mixer o a los CDJs y tendrás todos tus Hot Cues, beatgrids decimales, carátulas y etiquetas listos para tocar en directo sin ningún paso extra.",
        metricLabel: "COMPATIBILIDAD DE HARDWARE",
        metricVal: "SERATO DJ PRO (.crate) + PIONEER CDJ (XML)",
        metricSuccess: "PARIDAD GEOB 100% CERTIFICADA",
        accent: "from-djcyan-400 via-emerald-400 to-amber-400"
    }
];

// Pasos Guiados para el Tour Spotlight en Pantalla Real
const TOUR_STEPS = [
    {
        id: "audit-select",
        target: "tour-audit-select",
        tab: "audit",
        badge: "PASO 1 DE 5 • INGESTA HÍBRIDA",
        icon: "📂",
        title: "Selección Híbrida de Carpetas & Pistas",
        description: "Navega libremente por tu biblioteca y añade carpetas enteras o pistas sueltas sin perder tu selección previa en la cesta. Toda la ingesta se ejecuta con procesos asíncronos multihilo sin congelar la interfaz.",
        tip: "Pulsa '📂 Seleccionar' para explorar carpetas, marcar pistas y cargar todo en conjunto."
    },
    {
        id: "audit-table",
        target: "tour-audit-table",
        tab: "audit",
        badge: "PASO 2 DE 5 • INTELIGENCIA ACÚSTICA",
        icon: "⚡",
        title: "FFT Anti-Muddy & Rol Acústico",
        description: "Análisis espectral por FFT para cazar falsos Lossless (cortes a 16 kHz), medición EBU R128 LUFS y cálculo del Ratio Tri-Banda (Low 20-250Hz, Mid 250-4kHz, High 4-20kHz).",
        tip: "La columna 'Rol Acústico' clasifica cada tema como Bass Driver, Vocal/Lead o Percussive para mezclar sin colisión de frecuencias."
    },
    {
        id: "hotcues-deck",
        target: "tour-hotcues-deck",
        tab: "hotcues",
        badge: "PASO 3 DE 5 • HARDWARE HOT CUES",
        icon: "🎛️",
        title: "8 Pads RGB con Auto-Mapping de Frase",
        description: "Cabina táctil profesional con 8 pads RGB, pitch fader de rango dual y forma de onda 64x. El motor de Auto-Mapping detecta el downbeat y cuantiza automáticamente Drops, Breaks y Loops a 16 y 32 compases.",
        tip: "Pulsa 'Auto-Generate Cues (Club)' para poblar los 8 pads con offsets cuantizados en 1 segundo."
    },
    {
        id: "setbuilder",
        target: "tour-setbuilder",
        tab: "setbuilder",
        badge: "PASO 4 DE 5 • FLUJO ARMÓNICO",
        icon: "🗺️",
        title: "Set-Builder & Curva de Energía",
        description: "Canvas interactivo donde diseñas la narrativa de tu noche. Visualiza la curva de energía dinámica y las transiciones tonales en la Rueda Camelot para evitar saltos bruscos o caídas de ritmo.",
        tip: "Arrastra y organiza tus bloques de pistas para comprobar la compatibilidad armónica en tiempo real."
    },
    {
        id: "export-crates",
        target: "tour-export-crates",
        tab: "audit",
        badge: "PASO 5 DE 5 • EXPORTACIÓN CLUB",
        icon: "🚀",
        title: "Exportación Directa a Serato & Rekordbox",
        description: "Exporta tus listas y cues a Serato DJ Pro (.crate con paridad binaria GEOB Markers2) o Rekordbox XML para Pioneer CDJ en cero latencia.",
        tip: "Tus Hot Cues con colores oficiales y grids milimétricos se escriben directamente en tu USB para el soundsystem."
    }
];

// Modal 1: Vídeo Teaser Comercial de 60 Segundos
const CommercialTeaserModal = ({ isOpen, onClose, onOpenTour }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const beatEngineRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const engine = new CommercialBeatEngine();
        beatEngineRef.current = engine;
        engine.init();
        if (isPlaying && !isMuted) {
            engine.start();
        }
        return () => {
            if (beatEngineRef.current) {
                beatEngineRef.current.destroy();
                beatEngineRef.current = null;
            }
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !isPlaying) {
            if (beatEngineRef.current) beatEngineRef.current.stop();
            return;
        }
        if (beatEngineRef.current && !beatEngineRef.current.isPlaying && !isMuted) {
            beatEngineRef.current.start();
        }

        const interval = setInterval(() => {
            setCurrentTime(prev => {
                if (prev >= 60) {
                    setIsPlaying(false);
                    if (beatEngineRef.current) beatEngineRef.current.stop();
                    return 60;
                }
                return Math.round((prev + 0.1) * 10) / 10;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isOpen, isPlaying, isMuted]);

    if (!isOpen) return null;

    const currentScene = COMMERCIAL_SCENES.find(s => currentTime >= s.startSec && currentTime < s.endSec) || COMMERCIAL_SCENES[COMMERCIAL_SCENES.length - 1];
    const isFinished = currentTime >= 60;

    const handleTogglePlay = () => {
        if (isFinished) {
            setCurrentTime(0);
            setIsPlaying(true);
            if (beatEngineRef.current && !isMuted) beatEngineRef.current.start();
        } else {
            setIsPlaying(prev => !prev);
        }
    };

    const handleToggleMute = () => {
        const nextMute = !isMuted;
        setIsMuted(nextMute);
        if (beatEngineRef.current) {
            beatEngineRef.current.setMuted(nextMute);
            if (!nextMute && isPlaying && !beatEngineRef.current.isPlaying) {
                beatEngineRef.current.start();
            }
        }
    };

    const handleSeek = (sec) => {
        setCurrentTime(sec);
    };

    return (
        <div className="fixed inset-0 z-[9990] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
            <div className="relative w-full max-w-4xl bg-[#0a0a12] border border-djcyan-500/50 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.35)] overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* Header Superior del Reproductor */}
                <div className="p-4 sm:p-5 border-b border-djzinc-800 bg-djzinc-950/90 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                        <div>
                            <span className="text-[10px] font-mono tracking-widest text-djcyan-400 font-black uppercase block">
                                DEMO OFICIAL EN 60 SEGUNDOS • CLEANDJMIX PRO
                            </span>
                            <h2 className="text-base sm:text-lg font-black text-white">
                                {currentScene.tag}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Control de Audio Club */}
                        <button
                            type="button"
                            onClick={handleToggleMute}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                                !isMuted 
                                    ? 'bg-djcyan-500/20 text-djcyan-300 border border-djcyan-500/50' 
                                    : 'bg-djzinc-800 text-gray-400 hover:text-white'
                            }`}
                            title={isMuted ? "Activar audio synth club" : "Silenciar audio synth"}
                        >
                            <span>{!isMuted ? '🔊' : '🔇'}</span>
                            <span className="hidden sm:inline">{!isMuted ? 'Audio Club ON' : 'Mudo'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-djzinc-800 hover:bg-djzinc-700 text-gray-400 hover:text-white cursor-pointer transition-colors"
                            title="Cerrar reproductor"
                        >
                            <Icons.Close size={14} className="inline-block align-[-2px]" />
                        </button>
                    </div>
                </div>

                {/* Área de Visualización Cinematográfica */}
                <div className="relative flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-[#0e0e18] via-[#0a0a14] to-[#05050a]">
                    
                    {/* Badge de Fase y Progreso de Escenas */}
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                        <div className="flex items-center gap-1.5">
                            {COMMERCIAL_SCENES.map((sc, sIdx) => {
                                const isActive = currentScene.id === sc.id;
                                const isPassed = currentTime >= sc.endSec;
                                return (
                                    <button
                                        key={sc.id}
                                        type="button"
                                        onClick={() => handleSeek(sc.startSec)}
                                        className={`h-2 rounded-full transition-all cursor-pointer ${
                                            isActive 
                                                ? 'w-10 sm:w-16 bg-gradient-to-r from-djcyan-400 to-djcyan-500 shadow-[0_0_10px_#06b6d4]' 
                                                : isPassed 
                                                    ? 'w-6 bg-djcyan-800' 
                                                    : 'w-4 bg-djzinc-800 hover:bg-gray-600'
                                        }`}
                                        title={`Saltar a: ${sc.badge}`}
                                    />
                                );
                            })}
                        </div>

                        <div className="px-3 py-1 rounded-full bg-djzinc-900 border border-djzinc-800 text-xs font-mono font-bold text-djcyan-300 flex items-center gap-1.5 shadow-sm">
                            <Icons.Clock size={14} className="inline-block align-[-2px]" />
                            <span>{Math.floor(currentTime)}s / 60s</span>
                        </div>
                    </div>

                    {/* Contenido Dinámico de la Escena Activa */}
                    <div className="space-y-4 my-auto">
                        <span className="text-[11px] font-mono font-black uppercase tracking-widest text-djcyan-400 bg-djcyan-950/80 px-3 py-1 rounded-md border border-djcyan-500/40 inline-block shadow-sm">
                            {currentScene.badge}
                        </span>

                        <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase leading-tight max-w-2xl drop-shadow-md">
                            {currentScene.title}
                        </h1>

                        <p className="text-xs sm:text-sm font-mono font-bold text-djcyan-300 flex items-center gap-2">
                            <Icons.Zap size={14} className="inline-block align-[-2px]" />
                            <span>{currentScene.hook}</span>
                        </p>

                        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl">
                            {currentScene.description}
                        </p>

                        {/* Visualizador de Métrica / Gráfico de la Escena */}
                        <div className="p-4 rounded-2xl bg-djzinc-950/90 border border-djzinc-800/90 shadow-xl max-w-xl flex flex-col gap-2.5">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-gray-400 font-bold uppercase tracking-wider">{currentScene.metricLabel}</span>
                                <span className="text-red-400 font-bold">{currentScene.metricVal}</span>
                            </div>

                            {/* Barras de Espectro Animadas Simulando Cabina */}
                            <div className="h-10 flex items-end gap-1.5 px-2 py-1 bg-black/60 rounded-lg border border-djzinc-850">
                                {[40, 65, 85, 95, 80, 60, 45, 90, 75, 50, 30, 20, 15].map((h, i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 rounded-t transition-all duration-150 ${
                                            i < 4 ? 'bg-red-500' : i < 8 ? 'bg-amber-400' : 'bg-djcyan-400'
                                        }`}
                                        style={{ 
                                            height: isPlaying ? `${Math.max(15, Math.min(100, h * (0.6 + Math.random() * 0.5)))}%` : `${h}%` 
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    {currentScene.metricSuccess}
                                </span>
                                <span className="text-gray-500 text-[10px]">VERIFICACIÓN 100% HARDWARE</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Interactivo de 60 Segundos */}
                    <div className="pt-4 mt-6 border-t border-djzinc-800/80 flex flex-col gap-3">
                        <div className="relative w-full h-3 bg-djzinc-950 rounded-full overflow-hidden border border-djzinc-800 cursor-pointer group"
                             onClick={(e) => {
                                 const rect = e.currentTarget.getBoundingClientRect();
                                 const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                                 handleSeek(Math.round(pct * 60));
                             }}
                        >
                            <div 
                                className="h-full bg-gradient-to-r from-djcyan-400 via-emerald-400 to-amber-400 transition-all duration-100 ease-linear shadow-[0_0_15px_#06b6d4]"
                                style={{ width: `${(currentTime / 60) * 100}%` }}
                            />
                        </div>

                        {/* Botones de Control de Reproducción & CTA */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleTogglePlay}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-djcyan-400 to-djcyan-500 hover:from-djcyan-300 hover:to-djcyan-400 text-black font-black text-xs cursor-pointer shadow-lg shadow-djcyan-500/30 flex items-center gap-1.5 active:scale-95 transition-all"
                                >
                                    <span>{isFinished ? '🔄' : isPlaying ? '⏸' : '▶'}</span>
                                    <span>{isFinished ? 'Repetir Teaser' : isPlaying ? 'Pausar' : 'Reanudar'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleSeek(0)}
                                    className="px-3 py-2 rounded-xl bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 font-bold text-xs cursor-pointer"
                                    title="Volver al inicio (00:00)"
                                >
                                    ⏮ 00s
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-black text-xs cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                                >
                                    <Icons.Headphones size={14} className="inline-block align-[-2px]" /> Entrar a la Aplicación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Modal 2: Tour Interactivo Spotlight con Overlay Alpha y Tooltips Paso a Paso
const SpotlightTourOverlay = ({ isOpen, onClose, activeTab, setActiveTab, onOpenTeaser }) => {
    const [stepIdx, setStepIdx] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const curStep = TOUR_STEPS[stepIdx];
    const isLast = stepIdx === TOUR_STEPS.length - 1;

    // Sincronizar pestaña activa de acuerdo al paso
    useEffect(() => {
        if (!isOpen || !curStep) return;
        if (curStep.tab && activeTab !== curStep.tab && setActiveTab) {
            setActiveTab(curStep.tab);
        }
    }, [stepIdx, isOpen]);

    // Recalcular rect del elemento objetivo en el DOM
    const updateTargetRect = () => {
        if (!curStep) return;
        const el = document.querySelector(`[data-tour="${curStep.target}"]`);
        if (el) {
            const r = el.getBoundingClientRect();
            setTargetRect({
                x: Math.max(8, r.left),
                y: Math.max(8, r.top),
                w: r.width,
                h: r.height
            });
        } else {
            setTargetRect(null);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        updateTargetRect();
        const t1 = setTimeout(updateTargetRect, 80);
        const t2 = setTimeout(updateTargetRect, 250);
        const t3 = setTimeout(updateTargetRect, 600);

        window.addEventListener('resize', updateTargetRect);
        window.addEventListener('scroll', updateTargetRect, true);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            window.removeEventListener('resize', updateTargetRect);
            window.removeEventListener('scroll', updateTargetRect, true);
        };
    }, [stepIdx, isOpen, activeTab]);

    if (!isOpen) return null;

    const handleFinish = () => {
        if (dontShowAgain) {
            try {
                localStorage.setItem('cleandjmix_tutorial_completed', 'true');
            } catch (e) {}
        }
        onClose();
    };

    // Posicionamiento inteligente del tooltip
    let tooltipStyle = {};
    if (targetRect) {
        const spaceBelow = window.innerHeight - (targetRect.y + targetRect.h);
        const spaceAbove = targetRect.y;
        const placeBelow = spaceBelow >= 260 || spaceBelow >= spaceAbove;

        const top = placeBelow 
            ? Math.min(window.innerHeight - 300, targetRect.y + targetRect.h + 16)
            : Math.max(20, targetRect.y - 300);

        const left = Math.max(16, Math.min(window.innerWidth - 400, targetRect.x + (targetRect.w / 2) - 190));

        tooltipStyle = {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            maxWidth: '390px',
            width: 'calc(100vw - 32px)',
            zIndex: 9999
        };
    } else {
        tooltipStyle = {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '420px',
            width: 'calc(100vw - 32px)',
            zIndex: 9999
        };
    }

    return (
        <div className="fixed inset-0 z-[9990] animate-fadeIn">
            {/* Máscara Alpha SVG con Cutout Rectangular Iluminando el Elemento Real */}
            <svg className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 9991 }}>
                <defs>
                    <mask id="tour-spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {targetRect && (
                            <rect 
                                x={targetRect.x - 6} 
                                y={targetRect.y - 6} 
                                width={targetRect.w + 12} 
                                height={targetRect.h + 12} 
                                rx="14" 
                                fill="black" 
                            />
                        )}
                    </mask>
                </defs>
                <rect 
                    x="0" 
                    y="0" 
                    width="100%" 
                    height="100%" 
                    fill="rgba(0, 0, 0, 0.85)" 
                    mask="url(#tour-spotlight-mask)" 
                />
            </svg>

            {/* Marco Fluorescente Pulsante sobre el Elemento Objetivo */}
            {targetRect && (
                <div 
                    style={{
                        position: 'fixed',
                        left: targetRect.x - 6,
                        top: targetRect.y - 6,
                        width: targetRect.w + 12,
                        height: targetRect.h + 12,
                        borderRadius: '14px',
                        border: '2px solid #06b6d4',
                        boxShadow: '0 0 35px rgba(6, 182, 212, 0.85), inset 0 0 15px rgba(6, 182, 212, 0.4)',
                        pointerEvents: 'none',
                        zIndex: 9992,
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    className="animate-pulse"
                />
            )}

            {/* Tooltip Card Flotante Directo */}
            <div 
                style={tooltipStyle}
                className="bg-[#0b0c14] border border-djcyan-500/60 shadow-[0_0_50px_rgba(6,182,212,0.35)] rounded-2xl p-5 text-gray-200 flex flex-col gap-3.5 animate-fadeIn"
            >
                {/* Header Tooltip */}
                <div className="flex items-center justify-between border-b border-djzinc-800 pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{curStep.icon}</span>
                        <div>
                            <span className="text-[10px] font-mono tracking-widest text-djcyan-400 font-black uppercase">
                                {curStep.badge}
                            </span>
                            <h3 className="text-sm font-black text-white">{curStep.title}</h3>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={handleFinish} 
                        className="text-gray-400 hover:text-white text-xs font-mono cursor-pointer p-1"
                        title="Salir del tour"
                    >
                        <Icons.Close size={14} className="inline-block align-[-2px]" />
                    </button>
                </div>

                {/* Explicación Táctica */}
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    {curStep.description}
                </p>

                {/* Tip de Cabina */}
                <div className="p-2.5 bg-djzinc-950 rounded-xl border border-djzinc-800/90 text-xs text-djcyan-300 font-mono flex items-start gap-2 shadow-inner">
                    <Icons.Bulb size={14} className="inline-block align-[-2px] text-djcyan-400 font-bold shrink-0" />
                    <span>{curStep.tip}</span>
                </div>

                {/* Dots de Progreso */}
                <div className="flex items-center justify-center gap-2 pt-1">
                    {TOUR_STEPS.map((s, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setStepIdx(idx)}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                idx === stepIdx ? 'w-6 bg-djcyan-400' : 'w-2 bg-djzinc-700 hover:bg-gray-400'
                            }`}
                        />
                    ))}
                </div>

                {/* Footer del Tooltip con Botones */}
                <div className="flex items-center justify-between pt-2 border-t border-djzinc-800">
                    <button
                        type="button"
                        onClick={() => {
                            if (onOpenTeaser) onOpenTeaser();
                        }}
                        className="text-[11px] font-mono text-gray-400 hover:text-djcyan-300 cursor-pointer flex items-center gap-1"
                        title="Ver vídeo teaser comercial de 60 segundos"
                    >
                        <Icons.Film size={14} className="inline-block align-[-2px]" />
                        <span>Ver Teaser 60s</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {stepIdx > 0 && (
                            <button
                                type="button"
                                onClick={() => setStepIdx(prev => prev - 1)}
                                className="px-3 py-1.5 rounded-lg bg-djzinc-800 hover:bg-djzinc-700 text-gray-200 font-bold text-xs cursor-pointer"
                            >
                                Anterior
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                if (isLast) {
                                    handleFinish();
                                } else {
                                    setStepIdx(prev => prev + 1);
                                }
                            }}
                            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-djcyan-400 to-djcyan-500 hover:from-djcyan-300 hover:to-djcyan-400 text-black font-black text-xs cursor-pointer shadow-md shadow-djcyan-500/30 transition-transform active:scale-95"
                        >
                            {isLast ? "✓ Finalizar Tour" : "Siguiente →"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Modal 3: Launcher / Selector Inicial de Onboarding (Teaser vs Tour)
const TutorialLauncherModal = ({ isOpen, onClose, onLaunchTeaser, onLaunchTour }) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    if (!isOpen) return null;

    const handleSkip = () => {
        if (dontShowAgain) {
            try {
                localStorage.setItem('cleandjmix_tutorial_completed', 'true');
            } catch (e) {}
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9990] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#0c0d16] border border-djcyan-500/50 rounded-2xl max-w-lg w-full p-6 shadow-[0_0_60px_rgba(6,182,212,0.3)] flex flex-col gap-5 text-gray-200">
                <div className="flex items-center justify-between border-b border-djzinc-800 pb-3">
                    <div className="flex items-center gap-2.5">
                        <Icons.Sliders size={14} className="inline-block align-[-2px]" />
                        <div>
                            <span className="text-[10px] font-mono tracking-widest text-djcyan-400 font-black uppercase">
                                BIENVENIDO A CLEANDJMIX PRO
                            </span>
                            <h2 className="text-lg font-black text-white">¿Cómo prefieres descubrir la cabina?</h2>
                        </div>
                    </div>
                    <button onClick={handleSkip} className="text-gray-400 hover:text-white cursor-pointer p-1"><Icons.Close size={14} className="inline-block align-[-2px]" /></button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Opción 1: Teaser 60s */}
                    <div 
                        onClick={onLaunchTeaser}
                        className="p-4 rounded-xl bg-gradient-to-b from-[#141524] to-[#0c0d16] border border-djcyan-500/40 hover:border-djcyan-400 cursor-pointer transition-all hover:scale-[1.02] shadow-lg flex flex-col justify-between group"
                    >
                        <div className="space-y-2">
                            <Icons.Film size={14} className="inline-block align-[-2px] block group-hover:scale-110 transition-transform" />
                            <h3 className="text-sm font-black text-white uppercase group-hover:text-djcyan-300">
                                Vídeo Teaser (60s)
                            </h3>
                            <p className="text-xs text-gray-400 leading-relaxed font-sans">
                                Demostración rápida con audio synth club en 128 BPM, visualizador FFT y las 5 funciones clave en 1 minuto.
                            </p>
                        </div>
                        <span className="mt-3 text-[11px] font-mono font-bold text-djcyan-400 flex items-center gap-1">
                            <Icons.Play size={14} className="inline-block align-[-2px]" /> Ver Vídeo 60s →
                        </span>
                    </div>

                    {/* Opción 2: Tour Guiado Spotlight */}
                    <div 
                        onClick={onLaunchTour}
                        className="p-4 rounded-xl bg-gradient-to-b from-[#141524] to-[#0c0d16] border border-djzinc-750 hover:border-djcyan-400 cursor-pointer transition-all hover:scale-[1.02] shadow-lg flex flex-col justify-between group"
                    >
                        <div className="space-y-2">
                            <Icons.Target size={14} className="inline-block align-[-2px] block group-hover:scale-110 transition-transform" />
                            <h3 className="text-sm font-black text-white uppercase group-hover:text-djcyan-300">
                                Tour en Cabina (Spotlight)
                            </h3>
                            <p className="text-xs text-gray-400 leading-relaxed font-sans">
                                Fondo alpha con tooltips interactivos directamente sobre tus controles, Hot Cues y Set-Builder paso a paso.
                            </p>
                        </div>
                        <span className="mt-3 text-[11px] font-mono font-bold text-djcyan-400 flex items-center gap-1">
                            <Icons.Search size={14} className="inline-block align-[-2px]" /> Iniciar Tour Guiado →
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-djzinc-800 text-xs text-gray-400">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                            type="checkbox" 
                            checked={dontShowAgain} 
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                            className="rounded bg-djzinc-900 border-djzinc-700 text-djcyan-500 focus:ring-0 cursor-pointer"
                        />
                        <span>No volver a mostrar automáticamente</span>
                    </label>

                    <button 
                        type="button" 
                        onClick={handleSkip} 
                        className="text-gray-400 hover:text-white font-mono text-xs cursor-pointer"
                    >
                        Entrar directamente a la aplicación
                    </button>
                </div>
            </div>
        </div>
    );
};

// =======================================================
// SUB-COMPONENTE DECK HEADS-UP DISPLAY (CABINA PRO)
// =======================================================
const CopilotDeckCard = ({ deck, side, isMaster, antiMuddy = null, partnerDeck = null, onSetMaster = null, onTogglePlay = null, onCue = null }) => {
    if (!deck) return null;
    return (
        <div className={`p-3.5 sm:p-4 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${
            isMaster 
            ? 'bg-gradient-to-b from-[#0c0d1c] to-[#06060c] border-djcyan-500/70 shadow-[0_0_25px_rgba(6,182,212,0.2)]' 
            : 'bg-[#07070f] border-zinc-800 hover:border-zinc-700'
        }`}>
            {/* Cabecera del Deck */}
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                    <span className="font-orbitron font-black text-sm sm:text-base text-zinc-400">DECK {side}</span>
                    <button
                        type="button"
                        onClick={() => onSetMaster && onSetMaster(side)}
                        className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-black uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                            isMaster ? 'bg-djcyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                        }`}
                        title={`Haz clic para establecer DECK ${side} como MASTER (o pulsa 'M')`}
                    >
                        {isMaster ? '🔊 MASTER (ON AIR)' : '🎧 EN CUE (PREPARADO)'}
                    </button>

                    <div 
                        className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 select-none ${
                            deck.is_playing 
                                ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                                : 'bg-zinc-900 border border-zinc-700 text-zinc-400'
                        }`}
                        title={deck.is_playing ? `Deck ${side} en reproducción (EN VIVO)` : `Deck ${side} en CUE / Pausa`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${deck.is_playing ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`}></span>
                        <span>{deck.is_playing ? 'EN VIVO' : 'CUE'}</span>
                    </div>

                    {(deck.mood || deck.phase) && (
                        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/40 text-[9px] font-mono font-bold text-purple-300 uppercase">
                            <Icons.Sparkles size={12} className="inline-block align-[-1px] mr-1" /> {deck.mood || deck.phase}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500 uppercase">
                    {deck.format && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700/60 text-[9px] font-bold text-zinc-300">
                            {deck.format}
                        </span>
                    )}
                    <span className="hidden sm:inline">{deck.is_audited ? '✓ DSP BEATWAVE' : 'DEFAULT DSP'}</span>
                </div>
            </div>

            {/* SECCIÓN PISTA EN 2 COLUMNAS (IZQUIERDA: COVER+INFO | DERECHA: CAMELOT+BPM+ENERGÍA+MOOD) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2.5 p-2.5 rounded-2xl bg-black/40 border border-zinc-800/80 items-stretch">
                {/* COLUMNA IZQUIERDA: Carátula 1:1 Cuadrada Full Height + Título + Artista + Taxonomía */}
                <div className="flex items-stretch gap-3 min-w-0">
                    <div 
                        className="relative rounded-xl overflow-hidden shrink-0 border border-zinc-700/70 shadow-md bg-black group flex-none"
                        style={{ width: '68px', height: '68px', minWidth: '68px', minHeight: '68px', aspectRatio: '1 / 1' }}
                    >
                        <img 
                            src={getValidCover(deck.cover)} 
                            alt="Carátula" 
                            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                        {deck.duration && (
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-[8px] font-mono font-bold text-zinc-300">
                                {deck.duration}
                            </span>
                        )}
                        {deck.year && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[8px] font-mono text-zinc-400">
                                {deck.year}
                            </span>
                        )}
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <h2 className="font-syne font-bold text-xs sm:text-sm text-white tracking-tight leading-tight truncate" title={deck.title}>
                            {deck.title}
                        </h2>
                        <p className="font-syne font-bold text-xs text-zinc-400 mt-0.5 truncate" title={deck.artist}>
                            {deck.artist}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {deck.genre && (
                                <span className="px-1.5 py-0.2 rounded bg-djcyan-950/70 border border-djcyan-500/40 text-[9px] font-mono font-bold text-djcyan-300 truncate">
                                    {deck.genre}
                                </span>
                            )}
                            {deck.subgenre && (
                                <span className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-700/60 text-[9px] font-mono text-zinc-400 truncate">
                                    {deck.subgenre}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: TONO Y TEMPO APILADOS CON MOOD DEBAJO + ENERGÍA, INTENSIDAD, DANZABILIDAD Y POSITIVIDAD */}
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 border-t md:border-t-0 md:border-l border-zinc-800/80 pt-2 md:pt-0 md:pl-3">
                    {/* BLOQUE TONO, TEMPO Y MOOD DEBAJO DE LOS BPM */}
                    <div className="flex flex-col gap-1 p-1 rounded-xl bg-zinc-950/90 border border-zinc-800 shrink-0 min-w-[100px]">
                        {/* Fila Tono */}
                        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-zinc-900/80">
                            <div 
                                className="w-5 h-4 rounded text-[9px] font-orbitron font-black text-black flex items-center justify-center shrink-0 shadow-sm"
                                style={{ backgroundColor: deck.camelot_color || '#ec4899' }}
                            >
                                {deck.camelot || '10A'}
                            </div>
                            <span className="text-[7px] font-mono uppercase text-zinc-500 font-bold">TONO</span>
                            <span className="font-syne font-bold text-[10px] text-white truncate">{deck.raw_key || deck.camelot}</span>
                        </div>

                        {/* Fila Tempo (BPM) */}
                        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-zinc-900/80">
                            <span className="text-[7px] font-mono uppercase text-zinc-500 font-bold">TEMPO</span>
                            <span className="font-orbitron font-black text-[10px] text-white">
                                {deck.bpm ? Number(deck.bpm).toFixed(2) : '130.00'}
                            </span>
                            <span className="text-[7px] text-zinc-400 font-mono">BPM</span>
                        </div>

                        {/* Cuadro morado con el Mood ubicado debajo de los BPM */}
                        <div className="px-1.5 py-0.5 rounded-lg bg-purple-950/70 border border-purple-500/40 text-[8px] font-mono font-bold text-purple-300 truncate max-w-full text-center" title={deck.mood || deck.phase || 'Peak Time Climax'}>
                            ✨ {deck.mood || deck.phase || 'Peak Time Climax'}
                        </div>
                    </div>

                    {/* COLUMNA PSICOMETRÍA: ENERGÍA, INTENSIDAD, DANZABILIDAD Y POSITIVIDAD APILADAS */}
                    <div className="flex-1 min-w-[130px] flex flex-col justify-center gap-1">
                        {/* Fila 1: Energía */}
                        <div>
                            <div className="flex items-center justify-between text-[8px] font-mono mb-0.5">
                                <span className="text-amber-400 font-bold flex items-center gap-1">
                                    <Icons.Zap size={9} /> ENERGÍA
                                </span>
                                <span className="text-amber-400 font-bold">{deck.energy || 90}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden flex">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" style={{ width: `${deck.energy || 90}%` }}></div>
                            </div>
                        </div>

                        {/* Fila 2: Intensidad */}
                        <div>
                            <div className="flex items-center justify-between text-[8px] font-mono mb-0.5">
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <Icons.Activity size={9} /> INTENSIDAD
                                </span>
                                <span className="text-emerald-400 font-bold">{deck.arousal || Math.round((deck.energy || 90) * 0.95)}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden flex">
                                <div className="h-full bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.8)]" style={{ width: `${deck.arousal || Math.round((deck.energy || 90) * 0.95)}%` }}></div>
                            </div>
                        </div>

                        {/* Fila 3: Danzabilidad */}
                        <div>
                            <div className="flex items-center justify-between text-[8px] font-mono mb-0.5">
                                <span className="text-purple-300 font-bold flex items-center gap-1">
                                    <Icons.Sliders size={9} /> DANZABILIDAD
                                </span>
                                <span className="text-purple-300 font-bold">{deck.danceability || 85}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden flex">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_6px_rgba(168,85,247,0.8)]" style={{ width: `${deck.danceability || 85}%` }}></div>
                            </div>
                        </div>

                        {/* Fila 4: Positividad */}
                        <div>
                            <div className="flex items-center justify-between text-[8px] font-mono mb-0.5">
                                <span className="text-djcyan-400 font-bold flex items-center gap-1">
                                    <Icons.Sparkles size={9} /> POSITIVIDAD
                                </span>
                                <span className="text-djcyan-400 font-bold">{deck.valence != null ? deck.valence : (side === '1' || side === 'A' ? 55 : 62)}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden flex">
                                <div className="h-full bg-djcyan-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.8)]" style={{ width: `${deck.valence != null ? deck.valence : (side === '1' || side === 'A' ? 55 : 62)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tira Visual de 8 Hot Cues de Cabina */}
            <div className="mb-2.5 p-2 rounded-2xl bg-black/60 border border-zinc-800/80">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono uppercase text-zinc-400 tracking-wider font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-djcyan-400"></span> 8 HOT CUES DE CABINA
                    </span>
                    <span className="text-[8px] font-mono text-zinc-500">Puntos de Salto & Estructura</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                    {(deck.cues || [
                        { id: 1, name: "Downbeat", color: "#ef4444", time: "00:00" },
                        { id: 2, name: "Intro", color: "#f97316", time: "01:04" },
                        { id: 3, name: "Bass In", color: "#eab308", time: "02:08" },
                        { id: 4, name: "MAIN DROP", color: "#10b981", time: "03:12" },
                        { id: 5, name: "Break", color: "#06b6d4", time: "04:16" },
                        { id: 6, name: "Climax", color: "#22d3ee", time: "05:04" },
                        { id: 7, name: "Outro 32b", color: "#8b5cf6", time: "06:08" },
                        { id: 8, name: "Cut / Fade", color: "#ec4899", time: "07:15" },
                    ]).map((cue, cIdx) => (
                        <div 
                            key={cue.id || cIdx}
                            className="p-1 rounded-xl border flex flex-col justify-between transition-all bg-zinc-950/80 hover:bg-zinc-900 cursor-default"
                            style={{ borderColor: `${cue.color || '#06b6d4'}55` }}
                        >
                            <div className="flex items-center justify-between">
                                <span 
                                    className="w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-black text-black font-mono shadow-sm"
                                    style={{ backgroundColor: cue.color || '#06b6d4' }}
                                >
                                    {cue.id || (cIdx + 1)}
                                </span>
                                <span className="text-[7px] font-mono text-zinc-500">{cue.time || '--:--'}</span>
                            </div>
                            <div className="text-[7px] font-syne font-bold text-zinc-200 truncate mt-0.5" title={cue.name}>
                                {cue.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* WAVEFORM SERATO EN TIEMPO REAL CON ZOOM Y AYUDAS TÁCTICAS */}
            <div className="mb-2">
                <CopilotSeratoWaveform 
                    deck={deck} 
                    side={side} 
                    antiMuddy={antiMuddy} 
                    partnerDeck={partnerDeck} 
                />
            </div>

            {/* Densidad Sub-Graves y Espectro */}
            <div className="space-y-1 pt-1.5 border-t border-zinc-800/60 font-mono text-[11px]">
                <div className="flex items-center justify-between text-zinc-400">
                    <span>Densidad Sub-Graves (Sub-Bass)</span>
                    <span className={deck.low_ratio >= 44 ? 'text-red-400 font-bold' : 'text-zinc-200'}>{deck.low_ratio}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden flex">
                    <div className={`h-full transition-all duration-300 ${deck.low_ratio >= 44 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-djcyan-400'}`} style={{ width: `${Math.min(100, deck.low_ratio * 1.5)}%` }}></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                    <span>Medios: {deck.mid_ratio}%</span>
                    <span>Agudos: {deck.high_ratio}%</span>
                    <span>LUFS: <strong className="text-zinc-300">{deck.lufs} dB</strong></span>
                </div>
            </div>

            {/* Comentario Táctico DJ */}
            <div className="mt-2 p-2 rounded-xl bg-black/50 border border-zinc-800/80 flex items-start gap-2">
                <Icons.MessageSquare size={13} className="inline-block text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                    <div className="text-[8px] font-mono uppercase text-zinc-500 tracking-wider">Comentario Táctico DJ (Tag ID3)</div>
                    <div className="font-mono text-[11px] text-zinc-200 truncate" title={deck.comment || deck.tactical_comment || `[${deck.bpm ? Number(deck.bpm).toFixed(1) : '--'} BPM | ${deck.camelot}] Intro 32b • Drop contundente • Outro 64b`}>
                        {deck.comment || deck.tactical_comment || `[${deck.bpm ? Number(deck.bpm).toFixed(1) : '--'} BPM | ${deck.camelot}] Intro 32b • Drop contundente • Outro 64b`}
                    </div>
                </div>
            </div>
        </div>
    );
};


