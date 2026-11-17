const { useState, useEffect, useRef } = React;
import { Icons } from '../shell/icons.jsx';
import { useDrawerResize } from '../shell/hooks.js';

// ─── VISOR DE DETALLE DE BITÁCORA Y REGISTRO TÉCNICO (COLUMNA DERECHA / DRAWER) ────────
export const BitacoraDetailContent = ({ entry, onBack, onClose, onOpenBeatgridStudio, tracks = [] }) => {
    if (!entry) return null;
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const fullText = `=== BITÁCORA BEATWAVE PRO ===
Operación: ${entry.action || '--'}
Categoría: ${entry.category || '--'}
Fecha y Hora: ${entry.fullTimestamp || entry.timestamp || '--'}
Pista / Archivo: ${entry.trackTitle || '--'}
Ruta: ${entry.filePath || '--'}
Estado Anterior: ${entry.detailsBefore || '--'}
Estado Posterior: ${entry.detailsAfter || '--'}
Resultado: ${entry.status || 'OK'}

--- LOG COMPLETO / DETALLES TÉCNICOS ---
${entry.fullLog || entry.detailsAfter || 'Sin información adicional.'}
`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(fullText);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleDownload = () => {
        const fullText = `=== BITÁCORA BEATWAVE PRO ===
Operación: ${entry.action || '--'}
Categoría: ${entry.category || '--'}
Fecha y Hora: ${entry.fullTimestamp || entry.timestamp || '--'}
Pista / Archivo: ${entry.trackTitle || '--'}
Ruta: ${entry.filePath || '--'}
Estado Anterior: ${entry.detailsBefore || '--'}
Estado Posterior: ${entry.detailsAfter || '--'}
Resultado: ${entry.status || 'OK'}

--- LOG COMPLETO / DETALLES TÉCNICOS ---
${entry.fullLog || entry.detailsAfter || 'Sin información adicional.'}
`;
        const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Log_${(entry.action || 'ejecucion').replace(/\s+/g, '_')}_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const hasAudioTarget = !!(entry.filePath || entry.trackTitle || entry.trackId);

    const handleLaunchBeatgridStudio = () => {
        if (onOpenBeatgridStudio) {
            onOpenBeatgridStudio(entry.filePath || entry.trackTitle || entry.trackId);
        }
        if (onClose) onClose();
    };

    return (
        <div className="flex flex-col h-full overflow-hidden select-text font-mono text-gray-200">
            {/* Cabecera del Visor de Detalle */}
            <div className="px-5 py-3.5 border-b border-djzinc-800 bg-[#0e0e18] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-2.5 py-1.5 rounded-lg bg-djzinc-850 hover:bg-cyan-950 text-cyan-400 hover:text-cyan-200 border border-cyan-800/60 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Volver al listado de registros de bitácora"
                        >
                            <span>◀</span>
                            <span>Volver</span>
                        </button>
                    )}
                    <div>
                        <h3 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                            <span>{entry.action || 'Detalle de Ejecución'}</span>
                            <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-600/60 font-bold">
                                {entry.status || 'OK'}
                            </span>
                        </h3>
                        <p className="text-[10px] text-gray-400">
                            {entry.fullTimestamp || entry.timestamp || '--'} • <span className="text-cyan-400 font-bold">{entry.category || 'general'}</span>
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-djzinc-850 hover:bg-djzinc-750 text-gray-400 hover:text-white flex items-center justify-center font-mono text-sm border border-djzinc-700 transition-colors cursor-pointer"
                    title="Cerrar (ESC)"
                >
                    <Icons.Close size={15} />
                </button>
            </div>

            {/* Acciones Rápidas */}
            <div className="px-5 py-2.5 bg-[#080912] border-b border-djzinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                    {hasAudioTarget && (
                        <button
                            type="button"
                            onClick={handleLaunchBeatgridStudio}
                            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer transition-all active:scale-95"
                            title="Abrir y calibrar esta pista inmediatamente en el Studio de BeatGrid"
                        >
                            <span>🎛️</span>
                            <span>Abrir en Studio BeatGrid</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="px-2.5 py-1.5 bg-djzinc-850 hover:bg-djzinc-750 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                    >
                        <Icons.Copy size={13} />
                        <span>{copied ? '✓ Copiado' : 'Copiar'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="px-2.5 py-1.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 border border-djzinc-700 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                    >
                        <Icons.Download size={13} />
                        <span>Descargar</span>
                    </button>
                </div>
            </div>

            {/* Contenido / Tarjetas de Información */}
            <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1 custom-scrollbar text-xs">
                {/* Tarjeta Pista & Archivo */}
                <div className="bg-[#06070e] p-3.5 rounded-xl border border-djzinc-800 flex flex-col gap-1.5 shadow-inner">
                    <div className="text-[10px] text-cyan-400 uppercase font-black tracking-wider flex items-center justify-between">
                        <span>Pista / Archivo Afectado</span>
                        {hasAudioTarget && (
                            <span 
                                onClick={handleLaunchBeatgridStudio} 
                                className="text-[10px] text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
                            >
                                Calibrar Grid ➔
                            </span>
                        )}
                    </div>
                    <div className="text-white font-bold text-sm truncate">{entry.trackTitle || '--'}</div>
                    {entry.filePath && (
                        <div className="text-[10.5px] text-cyan-300/90 font-mono break-all bg-djzinc-900/90 p-2.5 rounded-lg border border-djzinc-800">
                            {entry.filePath}
                        </div>
                    )}
                </div>

                {/* Comparación Antes ➔ Después */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-rose-950/20 border border-rose-900/50 p-3 rounded-xl flex flex-col gap-1 shadow-sm">
                        <span className="text-[10px] text-rose-400 uppercase font-black">Estado Anterior</span>
                        <span className="text-rose-200 text-xs font-mono">{entry.detailsBefore || '--'}</span>
                    </div>
                    <div className="bg-emerald-950/20 border border-emerald-900/50 p-3 rounded-xl flex flex-col gap-1 shadow-sm">
                        <span className="text-[10px] text-emerald-400 uppercase font-black">Estado Modificado</span>
                        <span className="text-emerald-200 text-xs font-mono font-bold">{entry.detailsAfter || '--'}</span>
                    </div>
                </div>

                {/* Log Técnico Detallado */}
                <div className="flex flex-col gap-1.5 flex-1 min-h-[220px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                            Registro Técnico Detallado (Log de Ejecución)
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">Monospace Raw</span>
                    </div>
                    <div className="bg-[#05060b] border border-cyan-900/50 rounded-xl p-3.5 text-[11px] text-cyan-200/95 font-mono whitespace-pre-wrap break-all flex-1 overflow-y-auto custom-scrollbar leading-relaxed shadow-inner">
                        {entry.fullLog || entry.detailsAfter || 'Sin información adicional.'}
                    </div>
                </div>
            </div>

            {/* Pie del Visor */}
            <div className="px-5 py-3 border-t border-djzinc-800 bg-[#0a0a14] flex items-center justify-between shrink-0">
                {onBack ? (
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-3.5 py-1.5 rounded-lg bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 font-bold text-xs cursor-pointer transition-colors"
                    >
                        ◀ Volver al Listado
                    </button>
                ) : <div />}

                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-lg bg-djzinc-850 hover:bg-djzinc-750 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                    Cerrar (ESC)
                </button>
            </div>
        </div>
    );
};

// ─── MODAL/DRAWER DE INSPECCIÓN DETALLADA DE LOG (COLUMNA DERECHA) ──────────
export const BitacoraDetailModal = ({ entry, onClose, onOpenBeatgridStudio, tracks = [] }) => {
    if (!entry) return null;
    const { width: drawerWidth, onPointerDown: onResizeDown, resetWidth: onResetWidth } = useDrawerResize('bw_bitacora_detail_drawer_width', 540);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 overflow-hidden select-none pointer-events-none" style={{ zIndex: 100000 }}>
            <div 
                className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-fadeIn pointer-events-auto"
                style={{ zIndex: 100000 }}
                onClick={onClose}
            />
            <aside 
                style={{ width: '100%', maxWidth: `${drawerWidth}px`, zIndex: 100001 }}
                className="fixed top-0 bottom-0 right-0 h-full bg-[#0a0b14] border-l-4 border-l-cyan-400 shadow-[-25px_0_60px_rgba(0,0,0,1)] flex flex-col font-sans text-gray-200 animate-slideInRight pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Manija táctil de redimensión */}
                <div 
                    onPointerDown={onResizeDown}
                    onDoubleClick={onResetWidth}
                    className="hidden md:flex absolute top-0 bottom-0 -left-2 w-4 cursor-ew-resize items-center justify-center z-50 group select-none hover:bg-cyan-500/10 transition-colors"
                    title="Arrastra para redimensionar (Doble clic para restablecer a 540px)"
                >
                    <div className="w-1 h-12 rounded-full bg-zinc-600 group-hover:bg-cyan-400 group-hover:scale-y-125 transition-all shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                </div>
                <BitacoraDetailContent
                    entry={entry}
                    onClose={onClose}
                    onOpenBeatgridStudio={onOpenBeatgridStudio}
                    tracks={tracks}
                />
            </aside>
        </div>,
        document.body
    );
};

