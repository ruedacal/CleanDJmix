const { useState, useEffect, useRef, useCallback } = React;

// ─── PERF: Hook de virtualización de filas para tablas grandes ───────────────
// Renderiza únicamente las filas visibles dentro de la ventana del usuario.
// Mantiene compatibilidad con todos los eventos de interacción existentes y protección antiblackout.
export function useVirtualRows(items, containerRef, rowHeight = 40, overscan = 10) {
    const [range, setRange] = useState({ start: 0, end: 60 });
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        let rafId = null;
        const update = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const scrollTop    = el.scrollTop || 0;
                const clientHeight = el.clientHeight || window.innerHeight || 800;
                let start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
                let end   = Math.min(items.length, Math.ceil((scrollTop + clientHeight) / rowHeight) + overscan);
                if (start >= items.length && items.length > 0) {
                    start = 0;
                    end = Math.min(items.length, Math.ceil(clientHeight / rowHeight) + overscan * 2);
                    if (el.scrollTop > 0) el.scrollTop = 0;
                }
                if (end <= start && items.length > 0) {
                    end = Math.min(items.length, start + 60);
                }
                setRange(prev => (prev.start === start && prev.end === end ? prev : { start, end }));
            });
        };
        el.addEventListener("scroll", update, { passive: true });
        const ro = new ResizeObserver(update);
        ro.observe(el);
        update();
        return () => { 
            el.removeEventListener("scroll", update); 
            ro.disconnect(); 
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [items.length, rowHeight, overscan]);

    // Anti-blackout safety fallback: NUNCA devolver array vacío si items tiene elementos
    let safeStart = range.start;
    let safeEnd = range.end;
    if (items.length > 0) {
        if (safeStart >= items.length || safeEnd <= safeStart) {
            safeStart = 0;
            safeEnd = Math.min(items.length, 60);
        }
    }
    const visibleItems  = items.slice(safeStart, safeEnd);
    const paddingTop    = safeStart * rowHeight;
    const paddingBottom = Math.max(0, (items.length - safeEnd) * rowHeight);
    return { visibleItems, paddingTop, paddingBottom, startIndex: safeStart };
}

// ─── HOOK DE REDIMENSIÓN CON ARRASTRE (DRAG & DROP) & PERSISTENCIA PARA DRAWERS LATERALES (DESKTOP) ───
// Unificamos el ancho de TODAS las columnas laterales al ancho maestro del Inspector (540px inicial)
export const MASTER_DRAWER_STORAGE_KEY = 'bw_inspector_drawer_width';

export function useDrawerResize(storageKey = MASTER_DRAWER_STORAGE_KEY, defaultWidth = 540, minWidth = 380, maxWidth = 860, isIndependent = false) {
    // Si isIndependent es true, utiliza su propia clave de storage y no sincroniza con los drawers maestros
    const effectiveKey = isIndependent ? storageKey : MASTER_DRAWER_STORAGE_KEY;

    const [width, setWidth] = React.useState(() => {
        try {
            const saved = localStorage.getItem(effectiveKey) || localStorage.getItem(storageKey);
            if (saved) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
                    if (!isIndependent && parsed === 500) return defaultWidth;
                    return parsed;
                }
            }
        } catch (e) {}
        return defaultWidth;
    });

    // Sincronización en tiempo real entre todos los drawers maestros
    React.useEffect(() => {
        if (isIndependent) return;
        const handleSync = (ev) => {
            if (ev && ev.detail && typeof ev.detail.width === 'number') {
                setWidth(ev.detail.width);
            }
        };
        window.addEventListener('bw_drawer_width_synced', handleSync);
        return () => window.removeEventListener('bw_drawer_width_synced', handleSync);
    }, [isIndependent]);

    const isDraggingRef = React.useRef(false);
    const startXRef = React.useRef(0);
    const startWidthRef = React.useRef(width);

    const onPointerDown = React.useCallback((e) => {
        if (typeof window === 'undefined' || window.innerWidth < 768) return;
        e.preventDefault();
        e.stopPropagation();
        isDraggingRef.current = true;
        startXRef.current = e.clientX;
        startWidthRef.current = width;

        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        const onPointerMove = (moveEvent) => {
            if (!isDraggingRef.current) return;
            const delta = startXRef.current - moveEvent.clientX;
            const maxW = typeof window !== 'undefined' ? Math.min(maxWidth, window.innerWidth * 0.9) : maxWidth;
            const newWidth = Math.max(minWidth, Math.min(maxW, startWidthRef.current + delta));
            setWidth(newWidth);
            if (!isIndependent) {
                window.dispatchEvent(new CustomEvent('bw_drawer_width_synced', { detail: { width: newWidth } }));
            }
        };

        const onPointerUp = () => {
            if (!isDraggingRef.current) return;
            isDraggingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
            try {
                setWidth((currentW) => {
                    const rounded = Math.round(currentW);
                    localStorage.setItem(effectiveKey, String(rounded));
                    if (!isIndependent) {
                        window.dispatchEvent(new CustomEvent('bw_drawer_width_synced', { detail: { width: rounded } }));
                    }
                    return currentW;
                });
            } catch (e) {}
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
    }, [width, effectiveKey, minWidth, maxWidth, isIndependent]);

    const resetWidth = React.useCallback(() => {
        setWidth(defaultWidth);
        try { 
            localStorage.setItem(effectiveKey, String(defaultWidth));
            if (!isIndependent) {
                window.dispatchEvent(new CustomEvent('bw_drawer_width_synced', { detail: { width: defaultWidth } }));
            }
        } catch (e) {}
    }, [defaultWidth, effectiveKey, isIndependent]);

    return { width, onPointerDown, resetWidth };
}