// Función global de registro en bitácora para auditorías, inyecciones y reparaciones
const registrarEnBitacora = (entry) => {
    try {
        const bEntry = {
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            fullTimestamp: new Date().toLocaleString(),
            action: entry.action || 'Operación DSP',
            category: entry.category || 'audit',
            trackTitle: entry.trackTitle || 'Biblioteca',
            filePath: entry.filePath || '',
            detailsBefore: entry.detailsBefore || '--',
            detailsAfter: entry.detailsAfter || '--',
            status: entry.status || '✓ Completado',
            fullLog: entry.fullLog || entry.log || entry.detailsAfter || ''
        };
        const raw = localStorage.getItem('bw_audit_bitacora');
        let cur = raw ? JSON.parse(raw) : [];
        const nextB = [bEntry, ...cur].slice(0, 500);
        localStorage.setItem('bw_audit_bitacora', JSON.stringify(nextB));
        window.dispatchEvent(new CustomEvent('bw_bitacora_updated', { detail: nextB }));
    } catch (e) {
        console.error("Error registrando en bitacora:", e);
    }
};
if (typeof window !== 'undefined') {
    window.registrarEnBitacora = registrarEnBitacora;
}

// ─── CUADERNO DE BITÁCORA Y REGISTRO DE CAMBIOS CON EXPORTACIÓN EXCEL (DRAWER LATERAL DERECHO) ────────
export const BitacoraModal = ({ isOpen, onClose, entries = [], onClearEntries, onOpenBeatgridStudio, tracks = [] }) => {
    if (!isOpen) return null;

    const { width: drawerWidth, onPointerDown: onResizeDown, resetWidth: onResetWidth } = useDrawerResize('bw_bitacora_drawer_width', 540);

    const [filterCategory, setFilterCategory] = useState('all');
    const [selectedIds, setSelectedIds] = useState(() => new Set(entries.map(e => e.id)));
    const [searchTerm, setSearchTerm] = useState('');
    const [detailEntry, setDetailEntry] = useState(null);

    const filteredEntries = entries.filter(e => {
        const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
        const matchesSearch = !searchTerm || 
            (e.trackTitle && e.trackTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (e.action && e.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (e.detailsAfter && e.detailsAfter.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const isAllSelected = filteredEntries.length > 0 && selectedIds.size === filteredEntries.length;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredEntries.map(e => e.id)));
        }
    };

    const toggleSelectRow = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Exportación a Excel (.xlsx XML compatible nativo con Microsoft Excel y Apple Numbers)
    const exportToExcel = () => {
        const selectedList = filteredEntries.filter(e => selectedIds.has(e.id));
        if (selectedList.length === 0) {
            alert('Por favor selecciona al menos una entrada para exportar.');
            return;
        }

        let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0B132B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Success">
   <Font ss:Color="#006600" ss:Bold="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Bitacora BeatWave Pro">
  <Table>
   <Column ss:Width="110"/>
   <Column ss:Width="150"/>
   <Column ss:Width="220"/>
   <Column ss:Width="280"/>
   <Column ss:Width="200"/>
   <Column ss:Width="220"/>
   <Column ss:Width="110"/>
   <Row ss:StyleID="Header" ss:Height="24">
    <Cell><Data ss:Type="String">Fecha y Hora</Data></Cell>
    <Cell><Data ss:Type="String">Proceso / Acción</Data></Cell>
    <Cell><Data ss:Type="String">Pista / Archivo</Data></Cell>
    <Cell><Data ss:Type="String">Ruta en Disco</Data></Cell>
    <Cell><Data ss:Type="String">Estado Anterior</Data></Cell>
    <Cell><Data ss:Type="String">Estado Modificado</Data></Cell>
    <Cell><Data ss:Type="String">Resultado</Data></Cell>
   </Row>`;

        selectedList.forEach(item => {
            xml += `
   <Row ss:Height="20">
    <Cell><Data ss:Type="String">${item.timestamp || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${item.action || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${(item.trackTitle || '').replace(/[<&>]/g, '')}</Data></Cell>
    <Cell><Data ss:Type="String">${(item.filePath || '').replace(/[<&>]/g, '')}</Data></Cell>
    <Cell><Data ss:Type="String">${(item.detailsBefore || '').replace(/[<&>]/g, '')}</Data></Cell>
    <Cell><Data ss:Type="String">${(item.detailsAfter || '').replace(/[<&>]/g, '')}</Data></Cell>
    <Cell ss:StyleID="Success"><Data ss:Type="String">${item.status || 'OK'}</Data></Cell>
   </Row>`;
        });

        xml += `
  </Table>
 </Worksheet>
</Workbook>`;

        const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const nowStr = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `BeatWave_Pro_Bitacora_${nowStr}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 overflow-hidden select-none pointer-events-none" style={{ zIndex: 99998 }}>
            <div 
                className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-fadeIn pointer-events-auto"
                style={{ zIndex: 99998 }}
                onClick={onClose}
            />
            <aside 
                style={{ width: '100%', maxWidth: `${drawerWidth}px`, zIndex: 99999 }}
                className="fixed top-0 bottom-0 right-0 h-full bg-[#0a0b14] border-l-4 border-l-cyan-400 shadow-[-25px_0_60px_rgba(0,0,0,1)] flex flex-col font-sans text-gray-200 animate-slideInRight pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Manija táctil de redimensión (Drag to Resize) para Desktop */}
                <div 
                    onPointerDown={onResizeDown}
                    onDoubleClick={onResetWidth}
                    className="hidden md:flex absolute top-0 bottom-0 -left-2 w-4 cursor-ew-resize items-center justify-center z-50 group select-none hover:bg-cyan-500/10 transition-colors"
                    title="Arrastra para redimensionar (Doble clic para restablecer a 540px)"
                >
                    <div className="w-1 h-12 rounded-full bg-zinc-600 group-hover:bg-cyan-400 group-hover:scale-y-125 transition-all shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                </div>

                {detailEntry ? (
                    <BitacoraDetailContent
                        entry={detailEntry}
                        onBack={() => setDetailEntry(null)}
                        onClose={onClose}
                        onOpenBeatgridStudio={onOpenBeatgridStudio}
                        tracks={tracks}
                    />
                ) : (
                    <>
                        {/* Cabecera de la Bitácora */}
                <div className="px-5 py-3.5 border-b border-djzinc-800 bg-[#0e0e18] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-djcyan-950/80 border border-djcyan-500/50 flex items-center justify-center text-djcyan-400 text-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0 font-black">
                            <Icons.Notebook size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs sm:text-sm font-mono font-black uppercase text-white tracking-wider flex items-center gap-2">
                                    <span>CUADERNO DE BITÁCORA</span>
                                    <span className="text-[9px] bg-djcyan-950 text-djcyan-300 border border-djcyan-600/60 px-2 py-0.5 rounded-full font-bold">
                                        {entries.length} REGISTROS
                                    </span>
                                </h3>
                            </div>
                            <p className="text-[10.5px] text-gray-400 font-mono truncate max-w-[280px]">
                                HISTORIAL DSP, TAGS & OPERACIONES
                            </p>
                        </div>
                    </div>

                    <button 
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-djzinc-850 hover:bg-djzinc-750 text-gray-400 hover:text-white flex items-center justify-center font-mono text-sm border border-djzinc-700 transition-colors cursor-pointer"
                        title="Cerrar (ESC)"
                    >
                        <Icons.Close size={14} className="inline-block align-[-2px]" />
                    </button>
                </div>

                {/* Barra de Filtros, Búsqueda y Botón de Descarga Excel */}
                <div className="px-4 py-2.5 bg-[#080810] border-b border-djzinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0">
                    {/* Filtros de Categoría */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'audit', label: 'Auditoría DSP' },
                            { id: 'beatgrid', label: 'BeatGrid Serato' },
                            { id: 'cues', label: 'Hot Cues' },
                            { id: 'download', label: 'FLAC' },
                            { id: 'crates', label: 'Crates' },
                        ].map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setFilterCategory(cat.id)}
                                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                                    filterCategory === cat.id
                                        ? 'bg-djcyan-500 text-black font-black shadow-sm'
                                        : 'bg-djzinc-900 text-gray-400 hover:text-white border border-djzinc-800'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Acciones: Seleccionar Todo & Exportar Excel */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Buscar en bitácora..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-2.5 py-1 rounded-lg bg-djzinc-900 border border-djzinc-800 text-white placeholder-gray-500 text-[11px] outline-none focus:border-djcyan-400 w-32 sm:w-40"
                        />

                        <button
                            type="button"
                            onClick={exportToExcel}
                            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-black text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400/60 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                            title="Descargar hoja de cálculo Excel (.xls)"
                        >
                            <Icons.Excel size={13} className="inline-block align-[-2px]" />
                            <span>Excel ({selectedIds.size})</span>
                        </button>
                    </div>
                </div>

                {/* Tabla de Bitácora */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead className="sticky top-0 bg-[#0d0e1c] border-b border-djzinc-800 text-[10px] uppercase text-gray-400 font-bold z-10">
                            <tr>
                                <th className="p-2 w-8 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        className="w-3.5 h-3.5 accent-djcyan-400 rounded cursor-pointer"
                                        title="Seleccionar o deseleccionar todas las filas"
                                    />
                                </th>
                                <th className="p-2 w-20">Hora</th>
                                <th className="p-2 w-28">Operación</th>
                                <th className="p-2">Pista & Detalle (Antes ➔ Después)</th>
                                <th className="p-2 w-16 text-center">Estado</th>
                                <th className="p-2 w-20 text-center">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-djzinc-850/60 text-[11px]">
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        No hay registros que coincidan con el filtro seleccionado.
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((row) => {
                                    const isSelected = selectedIds.has(row.id);
                                    return (
                                        <tr 
                                            key={row.id}
                                            className={`transition-colors cursor-pointer ${
                                                isSelected ? 'bg-djcyan-950/20 hover:bg-djcyan-950/30' : 'hover:bg-djzinc-900/40'
                                            }`}
                                            onClick={() => setDetailEntry(row)}
                                        >
                                            <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input 
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectRow(row.id)}
                                                    className="w-3.5 h-3.5 accent-djcyan-400 rounded cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-2 text-gray-400 whitespace-nowrap text-[10px]">{row.timestamp}</td>
                                            <td className="p-2">
                                                <span className="px-1.5 py-0.5 rounded bg-djzinc-900 border border-djzinc-750 text-djcyan-300 font-bold text-[9.5px]">
                                                    {row.action}
                                                </span>
                                            </td>
                                            <td className="p-2">
                                                <div className="font-bold text-white truncate max-w-[220px]" title={row.filePath || row.trackTitle}>
                                                    {row.trackTitle}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5 text-[9.5px]">
                                                    <span className="px-1 py-0.2 rounded bg-rose-950/70 border border-rose-800 text-rose-300 truncate max-w-[100px]">
                                                        {row.detailsBefore}
                                                    </span>
                                                    <span className="text-gray-500">➔</span>
                                                    <span className="px-1 py-0.2 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-bold truncate max-w-[100px]">
                                                        {row.detailsAfter}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-2 text-center whitespace-nowrap">
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/60 font-bold text-[9.5px]">
                                                    {row.status || 'OK'}
                                                </span>
                                            </td>
                                            <td className="p-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => setDetailEntry(row)}
                                                    className="px-2 py-1 rounded bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 hover:text-white border border-cyan-600/70 font-bold text-[10px] cursor-pointer transition-all active:scale-95 inline-flex items-center gap-1 shadow-xs"
                                                    title="Ver informe detallado y log completo"
                                                >
                                                    <Icons.Eye size={12} />
                                                    <span>Detalle</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer de la Bitácora */}
                <div className="px-5 py-3 bg-[#0a0a14] border-t border-djzinc-800 flex items-center justify-between shrink-0 font-mono text-xs">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-[11px]">
                            {selectedIds.size} de {filteredEntries.length} seleccionadas
                        </span>
                        {entries.length > 0 && (
                            <button
                                type="button"
                                onClick={onClearEntries}
                                className="text-[10px] text-gray-500 hover:text-rose-400 underline cursor-pointer"
                            >
                                Vaciar Bitácora
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-xl bg-djzinc-850 hover:bg-djzinc-750 text-white font-bold transition-colors cursor-pointer text-xs"
                    >
                        Cerrar (ESC)
                    </button>
                </div>
                    </>
                )}
            </aside>
        </div>,
        document.body
    );
};

